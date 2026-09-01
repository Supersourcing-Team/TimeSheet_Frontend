import React, { useState } from 'react';
import { Project } from '../../types';
import { formatINR } from '../../utils/formatters';
import {
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart2,
  FolderKanban,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  X,
} from 'lucide-react';

interface ProjectFinancialsProps {
  projects: Project[];
  onUpdateProjectBudget: (projectId: string, newBudget: number) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProjectFinancials: React.FC<ProjectFinancialsProps> = ({
  projects,
  onUpdateProjectBudget,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editBudget, setEditBudget] = useState(0);
  const safeProjects = projects || [];

  // Financial aggregates in INR
  const totalBudget = safeProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalLaborCost = safeProjects.reduce((sum, p) => sum + (p.loggedHours || 0) * 1800, 0);
  const totalToolCosts = safeProjects.reduce(
    (sum, p) => sum + (p.tools || []).reduce((tSum, t) => tSum + (t.monthlyCost || 0) * 12, 0),
    0
  );
  const totalExpenditure = totalLaborCost + totalToolCosts;
  const estimatedRevenue = totalBudget * 1.35;
  const netProfit = estimatedRevenue - totalExpenditure;
  const marginPct = estimatedRevenue > 0 ? ((netProfit / estimatedRevenue) * 100).toFixed(1) : '0.0';

  const filteredProjects = safeProjects.filter((p) => {
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    if (
      searchQuery &&
      !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.client.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    onUpdateProjectBudget(editingProject.id, editBudget);
    onShowToast('Budget Updated', `Updated budget for ${editingProject.name} to ${formatINR(editBudget)}`, 'success');
    setEditingProject(null);
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span>Project Financials & Performance (INR ₹)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track portfolio contract budgets in INR, labor expenditures, software licenses, and net profit margins.
          </p>
        </div>
      </div>

      {/* Fiscal KPI Cards in INR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Budget */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Contract Portfolio
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatINR(totalBudget, true)}
          </div>
          <p className="text-xs text-slate-500">Allocated across {projects.length} accounts</p>
        </div>

        {/* Card 2: Labor Cost */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Logged Labor Expense
          </span>
          <div className="text-2xl font-extrabold text-blue-600">
            {formatINR(totalLaborCost, true)}
          </div>
          <p className="text-xs text-slate-500">Employee hourly rate calculations</p>
        </div>

        {/* Card 3: Software & Tool Costs */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tool Licenses (Annual)
          </span>
          <div className="text-2xl font-extrabold text-amber-600">
            {formatINR(totalToolCosts, true)}
          </div>
          <p className="text-xs text-slate-500">SaaS & AI API software costs</p>
        </div>

        {/* Card 4: Net Profit Margin */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Net Margin %
          </span>
          <div className="text-2xl font-extrabold text-emerald-600">
            {marginPct}%
          </div>
          <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{formatINR(netProfit, true)} Net Margin</span>
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 text-xs">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project or client..."
                className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50">
                <th className="py-3 px-3">Project & Code</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3 text-right">Contract Budget (INR)</th>
                <th className="py-3 px-3 text-right">Labor Cost</th>
                <th className="py-3 px-3 text-right">Tool Licenses</th>
                <th className="py-3 px-3 text-right">Budget Utilization</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProjects.map((p) => {
                const laborCost = (p.loggedHours || 0) * 1800;
                const toolCostYearly = (p.tools || []).reduce((sum, t) => sum + (t.monthlyCost || 0) * 12, 0);
                const projectSpent = laborCost + toolCostYearly;
                const utilPct = Math.min(100, Math.round((projectSpent / p.budget) * 100));

                return (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-blue-600 font-bold">{p.code}</p>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 font-semibold">{p.client}</td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                      {formatINR(p.budget)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-blue-600">
                      {formatINR(laborCost)}
                      <span className="text-[10px] text-slate-400 font-normal block">({p.loggedHours || 0} hrs logged)</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-amber-600">
                      {formatINR(toolCostYearly)}/yr
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              utilPct > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${utilPct}%` }}
                          />
                        </div>
                        <span
                          className={`font-bold ${
                            utilPct > 90 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {utilPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setEditingProject(p); setEditBudget(p.budget);
                        }}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-colors"
                        title="Edit Financials"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT BUDGET MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">
                Edit Contract Financials • {editingProject.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Total Budget Cap (INR ₹)
                </label>
                <input
                  type="number"
                  step="50000"
                  value={editBudget}
                  onChange={(e) => setEditBudget(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                <span className="text-[11px] text-blue-600 font-bold block">
                  Formatted: {formatINR(editBudget)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
