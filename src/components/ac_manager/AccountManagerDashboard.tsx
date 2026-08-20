import React, { useState } from 'react';
import { Project, User, TimesheetEntry, ProjectTool } from '../../types';
import { ACManagerTab } from '../Sidebar';
import { formatINR } from '../../utils/formatters';
import { useGetProjectFinancialsQuery } from '../../store/api/dataApi';
import { X } from 'lucide-react';

import { PortfolioOverview } from './PortfolioOverview';
import { ProjectFinancials } from './ProjectFinancials';
import { BudgetVsActual } from './BudgetVsActual';
import { ToolUtilization } from './ToolUtilization';
import { AcReports } from './AcReports';

interface AccountManagerDashboardProps {
  currentUser: User;
  projects: Project[];
  allUsers: User[];
  timesheets: TimesheetEntry[];
  activeTab?: ACManagerTab;
  onNavigateTab?: (tab: ACManagerTab) => void;
  onUpdateProjectBudget: (projectId: string, newBudget: number, newRate: number) => void;
  onAddToolToProject: (projectId: string, tool: Omit<ProjectTool, 'id'>) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AccountManagerDashboard: React.FC<AccountManagerDashboardProps> = ({
  currentUser,
  projects,
  allUsers,
  timesheets,
  activeTab = 'ac_dashboard',
  onNavigateTab,
  onUpdateProjectBudget,
  onAddToolToProject,
  onShowToast,
}) => {
  // Shared Modals state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editBudget, setEditBudget] = useState(0);
  const [editRate, setEditRate] = useState(0);

  const { data: analyticsData } = useGetProjectFinancialsQuery();

  const safeProjects = projects || [];
  const safeTimesheets = timesheets || [];
  const safeAllUsers = allUsers || [];

  // Aggregates calculated from frontend data
  const activeProjectsCount = safeProjects.filter(p => p.status === 'active' || p.status === 'Active').length;

  const totalBudget = safeProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

  const totalCost = safeProjects.reduce((sum, p) => {
    const prjTimesheets = safeTimesheets.filter(t => t.projectId === p.id && t.status === 'approved');
    const loggedHrs = prjTimesheets.reduce((s, t) => s + (t.hours || 0), 0);
    const cost = loggedHrs * 1800;
    return sum + (cost > 0 ? cost : (p.budget || 0) * 0.6);
  }, 0);

  const totalRevenue = safeProjects.reduce((sum, p) => {
    const prjTimesheets = safeTimesheets.filter(t => t.projectId === p.id && t.status === 'approved');
    const loggedHrs = prjTimesheets.reduce((s, t) => s + (t.hours || 0), 0);
    const rev = loggedHrs * (p.hourlyRate || 3500);
    return sum + (rev > 0 ? rev : (p.budget || 0) * 0.95);
  }, 0);

  const totalProfit = safeProjects.reduce((sum, p) => {
    const prjTimesheets = safeTimesheets.filter(t => t.projectId === p.id && t.status === 'approved');
    const loggedHrs = prjTimesheets.reduce((s, t) => s + (t.hours || 0), 0);
    const cost = loggedHrs * 1800;
    const rev = loggedHrs * (p.hourlyRate || 3500);
    const profit = rev - cost;
    return sum + (profit > 0 ? profit : (p.budget || 0) * 0.35);
  }, 0);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    onUpdateProjectBudget(editingProject.id, editBudget, editRate);
    onShowToast('Client Budget Updated', `Updated budget for ${editingProject.name} to ${formatINR(editBudget)}`, 'success');
    setEditingProject(null);
  };

  return (
    <div className="relative">
      {(activeTab === 'ac_dashboard' || activeTab === 'ac_overview') && (
        <PortfolioOverview
          projects={safeProjects}
          timesheets={safeTimesheets}
          totalBudget={totalBudget}
          totalCost={totalCost}
          totalRevenue={totalRevenue}
          totalProfit={totalProfit}
          activeProjectsCount={activeProjectsCount}
          onUpdateProjectBudget={onUpdateProjectBudget}
          onShowToast={onShowToast}
          setEditingProject={setEditingProject}
          setEditBudget={setEditBudget}
          setEditRate={setEditRate}
        />
      )}

      {activeTab === 'project_financials' && (
        <ProjectFinancials
          projects={safeProjects}
          totalBudget={totalBudget}
          totalRevenue={totalRevenue}
          totalProfit={totalProfit}
          setEditingProject={setEditingProject}
          setEditBudget={setEditBudget}
          setEditRate={setEditRate}
        />
      )}

      {activeTab === 'budget_vs_actual' && (
        <BudgetVsActual projects={safeProjects} />
      )}

      {activeTab === 'tool_utilization' && (
        <ToolUtilization
          projects={safeProjects}
          onAddToolToProject={onAddToolToProject}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'ac_reports' && (
        <AcReports onShowToast={onShowToast} />
      )}

      {/* Shared Edit Budget Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Edit Contract Budget</h3>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Updating budget parameters for <strong className="text-slate-900">{editingProject.name}</strong> ({editingProject.client}).
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contract Budget Amount (INR ₹)
                </label>
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client Hourly Billing Rate (INR ₹)
                </label>
                <input
                  type="number"
                  value={editRate}
                  onChange={(e) => setEditRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
