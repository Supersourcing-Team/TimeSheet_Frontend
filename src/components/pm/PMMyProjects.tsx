const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

import React, { useState } from 'react';
import { Project, User, ProjectTool, TimesheetEntry, Milestone } from '../../types';
import { formatINR } from '../../utils/formatters';
import {
  useCreateMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
  useGetToolsQuery,
  useUploadProjectDocumentMutation,
  useDeleteProjectDocumentMutation,
} from '../../store/api/dataApi';
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
  ArrowLeft,
  Paperclip,
  Download,
  UploadCloud,
  File,
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
  onAddToolToProject: (projectId: string, toolData: { toolId: number; monthlyCost: number; seats: number; allocationDate: string; deallocationDate?: string }) => void;
  onRemoveToolFromProject: (projectId: string, toolId: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}


const getStatusBadgeClass = (status: string) => {
  const s = (status || '').toLowerCase().replace(/_/g, ' ').trim();
  if (s === 'active') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  if (s === 'milestone planning' || s === 'planning') return 'bg-amber-100 text-amber-800 border border-amber-200';
  if (s === 'design') return 'bg-purple-100 text-purple-800 border border-purple-200';
  if (s === 'development') return 'bg-blue-100 text-blue-800 border border-blue-200';
  if (s === 'uat') return 'bg-cyan-100 text-cyan-800 border border-cyan-200';
  if (s === 'completed') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  return 'bg-slate-100 text-slate-700 border border-slate-200';
};

