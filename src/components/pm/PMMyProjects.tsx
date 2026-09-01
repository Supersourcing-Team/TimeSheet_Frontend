import React, { useState } from 'react';
import { Project, User, ProjectTool, TimesheetEntry, Milestone } from '../../types';
import { formatINR } from '../../utils/formatters';
import { useCreateMilestoneMutation, useUpdateMilestoneMutation, useDeleteMilestoneMutation } from '../../store/api/dataApi';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Users,
  Wrench,
  Clock,
  Edit3,
  UserPlus,
  Trash2,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  ChevronRight,
  ShieldAlert,
  Layers,
  Sparkles,
  FileText,
  Building2,
  Loader2,
} from 'lucide-react';

interface PMMyProjectsProps {
  currentUser: User;
  projects: Project[];
  allUsers: User[];
  clients: { id: number; name: string }[];
  timesheets: TimesheetEntry[];
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (updatedProject: Project) => void;
  onCreateClient: (name: string, contactInfo?: string) => Promise<any> | void;
  onAssignUserToProject: (projectId: string, userId: string) => void;
  onRemoveUserFromProject: (projectId: string, userId: string) => void;
  onAddToolToProject: (projectId: string, tool: Omit<ProjectTool, 'id'>) => void;
  onRemoveToolFromProject: (projectId: string, toolId: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PMMyProjects: React.FC<PMMyProjectsProps> = ({
  currentUser,
  projects = [],
  allUsers = [],
  clients = [],
  timesheets = [],
  onAddProject,
  onUpdateProject,
  onCreateClient,
  onAssignUserToProject,
  onRemoveUserFromProject,
  onAddToolToProject,
  onRemoveToolFromProject,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'team' | 'tools' | 'timesheets' | 'milestones'>('details');

  // Milestone Mutations
  const [createMilestone] = useCreateMilestoneMutation();
  const [updateMilestone] = useUpdateMilestoneMutation();
  const [deleteMilestone] = useDeleteMilestoneMutation();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [isAddingInlineClient, setIsAddingInlineClient] = useState(false);
  const [inlineClientName, setInlineClientName] = useState('');
  const [isInlineCreating, setIsInlineCreating] = useState(false);

  // New Project Form
  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    status: 'active' as const,
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    description: '',
  });

  // Edit Project Form
  const [editFormData, setEditFormData] = useState<Project | null>(null);

  // Add Tool Form
  const [newTool, setNewTool] = useState<{
    name: string;
    category: 'Cloud' | 'Design' | 'Dev' | 'AI' | 'SaaS' | 'Testing';
    monthlyCost: number;
    allocationDate: string;
    status: 'active' | 'deallocated';
  }>({
    name: '',
    category: 'AI',
    monthlyCost: 0,
    allocationDate: new Date().toISOString().split('T')[0],
    status: 'active',
  });

  // Add Milestone Form
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState<{
    name: string;
    description: string;
    expected_completion_date: string;
    weight_percentage: number;
  }>({
    name: '',
    description: '',
    expected_completion_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    weight_percentage: 10,
  });

  // Selected User for Assignment
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // PM's projects
  const pmProjects = (projects || []).filter(
    (p) =>
      (p.pmName && currentUser?.name && p.pmName.toLowerCase() === currentUser.name.toLowerCase()) ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'pm'
  );

  // Filtered projects
  const filteredProjects = pmProjects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.client) {
      onShowToast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    onAddProject({
      name: newProject.name,
      code: 'PRJ-' + Math.floor(1000 + Math.random() * 9000),
      client: newProject.client,
      accountManagerName: '',
      pmName: currentUser.name,
      pmAvatar: currentUser.avatar,
      status: newProject.status,
      budget: Number(newProject.budget),
      loggedHours: 0,
      billableHours: 0,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      description: newProject.description,
      tools: [],
      assignedUserIds: [currentUser.id],
    });

    onShowToast('Project Created', `Successfully created ${newProject.name}`, 'success');
    setShowCreateModal(false);
    setNewProject({
      name: '',
      client: '',
      status: 'active',
      budget: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      description: '',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    onUpdateProject(editFormData);
    if (selectedProject && selectedProject.id === editFormData.id) {
      setSelectedProject(editFormData);
    }
    onShowToast('Project Updated', `Updated details for ${editFormData.name}`, 'success');
    setShowEditModal(false);
  };

  const handleAssignUser = () => {
    if (!selectedProject || !selectedUserId) return;
    onAssignUserToProject(selectedProject.id, selectedUserId);
    const assignedUser = allUsers.find((u) => u.id === selectedUserId);
    onShowToast('Employee Assigned', `Assigned ${assignedUser?.name || 'user'} to ${selectedProject.name}`, 'success');
    setShowAssignModal(false);
    setSelectedUserId('');

    // Update selectedProject in local view
    const updated = {
      ...selectedProject,
      assignedUserIds: [...(selectedProject.assignedUserIds || []), selectedUserId],
    };
    setSelectedProject(updated);
  };

  const handleRemoveUser = (userId: string) => {
    if (!selectedProject) return;
    onRemoveUserFromProject(selectedProject.id, userId);
    const removedUser = allUsers.find((u) => u.id === userId);
    onShowToast('Employee Removed', `Removed ${removedUser?.name || 'user'} from ${selectedProject.name}`, 'info');

    const updated = {
      ...selectedProject,
      assignedUserIds: (selectedProject.assignedUserIds || []).filter((id) => id !== userId),
    };
    setSelectedProject(updated);
  };

  const handleAddToolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTool.name) return;

    const toolPayload: Omit<ProjectTool, 'id'> = {
      name: newTool.name,
      category: newTool.category,
      monthlyCost: Number(newTool.monthlyCost),
      assignedUsersCount: (selectedProject.assignedUserIds || []).length,
      allocationDate: newTool.allocationDate,
      status: newTool.status,
    };

    onAddToolToProject(selectedProject.id, toolPayload);
    onShowToast('Tool Allocated', `Allocated ${newTool.name} to ${selectedProject.name}`, 'success');
    setShowAddToolModal(false);
    setNewTool({
      name: '',
      category: 'AI',
      monthlyCost: 0,
      allocationDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });

    // Update selectedProject
    const updatedTools = [
      ...(selectedProject.tools || []),
      { ...toolPayload, id: 't-' + Date.now() },
    ];
    setSelectedProject({ ...selectedProject, tools: updatedTools });
  };

