import React, { useState, useEffect, useCallback } from 'react';
import { useGetUpcomingLeavesQuery } from '../../store/api/dataApi';
import {
  fetchUsersApi,
  createUserApi,
  updateUserApi,
  toggleUserStatusApi,
  fetchRolesApi,
  BackendUser,
  BackendRole,
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
  KeyRound,
  Edit,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  Hash,
} from 'lucide-react';

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
  if (r.includes('admin')) return 'bg-rose-100 text-rose-800';
  if (r.includes('project')) return 'bg-amber-100 text-amber-800';
  if (r.includes('account')) return 'bg-purple-100 text-purple-800';
  return 'bg-blue-100 text-blue-800';
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'active') return 'bg-emerald-100 text-emerald-800';
  if (s === 'inactive') return 'bg-rose-100 text-rose-800';
  if (s === 'pending') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-200 text-slate-700';
}

// ---------------------------------------------------------------------------
// Default form values
// ---------------------------------------------------------------------------
const defaultCreate = {
  first_name: '',
  last_name: '',
  email: '',
  employee_id: '',
  role_id: 0,
  joining_date: '',
  status: 'Pending',
};

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, onShowToast }) => {
  const currentUserId = currentUser ? Number(currentUser.id) : null;
  const { data: upcomingLeaves = [] } = useGetUpcomingLeavesQuery();

  // ── Server state ──────────────────────────────────────────────────────────
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [roles, setRoles] = useState<BackendRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Filters / Pagination ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<BackendUser | null>(null);
  const [resetPassUser, setResetPassUser] = useState<BackendUser | null>(null);
  const [showRoleMatrixModal, setShowRoleMatrixModal] = useState(false);

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
    joining_date: string;
    status: string;
  } | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // ── Status-toggle loading set ─────────────────────────────────────────────
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

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
      setUsers(resp.items);
      setTotal(resp.total);
      setTotalPages(resp.total_pages || Math.ceil(resp.total / itemsPerPage) || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedRoleId, selectedStatus, searchQuery]);

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
      onShowToast('Roles Load Failed', msg, 'error');
    } finally {
      setRolesLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRoleId, selectedStatus]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenAdd = async () => {
    // If roles haven't loaded yet (or failed), retry before opening the modal
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
        return; // Don't open the modal if we still have no roles
      } finally {
        setRolesLoading(false);
      }
    }
    // Default to the last role (Employee) so the select is never blank
    setCreateForm({
      ...defaultCreate,
      role_id: resolvedRoles[resolvedRoles.length - 1]?.id ?? 0,
    });
    setShowAddModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.first_name || !createForm.last_name || !createForm.email || !createForm.employee_id) {
      onShowToast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }
    if (!createForm.role_id) {
      onShowToast('Validation Error', 'Please select a system role.', 'error');
      return;
    }
    setCreateLoading(true);
    try {
      await createUserApi({
        email: createForm.email,
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        employee_id: createForm.employee_id,
        role_id: createForm.role_id,
        joining_date: createForm.joining_date || null,
        status: createForm.status,
      });
      onShowToast('Employee Created', `Account for ${createForm.first_name} ${createForm.last_name} created.`, 'success');
      setShowAddModal(false);
      setCreateForm({ ...defaultCreate });
      loadUsers();
    } catch (e: any) {
      onShowToast('Create Failed', e.message, 'error');
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
      joining_date: user.joining_date ? user.joining_date.split('T')[0] : '',
      status: user.status,
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
        joining_date: editForm.joining_date || null,
        status: editForm.status,
      });
      onShowToast('User Updated', `Updated ${editForm.first_name} ${editForm.last_name}.`, 'success');
      setEditingUser(null);
      setEditForm(null);
      loadUsers();
    } catch (e: any) {
      onShowToast('Update Failed', e.message, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async (user: BackendUser) => {
    const nextStatus: 'Active' | 'Inactive' = user.status === 'Active' ? 'Inactive' : 'Active';
    setTogglingIds((prev) => new Set(prev).add(user.id));
    try {
      await toggleUserStatusApi(user.id, nextStatus);
      onShowToast('Status Updated', `${user.first_name} ${user.last_name} is now ${nextStatus}.`, 'info');
      loadUsers();
    } catch (e: any) {
      onShowToast('Status Update Failed', e.message, 'error');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  const handleConfirmResetPassword = () => {
    if (!resetPassUser) return;
    onShowToast(
      'Password Reset Initiated',
      `Reset link dispatched to ${resetPassUser.email}`,
      'success'
    );
    setResetPassUser(null);
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const inputCls =
    'w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none';
  const labelCls = 'font-extrabold text-slate-700 uppercase tracking-wider text-[10px]';

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-blue-600" />
            <span>User Management &amp; Master Role Directory</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Administer employee accounts, assign system roles (Admin, PM, Account Manager, Employee),
            manage status (Active / Inactive), and reset credentials.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowRoleMatrixModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all flex items-center gap-1.5 border border-slate-200"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Role Permissions Matrix</span>
          </button>
          <button
            onClick={handleOpenAdd}
            disabled={rolesLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
          >
            {rolesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{rolesLoading ? 'Loading…' : 'Add Employee'}</span>
          </button>
        </div>
      </div>

      {/* ── Directory Section ───────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-xs">
        {/* Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-3 border-b border-slate-200">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, employee ID…"
              className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            />
          </div>

          {/* Role filter */}
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value === '' ? '' : Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
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
            className="bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Refresh */}
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={loadUsers}
              className="ml-auto underline underline-offset-2 font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-50 font-extrabold">
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Employee ID</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Joining Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    <p className="text-slate-400 mt-2 font-medium">Loading users…</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No users matching the selected filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    {/* Employee */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 ring-2 ring-blue-500/20">
                          {user.first_name?.[0]?.toUpperCase() ?? '?'}
                          {user.last_name?.[0]?.toUpperCase() ?? ''}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                        <Hash className="w-3 h-3 text-slate-400" />
                        {user.employee_id}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${roleBadgeClass(
                          user.role?.name ?? ''
                        )}`}
                      >
                        {roleLabel(user.role?.name ?? '')}
                      </span>
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
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${statusBadgeClass(
                          user.status
                        )}`}
                      >
                        {user.status === 'Active' ? (
                          <UserCheck className="w-3 h-3" />
                        ) : (
                          <UserX className="w-3 h-3" />
                        )}
                        <span>{user.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1 border border-slate-200"
                          title="Edit User"
                        >
                          <Edit className="w-3 h-3 text-blue-600" />
                          <span>Edit</span>
                        </button>

                        {/* <button
                          onClick={() => setResetPassUser(user)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold transition-colors border border-amber-200/60"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button> */}

                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={togglingIds.has(user.id) || user.id === currentUserId}
                          title={user.id === currentUserId ? "You cannot deactivate your own account" : ""}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors border ${
                            user.status === 'Active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/60'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/60'
                          } disabled:opacity-50 ${user.id === currentUserId ? 'cursor-not-allowed' : ''}`}
                        >
                          {togglingIds.has(user.id) ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : user.status === 'Active' ? (
                            'Deactivate'
                          ) : (
                            'Activate'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
          <div>
            Showing <span className="text-slate-900 font-bold">{users.length}</span> of{' '}
            <span className="text-slate-900 font-bold">{total}</span> employees
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page <span className="text-slate-900 font-bold">{currentPage}</span> of{' '}
              <span className="text-slate-900 font-bold">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── EDIT USER MODAL ─────────────────────────────────────────────── */}
      {editingUser && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleEditSubmit}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900">Edit Employee Information</h3>
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
                  <label className={labelCls}>First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Last Name</label>
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
                  <label className={labelCls}>Work Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Employee ID</label>
                  <input
                    type="text"
                    value={editForm.employee_id}
                    onChange={(e) => setEditForm({ ...editForm, employee_id: e.target.value })}
                    className={inputCls}
                    required
                  />
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

      {/* ── ADD NEW USER MODAL ──────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900">Add New Employee Profile</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    placeholder="e.g. Vikram"
                    className={inputCls}
                    required
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Work Email *</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="vikram@company.com"
                    className={inputCls}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Employee ID *</label>
                  <input
                    type="text"
                    value={createForm.employee_id}
                    onChange={(e) => setCreateForm({ ...createForm, employee_id: e.target.value })}
                    placeholder="EMP001"
                    className={inputCls}
                    required
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
                  <label className={labelCls}>Status</label>
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
                  <label className={labelCls}>Joining Date</label>
                  <input
                    type="date"
                    value={createForm.joining_date}
                    onChange={(e) => setCreateForm({ ...createForm, joining_date: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-70"
              >
                {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── RESET PASSWORD CONFIRMATION MODAL ──────────────────────────── */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Reset Account Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setResetPassUser(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed font-medium">
              Trigger a password reset for{' '}
              <strong className="text-slate-900">
                {resetPassUser.first_name} {resetPassUser.last_name}
              </strong>{' '}
              ({resetPassUser.email})? A secure one-time temporary link will be emailed.
            </p>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetPassUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20"
              >
                Confirm Password Reset
              </button>
            </div>
          </div>
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
              <table className="w-full text-left border border-slate-200 rounded-xl">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Module / Capability</th>
                    <th className="p-3 text-center">Admin</th>
                    <th className="p-3 text-center">Project Manager</th>
                    <th className="p-3 text-center">Account Manager</th>
                    <th className="p-3 text-center">Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {[
                    ['User & Role Management', 'Full Control', 'View Team', 'View Team', 'None'],
                    ['Holiday & Leave Types Config', 'Full Control', 'Read-Only', 'Read-Only', 'Read-Only'],
                    ['Working Calendar & Rules', 'Full Control', 'Read-Only', 'Read-Only', 'Read-Only'],
                    ['Timesheet Submission & Daily Logs', 'Disabled', 'Submit / Review', 'View Account Logs', 'Submit Daily'],
                    ['Project Financials & Budgets', 'View / Edit', 'Project Budget', 'Full Control', 'None'],
                  ].map(([module, admin, pm, ac, emp]) => (
                    <tr key={module}>
                      <td className="p-3 font-bold text-slate-800">{module}</td>
                      {[admin, pm, ac, emp].map((val, i) => (
                        <td
                          key={i}
                          className={`p-3 text-center ${
                            val === 'Full Control'
                              ? 'text-emerald-600 font-bold'
                              : val === 'None' || val === 'Disabled'
                              ? 'text-slate-400'
                              : 'text-blue-600 font-bold'
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              * System role permissions are hardcoded for security compliance and cannot be overridden by individual users.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