const formatStatusName = (status: string) => {
  const s = (status || '').toLowerCase().replace(/_/g, ' ').trim();
  if (s === 'planning' || s === 'milestone planning') return 'Milestone Planning';
  if (s === 'design') return 'Design';
  if (s === 'development') return 'Development';
  if (s === 'uat') return 'UAT';
  if (s === 'completed') return 'Completed';
  if (s === 'active') return 'Active';
  return status || 'Milestone Planning';
};

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

  // Helper to update URL param cleanly
  const updateUrlProjectId = (projId: string | null) => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (projId) {
        params.set('projectId', projId);
      } else {
        params.delete('projectId');
      }
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({ ...window.history.state, projectId: projId || undefined }, '', newUrl);
    } catch {
      // ignore
    }
  };

  // Sync on mount & popstate
  React.useEffect(() => {
    const syncFromUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const pid = params.get('projectId');
        if (pid) {
          const match = projects.find((p) => String(p.id) === String(pid));
          if (match) {
            setSelectedProject(match);
          }
        } else {
          setSelectedProject(null);
        }
      } catch {
        // ignore
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [projects]);

  // Keep selected project in sync with upstream changes
  React.useEffect(() => {
    if (selectedProject) {
      const updated = projects.find((p) => String(p.id) === String(selectedProject.id));
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedProject)) {
        setSelectedProject(updated);
      }
    }
  }, [projects, selectedProject]);

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
    status: 'Milestone Planning' as any,
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
    start_date: string;
    expected_completion_date: string;
    weight_percentage: number;
  }>({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    expected_completion_date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
    weight_percentage: 10,
  });

  // Edit Milestone Form
  const [showEditMilestoneModal, setShowEditMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<{
    id: number;
    name: string;
    description: string;
    start_date: string;
    expected_completion_date: string;
    weight_percentage: number;
  } | null>(null);

  // Selected User for Assignment
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Achieve Milestone Modal
  const [showAchieveModal, setShowAchieveModal] = useState(false);

  // Supporting documents state
  const [selectedCreateFiles, setSelectedCreateFiles] = useState<File[]>([]);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [uploadProjectDoc] = useUploadProjectDocumentMutation();
  const [deleteProjectDoc] = useDeleteProjectDocumentMutation();
  const [achieveMilestoneId, setAchieveMilestoneId] = useState<number | null>(null);
  const [achieveDate, setAchieveDate] = useState(new Date().toISOString().split('T')[0]);

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
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? p.isActive !== false && p.is_active !== false
        : statusFilter === 'inactive'
        ? p.isActive === false || p.is_active === false
        : p.status === statusFilter || formatStatusName(p.status) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const validateMilestone = (
    milestone: { start_date: string; expected_completion_date: string; weight_percentage: number },
    milestoneIdToIgnore?: number
  ): string | null => {
    if (!selectedProject) return 'No project selected.';

    const start = new Date(milestone.start_date);
    const end = new Date(milestone.expected_completion_date);
    const projStart = new Date(selectedProject.startDate);
    const projEnd = new Date(selectedProject.endDate);

    if (start > end) {
      return 'Start date must be before or equal to expected completion date.';
    }

    if (start < projStart || end > projEnd) {
      return `Milestone dates must fall within the project timeline (${selectedProject.startDate} to ${selectedProject.endDate}).`;
    }

    // Weight check
    const currentWeight = (selectedProject.milestones || [])
      .filter((m) => m.id !== milestoneIdToIgnore)
      .reduce((sum, m) => sum + m.weight_percentage, 0);

    if (currentWeight + Number(milestone.weight_percentage) > 100) {
      return 'Total milestone weights cannot exceed 100%.';
    }

    // Overlap check
    for (const m of selectedProject.milestones || []) {
      if (m.id === milestoneIdToIgnore) continue;
      if (!m.start_date || !m.expected_completion_date) continue; // Ignore old milestones with no dates

      const mStart = new Date(m.start_date);
      const mEnd = new Date(m.expected_completion_date);

      // Overlap logic: (Start A <= End B) and (End A >= Start B)
      if (start <= mEnd && end >= mStart) {
        return `Milestone dates overlap with existing milestone "${m.name}".`;
      }
    }

    return null;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.client) {
      onShowToast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    try {
      setIsUploadingDocs(true);
      const res: any = await onAddProject({
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

      const newProjId = res?.id || res?.data?.id;
      if (newProjId && selectedCreateFiles.length > 0) {
        for (const file of selectedCreateFiles) {
          try {
            await uploadProjectDoc({ projectId: String(newProjId), file }).unwrap();
          } catch (docErr) {
            console.error('Failed to upload document:', docErr);
          }
        }
      }

      onShowToast('Project Created', `Successfully created ${newProject.name}`, 'success');
      setShowCreateModal(false);
      setSelectedCreateFiles([]);
      setNewProject({
        name: '',
        client: '',
        status: 'active',
        budget: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        description: '',
      });
    } catch (err) {
      // toast already handled
    } finally {
      setIsUploadingDocs(false);
    }
  };

  const handleUploadEditDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !editFormData) return;
    try {
      setIsUploadingDocs(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadProjectDoc({ projectId: editFormData.id, file }).unwrap();
        const uploadedDoc = res?.data || res;
        setEditFormData((prev) =>
          prev
            ? {
                ...prev,
                documents: [
                  ...(prev.documents || []),
                  {
                    id: String(uploadedDoc.id),
                    projectId: String(editFormData.id),
                    fileName: uploadedDoc.file_name || file.name,
                    filePath: uploadedDoc.file_path,
                    fileSize: uploadedDoc.file_size || file.size,
                    fileType: uploadedDoc.file_type || file.type,
                    uploadedAt: uploadedDoc.uploaded_at || new Date().toISOString(),
                  },
                ],
              }
            : null
        );
      }
      onShowToast('Document Uploaded', 'Supporting document uploaded successfully.', 'success');
    } catch (err: any) {
      onShowToast('Upload Failed', err?.data?.detail || 'Failed to upload document', 'error');
    } finally {
      setIsUploadingDocs(false);
      e.target.value = '';
    }
  };

  const handleDeleteEditDocument = async (documentId: string) => {
    if (!editFormData) return;
    try {
      await deleteProjectDoc({ projectId: editFormData.id, documentId }).unwrap();
      setEditFormData((prev) =>
        prev
          ? {
              ...prev,
              documents: (prev.documents || []).filter((d) => d.id !== documentId),
            }
          : null
      );
      onShowToast('Document Deleted', 'Supporting document deleted.', 'info');
    } catch (err: any) {
      onShowToast('Delete Failed', err?.data?.detail || 'Failed to delete document', 'error');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    onUpdateProject(editFormData);
    onShowToast('Project Updated', `Updated details for ${editFormData.name}`, 'success');
    setShowEditModal(false);
    // Redirect back to My Projects grid view
    setSelectedProject(null);
    updateUrlProjectId(null);
  };

  const handleAssignUser = () => {
    if (!selectedProject || !selectedUserId) return;
    onAssignUserToProject(selectedProject.id, selectedUserId);
    const assignedUser = allUsers.find((u) => String(u.id) === String(selectedUserId));
    onShowToast('Employee Assigned', `Assigned ${assignedUser?.name || 'user'} to ${selectedProject.name}`, 'success');
    setShowAssignModal(false);
    setSelectedUserId('');

    // Update selectedProject in local view
    const updated = {
      ...selectedProject,
      assignedUserIds: [...(selectedProject.assignedUserIds || []).map(String), String(selectedUserId)],
    };
    setSelectedProject(updated);
  };

  const handleRemoveUser = (userId: string) => {
    if (!selectedProject) return;
    onRemoveUserFromProject(selectedProject.id, userId);
    const removedUser = allUsers.find((u) => String(u.id) === String(userId));
    onShowToast('Employee Removed', `Removed ${removedUser?.name || 'user'} from ${selectedProject.name}`, 'info');

    const updated = {
      ...selectedProject,
      assignedUserIds: (selectedProject.assignedUserIds || []).map(String).filter((id) => String(id) !== String(userId)),
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
    const validationError = validateMilestone(newMilestone);
    if (validationError) {
      onShowToast('Validation Error', validationError, 'error');
      return;
    }

    try {
      await createMilestone({
        project_id: Number(selectedProject.id),
        name: newMilestone.name,
        description: newMilestone.description,
        start_date: newMilestone.start_date,
        expected_completion_date: newMilestone.expected_completion_date,
        weight_percentage: Number(newMilestone.weight_percentage),
        status: 'planned'
      }).unwrap();
      onShowToast('Milestone Created', 'Successfully added milestone', 'success');
      setShowAddMilestoneModal(false);
      setNewMilestone({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        expected_completion_date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
        weight_percentage: 10,
      });
      // We don't locally update selectedProject here, rely on RTK query invalidation which refreshes the project list.
      // Alternatively, we could refresh the modal or let the user close and open it.
      // Note: In a real app we'd trigger a project refetch or local update.
    } catch (err: any) {
      onShowToast('Error', err?.data?.detail || 'Failed to create milestone', 'error');
    }
  };

  const handleEditMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !editingMilestone || !editingMilestone.name) return;

    const validationError = validateMilestone(editingMilestone, editingMilestone.id);
    if (validationError) {
      onShowToast('Validation Error', validationError, 'error');
      return;
    }

    try {
      await updateMilestone({
        id: editingMilestone.id,
        name: editingMilestone.name,
        description: editingMilestone.description,
        start_date: editingMilestone.start_date,
        expected_completion_date: editingMilestone.expected_completion_date,
        weight_percentage: Number(editingMilestone.weight_percentage)
      }).unwrap();
      onShowToast('Milestone Updated', 'Successfully updated milestone', 'success');
      setShowEditMilestoneModal(false);
      setEditingMilestone(null);
    } catch (err: any) {
      onShowToast('Error', err?.data?.detail || 'Failed to update milestone', 'error');
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId: number, status: string, additionalData: any = {}) => {
    try {
      if (status === 'achieved' && !additionalData.actual_achievement_date) {
        setAchieveMilestoneId(milestoneId);
        setAchieveDate(new Date().toISOString().split('T')[0]);
        setShowAchieveModal(true);
        return;
      }

      await updateMilestone({ id: milestoneId, status, ...additionalData }).unwrap();
      onShowToast('Status Updated', 'Milestone status updated successfully.', 'success');
      setShowAchieveModal(false);
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
      {!selectedProject && (
        <>
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
                <option value="active">Active Projects</option>
                <option value="inactive">Inactive Projects</option>
                <option value="Milestone Planning">Milestone Planning</option>
                <option value="Design">Design</option>
                <option value="Development">Development</option>
                <option value="UAT">UAT</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((proj) => {
              const assignedCount = (proj.assignedUserIds || []).length;
              const toolsCount = (proj.tools || []).length;
              const isMilestoneConfigured = (proj.milestones && proj.milestones.length > 0) || (proj.completion_percentage !== undefined && proj.completion_percentage > 0);

              const calculatedLoggedHours = timesheets
                .filter((ts) => ts.projectId === proj.id)
                .reduce((sum, ts) => sum + ((ts.billableHours || 0) + (ts.nonBillableHours || 0)), 0);

              const actualLoggedHours = proj.loggedHours > 0 ? proj.loggedHours : calculatedLoggedHours;

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setSelectedProject(proj);
                    setActiveTab('details');
                    updateUrlProjectId(String(proj.id));
                  }}
                  className={`p-6 rounded-3xl backdrop-blur-xl border transition-all duration-300 cursor-pointer group flex flex-col justify-between ${isMilestoneConfigured
                    ? 'bg-gradient-to-b from-indigo-50/30 to-white/90 border-indigo-200 shadow-[0_8px_30px_rgb(99,102,241,0.08)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.18)] hover:-translate-y-1 hover:border-indigo-400'
                    : 'bg-white/70 border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 hover:border-blue-300/50'
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 opacity-0">
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {proj.isActive !== false && proj.is_active !== false ? (
                          <>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${getStatusBadgeClass(proj.status)}`}
                            >
                              {formatStatusName(proj.status)}
                            </span>
                            {isMilestoneConfigured ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                                Milestone Configured
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shadow-2xs">
                                Milestone Not Configured
                              </span>
                            )}
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-2xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          </>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-2xs bg-rose-50 text-rose-700 border border-rose-200">
                            Inactive
                          </span>
                        )}
                      </div>
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

                    {/* Hours placeholder if needed later, removing logged hours for now */}
                    <div className="pt-2 flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>Completion:</span>
                      <span className="font-bold text-emerald-600">
                        {proj.completion_percentage || 0}%
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
                      {(proj.documents || []).length > 0 && (
                        <span className="flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          <Paperclip className="w-3 h-3 text-indigo-600" />
                          <span>{(proj.documents || []).length} Docs</span>
                        </span>
                      )}
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
        </>
      )}

      {/* DEDICATED FULL-PAGE PROJECT VIEW */}
      {selectedProject && (() => {
        const isMilestoneConfigured =
          (selectedProject.milestones && selectedProject.milestones.length > 0) ||
          (selectedProject.completion_percentage !== undefined && selectedProject.completion_percentage > 0);

        return (
          <div className="space-y-6">
            {/* Top Breadcrumbs & Back Button */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedProject(null);
                  updateUrlProjectId(null);
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50/80 border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-2xs transition-all cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-500 group-hover:text-blue-600" />
                <span>Back to My Projects</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span
                  className="hover:text-blue-600 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedProject(null);
                    updateUrlProjectId(null);
                  }}
                >
                  My Projects
                </span>
                <span>/</span>
                <span className="text-slate-800 font-extrabold">{selectedProject.name}</span>
              </div>
            </div>

            {/* Project Header Hero Card */}
            <div className="p-6 lg:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedProject.isActive !== false && selectedProject.is_active !== false ? (
                    <>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize ${getStatusBadgeClass(selectedProject.status)}`}
                      >
                        {formatStatusName(selectedProject.status)}
                      </span>
                      {isMilestoneConfigured ? (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1 shadow-2xs">
                          Milestone Configured
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1 shadow-2xs">
                          Milestone Not Configured
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-2xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Active
                      </span>
                    </>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-2xs bg-rose-500/20 text-rose-300 border border-rose-400/30">
                      Inactive
                    </span>
                  )}
                </div>

                <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">{selectedProject.name}</h1>
                <p className="text-xs text-slate-300 font-medium">
                  Client: <span className="font-bold text-white">{selectedProject.client}</span>
                  {selectedProject.code && <span className="ml-3 text-slate-400 font-mono">({selectedProject.code})</span>}
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditFormData(selectedProject);
                    setShowEditModal(true);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>
              </div>
            </div>

            {/* Project Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white/80 backdrop-blur-md rounded-2xl px-4 py-1.5 shadow-2xs overflow-x-auto text-xs font-bold gap-1">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'details'
                  ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Project Details</span>
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'team'
                  ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Users className="w-4 h-4" />
                <span>Team ({(selectedProject.assignedUserIds || []).length})</span>
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'tools'
                  ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Tools & Services ({(selectedProject.tools || []).length})</span>
              </button>
              <button
                onClick={() => setActiveTab('timesheets')}
                className={`py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'timesheets'
                  ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Clock className="w-4 h-4" />
                <span>Project Timesheets</span>
              </button>
              <button
                onClick={() => setActiveTab('milestones')}
                className={`py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'milestones'
                  ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Layers className="w-4 h-4" />
                <span>Milestones ({(selectedProject.milestones || []).length})</span>
              </button>
            </div>

            {/* Tab Content Container */}
            <div className="p-6 lg:p-8 bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-lg space-y-6 text-xs text-slate-800">
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
                      <span className="text-[10px] uppercase font-bold text-slate-500">Milestone Progress</span>
                      <p className="text-lg font-black text-emerald-700 mt-0.5">{selectedProject.completion_percentage || 0}%</p>
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

                  {/* Supporting Documents Section in Details Tab */}
                  <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-indigo-600" />
                        <span>Supporting Documents ({(selectedProject.documents || []).length})</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setEditFormData(selectedProject);
                          setShowEditModal(true);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add / Manage Documents</span>
                      </button>
                    </div>

                    {(selectedProject.documents || []).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(selectedProject.documents || []).map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-blue-400 hover:shadow-sm transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <File className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-xs text-slate-900 truncate group-hover:text-blue-600 transition-colors" title={doc.fileName}>
                                  {doc.fileName}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  {formatFileSize(doc.fileSize)}
                                  {doc.uploadedAt && ` ? ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                                </p>
                              </div>
                            </div>
                            <a
                              href={doc.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={doc.fileName}
                              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all shrink-0 cursor-pointer"
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No supporting documents uploaded for this project.</p>
                    )}
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
                      const userObj = allUsers.find((u) => String(u.id) === String(userId));
                      if (!userObj) return null;

                      return (
                        <div key={String(userId)} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
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
                            {String(userId) !== String(currentUser.id) && (
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
                            <th className="py-2.5 px-3">Seats (Qty)</th>
                            <th className="py-2.5 px-3">Monthly Rate</th>
                            <th className="py-2.5 px-3">Total Cost</th>
                            <th className="py-2.5 px-3">Allocation Period</th>
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
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {t.seats || 1} {t.seats === 1 ? 'Seat' : 'Seats'}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-medium text-slate-700">${t.monthlyCost}/mo</td>
                              <td className="py-3 px-3 font-extrabold text-emerald-600">${(t.monthlyCost || 0) * (t.seats || 1)}/mo</td>
                              <td className="py-3 px-3 text-slate-600 text-[11px]">
                                <span>{t.allocationDate || 'Immediate'}</span>
                                {t.deallocationDate && <span className="text-slate-400"> → {t.deallocationDate}</span>}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                  {t.status || 'Active'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => handleRemoveTool(t.id)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold cursor-pointer"
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
                              {(ts.billableHours || 0) + (ts.nonBillableHours || 0)}h ({ts.billableHours}h Billable)
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
                            <th className="py-2.5 px-3">Start Date</th>
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
                              <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{m.start_date || '-'}</td>
                              <td className="py-3 px-3 font-extrabold text-slate-800">{m.weight_percentage}%</td>
                              <td className="py-3 px-3">
                                <select
                                  value={m.status}
                                  onChange={(e) => handleUpdateMilestoneStatus(m.id, e.target.value)}
                                  className={`px-2 py-1 rounded border text-[10px] font-bold ${m.status === 'achieved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
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
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingMilestone({
                                        id: m.id,
                                        name: m.name,
                                        description: m.description || '',
                                        start_date: m.start_date || new Date().toISOString().split('T')[0],
                                        expected_completion_date: m.expected_completion_date || new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
                                        weight_percentage: m.weight_percentage,
                                      });
                                      setShowEditMilestoneModal(true);
                                    }}
                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 font-bold"
                                    title="Edit milestone"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMilestone(m.id)}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold"
                                    title="Delete milestone"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
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
        );
      })()}

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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Milestone Planning">Milestone Planning</option>
                  <option value="Design">Design</option>
                  <option value="Development">Development</option>
                  <option value="UAT">UAT</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {currentUser?.role === 'ac_manager' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Budget (₹ INR)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newProject.budget === 0 ? '' : newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value === '' ? 0 : Number(e.target.value) })}
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

            {/* Supporting Documents Upload Field */}
            <div className="space-y-1.5 pt-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center justify-between">
                <span>Supporting Documents</span>
                <span className="text-[10px] text-slate-400 font-normal">PDF, DOCX, XLSX, Images (Max 10MB)</span>
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 rounded-2xl p-4 transition-all text-center">
                <input
                  type="file"
                  id="create_project_docs_input"
                  multiple
                  accept=".pdf,.doc,.docx,.xlsx,.csv,.png,.jpg,.jpeg,.txt,.zip"
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedCreateFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="create_project_docs_input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-blue-600 hover:underline">
                    Click to browse or upload documents
                  </span>
                  <span className="text-[10px] text-slate-400">Attach project specs, contracts, or reference files</span>
                </label>
              </div>

              {selectedCreateFiles.length > 0 && (
                <div className="space-y-1.5 pt-2 max-h-36 overflow-y-auto">
                  {selectedCreateFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-100/80 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-800 truncate">{f.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">({formatFileSize(f.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCreateFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              {/* Active / Inactive Radio Buttons */}
              <div className="space-y-1.5 sm:col-span-2 pb-1 border-b border-slate-100">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Project State</label>
                <div className="flex items-center gap-6 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                    <input
                      type="radio"
                      name="edit_project_is_active"
                      checked={editFormData.isActive !== false && editFormData.is_active !== false}
                      onChange={() => setEditFormData({ ...editFormData, isActive: true, is_active: true })}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 font-extrabold">
                      Active
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                    <input
                      type="radio"
                      name="edit_project_is_active"
                      checked={editFormData.isActive === false || editFormData.is_active === false}
                      onChange={() => setEditFormData({ ...editFormData, isActive: false, is_active: false })}
                      className="w-4 h-4 text-rose-600 focus:ring-rose-500 accent-rose-600"
                    />
                    <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 font-extrabold">
                      Inactive
                    </span>
                  </label>
                </div>
              </div>

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
                  value={formatStatusName(editFormData.status)}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                >
                  <option value="Milestone Planning">Milestone Planning</option>
                  <option value="Design">Design</option>
                  <option value="Development">Development</option>
                  <option value="UAT">UAT</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {currentUser?.role === 'ac_manager' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Budget (₹ INR)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={editFormData.budget === 0 ? '' : editFormData.budget}
                    onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value === '' ? 0 : Number(e.target.value) })}
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

            {/* Supporting Documents Section in Edit Modal */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Supporting Documents ({(editFormData.documents || []).length})
                </label>
                <label
                  htmlFor="edit_project_docs_input"
                  className="cursor-pointer text-[11px] font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                  <input
                    type="file"
                    id="edit_project_docs_input"
                    multiple
                    accept=".pdf,.doc,.docx,.xlsx,.csv,.png,.jpg,.jpeg,.txt,.zip"
                    onChange={handleUploadEditDocument}
                    className="hidden"
                  />
                </label>
              </div>

              {(editFormData.documents || []).length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(editFormData.documents || []).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-800 truncate">{doc.fileName}</span>
                        {doc.fileSize && (
                          <span className="text-[10px] text-slate-400 shrink-0">({formatFileSize(doc.fileSize)})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={doc.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.fileName}
                          className="p-1 rounded-lg text-blue-600 hover:bg-blue-50"
                          title="Download document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteEditDocument(doc.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic py-1">No supporting documents attached yet.</p>
              )}
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
                  .filter((u) => !(selectedProject.assignedUserIds || []).map(String).includes(String(u.id)))
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
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" />
                <span>Allocate Tool from Catalog</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddToolModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Select Tool (Configured by Admin) *
                </label>
                {masterTools.filter((t) => t.status !== 'Inactive').length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
                    No tools configured by Admin in the master catalog.
                  </div>
                ) : (
                  <select
                    required
                    value={newTool.masterToolId}
                    onChange={(e) => setNewTool({ ...newTool, masterToolId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium cursor-pointer"
                  >
                    <option value="">-- Select Tool from Catalog --</option>
                    {masterTools
                      .filter((t) => t.status !== 'Inactive')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Monthly Cost ($/mo) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="e.g. 50"
                    value={newTool.monthlyCost === 0 ? '' : newTool.monthlyCost}
                    onChange={(e) => setNewTool({ ...newTool, monthlyCost: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Seats (Qty) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={newTool.seats}
                    onChange={(e) => setNewTool({ ...newTool, seats: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
                <span className="text-indigo-900 font-bold text-xs">Total Monthly Cost:</span>
                <span className="text-emerald-700 font-black text-sm">
                  ${((Number(newTool.monthlyCost) || 0) * (Number(newTool.seats) || 1)).toFixed(2)}/mo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newTool.allocationDate}
                    onChange={(e) => setNewTool({ ...newTool, allocationDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newTool.deallocationDate}
                    onChange={(e) => setNewTool({ ...newTool, deallocationDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddToolModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={masterTools.filter((t) => t.status !== 'Inactive').length === 0}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
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
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Start Date *</label>
                <input
                  type="date"
                  required
                  min={selectedProject?.startDate}
                  max={selectedProject?.endDate}
                  value={newMilestone.start_date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, start_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Expected Completion Date *</label>
                <input
                  type="date"
                  required
                  min={selectedProject?.startDate}
                  max={selectedProject?.endDate}
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

      {/* Achieve Milestone Modal */}
      {showAchieveModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Mark as Achieved</h3>
            <p className="text-xs text-slate-500 font-medium">Please confirm the actual completion date for this milestone. This is used to calculate the actual cost (AC).</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Completion Date</label>
              <input
                type="date"
                value={achieveDate}
                onChange={(e) => setAchieveDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAchieveModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (achieveMilestoneId) {
                    handleUpdateMilestoneStatus(achieveMilestoneId, 'achieved', {
                      actual_achievement_date: achieveDate
                    });
                  }
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MILESTONE MODAL */}
      {showEditMilestoneModal && editingMilestone && selectedProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <form
            onSubmit={handleEditMilestoneSubmit}
            className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl p-7 space-y-5 text-xs font-sans"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <h3 className="text-base font-black text-slate-900">Edit Milestone</h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditMilestoneModal(false);
                  setEditingMilestone(null);
                }}
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
                  value={editingMilestone.name}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Description</label>
                <textarea
                  placeholder="Details of the milestone..."
                  value={editingMilestone.description}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Start Date *</label>
                <input
                  type="date"
                  required
                  min={selectedProject?.startDate}
                  max={selectedProject?.endDate}
                  value={editingMilestone.start_date}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, start_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Expected Completion Date *</label>
                <input
                  type="date"
                  required
                  min={selectedProject?.startDate}
                  max={selectedProject?.endDate}
                  value={editingMilestone.expected_completion_date}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, expected_completion_date: e.target.value })}
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
                  value={editingMilestone.weight_percentage}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, weight_percentage: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowEditMilestoneModal(false);
                  setEditingMilestone(null);
                }}
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
    </div>
  );
};
