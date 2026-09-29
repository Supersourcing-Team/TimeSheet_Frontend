import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link2,
  Unlink,
  Zap,
  Search,
  Building2,
  Users,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Filter,
  Trash2,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  useGetKekaStatusQuery,
  useTestKekaConnectionMutation,
  useClearKekaTokenCacheMutation,
  useGetKekaMappingPreviewQuery,
  useGetKekaMappingsQuery,
  useSaveKekaMappingMutation,
  useDeleteKekaMappingMutation,
  useAutoSyncKekaMappingsMutation,
  useGetKekaLeaveTypesQuery,
  useGetLeaveTypesQuery,
  useUpdateLeaveTypeMutation,
  useGetUsersQuery,
  useGetLeaveRequestsQuery,
  useSyncLeaveToKekaMutation,
} from '../../store/api/dataApi';
import { KekaEmployeeMappingCandidate, LeaveTypeConfig } from '../../types';

interface KekaIntegrationManagementProps {
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const KekaIntegrationManagement: React.FC<KekaIntegrationManagementProps> = ({
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'leave_types' | 'leave_sync'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'local_match' | 'mapped' | 'unmapped' | 'conflict'>('all');
  const [manualUserMap, setManualUserMap] = useState<Record<string, number>>({});
  const [leaveTypeMapDraft, setLeaveTypeMapDraft] = useState<Record<string, string>>({});

  // RTK Query Hooks
  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useGetKekaStatusQuery();
  const [testConnection, { isLoading: isTesting }] = useTestKekaConnectionMutation();
  const [clearTokenCache, { isLoading: isClearingCache }] = useClearKekaTokenCacheMutation();

  const { data: previewData, isLoading: isPreviewLoading, refetch: refetchPreview } = useGetKekaMappingPreviewQuery();
  const { data: mappingsData, refetch: refetchMappings } = useGetKekaMappingsQuery();
  const { data: kekaLeaveTypes = [], isLoading: isKekaLeaveTypesLoading, refetch: refetchKekaLeaveTypes } = useGetKekaLeaveTypesQuery();
  const { data: localLeaveTypes = [], refetch: refetchLocalLeaveTypes } = useGetLeaveTypesQuery();
  const { data: usersData } = useGetUsersQuery({ limit: 500 });
  const localUsers = usersData?.items || [];

  const { data: allLeaveRequests = [], refetch: refetchLeaveRequests } = useGetLeaveRequestsQuery();

  const [saveMapping, { isLoading: isSavingMapping }] = useSaveKekaMappingMutation();
  const [deleteMapping, { isLoading: isDeletingMapping }] = useDeleteKekaMappingMutation();
  const [autoSyncMappings, { isLoading: isAutoSyncing }] = useAutoSyncKekaMappingsMutation();
  const [updateLeaveType, { isLoading: isUpdatingLeaveType }] = useUpdateLeaveTypeMutation();
  const [syncLeaveToKeka, { isLoading: isSyncingLeave }] = useSyncLeaveToKekaMutation();

  // Test Connection Handler
  const handleTestConnection = async () => {
    try {
      const res = await testConnection().unwrap();
      if (res?.data?.status === 'connected') {
        onShowToast('Connection Successful', `Connected to Keka (${res.data.company || 'Ready'}). Sample records fetched.`, 'success');
      } else {
        onShowToast('Connection Failed', res?.data?.message || 'Unable to connect to Keka API.', 'error');
      }
      refetchStatus();
      refetchPreview();
    } catch (err: any) {
      onShowToast('Connection Error', err?.data?.message || err?.message || 'Failed to test Keka connection.', 'error');
    }
  };

  // Clear Token Cache
  const handleClearCache = async () => {
    try {
      await clearTokenCache().unwrap();
      onShowToast('Cache Cleared', 'Keka token cache cleared. Next request will request fresh OAuth token.', 'info');
      refetchStatus();
    } catch (err: any) {
      onShowToast('Error', 'Failed to clear token cache.', 'error');
    }
  };

  // Auto-Sync All Matched
  const handleAutoSync = async () => {
    try {
      const res = await autoSyncMappings().unwrap();
      const count = res.data?.mapped_count ?? 0;
      onShowToast('Auto-Sync Complete', `Successfully mapped ${count} employees automatically!`, 'success');
      refetchPreview();
      refetchMappings();
    } catch (err: any) {
      onShowToast('Auto-Sync Failed', err?.data?.message || err?.message || 'Failed to auto-sync employees.', 'error');
    }
  };

  // Map Individual User
  const handleMapUser = async (candidate: KekaEmployeeMappingCandidate, overrideUserId?: number) => {
    const targetUserId = overrideUserId || candidate.matched_local_user_id || manualUserMap[candidate.keka_employee_id];
    if (!targetUserId) {
      onShowToast('Selection Required', 'Please select a local user to map to this Keka employee.', 'error');
      return;
    }

    try {
      await saveMapping({
        keka_employee_id: candidate.keka_employee_id,
        local_user_id: targetUserId,
        keka_employee_number: candidate.keka_employee_number || undefined,
      }).unwrap();

      onShowToast('Mapping Saved', `Mapped ${candidate.keka_name || candidate.keka_employee_id} to local user.`, 'success');
      refetchPreview();
      refetchMappings();
    } catch (err: any) {
      onShowToast('Mapping Error', err?.data?.message || err?.message || 'Failed to save mapping.', 'error');
    }
  };

  // Unmap User
  const handleUnmapUser = async (kekaEmployeeId: string, kekaName?: string | null) => {
    try {
      await deleteMapping(kekaEmployeeId).unwrap();
      onShowToast('Mapping Removed', `Unmapped ${kekaName || kekaEmployeeId}.`, 'info');
      refetchPreview();
      refetchMappings();
    } catch (err: any) {
      onShowToast('Error', err?.data?.message || err?.message || 'Failed to delete mapping.', 'error');
    }
  };

  // Update Leave Type Mapping
  const handleSaveLeaveTypeMapping = async (localLt: LeaveTypeConfig) => {
    const selectedKekaId = leaveTypeMapDraft[localLt.id] !== undefined
      ? leaveTypeMapDraft[localLt.id]
      : (localLt.kekaLeaveTypeId || '');

    try {
      await updateLeaveType({
        id: localLt.id,
        kekaLeaveTypeId: selectedKekaId ? selectedKekaId : undefined,
      }).unwrap();

      onShowToast('Leave Policy Updated', `Mapped "${localLt.name}" to Keka leave type.`, 'success');
      refetchLocalLeaveTypes();
    } catch (err: any) {
      onShowToast('Save Failed', err?.data?.message || err?.message || 'Could not update leave type.', 'error');
    }
  };

  // Push Individual Leave Request to Keka
  const handlePushLeaveToKeka = async (leaveId: string) => {
    try {
      const res = await syncLeaveToKeka({ local_leave_id: leaveId }).unwrap();
      if (res?.data?.synced) {
        onShowToast('Synced to Keka', `Leave #${leaveId} pushed to Keka (ID: ${res.data.keka_leave_request_id})`, 'success');
      } else {
        onShowToast('Sync Failed', res?.data?.error || 'Keka rejected leave request push.', 'error');
      }
      refetchLeaveRequests();
    } catch (err: any) {
      onShowToast('Sync Error', err?.data?.message || err?.message || 'Error communicating with Keka API.', 'error');
    }
  };

  // Candidates Filtering
  const candidates = previewData?.items || [];
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (c.keka_name || '').toLowerCase().includes(q);
        const emailMatch = (c.keka_email || '').toLowerCase().includes(q);
        const empNumMatch = (c.keka_employee_number || '').toLowerCase().includes(q);
        const localMatch = (c.matched_local_user_name || '').toLowerCase().includes(q) ||
                           (c.matched_local_user_email || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || empNumMatch || localMatch;
      }
      return true;
    });
  }, [candidates, statusFilter, searchQuery]);

  const summary = previewData?.summary || { mapped: 0, local_match: 0, unmapped: 0, conflict: 0 };
  const totalEmployees = previewData?.total_keka_employees || 0;
  const isConfigured = statusData?.is_configured ?? false;

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Connection Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">Keka HRMS Integration</h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isConfigured
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    {isConfigured ? 'Connected & Active' : 'Unconfigured'}
                  </span>
                  {statusData?.environment && (
                    <span className="text-[11px] font-mono tracking-wide px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                      {statusData.environment}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronize employees, policies, and auto-push approved leaves seamlessly into Keka.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleClearCache}
              disabled={isClearingCache}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors shadow-xs"
              title="Clears OAuth2 token cache to force fresh token generation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isClearingCache ? 'animate-spin' : ''}`} />
              Reset Token
            </button>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
            >
              <ShieldCheck className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testing Connection...' : 'Test Connection'}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 font-medium">Keka Employees</div>
            <div className="text-xl font-bold text-white mt-1">{totalEmployees}</div>
          </div>
          <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/40">
            <div className="text-emerald-400 font-medium flex items-center justify-between">
              <span>Ready to Auto-Map</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-300 mt-1">{summary.local_match}</div>
          </div>
          <div className="bg-blue-950/30 p-3 rounded-xl border border-blue-800/40">
            <div className="text-blue-400 font-medium">Active Mappings</div>
            <div className="text-xl font-bold text-blue-300 mt-1">{summary.mapped}</div>
          </div>
          <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-800/40">
            <div className="text-amber-400 font-medium">Unmapped / Conflicts</div>
            <div className="text-xl font-bold text-amber-300 mt-1">{summary.unmapped + summary.conflict}</div>
          </div>
        </div>
      </div>

      {/* 2. Primary Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'employees'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Employee Directory & Mappings
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-indigo-700/40 text-white">
            {totalEmployees}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leave_types')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'leave_types'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Leave Policy Mapping
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-700">
            {localLeaveTypes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leave_sync')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'leave_sync'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          Leave Sync Activity
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-700">
            {allLeaveRequests.filter((r) => r.syncedToKeka).length} synced
          </span>
        </button>
      </div>

      {/* 3. TAB 1: EMPLOYEE MAPPINGS */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, employee code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                {(['all', 'local_match', 'mapped', 'unmapped', 'conflict'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setStatusFilter(filterKey)}
                    className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-all ${
                      statusFilter === filterKey
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filterKey.replace('_', ' ')}
                    {filterKey !== 'all' && (
                      <span className="ml-1 text-[10px] text-slate-400">
                        ({summary[filterKey as keyof typeof summary] ?? 0})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Sync All Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoSync}
                disabled={isAutoSyncing || summary.local_match === 0}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  summary.local_match > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                title="Automatically creates 1:1 mappings for all cleanly matched employees"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAutoSyncing ? 'Mapping Users...' : `Auto-Map Matched (${summary.local_match})`}
              </button>

              <button
                onClick={() => refetchPreview()}
                disabled={isPreviewLoading}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Refresh mapping preview"
              >
                <RefreshCw className={`w-4 h-4 ${isPreviewLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Employee Mapping Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Keka Employee</th>
                    <th className="py-3 px-4">Match Status</th>
                    <th className="py-3 px-4">Local Timesheet User</th>
                    <th className="py-3 px-4">Match Logic / Details</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No employees found</p>
                        <p className="text-[11px] text-slate-400">Try adjusting your search query or filter status.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((candidate) => {
                      const isMapped = candidate.status === 'mapped';
                      const isMatched = candidate.status === 'local_match';
                      const isConflict = candidate.status === 'conflict';
                      const isUnmapped = candidate.status === 'unmapped';

                      return (
                        <tr key={candidate.keka_employee_id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Keka Employee Details */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{candidate.keka_name || 'Unnamed Employee'}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                              {candidate.keka_email && <span>{candidate.keka_email}</span>}
                              {candidate.keka_employee_number && (
                                <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 text-[10px] font-semibold">
                                  {candidate.keka_employee_number}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {[candidate.keka_department, candidate.keka_job_title].filter(Boolean).join(' • ')}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isMapped && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Mapped
                              </span>
                            )}
                            {isMatched && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Sparkles className="w-3.5 h-3.5" />
                                Match Found
                              </span>
                            )}
                            {isConflict && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Conflict
                              </span>
                            )}
                            {isUnmapped && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                Unmapped
                              </span>
                            )}
                          </td>

                          {/* Local Timesheet User */}
                          <td className="py-3.5 px-4">
                            {candidate.matched_local_user_name ? (
                              <div>
                                <div className="font-semibold text-slate-800">{candidate.matched_local_user_name}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{candidate.matched_local_user_email}</div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select
                                  value={manualUserMap[candidate.keka_employee_id] || ''}
                                  onChange={(e) =>
                                    setManualUserMap((prev) => ({
                                      ...prev,
                                      [candidate.keka_employee_id]: Number(e.target.value),
                                    }))
                                  }
                                  className="py-1 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                >
                                  <option value="">-- Choose Local User --</option>
                                  {localUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.first_name} {u.last_name} ({u.email})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </td>

                          {/* Reason / Details */}
                          <td className="py-3.5 px-4 text-[11px] text-slate-500 max-w-[280px]">
                            {candidate.reason || '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isMapped ? (
                              <button
                                onClick={() => handleUnmapUser(candidate.keka_employee_id, candidate.keka_name)}
                                disabled={isDeletingMapping}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                              >
                                <Unlink className="w-3 h-3" />
                                Unmap
                              </button>
                            ) : isMatched ? (
                              <button
                                onClick={() => handleMapUser(candidate)}
                                disabled={isSavingMapping}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-xs"
                              >
                                <Link2 className="w-3 h-3" />
                                Map User
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMapUser(candidate)}
                                disabled={isSavingMapping || !manualUserMap[candidate.keka_employee_id]}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                  manualUserMap[candidate.keka_employee_id]
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                <Link2 className="w-3 h-3" />
                                Save Map
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: LEAVE TYPES MAPPING */}
      {activeTab === 'leave_types' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Map Local Policies to Keka Leave UUIDs</p>
              <p className="mt-0.5 text-blue-700">
                When employees submit leaves locally (e.g. Sick Leave, Annual Leave), the system will use the corresponding Keka Leave Type UUID below to create the leave request in Keka.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Local Leave Type</th>
                    <th className="py-3 px-4">Days / Year</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Keka Leave Type Mapping</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localLeaveTypes.map((lt) => {
                    const currentSelected = leaveTypeMapDraft[lt.id] !== undefined
                      ? leaveTypeMapDraft[lt.id]
                      : (lt.kekaLeaveTypeId || '');

                    const isMapped = Boolean(lt.kekaLeaveTypeId);

                    return (
                      <tr key={lt.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{lt.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">Code: {lt.code}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {lt.daysPerYear} days
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              lt.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {lt.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={currentSelected}
                            onChange={(e) =>
                              setLeaveTypeMapDraft((prev) => ({
                                ...prev,
                                [lt.id]: e.target.value,
                              }))
                            }
                            className="py-1.5 px-3 text-xs border border-slate-200 rounded-lg bg-white w-full max-w-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">-- No Keka Mapping (Fallback to Default) --</option>
                            {kekaLeaveTypes.map((kLt) => (
                              <option key={kLt.id} value={kLt.id}>
                                {kLt.name} {kLt.code ? `(${kLt.code})` : ''} - {kLt.id.slice(0, 8)}...
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleSaveLeaveTypeMapping(lt)}
                            disabled={isUpdatingLeaveType}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs"
                          >
                            Save Mapping
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: LEAVE SYNC ACTIVITY */}
      {activeTab === 'leave_sync' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Leave Requests Keka Sync Audit</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect which employee leave applications were pushed to Keka or retry failed syncs.
              </p>
            </div>
            <button
              onClick={() => refetchLeaveRequests()}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Refresh leave requests"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Local Leave ID</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Type & Dates</th>
                    <th className="py-3 px-4">Keka Sync Status</th>
                    <th className="py-3 px-4">Keka Request ID / Error</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allLeaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No leave requests found.
                      </td>
                    </tr>
                  ) : (
                    allLeaveRequests.slice(0, 50).map((leave) => {
                      const isSynced = leave.syncedToKeka;
                      const hasError = Boolean(leave.lastSyncError);

                      return (
                        <tr key={leave.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            #{leave.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{leave.userName || 'Employee'}</div>
                            <div className="text-[10px] text-slate-400">User ID: {leave.userId}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{leave.type}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {leave.startDate} → {leave.endDate} ({leave.daysCount}d)
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isSynced ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Synced to Keka
                              </span>
                            ) : hasError ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3.5 h-3.5" />
                                Sync Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                Pending / Local
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] max-w-[280px]">
                            {isSynced ? (
                              <span className="font-mono text-emerald-800 font-semibold truncate block">
                                {leave.kekaLeaveRequestId}
                              </span>
                            ) : hasError ? (
                              <span className="text-rose-600 truncate block" title={leave.lastSyncError}>
                                {leave.lastSyncError}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handlePushLeaveToKeka(leave.id)}
                              disabled={isSyncingLeave}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                isSynced
                                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                              }`}
                            >
                              <Zap className="w-3 h-3" />
                              {isSynced ? 'Re-Sync' : 'Push to Keka'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