  const handleRemoveTool = (toolId: string) => {
    if (!selectedProject) return;
    onRemoveToolFromProject(selectedProject.id, toolId);
    onShowToast('Tool Deallocated', 'Deallocated tool resource from project.', 'info');

    const updatedTools = (selectedProject.tools || []).filter((t) => t.id !== toolId);
    setSelectedProject({ ...selectedProject, tools: updatedTools });
  };

  const handleAddMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newMilestone.name) return;
    
    // Check total weight
    const currentWeight = (selectedProject.milestones || []).reduce((sum, m) => sum + m.weight_percentage, 0);
    if (currentWeight + Number(newMilestone.weight_percentage) > 100) {
      onShowToast('Weight Error', 'Total milestone weights cannot exceed 100%.', 'error');
      return;
    }

    try {
      await createMilestone({
        project_id: Number(selectedProject.id),
        name: newMilestone.name,
        description: newMilestone.description,
        expected_completion_date: newMilestone.expected_completion_date,
        weight_percentage: Number(newMilestone.weight_percentage),
        status: 'planned'
      }).unwrap();
      onShowToast('Milestone Created', 'Successfully added milestone', 'success');
      setShowAddMilestoneModal(false);
      setNewMilestone({
        name: '',
        description: '',
        expected_completion_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        weight_percentage: 10,
      });
      // We don't locally update selectedProject here, rely on RTK query invalidation which refreshes the project list.
      // Alternatively, we could refresh the modal or let the user close and open it.
      // Note: In a real app we'd trigger a project refetch or local update.
    } catch (err: any) {
      onShowToast('Error', err?.data?.detail || 'Failed to create milestone', 'error');
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId: number, status: string) => {
    try {
      await updateMilestone({ id: milestoneId, status }).unwrap();
      onShowToast('Status Updated', 'Milestone status updated successfully.', 'success');
    } catch (err: any) {
      onShowToast('Error', err?.data?.detail || 'Failed to update milestone', 'error');
    }
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await deleteMilestone(milestoneId).unwrap();
      onShowToast('Deleted', 'Milestone deleted.', 'info');
    } catch (err: any) {
      onShowToast('Error', err?.data?.detail || 'Failed to delete milestone', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans pb-8">
      {/* Top Header & Search Bar */}
           <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white-900 flex items-center gap-3">
           
            <span>My Projects Management</span>
          </h1>
          <p className="text-xs text-white-500 mt-2 font-medium max-w-xl leading-relaxed">
            Manage active projects, assign team members, allocate project tools & services, and review project timesheets.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 relative z-10 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative z-10">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search project name, code, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-200/60 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/50 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((proj) => {
          const assignedCount = (proj.assignedUserIds || []).length;
          const toolsCount = (proj.tools || []).length;
          
          const calculatedLoggedHours = timesheets
            .filter((ts) => ts.projectId === proj.id)
            .reduce((sum, ts) => sum + (ts.hours || 0), 0);
            
          const actualLoggedHours = proj.loggedHours > 0 ? proj.loggedHours : calculatedLoggedHours;

          return (
            <div
              key={proj.id}
              onClick={() => {
                setSelectedProject(proj);
                setActiveTab('details');
              }}
              className="p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 hover:border-blue-300/50 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 opacity-0">
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                      proj.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : proj.status === 'planning'
                        ? 'bg-amber-100 text-amber-800'
                        : proj.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {proj.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{proj.client}</p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {proj.description || 'No project description available.'}
                </p>

                {/* Hours */}
                <div className="pt-2 flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Logged Hours:</span>
                  <span className="font-bold text-blue-600">
                    {actualLoggedHours} hrs
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>{assignedCount} Team</span>
                  </span>
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span>{toolsCount} Tools</span>
                  </span>
                </div>

                {currentUser?.role === 'ac_manager' && (
                  <span className="font-extrabold text-slate-900">
                    {formatINR(proj.budget)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PROJECT DETAILED MODAL / DRAWER */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">

                  <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {selectedProject.status}
                  </span>
                </div>
                <h2 className="text-xl font-black">{selectedProject.name}</h2>
                <p className="text-xs text-slate-300">Client: {selectedProject.client}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditFormData(selectedProject);
                    setShowEditModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 text-xs font-bold">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'details'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Project Details</span>
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'team'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Team ({selectedProject.assignedUserIds?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'tools'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Tools & Services ({selectedProject.tools?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab('timesheets')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'timesheets'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Project Timesheets</span>
              </button>
              <button
                onClick={() => setActiveTab('milestones')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'milestones'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Milestones ({selectedProject.milestones?.length || 0})</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800">
              {/* TAB 1: DETAILS */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentUser?.role === 'ac_manager' && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Project Budget</span>
                        <p className="text-lg font-black text-slate-900 mt-0.5">{formatINR(selectedProject.budget)}</p>
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Logged Billable Hours</span>
                      <p className="text-lg font-black text-emerald-700 mt-0.5">{selectedProject.billableHours}h</p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="font-extrabold text-slate-900 text-sm">Description</h3>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {selectedProject.description || 'No detailed description provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Start Date</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedProject.startDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Target Completion Date</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedProject.endDate}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TEAM */}
              {activeTab === 'team' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Assigned Employees</h3>
                      <p className="text-slate-500 text-[11px]">Team members working on this project</p>
                    </div>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign Employee</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {(selectedProject.assignedUserIds || []).map((userId) => {
                      const userObj = allUsers.find((u) => u.id === userId);
                      if (!userObj) return null;

                      return (
                        <div key={userId} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <img
                              src={userObj.avatar}
                              alt={userObj.name}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{userObj.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {userObj.title} • {userObj.department}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-[11px] font-bold text-slate-700">
                              {formatINR(userObj.hourlyRate)}/hr
                            </span>
                            {userId !== currentUser.id && (
                              <button
                                onClick={() => handleRemoveUser(userId)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                title="Remove employee from project"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: TOOLS & SERVICES */}
              {activeTab === 'tools' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Allocated Tools & Services</h3>
                      <p className="text-slate-500 text-[11px]">
                        Tools are allocated <strong>to the project</strong>. All assigned employees can access and use them.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddToolModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Allocate Tool/Service</span>
                    </button>
                  </div>

                  {(selectedProject.tools || []).length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Wrench className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">No tools currently allocated to this project.</p>
                      <p className="text-xs text-slate-500">Allocate AI subscriptions, cloud services, APIs or testing tools above.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-extrabold text-slate-500">
                          <tr>
                            <th className="py-2.5 px-3">Tool Name</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Monthly Cost</th>
                            <th className="py-2.5 px-3">Allocation Date</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {(selectedProject.tools || []).map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50">
                              <td className="py-3 px-3 font-bold text-slate-900">{t.name}</td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {t.category}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-extrabold text-slate-800">{formatINR(t.monthlyCost)}/mo</td>
                              <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                                {t.allocationDate || 'N/A'}
                              </td>
                              <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                                {t.deallocationDate || 'N/A'}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                  {t.status || 'Active'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => handleRemoveTool(t.id)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold"
                                  title="Deallocate tool"
                                >
                                  Deallocate
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TIMESHEETS */}
              {activeTab === 'timesheets' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Project Timesheets (Review-Only)</h3>
                      <p className="text-slate-500 text-[11px]">Read-only view of submitted timesheet logs for this project.</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {timesheets
                      .filter((ts) => ts.projectId === selectedProject.id)
                      .map((ts) => (
                        <div key={ts.id} className="p-3.5 space-y-1.5 hover:bg-slate-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={ts.userAvatar} alt={ts.userName} className="w-6 h-6 rounded-full" />
                              <span className="font-bold text-slate-900">{ts.userName}</span>
                              <span className="text-[10px] font-mono text-slate-500">({ts.date})</span>
                            </div>
                            <span className="font-extrabold text-slate-900">
                              {ts.hours}h ({ts.billableHours}h Billable)
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-medium">
                            {ts.billableDescription || ts.description}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 5: MILESTONES */}
              {activeTab === 'milestones' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Project Milestones</h3>
                      <p className="text-slate-500 text-[11px]">Track progress and revenue through milestones.</p>
                    </div>
                    <button
                      onClick={() => setShowAddMilestoneModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Milestone</span>
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-2">
                      <span>Total Project Completion</span>
                      <span>{selectedProject.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(selectedProject.completion_percentage || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {(selectedProject.milestones || []).length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">No milestones created yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-extrabold text-slate-500">
                          <tr>
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Expected Date</th>
                            <th className="py-2.5 px-3">Weight</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {(selectedProject.milestones || []).map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="py-3 px-3">
                                <p className="font-bold text-slate-900">{m.name}</p>
                                {m.description && <p className="text-[10px] text-slate-500 truncate w-48">{m.description}</p>}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{m.expected_completion_date}</td>
                              <td className="py-3 px-3 font-extrabold text-slate-800">{m.weight_percentage}%</td>
                              <td className="py-3 px-3">
                                <select
                                  value={m.status}
                                  onChange={(e) => handleUpdateMilestoneStatus(m.id, e.target.value)}
                                  className={`px-2 py-1 rounded border text-[10px] font-bold ${
                                    m.status === 'achieved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    m.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  <option value="planned">Planned</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="achieved">Achieved</option>
                                </select>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => handleDeleteMilestone(m.id)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold"
                                  title="Delete milestone"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl p-7 space-y-5 text-xs font-sans"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <h3 className="text-base font-black text-slate-900">Create New Project</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ERP Cloud Portal"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>



              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    {isAddingInlineClient ? 'New Client Name *' : 'Client Name *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingInlineClient(!isAddingInlineClient);
                      setInlineClientName('');
                    }}
                    className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isAddingInlineClient ? (
                      <>
                        <X className="w-3 h-3" /> Select Existing
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" /> New Client
                      </>
                    )}
                  </button>
                </div>

                {isAddingInlineClient ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Enter client company name..."
                      value={inlineClientName}
                      onChange={(e) => setInlineClientName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!inlineClientName.trim() || isInlineCreating) return;
                          setIsInlineCreating(true);
                          try {
                            const created = await onCreateClient(inlineClientName.trim());
                            if (created?.id) {
                              setNewProject((prev) => ({ ...prev, client: String(created.id) }));
                            }
                            setInlineClientName('');
                            setIsAddingInlineClient(false);
                          } finally {
                            setIsInlineCreating(false);
                          }
                        } else if (e.key === 'Escape') {
                          setIsAddingInlineClient(false);
                        }
                      }}
                      className="w-full bg-white border-2 border-blue-400 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                    />
                    <button
                      type="button"
                      disabled={isInlineCreating || !inlineClientName.trim()}
                      onClick={async () => {
                        if (!inlineClientName.trim() || isInlineCreating) return;
                        setIsInlineCreating(true);
                        try {
                          const created = await onCreateClient(inlineClientName.trim());
                          if (created?.id) {
                            setNewProject((prev) => ({ ...prev, client: String(created.id) }));
                          }
                          setInlineClientName('');
                          setIsAddingInlineClient(false);
                        } finally {
                          setIsInlineCreating(false);
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                      title="Save and select client"
                    >
                      {isInlineCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Add</span>
                    </button>
                  </div>
                ) : (
                  <select
                    required
                    value={newProject.client}
                    onChange={(e) => {
                      if (e.target.value === '__create_new__') {
                        setIsAddingInlineClient(true);
                      } else {
                        setNewProject({ ...newProject, client: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select a client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="__create_new__" className="font-bold text-blue-600">
                      + Add New Client...
                    </option>
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Status</label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="planning">Planning</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              {currentUser?.role === 'ac_manager' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Budget (₹ INR)</label>
                  <input
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}



              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Start Date</label>
                <input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">End Date</label>
                <input
                  type="date"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Description</label>
              <textarea
                rows={3}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                placeholder="Brief summary of deliverables and scope..."
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT PROJECT DETAILS MODAL */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <form
            onSubmit={handleEditSubmit}
            className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl p-7 space-y-5 text-xs font-sans"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <h3 className="text-base font-black text-slate-900">Edit Project Details</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Project Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="active">Active</option>
                  <option value="planning">Planning</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              {currentUser?.role === 'ac_manager' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Budget (₹ INR)</label>
                  <input
                    type="number"
                    value={editFormData.budget}
                    onChange={(e) => setEditFormData({ ...editFormData, budget: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              )}


            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Description</label>
              <textarea
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ASSIGN EMPLOYEE MODAL */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl p-7 space-y-5 text-xs font-sans">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <h3 className="text-base font-black text-slate-900">Assign Employee to {selectedProject.name}</h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Select Employee</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium"
              >
                <option value="">-- Select an employee --</option>
                {allUsers
                  .filter((u) => u.role === 'employee')
                  .filter((u) => !(selectedProject.assignedUserIds || []).includes(u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.title} • {u.department})
                    </option>
                  ))}
              </select>
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
                type="button"
                disabled={!selectedUserId}
                onClick={handleAssignUser}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALLOCATE TOOL MODAL */}
      {showAddToolModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <form
            onSubmit={handleAddToolSubmit}
            className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl p-7 space-y-5 text-xs font-sans"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <h3 className="text-base font-black text-slate-900">Allocate Tool/Service to Project</h3>
              <button
                type="button"
                onClick={() => setShowAddToolModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Tool / Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Claude Enterprise, GCP Vertex AI, Postman"
                  value={newTool.name}
                  onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Category</label>
                <select
                  value={newTool.category}
                  onChange={(e) => setNewTool({ ...newTool, category: e.target.value as any })}
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
                  value={newTool.monthlyCost}
                  onChange={(e) => setNewTool({ ...newTool, monthlyCost: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Allocation Date</label>
                <input
                  type="date"
                  value={newTool.allocationDate}
                  onChange={(e) => setNewTool({ ...newTool, allocationDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddToolModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Allocate Tool
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ADD MILESTONE MODAL */}
      {showAddMilestoneModal && selectedProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <form
            onSubmit={handleAddMilestoneSubmit}
            className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl p-7 space-y-5 text-xs font-sans"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <h3 className="text-base font-black text-slate-900">Add Milestone to Project</h3>
              <button
                type="button"
                onClick={() => setShowAddMilestoneModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Milestone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phase 1 - Design Complete"
                  value={newMilestone.name}
                  onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Description</label>
                <textarea
                  placeholder="Details of the milestone..."
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Expected Completion Date *</label>
                <input
                  type="date"
                  required
                  value={newMilestone.expected_completion_date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, expected_completion_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Weight Percentage (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={newMilestone.weight_percentage}
                  onChange={(e) => setNewMilestone({ ...newMilestone, weight_percentage: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMilestoneModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Add Milestone
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
