import React, { useState } from 'react';
import { User, Project, ProjectTool } from '../../types';
import {
  Users,
  FolderKanban,
  Plus,
  Wrench,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  DollarSign,
  Briefcase,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface ResourceAllocationProps {
  users: User[];
  projects: Project[];
  onToggleUserProject: (userId: string, projectId: string) => void;
  onAddToolToProject: (projectId: string, tool: Omit<ProjectTool, 'id'>) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ResourceAllocation: React.FC<ResourceAllocationProps> = ({
  users,
  projects,
  onToggleUserProject,
  onAddToolToProject,
  onShowToast,
}) => {
  const [searchStaff, setSearchStaff] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [showAddToolModal, setShowAddToolModal] = useState(false);

  // New tool form state
  const [toolProjectId, setToolProjectId] = useState(projects[0]?.id || '');
  const [toolName, setToolName] = useState('JetBrains AI Assistant');
  const [toolCategory, setToolCategory] = useState<ProjectTool['category']>('AI');
  const [monthlyCost, setMonthlyCost] = useState(250);

  const filteredUsers = users.filter((u) => {
    if (selectedDept !== 'all' && u.department !== selectedDept) return false;
    if (
      searchStaff &&
      !u.name.toLowerCase().includes(searchStaff.toLowerCase()) &&
      !u.title.toLowerCase().includes(searchStaff.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleAddToolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddToolToProject(toolProjectId, {
      name: toolName,
      category: toolCategory,
      monthlyCost,
      assignedUsersCount: 3,
    });
    onShowToast('Tool Allocated', `Allocated ${toolName} ($${monthlyCost}/mo) to project.`, 'success');
    setShowAddToolModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Resource Allocation & Software Licenses</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Assign personnel to project rosters and manage SaaS tool subscriptions and API keys.
          </p>
        </div>

        <button
          onClick={() => setShowAddToolModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Allocate Software Tool</span>
        </button>
      </div>

      {/* Staff Roster Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Staff Allocation Matrix</h3>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                placeholder="Search staff by name or skill..."
                className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="all">All Departments</option>
              <option value="Product Engineering">Product Engineering</option>
              <option value="UX/UI Design">UX/UI Design</option>
              <option value="DevOps & Security">DevOps & Security</option>
              <option value="Quality Assurance">Quality Assurance</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const userProjects = (projects || []).filter((p) => p.assignedUserIds?.includes(user.id));
            const allocationPct = Math.min(100, userProjects.length * 30 + 20);

            return (
              <div
                key={user.id}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{user.name}</h4>
                      <p className="text-slate-400 text-[11px]">{user.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Department</span>
                    <span className="font-semibold text-purple-300">{user.department}</span>
                  </div>

                  {/* Allocation Capacity Gauge */}
                  <div>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                      <span>Workload Allocation</span>
                      <span className="text-indigo-300">{allocationPct}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          allocationPct >= 90 ? 'bg-rose-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${allocationPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Assigned Projects Toggles */}
                <div className="pt-2 border-t border-slate-700/60 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Toggle Project Assignments
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {projects.map((proj) => {
                      const isAssigned = (proj.assignedUserIds || []).includes(user.id);
                      return (
                        <button
                          key={proj.id}
                          onClick={() => {
                            onToggleUserProject(user.id, proj.id);
                            onShowToast(
                              isAssigned ? 'Removed from Project' : 'Assigned to Project',
                              `${user.name} ${isAssigned ? 'removed from' : 'assigned to'} ${proj.name}`,
                              'info'
                            );
                          }}
                          className={`w-full p-1.5 rounded-lg text-left flex items-center justify-between text-[11px] transition-colors ${
                            isAssigned
                              ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 font-semibold'
                              : 'bg-slate-900/40 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{proj.name}</span>
                          <span className="text-[10px] font-bold">
                            {isAssigned ? 'Assigned ✓' : '+ Add'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ALLOCATE NEW TOOL MODAL */}
      {showAddToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleAddToolSubmit}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-extrabold text-white">Allocate Software License</h3>
              <button
                type="button"
                onClick={() => setShowAddToolModal(false)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Target Project
                </label>
                <select
                  value={toolProjectId}
                  onChange={(e) => setToolProjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Software Name / API Service
                </label>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                    Category
                  </label>
                  <select
                    value={toolCategory}
                    onChange={(e) =>
                      setToolCategory(e.target.value as ProjectTool['category'])
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Cloud">Cloud</option>
                    <option value="Design">Design</option>
                    <option value="Dev">Dev</option>
                    <option value="AI">AI</option>
                    <option value="SaaS">SaaS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                    Monthly Cost ($)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={monthlyCost}
                    onChange={(e) => setMonthlyCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-400 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddToolModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30"
              >
                Allocate License
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
