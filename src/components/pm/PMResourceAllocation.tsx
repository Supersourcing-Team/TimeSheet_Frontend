import React, { useState } from 'react';
import { Project, User, ProjectTool } from '../../types';
import { formatINR } from '../../utils/formatters';
import {
  Users,
  Wrench,
  Search,
  Filter,
  Plus,
  Trash2,
  Briefcase,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
  Sparkles,
  DollarSign,
  Calendar,
  X,
} from 'lucide-react';

interface PMResourceAllocationProps {
  currentUser: User;
  projects: Project[];
  allUsers: User[];
  onAssignUserToProject: (projectId: string, userId: string) => void;
  onRemoveUserFromProject: (projectId: string, userId: string) => void;
  onAddToolToProject: (projectId: string, tool: Omit<ProjectTool, 'id'>) => void;
  onRemoveToolFromProject: (projectId: string, toolId: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PMResourceAllocation: React.FC<PMResourceAllocationProps> = ({
  currentUser,
  projects = [],
  allUsers = [],
  onAssignUserToProject,
  onRemoveUserFromProject,
  onAddToolToProject,
  onRemoveToolFromProject,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'tools'>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');

  // Modal states for allocation
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);

  // Form states for Employee Assignment
  const [assignProjectId, setAssignProjectId] = useState<string>('');
  const [assignUserId, setAssignUserId] = useState<string>('');

  // Form states for Tool Allocation
  const [toolProjectId, setToolProjectId] = useState<string>('');
  const [toolName, setToolName] = useState('');
  const [toolCategory, setToolCategory] = useState<'Cloud' | 'Design' | 'Dev' | 'AI' | 'SaaS' | 'Testing'>('AI');
  const [toolMonthlyCost, setToolMonthlyCost] = useState<number>(15000);
  const [toolAllocationDate, setToolAllocationDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // PM's projects
  const pmProjects = (projects || []).filter(
    (p) =>
      (p.pmName && currentUser?.name && p.pmName.toLowerCase() === currentUser.name.toLowerCase()) ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'pm'
  );

  // Handle assign employee submission
  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignProjectId || !assignUserId) return;

    const targetProject = pmProjects.find((p) => p.id === assignProjectId);
    const targetUser = allUsers.find((u) => u.id === assignUserId);

    if (targetProject && targetUser) {
      if ((targetProject.assignedUserIds || []).includes(assignUserId)) {
        onShowToast('Already Assigned', `${targetUser.name} is already assigned to ${targetProject.name}.`, 'info');
        return;
      }

      onAssignUserToProject(assignProjectId, assignUserId);
      onShowToast('Employee Assigned', `Assigned ${targetUser.name} to ${targetProject.name}`, 'success');
      setShowAssignModal(false);
      setAssignProjectId('');
      setAssignUserId('');
    }
  };

  // Handle remove employee submission
  const handleRemoveUser = (projectId: string, userId: string, userName: string, projectName: string) => {
    onRemoveUserFromProject(projectId, userId);
    onShowToast('Employee Removed', `Removed ${userName} from ${projectName}.`, 'info');
  };

  // Handle tool allocation submission
  const handleConfirmAddTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolProjectId || !toolName) return;

    const targetProject = pmProjects.find((p) => p.id === toolProjectId);
    if (!targetProject) return;

    const toolPayload: Omit<ProjectTool, 'id'> = {
      name: toolName,
      category: toolCategory,
      monthlyCost: Number(toolMonthlyCost),
      assignedUsersCount: (targetProject.assignedUserIds || []).length,
      allocationDate: toolAllocationDate,
      status: 'active',
    };

    onAddToolToProject(toolProjectId, toolPayload);
    onShowToast('Tool Allocated', `Allocated ${toolName} to ${targetProject.name}`, 'success');

