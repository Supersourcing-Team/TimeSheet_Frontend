import React, { useState } from 'react';
import { Project, ProjectTool } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Plus, X } from 'lucide-react';

interface ToolUtilizationProps {
  projects: Project[];
  onAddToolToProject: (projectId: string, tool: Omit<ProjectTool, 'id'>) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ToolUtilization: React.FC<ToolUtilizationProps> = ({
  projects,
  onAddToolToProject,
  onShowToast,
}) => {
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [selectedToolProjectId, setSelectedToolProjectId] = useState('');
  const [newToolName, setNewToolName] = useState('');
  const [newToolCategory, setNewToolCategory] = useState<'Cloud' | 'Design' | 'Dev' | 'AI' | 'SaaS' | 'Testing'>('Cloud');
  const [newToolCost, setNewToolCost] = useState(15000);
  const [newToolUsersCount, setNewToolUsersCount] = useState(5);

  const safeProjects = projects || [];

  const handleCreateTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToolProjectId || !newToolName) return;
    onAddToolToProject(selectedToolProjectId, {
      name: newToolName,
      category: newToolCategory,
      monthlyCost: newToolCost,
      assignedUsersCount: newToolUsersCount,
      seats: 1,
    });
    onShowToast('SaaS Tool Added', `Added ${newToolName} to project.`, 'success');
    setShowAddToolModal(false);
    setNewToolName('');
  };

  return (
    <div className="space-y-6 text-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tool Utilization</h1>
          <p className="text-xs text-slate-500 font-medium">
            SaaS software licenses, cloud infrastructure, and tool expenses per project.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddToolModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Allocate SaaS Tool</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeProjects.flatMap((p) =>
          (p.tools || []).map((t) => (
            <div key={`${p.id}-${t.id}`} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                  {t.category}
                </span>
                <span className="text-xs font-bold text-slate-400">{p.name}</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{t.name}</h3>
                <p className="text-xl font-black text-slate-900 mt-1">{formatINR(t.monthlyCost)}/mo</p>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
                <span>Assigned Seats: {t.assignedUsersCount} users</span>
                <span>Yearly: {formatINR(t.monthlyCost * 12)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddToolModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Allocate SaaS Tool</h3>
              <button
                type="button"
                onClick={() => setShowAddToolModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTool} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Project</label>
                <select
                  value={selectedToolProjectId}
                  onChange={(e) => setSelectedToolProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Project --</option>
                  {safeProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tool Name</label>
                <input
                  type="text"
                  placeholder="e.g. Figma Enterprise, AWS Cloud, OpenAI API"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newToolCategory}
                    onChange={(e) => setNewToolCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="Cloud">Cloud</option>
                    <option value="Design">Design</option>
                    <option value="Dev">Dev</option>
                    <option value="AI">AI</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Testing">Testing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newToolCost === 0 ? '' : newToolCost}
                    onChange={(e) => setNewToolCost(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddToolModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Allocate Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
