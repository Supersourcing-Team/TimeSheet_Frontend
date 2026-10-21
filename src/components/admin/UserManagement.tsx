import { Pagination } from '../common/Pagination';
import { getErrorMessage } from '../../utils/errorHandler';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useGetUpcomingLeavesQuery,
  useGetKekaMappingPreviewQuery,
  useSyncKekaEmployeesMutation,
  useSyncKekaDepartmentsMutation,
  useLazyGetKekaEmployeeDetailsQuery,
  useLazyGetUserByIdQuery,
} from '../../store/api/dataApi';
import { KekaMappingPreviewItem } from '../../types';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import {
  fetchUsersApi,
  createUserApi,
  createKekaEmployeeApi,
  updateUserApi,
  toggleUserStatusApi,
  fetchRolesApi,
  fetchDepartmentsApi,
  createDepartmentApi,
  deleteDepartmentApi,
  BackendUser,
  BackendRole,
  BackendDepartment,
} from '../../utils/api';
import {
  UserCog,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  X,
  UserCheck,
  UserX,
  Edit,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Hash,
  Building2,
  Trash2,
  Settings,
  Sparkles,
  Globe,
  Briefcase,
  Cloud,
  Database,
  Link2,
  Unlink,
  UserPlus,
  Eye,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface UserManagementProps {
  currentUser?: { id: string } | null;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

// Map backend role name → frontend display label and colour
function roleLabel(roleName: string): string {
  const r = roleName.toLowerCase();
  if (r.includes('admin')) return 'Admin';
  if (r.includes('project')) return 'Project Manager';
  if (r.includes('account')) return 'Account Manager';
  return 'Employee';
}

function roleBadgeClass(roleName: string): string {
  const r = roleName.toLowerCase();
  if (r.includes('admin')) return 'bg-slate-900 text-white border border-slate-900';
  if (r.includes('project')) return 'bg-sky-100 text-sky-900 border border-sky-300';
  if (r.includes('account')) return 'bg-sky-50 text-sky-800 border border-sky-200';
  return 'bg-slate-100 text-slate-800 border border-slate-200';
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'active') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (s === 'inactive') return 'bg-rose-50 text-rose-700 border border-rose-200';
  if (s === 'pending') return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-slate-100 text-slate-700 border border-slate-200';
}

function kekaStatusBadgeClass(status?: string | null): string {
  const s = (status || '').toLowerCase();
  if (s.includes('work') || s.includes('active')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (s.includes('relieved') || s.includes('exit') || s.includes('inactive')) return 'bg-rose-50 text-rose-700 border border-rose-200';
  if (s.includes('notice')) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-slate-100 text-slate-700 border border-slate-200';
}

function departmentBadgeClass(deptName: string): string {
  return 'bg-sky-50 text-sky-900 border border-sky-200';
}

// ---------------------------------------------------------------------------
// Default form values
// ---------------------------------------------------------------------------
const defaultCreate = {
  first_name: '',
  middle_name: '',
  last_name: '',
  display_name: '',
  email: '',
  employee_id: '',
  role_id: 0,
  department_id: '' as number | '',
  joining_date: '',
  status: 'Active',
  ctc: undefined as number | undefined,
  // Keka Official Fields
  mobile_number: '',
  gender: 0, // 0: Unspecified, 1: Male, 2: Female, 3: Other
  date_of_birth: '',
  business_unit: '',
  job_title: '',
  secondary_job_title: '',
  location: '',
  legal_entity: '',
  nationality: 'Indian',
  sync_to_keka: true,
};

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, onShowToast }) => {
  const currentUserId = currentUser ? Number(currentUser.id) : null;
  const { data: upcomingLeaves = [] } = useGetUpcomingLeavesQuery();

  // ── Server state ──────────────────────────────────────────────────────────
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [roles, setRoles] = useState<BackendRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<BackendDepartment[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Filters / Pagination ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ── Directory View Mode ───────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'keka' | 'system'>('keka');

  // ── Keka Directory query & mutations ──────────────────────────────────────
  const {
    data: kekaMappingData,
    isLoading: isKekaLoading,
    isFetching: isKekaFetching,
    refetch: refetchKeka,
    error: kekaError,
  } = useGetKekaMappingPreviewQuery();

  const [syncKekaEmployees, { isLoading: isSyncingKekaEmps }] = useSyncKekaEmployeesMutation();
  const [syncKekaDepartments, { isLoading: isSyncingKekaDepts }] = useSyncKekaDepartmentsMutation();

  const [syncingSingleId, setSyncingSingleId] = useState<string | null>(null);

  // Keka Directory filters & pagination
  const [kekaSearchQuery, setKekaSearchQuery] = useState('');
  const [kekaSyncFilter, setKekaSyncFilter] = useState<'all' | 'mapped' | 'unmapped' | 'local_match'>('all');
  const [kekaDeptFilter, setKekaDeptFilter] = useState<string>('');
  const [kekaStatusFilter, setKekaStatusFilter] = useState<string>('');
  const [kekaCurrentPage, setKekaCurrentPage] = useState(1);
  const [kekaItemsPerPage, setKekaItemsPerPage] = useState(10);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<BackendUser | null>(null);
  const [showRoleMatrixModal, setShowRoleMatrixModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showManageDeptModal, setShowManageDeptModal] = useState(false);

  // ── Employee Live Profile Modal ───────────────────────────────────────────
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState<{
    type: 'keka' | 'system';
    id: string | number;
    initialItem: any;
  } | null>(null);

  const [
    triggerKekaDetails,
    { data: kekaDetailData, isFetching: isKekaDetailLoading, error: kekaDetailError },
  ] = useLazyGetKekaEmployeeDetailsQuery();

  const [
    triggerUserDetails,
    { data: userDetailData, isFetching: isUserDetailLoading, error: userDetailError },
  ] = useLazyGetUserByIdQuery();

  const handleOpenEmployeeDetails = (type: 'keka' | 'system', item: any) => {
    if (type === 'keka') {
      setDetailTarget({ type: 'keka', id: item.keka_employee_id, initialItem: item });
      setShowDetailModal(true);
      triggerKekaDetails(item.keka_employee_id);
    } else {
      setDetailTarget({ type: 'system', id: item.id, initialItem: item });
      setShowDetailModal(true);
      triggerUserDetails(item.id);
    }
  };

  // ── Department forms ──────────────────────────────────────────────────────
  const [newDeptForm, setNewDeptForm] = useState({ name: '', code: '', description: '' });
  const [newDeptLoading, setNewDeptLoading] = useState(false);
  const [deptActionTarget, setDeptActionTarget] = useState<'create' | 'edit' | null>(null);

  // ── Add-user form ─────────────────────────────────────────────────────────
  const [createForm, setCreateForm] = useState({ ...defaultCreate });
  const [createLoading, setCreateLoading] = useState(false);

  // ── Edit-user form ────────────────────────────────────────────────────────
  const [editForm, setEditForm] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    employee_id: string;
    role_id: number;
    department_id: number | '';
    joining_date: string;
    status: string;
    ctc?: number;
  } | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // ── Status-toggle loading set ─────────────────────────────────────────────
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  // ── Fetch departments ────────────────────────────────────────────────────
  const loadDepartments = useCallback(async () => {
    setDeptLoading(true);
    try {
      const data = await fetchDepartmentsApi(false);
      setDepartments(data);
    } catch (e: any) {
      console.error('Failed to load departments:', e);
    } finally {
      setDeptLoading(false);
    }
  }, []);

  // ── Fetch users ───────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: currentPage, limit: itemsPerPage };
      if (selectedRoleId !== '') params.role_id = selectedRoleId;
      if (selectedStatus) params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const resp = await fetchUsersApi(params);
      
      // Filter by department on frontend if selected
      let filteredItems = resp.items;
      if (selectedDeptId !== '') {
        filteredItems = filteredItems.filter(u => u.department_id === selectedDeptId || u.department?.id === selectedDeptId);
      }
      
      setUsers(filteredItems);
      setTotal(selectedDeptId !== '' ? filteredItems.length : resp.total);
      setTotalPages(resp.total_pages || Math.ceil(resp.total / itemsPerPage) || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedRoleId, selectedDeptId, selectedStatus, searchQuery]);

  // ── Fetch roles (with retry support) ─────────────────────────────────────
  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const data = await fetchRolesApi();
      setRoles(data);
    } catch (e: any) {
      const msg = e.message || 'Failed to load roles';
      setRolesError(msg);
      onShowToast('Roles Load Failed', getErrorMessage(e, 'Failed to load system roles.'), 'error');
    } finally {
      setRolesLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    loadRoles();
    loadDepartments();
  }, [loadRoles, loadDepartments]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRoleId, selectedDeptId, selectedStatus]);

  // ── Keka Items Memoization & Filtering ────────────────────────────────────
  const kekaItems = kekaMappingData?.items || [];

  const kekaDepartments = useMemo(() => {
    const set = new Set<string>();
    kekaItems.forEach((item) => {
      if (item.keka_department) set.add(item.keka_department);
    });
    return Array.from(set).sort();
  }, [kekaItems]);

  const kekaStatuses = useMemo(() => {
    const set = new Set<string>();
    kekaItems.forEach((item) => {
      if (item.employment_status) set.add(item.employment_status);
    });
    return Array.from(set).sort();
  }, [kekaItems]);

  const filteredKekaItems = useMemo(() => {
    return kekaItems.filter((item) => {
      if (kekaSearchQuery.trim()) {
        const q = kekaSearchQuery.toLowerCase();
        const nameMatch = item.keka_name?.toLowerCase().includes(q);
        const emailMatch = item.keka_email?.toLowerCase().includes(q);
        const empNumMatch = item.keka_employee_number?.toLowerCase().includes(q);
        const titleMatch = item.keka_job_title?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !empNumMatch && !titleMatch) return false;
      }

      if (kekaSyncFilter !== 'all') {
        if (kekaSyncFilter === 'mapped' && item.status !== 'mapped') return false;
        if (kekaSyncFilter === 'unmapped' && item.status !== 'unmapped') return false;
        if (kekaSyncFilter === 'local_match' && item.status !== 'local_match') return false;
      }

      if (kekaDeptFilter && item.keka_department !== kekaDeptFilter) {
        return false;
      }

      if (kekaStatusFilter && item.employment_status !== kekaStatusFilter) {
        return false;
      }

      return true;
    });
  }, [kekaItems, kekaSearchQuery, kekaSyncFilter, kekaDeptFilter, kekaStatusFilter]);

  const totalKekaPages = Math.max(1, Math.ceil(filteredKekaItems.length / kekaItemsPerPage));
  const paginatedKekaItems = useMemo(() => {
    const start = (kekaCurrentPage - 1) * kekaItemsPerPage;
    return filteredKekaItems.slice(start, start + kekaItemsPerPage);
  }, [filteredKekaItems, kekaCurrentPage, kekaItemsPerPage]);

  useEffect(() => {
    setKekaCurrentPage(1);
  }, [kekaSearchQuery, kekaSyncFilter, kekaDeptFilter, kekaStatusFilter]);

  const handleSyncAllFromKeka = async () => {
    try {
      onShowToast('Sync Initiated', 'Synchronizing employees and departments from Keka API…', 'info');
      try {
        await syncKekaDepartments().unwrap();
      } catch (err) {
        console.warn('Departments sync warning:', err);
      }
      const res = await syncKekaEmployees({ update_existing: true, create_missing: true }).unwrap();
      await refetchKeka();
      await loadUsers();
      await loadDepartments();
      const count = res?.total_keka_employees || res?.created_count || 'All';
      onShowToast(
        'Keka Sync Complete',
        `Successfully synchronized ${count} Keka employees with local Timesheet system.`,
        'success'
      );
    } catch (e: any) {
      onShowToast('Sync Failed', getErrorMessage(e, 'Failed to synchronize with Keka.'), 'error');
    }
  };

  const handleSyncSingleEmployee = async (item: KekaMappingPreviewItem) => {
    setSyncingSingleId(item.keka_employee_id);
    try {
      await syncKekaEmployees({
        keka_employee_id: item.keka_employee_id,
        update_existing: true,
        create_missing: true,
      }).unwrap();
      await refetchKeka();
      await loadUsers();
      await loadDepartments();
      onShowToast(
        'Employee Synced',
        `${item.keka_name || 'Employee'} has been successfully imported and linked to Timesheet!`,
        'success'
      );
    } catch (e: any) {
      onShowToast('Sync Failed', getErrorMessage(e, 'Failed to sync employee.'), 'error');
    } finally {
      setSyncingSingleId(null);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenAdd = async () => {
    let resolvedRoles = roles;
    if (resolvedRoles.length === 0) {
      setRolesLoading(true);
      setRolesError(null);
      try {
        const data = await fetchRolesApi();
        setRoles(data);
        resolvedRoles = data;
      } catch (e: any) {
        const msg = e.message || 'Failed to load roles';
        setRolesError(msg);
        onShowToast('Roles Load Failed', msg + ' — cannot open form without roles.', 'error');
        setRolesLoading(false);
        return;
      } finally {
        setRolesLoading(false);
      }
    }
    setCreateForm({
      ...defaultCreate,
      role_id: resolvedRoles[resolvedRoles.length - 1]?.id ?? 0,
      department_id: departments.length > 0 ? departments[0].id : '',
    });
    setShowAddModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.first_name || !createForm.last_name || !createForm.email) {
      onShowToast('Missing Fields', 'Please complete all required fields.', 'error');
      return;
    }
    if (!createForm.role_id) {
      onShowToast('Validation Error', 'Please select a system role.', 'error');
      return;
    }
    setCreateLoading(true);
    try {
      if (createForm.sync_to_keka) {
        const selectedDept = departments.find((d) => d.id === Number(createForm.department_id));
        const kekaPayload: any = {
          employeeNumber: createForm.employee_id.trim() || `EMP-${Date.now().toString().slice(-4)}`,
          firstName: createForm.first_name.trim(),
          lastName: createForm.last_name.trim(),
          email: createForm.email.trim(),
          dateJoined: createForm.joining_date || new Date().toISOString().split('T')[0],
        };
        if (createForm.middle_name.trim()) kekaPayload.middleName = createForm.middle_name.trim();
        if (createForm.display_name.trim()) {
          kekaPayload.displayName = createForm.display_name.trim();
        } else {
          kekaPayload.displayName = `${createForm.first_name.trim()} ${createForm.last_name.trim()}`;
        }
        if (createForm.mobile_number.trim()) kekaPayload.mobileNumber = createForm.mobile_number.trim();
        if (createForm.gender !== undefined && createForm.gender !== null) kekaPayload.gender = Number(createForm.gender);
        if (createForm.date_of_birth) kekaPayload.dateOfBirth = createForm.date_of_birth;
        if (selectedDept?.name) kekaPayload.department = selectedDept.name;
        if (createForm.business_unit.trim()) kekaPayload.businessUnit = createForm.business_unit.trim();
        if (createForm.job_title.trim()) kekaPayload.jobTitle = createForm.job_title.trim();
        if (createForm.secondary_job_title.trim()) kekaPayload.secondaryJobTitle = createForm.secondary_job_title.trim();
        if (createForm.location.trim()) kekaPayload.location = createForm.location.trim();
        if (createForm.legal_entity.trim()) kekaPayload.legalEntity = createForm.legal_entity.trim();
        if (createForm.nationality.trim()) kekaPayload.nationality = createForm.nationality.trim();
        if (createForm.role_id) kekaPayload.role_id = createForm.role_id;
        if (createForm.ctc !== undefined && createForm.ctc !== null) kekaPayload.ctc = createForm.ctc;

        const res = await createKekaEmployeeApi(kekaPayload);
        onShowToast(
          'Employee Created in Keka',
          res?.message || `Account for ${createForm.first_name} ${createForm.last_name} created in Keka and synchronized locally.`,
          'success'
        );
      } else {
        await createUserApi({
          email: createForm.email,
          first_name: createForm.first_name,
          last_name: createForm.last_name,
          employee_id: createForm.employee_id.trim() || undefined,
          role_id: createForm.role_id,
          department_id: createForm.department_id ? Number(createForm.department_id) : null,
          joining_date: createForm.joining_date || null,
          status: createForm.status,
          ctc: createForm.ctc,
          middle_name: createForm.middle_name.trim() || undefined,
          display_name: createForm.display_name.trim() || undefined,
          mobile_number: createForm.mobile_number.trim() || undefined,
          job_title: createForm.job_title.trim() || undefined,
          secondary_job_title: createForm.secondary_job_title.trim() || undefined,
          business_unit: createForm.business_unit.trim() || undefined,
          gender: createForm.gender ? (createForm.gender === 1 ? 'Male' : createForm.gender === 2 ? 'Female' : 'Other') : undefined,
          date_of_birth: createForm.date_of_birth || undefined,
          nationality: createForm.nationality.trim() || undefined,
          location: createForm.location.trim() || undefined,
          legal_entity: createForm.legal_entity.trim() || undefined,
        });
        onShowToast('Employee Created', `Account for ${createForm.first_name} ${createForm.last_name} created locally.`, 'success');
      }
      setShowAddModal(false);
      setCreateForm({ ...defaultCreate });
      loadUsers();
      loadDepartments();
    } catch (e: any) {
      onShowToast('Create Failed', getErrorMessage(e, 'Failed to create employee.'), 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (user: BackendUser) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      employee_id: user.employee_id,
      role_id: user.role_id,
      department_id: user.department_id || user.department?.id || '',
      joining_date: user.joining_date ? user.joining_date.split('T')[0] : '',
      status: user.status,
      ctc: user.ctc,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editForm) return;
    setEditLoading(true);
    try {
      await updateUserApi(editingUser.id, {
        email: editForm.email,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        employee_id: editForm.employee_id,
        role_id: editForm.role_id,
        department_id: editForm.department_id ? Number(editForm.department_id) : null,
        joining_date: editForm.joining_date || null,
        status: editForm.status,
        ctc: editForm.ctc,
      });
      onShowToast('User Updated', `Updated ${editForm.first_name} ${editForm.last_name}.`, 'success');
      setEditingUser(null);
      setEditForm(null);
      loadUsers();
      loadDepartments();
    } catch (e: any) {
      onShowToast('Update Failed', getErrorMessage(e, 'Failed to update user.'), 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async (user: BackendUser) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    setTogglingIds((prev) => new Set(prev).add(user.id));
    try {
      await toggleUserStatusApi(user.id, newStatus);
      onShowToast(
        newStatus === 'Active' ? 'Account Activated' : 'Account Deactivated',
        `${user.first_name} ${user.last_name} is now ${newStatus}.`,
        'info'
      );
      loadUsers();
    } catch (e: any) {
      onShowToast('Status Update Failed', getErrorMessage(e, 'Failed to update status.'), 'error');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  // ── Quick Department Creation Handler ──────────────────────────────────
  const handleCreateDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptForm.name.trim()) {
      onShowToast('Validation Error', 'Department name is required.', 'error');
      return;
    }
    setNewDeptLoading(true);
    try {
      const created = await createDepartmentApi({
        name: newDeptForm.name.trim(),
        code: newDeptForm.code?.trim() || undefined,
        description: newDeptForm.description?.trim() || undefined,
      });
      onShowToast('Department Created', `Department "${created.name}" created successfully.`, 'success');
      setNewDeptForm({ name: '', code: '', description: '' });
      setShowAddDeptModal(false);
      await loadDepartments();

      // Automatically select newly created department in the open form
      if (deptActionTarget === 'create') {
        setCreateForm((prev) => ({ ...prev, department_id: created.id }));
      } else if (deptActionTarget === 'edit' && editForm) {
        setEditForm((prev) => ({ ...prev, department_id: created.id }));
      }
    } catch (e: any) {
      onShowToast('Creation Failed', getErrorMessage(e, 'Failed to create department.'), 'error');
    } finally {
      setNewDeptLoading(false);
      setDeptActionTarget(null);
    }
  };

  // Delete department confirmation state
  const [deleteDeptConfirm, setDeleteDeptConfirm] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingDept, setIsDeletingDept] = useState(false);

  const handleDeleteDepartment = (deptId: number, deptName: string) => {
    setDeleteDeptConfirm({ id: deptId, name: deptName });
  };

  const handleConfirmDeleteDepartment = async () => {
    if (!deleteDeptConfirm || isDeletingDept) return;
    const { id: deptId, name: deptName } = deleteDeptConfirm;
    try {
      setIsDeletingDept(true);
      await deleteDepartmentApi(deptId);
      onShowToast('Department Deleted', `Department "${deptName}" was removed.`, 'success');
      setDeleteDeptConfirm(null);
      await loadDepartments();
      loadUsers();
    } catch (e: any) {
      onShowToast('Cannot Delete', getErrorMessage(e, 'Failed to delete department. Make sure no employees are assigned.'), 'error');
    } finally {
      setIsDeletingDept(false);
    }
  };

  // ── Active upcoming leaves count ──────────────────────────────────────────
  const activeLeavesCount = upcomingLeaves.filter(
    (l: any) => l.status === 'Approved' || l.status === 'Pending'
  ).length;

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelCls = 'text-[11px] font-bold text-slate-700 tracking-wide';

  return (
    <div className="space-y-6">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="p-5 bg-white border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserCog className="w-6 h-6 text-sky-600" />
              <span>User &amp; Department Management</span>
            </h1>

            {/* View Switcher Pills */}
            <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setViewMode('keka')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'keka'
                    ? 'bg-white text-sky-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-sky-600" />
                <span>Keka Directory</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-sky-100 text-sky-800 font-extrabold">
                  {kekaMappingData?.total_keka_employees ?? kekaItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('system')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'system'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Timesheet Users</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-700 font-extrabold">
                  {total}
                </span>
              </button>
            </div>

            <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {departments.length} Departments
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {viewMode === 'keka'
              ? 'Real-time directory fetched from Keka HR API. Review synchronization status and sync employees to Timesheet.'
              : 'System users registered in local Timesheet database. Assign departments, manage roles, and review account statuses.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Sync All from Keka button */}
          <button
            type="button"
            onClick={handleSyncAllFromKeka}
            disabled={isSyncingKekaEmps || isSyncingKekaDepts}
            className="flex items-center gap-2 px-3.5 py-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Import all missing employees & departments from Keka API into local Timesheet system"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-700 ${isSyncingKekaEmps || isSyncingKekaDepts ? 'animate-spin' : ''}`} />
            <span>{isSyncingKekaEmps || isSyncingKekaDepts ? 'Syncing Keka…' : 'Sync All from Keka'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManageDeptModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-slate-600" />
            <span>Manage Departments</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRoleMatrixModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Role Matrix</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ──────────────────────────────────────────── */}
      {viewMode === 'keka' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={kekaSearchQuery}
                onChange={(e) => setKekaSearchQuery(e.target.value)}
                placeholder="Search Keka employees by name, email, employee ID, or job title..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            {/* Sync status filter */}
            <select
              value={kekaSyncFilter}
              onChange={(e) => setKekaSyncFilter(e.target.value as any)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">All Sync Statuses ({kekaItems.length})</option>
              <option value="mapped">Synced ({kekaMappingData?.summary?.mapped ?? 0})</option>
              <option value="unmapped">Not Synced ({kekaMappingData?.summary?.unmapped ?? 0})</option>
              <option value="local_match">Ready to Map ({kekaMappingData?.summary?.local_match ?? 0})</option>
            </select>

            {/* Department filter */}
            <select
              value={kekaDeptFilter}
              onChange={(e) => setKekaDeptFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="">All Departments ({kekaDepartments.length})</option>
              {kekaDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Employment Status filter */}
            <select
              value={kekaStatusFilter}
              onChange={(e) => setKekaStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="">All Keka Statuses</option>
              {kekaStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => refetchKeka()}
              disabled={isKekaFetching}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh Keka directory"
            >
              <RefreshCw className={`w-4 h-4 ${isKekaFetching ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or employee ID..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Department filter */}
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value === '' ? '' : Number(e.target.value))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.employee_count ?? 0})
                </option>
              ))}
            </select>

            {/* Role filter */}
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value === '' ? '' : Number(e.target.value))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {roleLabel(r.name)}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => { loadUsers(); loadDepartments(); }}
              disabled={loading}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* ── TABLE VIEW (KEKA DIRECTORY OR SYSTEM USERS) ─────────────────── */}
      {viewMode === 'keka' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Keka Employee</th>
                  <th className="py-3 px-3">Employee ID</th>
                  <th className="py-3 px-3">Role / Designation</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Joining Date</th>
                  <th className="py-3 px-3 text-center">Employment Status</th>
                  <th className="py-3 px-3 text-center">Sync Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isKekaLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-sky-500 mx-auto" />
                      <p className="text-slate-400 mt-2 font-medium">Fetching real-time employee directory from Keka API…</p>
                    </td>
                  </tr>
                ) : kekaError ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center">
                      <div className="max-w-md mx-auto p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                        <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
                        <p className="font-bold text-sm">Failed to load Keka Directory</p>
                        <p className="text-xs text-rose-600 mt-1">
                          {getErrorMessage(kekaError, 'Could not retrieve employee list from Keka API.')}
                        </p>
                        <button
                          type="button"
                          onClick={() => refetchKeka()}
                          className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Fetch</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredKekaItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                      {kekaItems.length === 0
                        ? 'No Keka employees returned from Keka API.'
                        : 'No Keka employees found matching the filters.'}
                    </td>
                  </tr>
                ) : (
                  paginatedKekaItems.map((emp) => {
                    const initials = emp.keka_name
                      ? emp.keka_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()
                      : '?';

                    return (
                      <tr
                        key={emp.keka_employee_id}
                        onClick={() => handleOpenEmployeeDetails('keka', emp)}
                        className="hover:bg-sky-50/40 transition-colors cursor-pointer group"
                      >
                        {/* Employee Name & Email */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-sky-100 to-blue-200 border border-sky-300 flex items-center justify-center text-sky-900 font-bold text-sm shrink-0 rounded-lg shadow-2xs group-hover:scale-105 transition-transform">
                              {initials}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 group-hover:text-sky-700 transition-colors flex items-center gap-1.5">
                                <span>{emp.keka_name || 'Unnamed Employee'}</span>
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium">{emp.keka_email || '—'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Employee ID */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg font-semibold border border-slate-200">
                            <Hash className="w-3 h-3 text-slate-400" />
                            {emp.keka_employee_number || '—'}
                          </span>
                        </td>

                        {/* Role / Job Title */}
                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-slate-800">
                            {emp.keka_job_title || '—'}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-3">
                          {emp.keka_department ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold border rounded bg-sky-50 text-sky-900 border-sky-200">
                              <Building2 className="w-2.5 h-2.5 opacity-70" />
                              {emp.keka_department}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Unassigned</span>
                          )}
                        </td>

                        {/* Joining Date */}
                        <td className="py-3.5 px-3 text-slate-500 font-medium">
                          {emp.date_of_joining
                            ? new Date(emp.date_of_joining).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>

                        {/* Keka Employment Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full ${kekaStatusBadgeClass(
                              emp.employment_status
                            )}`}
                          >
                            {emp.employment_status || 'Active'}
                          </span>
                        </td>

                        {/* Keka Sync Status (Sync or Not Sync) */}
                        <td className="py-3.5 px-3 text-center">
                          {emp.status === 'mapped' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Synced
                            </span>
                          ) : emp.status === 'local_match' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-300 rounded-full" title={`Matched local user: ${emp.matched_local_user_name || emp.matched_local_user_email}`}>
                              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                              Ready to Link
                            </span>
                          ) : emp.status === 'conflict' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-300 rounded-full" title={emp.reason}>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              Conflict
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-300 rounded-full">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              Not Synced
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details Eye Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEmployeeDetails('keka', emp);
                              }}
                              className="p-1.5 border border-slate-200 bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 rounded-lg transition-all cursor-pointer shadow-2xs"
                              title="View Full Employee Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {emp.status === 'mapped' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Linked
                              </span>
                            ) : emp.status === 'local_match' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSyncSingleEmployee(emp);
                                }}
                                disabled={syncingSingleId === emp.keka_employee_id}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                                title="Link Keka profile with matching Timesheet user"
                              >
                                {syncingSingleId === emp.keka_employee_id ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                                ) : (
                                  <Link2 className="w-3 h-3 text-sky-600" />
                                )}
                                <span>Link Account</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSyncSingleEmployee(emp);
                                }}
                                disabled={syncingSingleId === emp.keka_employee_id}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-emerald-800 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                                title="Import and provision this Keka employee into local Timesheet system"
                              >
                                {syncingSingleId === emp.keka_employee_id ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                                ) : (
                                  <UserPlus className="w-3 h-3 text-emerald-600" />
                                )}
                                <span>Sync to System</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar for Keka Directory */}
          <Pagination
            currentPage={kekaCurrentPage}
            totalItems={filteredKekaItems.length}
            itemsPerPage={kekaItemsPerPage}
            onPageChange={setKekaCurrentPage}
            onItemsPerPageChange={setKekaItemsPerPage}
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {error && (
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3">Employee ID</th>
                  <th className="py-3 px-3">Role / Designation</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Joining Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Sync Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-sky-500 mx-auto" />
                      <p className="text-slate-400 mt-2 font-medium">Loading users…</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      No users matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => handleOpenEmployeeDetails('system', user)}
                      className="hover:bg-sky-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Employee */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-sky-100 to-blue-200 border border-sky-300 flex items-center justify-center text-sky-900 font-bold text-sm shrink-0 rounded-lg shadow-2xs group-hover:scale-105 transition-transform">
                            {user.first_name?.[0]?.toUpperCase() ?? '?'}
                            {user.last_name?.[0]?.toUpperCase() ?? ''}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 group-hover:text-sky-700 transition-colors flex items-center gap-1.5 flex-wrap">
                              <span>{user.first_name} {user.last_name}</span>
                              {(!user.ctc || Number(user.ctc) <= 0) && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-300 rounded-full"
                                  title="Missing CTC: Default fallback rate (₹500/hr) applies for project cost calculations"
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> No CTC
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg font-semibold border border-slate-200">
                          <Hash className="w-3 h-3 text-slate-400" />
                          {user.employee_id || '—'}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800">
                          {roleLabel(user.role?.name ?? '')}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-3">
                        {user.department?.name ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold border rounded bg-sky-50 text-sky-900 border-sky-200">
                            <Building2 className="w-2.5 h-2.5 opacity-70" />
                            {user.department.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unassigned</span>
                        )}
                      </td>

                      {/* Joining Date */}
                      <td className="py-3.5 px-3 text-slate-500 font-medium">
                        {user.joining_date
                          ? new Date(user.joining_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full ${statusBadgeClass(
                            user.status
                          )}`}
                        >
                          {user.status || 'Active'}
                        </span>
                      </td>

                      {/* Keka Sync Status */}
                      <td className="py-3.5 px-3 text-center">
                        {user.is_keka_synced ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 rounded-full">
                            <Unlink className="w-3.5 h-3.5 text-slate-400" />
                            Local Only
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details Eye Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEmployeeDetails('system', user);
                            }}
                            className="p-1.5 border border-slate-200 bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 rounded-lg transition-all cursor-pointer shadow-2xs"
                            title="View Full Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Status toggle button */}
                          {currentUserId !== user.id && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(user);
                              }}
                              disabled={togglingIds.has(user.id)}
                              className="p-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                              title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                            >
                              {togglingIds.has(user.id) ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                              ) : user.status === 'Active' ? (
                                <UserX className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </button>
                          )}

                          {/* Edit User */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(user);
                            }}
                            className="p-1.5 border border-slate-200 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-600 rounded-lg transition-all cursor-pointer shadow-2xs"
                            title="Edit User"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <Pagination
            currentPage={currentPage}
            totalItems={total}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      {/* ── EDIT USER MODAL ─────────────────────────────────────────────── */}
      {editingUser && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleEditSubmit}
            className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  Edit User — {editingUser.first_name} {editingUser.last_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setEditingUser(null); setEditForm(null); }}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>First Name *</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Last Name *</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Email Address *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Employee ID *</label>
                  <input
                    type="text"
                    value={editForm.employee_id}
                    onChange={(e) => setEditForm({ ...editForm, employee_id: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Department Field with Inline Add */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Department</label>
                    <button
                      type="button"
                      onClick={() => { setDeptActionTarget('edit'); setShowAddDeptModal(true); }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Dept
                    </button>
                  </div>
                  <select
                    value={editForm.department_id || ''}
                    onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value === '' ? '' : Number(e.target.value) })}
                    className={inputCls}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.code ? `(${d.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>CTC (Annual in ₹)</label>
                  <input
                    type="number"
                    value={editForm.ctc !== undefined ? editForm.ctc : ''}
                    onChange={(e) => setEditForm({ ...editForm, ctc: e.target.value ? Number(e.target.value) : undefined })}
                    className={inputCls}
                    placeholder="E.g., 500000"
                  />
                  {(!editForm.ctc || Number(editForm.ctc) <= 0) && (
                    <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Fallback rate (₹500/hr) will apply in project financials if unset.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>System Role</label>
                  {rolesLoading ? (
                    <div className={`${inputCls} flex items-center gap-2 text-slate-400`}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading roles…</span>
                    </div>
                  ) : rolesError ? (
                    <div className={`${inputCls} flex items-center gap-2 text-rose-600`}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="flex-1 truncate">{rolesError}</span>
                      <button type="button" onClick={loadRoles} className="underline font-bold shrink-0">Retry</button>
                    </div>
                  ) : (
                  <select
                    value={editForm.role_id}
                    onChange={(e) => setEditForm({ ...editForm, role_id: Number(e.target.value) })}
                    className={inputCls}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {roleLabel(r.name)}
                      </option>
                    ))}
                  </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className={inputCls}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>Joining Date</label>
                  <input
                    type="date"
                    value={editForm.joining_date}
                    onChange={(e) => setEditForm({ ...editForm, joining_date: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditingUser(null); setEditForm(null); }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-70"
              >
                {editLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── ADD USER MODAL WITH COMPLETE KEKA HRMS FIELD SUPPORT ───────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-xs"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/75 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add New Employee</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Create employee record with direct Keka HRMS provisioning</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-slate-200/60 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Keka Sync Integration Banner */}
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/30 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs">Also create profile in Keka HR</span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Creates employee profile in Keka HR and links the account
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={createForm.sync_to_keka}
                    onChange={(e) => setCreateForm({ ...createForm, sync_to_keka: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* 1. Core Identity & Contact Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                  <UserCog className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Core Profile & Contact Details</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className={labelCls}>First Name *</label>
                    <input
                      type="text"
                      value={createForm.first_name}
                      onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                      placeholder="e.g. Vikram"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Middle Name</label>
                    <input
                      type="text"
                      value={createForm.middle_name}
                      onChange={(e) => setCreateForm({ ...createForm, middle_name: e.target.value })}
                      placeholder="e.g. Kumar"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Last Name *</label>
                    <input
                      type="text"
                      value={createForm.last_name}
                      onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                      placeholder="e.g. Sharma"
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className={labelCls}>Display Name</label>
                    <input
                      type="text"
                      value={createForm.display_name}
                      onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                      placeholder="Leave blank to auto-derive"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Work Email Address *</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="e.g. vikram@company.com"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Mobile Number</label>
                    <input
                      type="tel"
                      value={createForm.mobile_number}
                      onChange={(e) => setCreateForm({ ...createForm, mobile_number: e.target.value })}
                      placeholder="+91 9876543210"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Employment & Organization */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Job Details & Organization</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className={labelCls}>Employee ID / Number</label>
                    <input
                      type="text"
                      value={createForm.employee_id}
                      onChange={(e) => setCreateForm({ ...createForm, employee_id: e.target.value })}
                      placeholder="e.g. EMP-101 (or auto)"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Joining Date *</label>
                    <input
                      type="date"
                      value={createForm.joining_date}
                      onChange={(e) => setCreateForm({ ...createForm, joining_date: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>
                  {/* Department */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className={labelCls}>Department</label>
                      <button
                        type="button"
                        onClick={() => { setDeptActionTarget('create'); setShowAddDeptModal(true); }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Dept
                      </button>
                    </div>
                    <select
                      value={createForm.department_id || ''}
                      onChange={(e) => setCreateForm({ ...createForm, department_id: e.target.value === '' ? '' : Number(e.target.value) })}
                      className={inputCls}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.code ? `(${d.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className={labelCls}>Job Title (Primary)</label>
                    <input
                      type="text"
                      value={createForm.job_title}
                      onChange={(e) => setCreateForm({ ...createForm, job_title: e.target.value })}
                      placeholder="e.g. Senior Software Engineer"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Secondary Job Title</label>
                    <input
                      type="text"
                      value={createForm.secondary_job_title}
                      onChange={(e) => setCreateForm({ ...createForm, secondary_job_title: e.target.value })}
                      placeholder="e.g. Tech Lead"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Business Unit</label>
                    <input
                      type="text"
                      value={createForm.business_unit}
                      onChange={(e) => setCreateForm({ ...createForm, business_unit: e.target.value })}
                      placeholder="e.g. Digital Solutions"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className={labelCls}>System Role *</label>
                    {rolesLoading ? (
                      <div className={`${inputCls} flex items-center gap-2 text-slate-400`}>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading roles…</span>
                      </div>
                    ) : rolesError ? (
                      <div className={`${inputCls} flex items-center gap-2 text-rose-600`}>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="flex-1 truncate">{rolesError}</span>
                        <button type="button" onClick={loadRoles} className="underline font-bold shrink-0">Retry</button>
                      </div>
                    ) : (
                      <select
                        value={createForm.role_id}
                        onChange={(e) => setCreateForm({ ...createForm, role_id: Number(e.target.value) })}
                        className={inputCls}
                        required
                      >
                        <option value={0} disabled>
                          Select Role
                        </option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {roleLabel(r.name)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Account Status</label>
                    <select
                      value={createForm.status}
                      onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                      className={inputCls}
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>CTC (Annual in ₹)</label>
                    <input
                      type="number"
                      value={createForm.ctc !== undefined ? createForm.ctc : ''}
                      onChange={(e) => setCreateForm({ ...createForm, ctc: e.target.value ? Number(e.target.value) : undefined })}
                      className={inputCls}
                      placeholder="e.g. 750000"
                    />
                    {(!createForm.ctc || Number(createForm.ctc) <= 0) && (
                      <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Fallback rate (₹500/hr) will apply in project financials if left blank.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Additional Demographics & Compliance */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Personal & Location Details</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className={labelCls}>Gender</label>
                    <select
                      value={createForm.gender}
                      onChange={(e) => setCreateForm({ ...createForm, gender: Number(e.target.value) })}
                      className={inputCls}
                    >
                      <option value={0}>Unspecified</option>
                      <option value={1}>Male</option>
                      <option value={2}>Female</option>
                      <option value={3}>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Date of Birth</label>
                    <input
                      type="date"
                      value={createForm.date_of_birth}
                      onChange={(e) => setCreateForm({ ...createForm, date_of_birth: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Nationality</label>
                    <input
                      type="text"
                      value={createForm.nationality}
                      onChange={(e) => setCreateForm({ ...createForm, nationality: e.target.value })}
                      placeholder="e.g. Indian"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={labelCls}>Location / Office</label>
                    <input
                      type="text"
                      value={createForm.location}
                      onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                      placeholder="e.g. Bangalore, India"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Legal Entity</label>
                    <input
                      type="text"
                      value={createForm.legal_entity}
                      onChange={(e) => setCreateForm({ ...createForm, legal_entity: e.target.value })}
                      placeholder="e.g. Supersourcing India Pvt Ltd"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/75 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                {createForm.sync_to_keka ? (
                  <span className="text-blue-700 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Will create in Keka and sync locally
                  </span>
                ) : (
                  <span>Saving to local database only</span>
                )}
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-70 transition-colors"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {createForm.sync_to_keka ? 'Create & Provision in Keka' : 'Create Account'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── MANAGE DEPARTMENTS MODAL ────────────────────────────────────── */}
      {showManageDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Manage Departments</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddDeptModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Dept</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManageDeptModal(false)}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {departments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium">
                  No departments created yet. Click "+ New Dept" to create one.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Department Name</th>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Employees</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departments.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {d.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {d.code || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                          {d.description || '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {d.employee_count ?? 0}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteDepartment(d.id, d.name)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Delete Department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManageDeptModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK ADD DEPARTMENT MODAL (NESTED ON TOP) ────────────────── */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateDepartmentSubmit}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Add New Department</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className={labelCls}>Department Name *</label>
                <input
                  type="text"
                  value={newDeptForm.name}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                  placeholder="e.g. Design, Development, QA, HR"
                  className={inputCls}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Department Code (Optional)</label>
                <input
                  type="text"
                  value={newDeptForm.code}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, code: e.target.value })}
                  placeholder="e.g. DES, DEV, QA, HR"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Description (Optional)</label>
                <textarea
                  value={newDeptForm.description}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, description: e.target.value })}
                  placeholder="Brief summary of department responsibilities..."
                  className={`${inputCls} h-20 resize-none`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={newDeptLoading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-70"
              >
                {newDeptLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Department
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── ROLE PERMISSIONS MATRIX (READ-ONLY) ─────────────────────────── */}
      {showRoleMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  Predefined System Role Permissions (Read-Only)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleMatrixModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Module / Capability</th>
                    <th className="py-2.5 px-3 text-rose-700">Admin</th>
                    <th className="py-2.5 px-3 text-amber-700">Project Manager</th>
                    <th className="py-2.5 px-3 text-purple-700">Account Manager</th>
                    <th className="py-2.5 px-3 text-blue-700">Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['User & Role Management', 'Full Control', 'View Team', 'View Team', 'None'],
                    ['Department Configuration', 'Full Control', 'View Only', 'View Only', 'View Only'],
                    ['Project Management', 'Full Control', 'Assigned Projects', 'Assigned Projects', 'Assigned Only'],
                    ['Timesheet Approvals', 'Override All', 'Project Resources', 'Client Projects', 'Self Only'],
                    ['Leave Approvals', 'All Employees', 'Reporting Members', 'Reporting Members', 'Self Request'],
                    ['System Settings & Holidays', 'Full Control', 'View Only', 'View Only', 'View Only'],
                    ['Reports & Analytics', 'Full Org', 'Project Level', 'Client Level', 'Personal Only'],
                  ].map(([mod, adm, pm, am, emp], idx) => (
                    <tr key={idx} className="hover:bg-slate-50 font-medium">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{mod}</td>
                      <td className="py-2.5 px-3 text-rose-700">{adm}</td>
                      <td className="py-2.5 px-3 text-amber-700">{pm}</td>
                      <td className="py-2.5 px-3 text-purple-700">{am}</td>
                      <td className="py-2.5 px-3 text-blue-700">{emp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRoleMatrixModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMPLOYEE LIVE DETAIL MODAL ───────────────────────────────── */}
      <EmployeeDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailTarget(null);
        }}
        type={detailTarget?.type || 'keka'}
        kekaDetails={kekaDetailData}
        userDetails={userDetailData}
        initialItem={detailTarget?.initialItem}
        isLoading={detailTarget?.type === 'keka' ? isKekaDetailLoading : isUserDetailLoading}
        error={detailTarget?.type === 'keka' ? kekaDetailError : userDetailError}
        onRetry={() => {
          if (detailTarget?.type === 'keka') {
            triggerKekaDetails(String(detailTarget.id));
          } else if (detailTarget) {
            triggerUserDetails(Number(detailTarget.id));
          }
        }}
        onSyncSingleKeka={handleSyncSingleEmployee}
        isSyncingSingle={syncingSingleId === detailTarget?.id}
        onOpenEditUser={(u) => {
          setShowDetailModal(false);
          handleOpenEdit(u);
        }}
      />

      {/* Delete Department Confirmation Dialog */}
      <ConfirmModal
        isOpen={deleteDeptConfirm !== null}
        title="Delete Department"
        message={`Are you sure you want to delete the department "${deleteDeptConfirm?.name}"? Make sure no active employees are assigned to this department.`}
        confirmText="Delete Department"
        variant="danger"
        isLoading={isDeletingDept}
        onConfirm={handleConfirmDeleteDepartment}
        onCancel={() => setDeleteDeptConfirm(null)}
      />
    </div>
  );
};