    setShowToolModal(false);
    setToolProjectId('');
    setToolName('');
    setToolMonthlyCost(15000);
  };

  // Handle tool deallocation
  const handleRemoveTool = (projectId: string, toolId: string, toolName: string) => {
    onRemoveToolFromProject(projectId, toolId);
    onShowToast('Tool Deallocated', `Deallocated ${toolName} from project.`, 'info');
  };

  // Filtered list of users
  const filteredUsers = (allUsers || []).filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedProjectFilter === 'all') return matchesSearch;

    const targetProj = pmProjects.find((p) => p.id === selectedProjectFilter);
    return matchesSearch && (targetProj?.assignedUserIds || []).includes(u.id);
  });

  // Flat list of allocated tools across PM's projects
  const allAllocatedTools = pmProjects.flatMap((p) =>
    (p.tools || []).map((t) => ({
      ...t,
      projectId: p.id,
      projectName: p.name,
      projectCode: p.code,
    }))
  );

  const filteredTools = allAllocatedTools.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject = selectedProjectFilter === 'all' || t.projectId === selectedProjectFilter;

    return matchesSearch && matchesProject;
  });

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 font-medium text-xs border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Resource & Tool Allocation Portal</span>
          </div>
          <h1 className="text-2xl font-black">Resource Allocation Hub</h1>
          <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
            Assign employees to active projects and allocate shared project tools (AI Subscriptions, Cloud Infrastructure, APIs, Testing Suite). Tools allocated to a project are automatically accessible to all assigned team members.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Assign Employee</span>
          </button>
          <button
            onClick={() => setShowToolModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow-xs transition-all flex items-center gap-2"
          >
            <Wrench className="w-4 h-4 text-blue-700" />
            <span>Allocate Tool / Service</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-Tab Selector */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-2xl border shadow-2xs gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'employees'
              ? 'bg-blue-600 text-white shadow-sm font-extrabold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Assignment ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tools')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'tools'
              ? 'bg-blue-600 text-white shadow-sm font-extrabold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Project Tools & Services Allocation ({allAllocatedTools.length})</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'employees'
                ? 'Search employee name, title, department...'
                : 'Search tool name, category, project...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Filter Project:</span>
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Managed Projects</option>
            {pmProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1: EMPLOYEE ASSIGNMENT VIEW */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-blue-950">Multi-Project Allocation Rules</p>
              <p className="text-blue-800 mt-0.5 leading-relaxed">
                Employees can be assigned to multiple projects concurrently. Assigning an employee to a project gives them full access to all project-allocated tools and enables them to log timesheets against that project.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              // Find all projects this user is assigned to
              const assignedProjects = pmProjects.filter((p) =>
                (p.assignedUserIds || []).includes(user.id)
              );

              return (
                <div
                  key={user.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate">{user.name}</h3>
                        <p className="text-xs text-blue-600 font-semibold truncate">{user.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user.department}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-600 text-[11px]">Assigned Projects:</span>
                        <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px] border border-blue-100">
                          {assignedProjects.length} Projects
                        </span>
                      </div>

                      {assignedProjects.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Not currently assigned to any of your managed projects.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {assignedProjects.map((proj) => (
                            <div
                              key={proj.id}
                              className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-slate-800 text-[11px] truncate">{proj.name}</p>
                                <p className="text-[10px] font-mono text-slate-500">{proj.code}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveUser(proj.id, user.id, user.name, proj.name)}
                                className="p-1 rounded text-rose-600 hover:bg-rose-50 shrink-0"
                                title="Remove employee from this project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900">{formatINR(user.hourlyRate)}/hr</span>
                    <button
                      onClick={() => {
                        setAssignUserId(user.id);
                        if (pmProjects.length > 0) setAssignProjectId(pmProjects[0].id);
                        setShowAssignModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign to Project</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: TOOL & SERVICE ALLOCATION VIEW */}
      {activeSubTab === 'tools' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
            <Wrench className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-950">Project Tool Share Model</p>
              <p className="text-amber-900 mt-0.5 leading-relaxed">
                Tools are allocated directly to projects. Every employee assigned to a project can use the project's allocated tools (e.g., Figma Enterprise, AWS Cloud, OpenAI Gateway, Vanta, Datadog).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tool / Service Name</th>
                  <th className="py-3 px-4">Allocated Project</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Monthly Cost</th>
                  <th className="py-3 px-4">Allocation Date</th>
                  <th className="py-3 px-4">Deallocation Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredTools.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      No tools allocated matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTools.map((tool) => (
                    <tr key={tool.id + tool.projectId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">{tool.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                          {tool.projectName} ({tool.projectCode})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
                          {tool.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">{formatINR(tool.monthlyCost)}/mo</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {tool.allocationDate || '2025-01-10'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {tool.deallocationDate || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          {tool.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRemoveTool(tool.projectId, tool.id, tool.name)}
                          className="px-3 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs border border-rose-200"
                        >
                          Deallocate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ASSIGN EMPLOYEE */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmAssign}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 text-xs font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900">Assign Employee to Project</h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Target Project *</label>
                <select
                  required
                  value={assignProjectId}
                  onChange={(e) => setAssignProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
                >
                  <option value="">-- Select Project --</option>
                  {pmProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Select Employee *</label>
                <select
                  required
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
                >
                  <option value="">-- Select Employee --</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.title} • {u.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Assign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: ALLOCATE TOOL */}
      {showToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmAddTool}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 text-xs font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900">Allocate Tool / Service to Project</h3>
              <button
                type="button"
                onClick={() => setShowToolModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Target Project *</label>
                <select
                  required
                  value={toolProjectId}
                  onChange={(e) => setToolProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
                >
                  <option value="">-- Select Project --</option>
                  {pmProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Tool / Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenAI GPT-4 API Gateway, Postman Enterprise"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Category</label>
                <select
                  value={toolCategory}
                  onChange={(e) => setToolCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="AI">AI Subscription</option>
                  <option value="Cloud">Cloud Services</option>
                  <option value="Dev">Development Tools</option>
                  <option value="Design">Design Tools</option>
                  <option value="SaaS">SaaS Platform</option>
                  <option value="Testing">Testing Tools</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Monthly Cost (₹ INR)</label>
                <input
                  type="number"
                  value={toolMonthlyCost}
                  onChange={(e) => setToolMonthlyCost(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Allocation Date</label>
                <input
                  type="date"
                  value={toolAllocationDate}
                  onChange={(e) => setToolAllocationDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowToolModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Allocate Resource
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
