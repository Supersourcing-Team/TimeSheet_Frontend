import React, { useState, useMemo } from 'react';
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
  useGetKekaAttendanceQuery,
  useGetKekaAttendanceExceptionsQuery,
  useCreateKekaEmployeeMutation,
  useUpdateKekaJobDetailsMutation,
  useCreateKekaExitRequestMutation,
  usePushKekaTimeEntryMutation,
  useSyncKekaEmployeesMutation,
  useSyncKekaDepartmentsMutation,
  useSyncKekaHolidaysMutation,
  useGetUsersQuery,
} from '../../store/api/dataApi';
import {
  KekaMappingPreviewItem,
  KekaLeaveTypeItem,
  LeaveTypeConfig,
  KekaAttendanceRecord,
  KekaEmployeeCreatePayload,
  KekaJobDetailsUpdatePayload,
  KekaEmployeeExitPayload,
  KekaTimeEntryPayload,
} from '../../types';
import { getErrorMessage } from '../../utils/errorHandler';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Globe,
  Key,
  Layers,
  Link as LinkIcon,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlink,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';

interface KekaManagementProps {
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

type KekaSubTab = 'overview' | 'mappings' | 'leave_types' | 'attendance';

export const KekaManagement: React.FC<KekaManagementProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<KekaSubTab>('overview');

  // Overview / Status API hooks
  const {
    data: statusData,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useGetKekaStatusQuery();

  const [testConnection, { isLoading: isTestingConn }] = useTestKekaConnectionMutation();
  const [clearTokenCache, { isLoading: isClearingCache }] = useClearKekaTokenCacheMutation();

  // Test connection feedback modal / banner
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
    testedAt?: string;
  } | null>(null);

  // Employee Mapping API hooks
  const {
    data: mappingPreview,
    isLoading: isPreviewLoading,
    refetch: refetchPreview,
  } = useGetKekaMappingPreviewQuery();

  const {
    data: mappingsData,
    isLoading: isMappingsLoading,
    refetch: refetchMappings,
  } = useGetKekaMappingsQuery();

  const { data: usersList = [] } = useGetUsersQuery();

  const [saveMapping, { isLoading: isSavingMapping }] = useSaveKekaMappingMutation();
  const [deleteMapping, { isLoading: isDeletingMapping }] = useDeleteKekaMappingMutation();
  const [autoSyncMappings, { isLoading: isAutoSyncing }] = useAutoSyncKekaMappingsMutation();

  // Mapping state
  const [mappingSearch, setMappingSearch] = useState('');
  const [mappingFilter, setMappingFilter] = useState<'all' | 'mapped' | 'unmapped' | 'ready'>('all');
  const [manualMapModalItem, setManualMapModalItem] = useState<KekaMappingPreviewItem | null>(null);
  const [selectedLocalUserId, setSelectedLocalUserId] = useState<number | string>('');

  // Leave Types Mapping hooks
  const {
    data: kekaLeaveTypes = [],
    isLoading: isKekaLeaveTypesLoading,
    refetch: refetchKekaLeaveTypes,
  } = useGetKekaLeaveTypesQuery();

  const {
    data: localLeaveTypes = [],
    isLoading: isLocalLeaveTypesLoading,
    refetch: refetchLocalLeaveTypes,
  } = useGetLeaveTypesQuery();

  const [updateLeaveType, { isLoading: isUpdatingLeaveType }] = useUpdateLeaveTypeMutation();

  // Attendance & Exceptions hooks
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [attendanceDate, setAttendanceDate] = useState<string>(todayStr);

  const {
    data: attendanceRecords = [],
    isLoading: isAttendanceLoading,
    refetch: refetchAttendance,
  } = useGetKekaAttendanceQuery({ from: attendanceDate, to: attendanceDate });

  const {
    data: exceptionsData,
    isLoading: isExceptionsLoading,
    refetch: refetchExceptions,
  } = useGetKekaAttendanceExceptionsQuery(attendanceDate);

  // Live Keka Write Mutations
  const [createKekaEmployee, { isLoading: isCreatingEmp }] = useCreateKekaEmployeeMutation();
  const [updateJobDetails, { isLoading: isUpdatingJob }] = useUpdateKekaJobDetailsMutation();
  const [createExitRequest, { isLoading: isCreatingExit }] = useCreateKekaExitRequestMutation();
  const [pushTimeEntry, { isLoading: isPushingPunch }] = usePushKekaTimeEntryMutation();
  const [syncEmployees, { isLoading: isSyncingEmployees }] = useSyncKekaEmployeesMutation();
  const [syncDepartments, { isLoading: isSyncingDepartments }] = useSyncKekaDepartmentsMutation();
  const [syncHolidays, { isLoading: isSyncingHolidays }] = useSyncKekaHolidaysMutation();

  // Modals State
  const [showAddKekaEmpModal, setShowAddKekaEmpModal] = useState(false);
  const [newKekaEmpForm, setNewKekaEmpForm] = useState<KekaEmployeeCreatePayload>({
    employeeNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    displayName: '',
    email: '',
    mobileNumber: '',
    gender: 0,
    dateOfBirth: '',
    dateJoined: todayStr,
    department: '',
    businessUnit: '',
    jobTitle: '',
    secondaryJobTitle: '',
    location: '',
    legalEntity: '',
    nationality: 'Indian',
  });

  const [jobDetailsModalItem, setJobDetailsModalItem] = useState<KekaMappingPreviewItem | null>(null);
  const [jobDetailsForm, setJobDetailsForm] = useState<KekaJobDetailsUpdatePayload>({
    jobTitle: '',
    secondaryJobTitle: '',
    department: '',
    businessUnit: '',
    location: '',
    reportsToEmail: '',
  });

  const [exitModalItem, setExitModalItem] = useState<KekaMappingPreviewItem | null>(null);
  const [exitForm, setExitForm] = useState<KekaEmployeeExitPayload>({
    exitType: 0,
    lastWorkingDate: todayStr,
    exitReason: '',
    resignationDate: todayStr,
    isOkToRehire: true,
    comments: '',
  });

  const [punchModalOpen, setPunchModalOpen] = useState(false);
  const [punchForm, setPunchForm] = useState<KekaTimeEntryPayload>({
    timestamp: new Date().toISOString(),
    punchStatus: 0,
    employeeIdentifier: '',
  });

  // Handlers
  const handleSyncEmployees = async () => {
    try {
      const res = await syncEmployees({ update_existing: true, create_missing: true }).unwrap();
      onShowToast(
        'Employee Sync Complete',
        res.message || `Synchronized ${res.synced ?? res.created ?? 0} employees from Keka.`,
        'success'
      );
      refetchPreview();
      refetchMappings();
      refetchStatus();
    } catch (err: any) {
      onShowToast('Sync Failed', getErrorMessage(err, 'Failed to sync employees from Keka'), 'error');
    }
  };

  const handleSyncDepartments = async () => {
    try {
      const res = await syncDepartments().unwrap();
      onShowToast(
        'Department Sync Complete',
        res.message || 'Synchronized departments from Keka.',
        'success'
      );
    } catch (err: any) {
      onShowToast('Sync Failed', getErrorMessage(err, 'Failed to sync departments from Keka'), 'error');
    }
  };

  const handleSyncHolidays = async () => {
    try {
      const res = await syncHolidays().unwrap();
      onShowToast(
        'Holiday Sync Complete',
        res.message || 'Synchronized holidays from Keka calendars.',
        'success'
      );
    } catch (err: any) {
      onShowToast('Sync Failed', getErrorMessage(err, 'Failed to sync holidays from Keka'), 'error');
    }
  };

  const handleCreateKekaEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKekaEmpForm.firstName.trim() || !newKekaEmpForm.lastName.trim() || !newKekaEmpForm.email.trim()) {
      onShowToast('Validation Error', 'First name, last name, and email are required.', 'error');
      return;
    }
    try {
      const payload: any = {
        employeeNumber: newKekaEmpForm.employeeNumber.trim() || `EMP-${Date.now().toString().slice(-4)}`,
        firstName: newKekaEmpForm.firstName.trim(),
        lastName: newKekaEmpForm.lastName.trim(),
        email: newKekaEmpForm.email.trim(),
        dateJoined: newKekaEmpForm.dateJoined || todayStr,
      };
      if (newKekaEmpForm.middleName?.trim()) payload.middleName = newKekaEmpForm.middleName.trim();
      payload.displayName = newKekaEmpForm.displayName?.trim() || `${newKekaEmpForm.firstName.trim()} ${newKekaEmpForm.lastName.trim()}`;
      if (newKekaEmpForm.mobileNumber?.trim()) payload.mobileNumber = newKekaEmpForm.mobileNumber.trim();
      if (newKekaEmpForm.gender !== undefined) payload.gender = Number(newKekaEmpForm.gender);
      if (newKekaEmpForm.dateOfBirth) payload.dateOfBirth = newKekaEmpForm.dateOfBirth;
      if (newKekaEmpForm.department?.trim()) payload.department = newKekaEmpForm.department.trim();
      if (newKekaEmpForm.businessUnit?.trim()) payload.businessUnit = newKekaEmpForm.businessUnit.trim();
      if (newKekaEmpForm.jobTitle?.trim()) payload.jobTitle = newKekaEmpForm.jobTitle.trim();
      if (newKekaEmpForm.secondaryJobTitle?.trim()) payload.secondaryJobTitle = newKekaEmpForm.secondaryJobTitle.trim();
      if (newKekaEmpForm.location?.trim()) payload.location = newKekaEmpForm.location.trim();
      if (newKekaEmpForm.legalEntity?.trim()) payload.legalEntity = newKekaEmpForm.legalEntity.trim();
      if (newKekaEmpForm.nationality?.trim()) payload.nationality = newKekaEmpForm.nationality.trim();

      const res = await createKekaEmployee(payload).unwrap();
      onShowToast(
        'Employee Created in Keka',
        res?.message || `Successfully created ${newKekaEmpForm.firstName} ${newKekaEmpForm.lastName} in Keka and linked locally.`,
        'success'
      );
      setShowAddKekaEmpModal(false);
      refetchPreview();
      refetchMappings();
      refetchStatus();
    } catch (err: any) {
      onShowToast('Creation Failed', getErrorMessage(err, 'Failed to create employee in Keka'), 'error');
    }
  };

  const handleUpdateJobDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDetailsModalItem) return;
    try {
      await updateJobDetails({
        employeeId: jobDetailsModalItem.keka_employee_id,
        user_id: jobDetailsModalItem.matched_local_user_id || undefined,
        ...jobDetailsForm,
      }).unwrap();
      onShowToast('Job Details Updated', `Updated job details in Keka for ${jobDetailsModalItem.keka_name}`, 'success');
      setJobDetailsModalItem(null);
      refetchPreview();
    } catch (err: any) {
      onShowToast('Update Failed', getErrorMessage(err, 'Failed to update job details in Keka'), 'error');
    }
  };

  const handleExitRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitModalItem) return;
    try {
      await createExitRequest({
        employee_id: exitModalItem.keka_employee_id,
        body: exitForm,
      }).unwrap();
      onShowToast('Exit Request Submitted', `Exit request submitted in Keka for ${exitModalItem.keka_name}`, 'success');
      setExitModalItem(null);
      refetchPreview();
    } catch (err: any) {
      onShowToast('Exit Request Failed', getErrorMessage(err, 'Failed to submit exit request in Keka'), 'error');
    }
  };

  const handlePushTimeEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pushTimeEntry(punchForm).unwrap();
      onShowToast('Time Entry Logged', 'Punch status logged to Keka successfully.', 'success');
      setPunchModalOpen(false);
      refetchAttendance();
    } catch (err: any) {
      onShowToast('Punch Failed', getErrorMessage(err, 'Failed to push time entry to Keka'), 'error');
    }
  };

  const handleTestConnection = async () => {
    try {
      const res = await testConnection().unwrap();
      const isSuccess = res.status === 'connected';
      setTestResult({
        success: isSuccess,
        message: res.message,
        details: res,
        testedAt: new Date().toLocaleTimeString(),
      });
      if (isSuccess) {
        onShowToast('Connection Successful', res.message || 'Connected to Keka HR API', 'success');
      } else {
        onShowToast('Connection Failed', res.message || 'Could not authenticate with Keka', 'error');
      }
      refetchStatus();
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Failed to test connection');
      setTestResult({
        success: false,
        message: msg,
        testedAt: new Date().toLocaleTimeString(),
      });
      onShowToast('Test Failed', msg, 'error');
    }
  };

  const handleClearCache = async () => {
    try {
      await clearTokenCache().unwrap();
      onShowToast('Token Cache Cleared', 'Cached bearer token cleared successfully', 'success');
      refetchStatus();
    } catch (err: any) {
      onShowToast('Error', getErrorMessage(err, 'Failed to clear token cache'), 'error');
    }
  };

  const handleAutoSync = async () => {
    try {
      const res = await autoSyncMappings().unwrap();
      onShowToast(
        'Auto-Sync Complete',
        `Linked ${res.mapped_count} employees automatically by work email.`,
        'success'
      );
      refetchPreview();
      refetchMappings();
    } catch (err: any) {
      onShowToast('Auto-Sync Failed', getErrorMessage(err, 'Failed to run auto-sync'), 'error');
    }
  };

  const handleUnlink = async (kekaEmployeeId: string, empName: string) => {
    if (!window.confirm(`Are you sure you want to unlink ${empName} from Keka?`)) return;
    try {
      await deleteMapping(kekaEmployeeId).unwrap();
      onShowToast('Unlinked', `Removed Keka mapping for ${empName}`, 'info');
      refetchPreview();
      refetchMappings();
    } catch (err: any) {
      onShowToast('Unlink Failed', getErrorMessage(err, 'Could not unlink employee'), 'error');
    }
  };

  const handleSaveManualMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMapModalItem || !selectedLocalUserId) return;
    try {
      await saveMapping({
        local_user_id: Number(selectedLocalUserId),
        keka_employee_id: manualMapModalItem.keka_employee_id,
        keka_employee_number: manualMapModalItem.keka_employee_number || undefined,
      }).unwrap();
      const matchedUser = usersList.find((u) => String(u.id) === String(selectedLocalUserId));
      onShowToast(
        'Mapping Saved',
        `Linked ${manualMapModalItem.keka_name || manualMapModalItem.keka_employee_id} to ${matchedUser?.name || `User #${selectedLocalUserId}`}`,
        'success'
      );
      setManualMapModalItem(null);
      setSelectedLocalUserId('');
      refetchPreview();
      refetchMappings();
    } catch (err: any) {
      onShowToast('Save Failed', getErrorMessage(err, 'Failed to save mapping'), 'error');
    }
  };

  const handleMapLeaveType = async (localType: LeaveTypeConfig, kekaId: string) => {
    try {
      await updateLeaveType({
        ...localType,
        keka_leave_type_id: kekaId || undefined,
      }).unwrap();
      onShowToast(
        'Policy Updated',
        `Updated Keka mapping for ${localType.name}`,
        'success'
      );
      refetchLocalLeaveTypes();
    } catch (err: any) {
      onShowToast('Update Failed', getErrorMessage(err, 'Failed to update leave policy'), 'error');
    }
  };

  // Filtered mapping preview items
  const filteredPreview = useMemo(() => {
    if (!mappingPreview?.items) return [];
    return mappingPreview.items.filter((item) => {
      const q = mappingSearch.toLowerCase();
      const matchSearch =
        !q ||
        item.keka_name?.toLowerCase().includes(q) ||
        item.keka_email?.toLowerCase().includes(q) ||
        item.keka_employee_id?.toLowerCase().includes(q) ||
        item.keka_employee_number?.toLowerCase().includes(q) ||
        item.matched_local_user_name?.toLowerCase().includes(q) ||
        item.matched_local_user_email?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (mappingFilter === 'mapped') return item.status === 'mapped';
      if (mappingFilter === 'unmapped') return item.status === 'unmapped' || item.status === 'conflict';
      if (mappingFilter === 'ready') return item.status === 'local_match';
      return true;
    });
  }, [mappingPreview, mappingSearch, mappingFilter]);

  const isConfigured = statusData?.is_configured ?? false;

  return (
    <div className="space-y-6 text-slate-900 font-sans pb-12">
      {/* Top Banner & Header */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Keka HR Integration Hub</h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    isConfigured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {isConfigured ? 'Configured & Active' : 'Credentials Missing'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Bidirectional synchronization of employee directories, approved leave requests, and daily attendance logs.
              </p>
            </div>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddKekaEmpModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee to Keka</span>
          </button>

          <button
            onClick={handleSyncEmployees}
            disabled={isSyncingEmployees}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingEmployees ? 'animate-spin' : ''}`} />
            <span>{isSyncingEmployees ? 'Syncing...' : 'Sync Employees'}</span>
          </button>

          <button
            onClick={handleSyncDepartments}
            disabled={isSyncingDepartments}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Sync Depts</span>
          </button>

          <button
            onClick={handleSyncHolidays}
            disabled={isSyncingHolidays}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Sync Holidays</span>
          </button>

          <button
            onClick={handleTestConnection}
            disabled={isTestingConn}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Wifi className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
            <span>{isTestingConn ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={handleClearCache}
            disabled={isClearingCache}
            title="Invalidate cached access token and force renewal"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isClearingCache ? 'animate-spin' : ''}`} />
            <span>Clear Token Cache</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Status &amp; Connectivity</span>
        </button>

        <button
          onClick={() => setActiveTab('mappings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'mappings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Directory Mapping</span>
          {mappingPreview && (
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black">
              {mappingPreview.summary?.mapped ?? 0}/{mappingPreview.total_keka_employees ?? 0}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('leave_types')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'leave_types'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Leave Policy Mapping</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Attendance &amp; Exceptions</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STATUS & CONNECTIVITY                                              */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Diagnostic Result Banner if Tested */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {testResult.success ? 'Handshake Successful' : 'Handshake Failed'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Tested at {testResult.testedAt}
                  </span>
                </div>
                <p className="font-medium">{testResult.message}</p>
                {testResult.details && (
                  <pre className="mt-2 p-2 rounded-lg bg-black/5 font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">API Connection</span>
                <Wifi className={`w-4 h-4 ${isConfigured ? 'text-emerald-500' : 'text-amber-500'}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {isConfigured ? 'Online' : 'Not Configured'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isConfigured
                    ? 'Environment variables verified in backend'
                    : 'Set KEKA_CLIENT_ID & KEKA_CLIENT_SECRET'}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">OAuth Grant Type</span>
                <Key className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">Client Credentials</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scope: <code className="text-blue-600 font-bold">kekaapi</code>
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Access Token State</span>
                <ShieldCheck className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {statusData?.is_token_cached ? 'Cached (Active)' : 'Refreshed On-Demand'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated renewal with in-memory mutex lock
                </p>
              </div>
            </div>
          </div>

          {/* Integration Specs & Environment Settings Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Current Integration Endpoints &amp; Parameters</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                  Authentication Token Endpoint
                </span>
                <p className="font-mono text-slate-800 break-all">
                  {statusData?.token_endpoint || 'https://login.keka.com/connect/token'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                  Environment &amp; Target Platform
                </span>
                <p className="font-mono text-slate-800 break-all">
                  {statusData?.environment ? `${statusData.environment.toUpperCase()} (Keka HR API)` : 'PRODUCTION (Keka HR API)'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                  Client ID
                </span>
                <p className="font-mono text-slate-800">
                  {statusData?.has_client_id ? '•••••••••••••••• (Configured)' : 'Missing'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                  Client Secret
                </span>
                <p className="font-mono text-slate-800">
                  {statusData?.has_client_secret ? '•••••••••••••••• (Configured)' : 'Missing'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
              <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Automated Synchronization Features</p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  When employee mappings are active, approving a leave request in Timesheet Portal will automatically forward
                  the leave request to Keka HR API via the Leave Module. Attendance logs can be queried and synchronized daily
                  to detect missing timesheet entries.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EMPLOYEE DIRECTORY MAPPING                                         */}
      {/* ========================================================================= */}
      {activeTab === 'mappings' && (
        <div className="space-y-6">
          {/* Mapping KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500">Total Keka Employees</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {mappingPreview?.total_keka_employees ?? 0}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-emerald-600">Fully Mapped</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {mappingPreview?.summary?.mapped ?? 0}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-blue-600">Auto-Sync Match Ready</span>
              <p className="text-2xl font-black text-blue-700 mt-1">
                {mappingPreview?.summary?.local_match ?? 0}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-amber-600">Unmapped / Pending</span>
              <p className="text-2xl font-black text-amber-700 mt-1">
                {(mappingPreview?.summary?.unmapped ?? 0) + (mappingPreview?.summary?.conflict ?? 0)}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={mappingSearch}
                  onChange={(e) => setMappingSearch(e.target.value)}
                  placeholder="Search user name or email..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['all', 'mapped', 'unmapped', 'ready'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setMappingFilter(filter)}
                    className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                      mappingFilter === filter
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter === 'ready' ? 'Match Ready' : filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoSync}
                disabled={isAutoSyncing || (mappingPreview?.summary?.local_match ?? 0) === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-xs transition-all cursor-pointer shrink-0"
              >
                <ArrowRightLeft className={`w-3.5 h-3.5 ${isAutoSyncing ? 'animate-spin' : ''}`} />
                <span>Auto-Sync Matched ({mappingPreview?.summary?.local_match ?? 0})</span>
              </button>

              <button
                onClick={() => {
                  refetchPreview();
                  refetchMappings();
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Refresh Table"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mapping Table */}
          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-2xs text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Keka Employee</th>
                  <th className="py-3 px-4">Work Email</th>
                  <th className="py-3 px-4">Mapping Status</th>
                  <th className="py-3 px-4">Matched Local User</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPreview.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <UserX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-600">No employees match filter criteria</p>
                    </td>
                  </tr>
                ) : (
                  filteredPreview.map((item) => (
                    <tr key={item.keka_employee_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.keka_name || 'Unnamed Employee'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          No: {item.keka_employee_number || 'N/A'} • ID: {item.keka_employee_id.slice(0, 8)}...
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {item.keka_email || <span className="text-slate-400 italic">No email</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.status === 'mapped' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Linked</span>
                          </span>
                        ) : item.status === 'local_match' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                            <Zap className="w-3 h-3 text-blue-600" />
                            <span>Match Ready</span>
                          </span>
                        ) : item.status === 'conflict' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800" title={item.reason}>
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Conflict</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600">
                            <span>Unlinked</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-800">
                        {item.matched_local_user_name ? (
                          <div>
                            <div className="font-bold text-slate-900">{item.matched_local_user_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {item.matched_local_user_email} (User #{item.matched_local_user_id})
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No local user matched</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setManualMapModalItem(item);
                              setSelectedLocalUserId(item.matched_local_user_id || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition-colors"
                          >
                            {item.status === 'mapped' ? 'Edit Link' : 'Link User'}
                          </button>

                          {item.status === 'mapped' && (
                            <>
                              <button
                                onClick={() => {
                                  setJobDetailsModalItem(item);
                                  setJobDetailsForm({
                                    jobTitle: item.keka_job_title || '',
                                    department: item.keka_department || '',
                                    location: '',
                                    businessUnit: '',
                                    secondaryJobTitle: '',
                                    reportsToEmail: '',
                                  });
                                }}
                                title="Update Job Details in Keka"
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] border border-slate-200 transition-colors flex items-center gap-1"
                              >
                                <Briefcase className="w-3 h-3 text-slate-500" />
                                <span>Job</span>
                              </button>

                              <button
                                onClick={() => {
                                  setExitModalItem(item);
                                  setExitForm({
                                    exitType: 0,
                                    lastWorkingDate: todayStr,
                                    exitReason: '',
                                    resignationDate: todayStr,
                                    isOkToRehire: true,
                                    comments: '',
                                  });
                                }}
                                title="Submit Exit Request in Keka"
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200 transition-colors flex items-center gap-1"
                              >
                                <LogOut className="w-3 h-3 text-rose-500" />
                                <span>Exit</span>
                              </button>

                              <button
                                onClick={() => handleUnlink(item.keka_employee_id, item.keka_name || item.matched_local_user_name || item.keka_employee_id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Unlink Employee"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LEAVE POLICY MAPPING                                               */}
      {/* ========================================================================= */}
      {activeTab === 'leave_types' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Map Internal Leave Categories to Keka Leave Types</span>
            </h3>
            <p className="text-xs text-slate-500">
              When an employee submits a leave request and it gets approved by Admin/Manager,
              it will be automatically synchronized with Keka HR under the selected Keka leave type identifier.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-2xs text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Local Policy</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Current Keka Mapping</th>
                  <th className="py-3 px-4">Select Keka Leave Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {localLeaveTypes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No local leave types configured.
                    </td>
                  </tr>
                ) : (
                  localLeaveTypes.map((lt) => {
                    const mappedKekaType = kekaLeaveTypes.find((k) => k.id === lt.keka_leave_type_id);

                    return (
                      <tr key={lt.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {lt.name}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-black text-[10px]">
                            {lt.code}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {lt.keka_leave_type_id ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{mappedKekaType ? mappedKekaType.name : lt.keka_leave_type_id}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Not mapped</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={lt.keka_leave_type_id || ''}
                            onChange={(e) => handleMapLeaveType(lt, e.target.value)}
                            disabled={isUpdatingLeaveType || isKekaLeaveTypesLoading}
                            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none w-64"
                          >
                            <option value="">-- No Keka Mapping --</option>
                            {kekaLeaveTypes.map((k) => (
                              <option key={k.id} value={k.id}>
                                {k.name} ({k.code || k.id.substring(0, 8)})
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ATTENDANCE & EXCEPTIONS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Date Picker & Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <label className="font-bold text-slate-600">Select Date:</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPunchModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Punch Entry</span>
              </button>

              <button
                onClick={() => {
                  refetchAttendance();
                  refetchExceptions();
                }}
                disabled={isAttendanceLoading || isExceptionsLoading}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isAttendanceLoading || isExceptionsLoading ? 'animate-spin' : ''
                  }`}
                />
                <span>Refresh Log</span>
              </button>
            </div>
          </div>

          {/* Exceptions & Health Summary */}
          {exceptionsData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500">Present / Punched In</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {Math.max(0, (exceptionsData.total_evaluated ?? 0) - (exceptionsData.absent_without_leave_count ?? 0))}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-amber-600">Missing Out-Punch</span>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {exceptionsData.missing_punch_count ?? 0}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-rose-600">Absent / Unreported</span>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  {exceptionsData.absent_without_leave_count ?? 0}
                </p>
              </div>
            </div>
          )}

          {/* Attendance Log Table */}
          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-2xs text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee ID / Name</th>
                  <th className="py-3 px-4">First In</th>
                  <th className="py-3 px-4">Last Out</th>
                  <th className="py-3 px-4">Total Work Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-600">
                        No Keka attendance records found for {attendanceDate}
                      </p>
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((rec) => (
                    <tr key={`${rec.keka_employee_id}-${rec.date}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {rec.keka_employee_name || 'Keka Employee'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {rec.keka_employee_number || rec.keka_employee_id.slice(0, 8)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {rec.first_in ? (
                          <span className="inline-flex items-center gap-1">
                            <LogIn className="w-3 h-3 text-emerald-600" />
                            {new Date(rec.first_in).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400">--:--</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {rec.last_out ? (
                          <span className="inline-flex items-center gap-1">
                            <LogOut className="w-3 h-3 text-blue-600" />
                            {new Date(rec.last_out).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-amber-500 font-bold">Missing</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {rec.effective_hours ? `${rec.effective_hours} hrs` : (rec.gross_hours ? `${rec.gross_hours} hrs` : '--')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black capitalize ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'absent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.status || 'Present'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANUAL MAP MODAL                                                          */}
      {/* ========================================================================= */}
      {manualMapModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveManualMapping}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-600" />
                <span>Link Keka Employee to Timesheet User</span>
              </h3>
              <button
                type="button"
                onClick={() => setManualMapModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{manualMapModalItem.keka_name || 'Keka Employee'}</div>
                <div className="text-slate-500">{manualMapModalItem.keka_email || 'No email registered'}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Keka ID: {manualMapModalItem.keka_employee_id} {manualMapModalItem.keka_employee_number ? `(${manualMapModalItem.keka_employee_number})` : ''}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Local Timesheet User *</label>
                <select
                  value={selectedLocalUserId}
                  onChange={(e) => setSelectedLocalUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Select Local User --</option>
                  {usersList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) [ID: {user.id}]
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Select the local Timesheet user account to link with this Keka profile.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setManualMapModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingMapping || !selectedLocalUserId}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-xs"
              >
                {isSavingMapping ? 'Saving...' : 'Save Mapping'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DIRECT KEKA PROVISIONING MODAL (POST /hris/employees)                  */}
      {/* ========================================================================= */}
      {showAddKekaEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreateKekaEmpSubmit}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-xs"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/75 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Provision Employee in Keka HR</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Executes official POST /hris/employees with all tenant-supported fields</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddKekaEmpModal(false)}
                className="p-1.5 rounded-lg bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Fields */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Core Profile */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Core Profile Details</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">First Name *</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.firstName}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, firstName: e.target.value })}
                      placeholder="e.g. Vikram"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Middle Name</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.middleName}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, middleName: e.target.value })}
                      placeholder="e.g. Kumar"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Last Name *</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.lastName}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, lastName: e.target.value })}
                      placeholder="e.g. Sharma"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Display Name</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.displayName}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, displayName: e.target.value })}
                      placeholder="Auto-derived if blank"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Work Email Address *</label>
                    <input
                      type="email"
                      value={newKekaEmpForm.email}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, email: e.target.value })}
                      placeholder="e.g. vikram@company.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Mobile Number</label>
                    <input
                      type="tel"
                      value={newKekaEmpForm.mobileNumber}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, mobileNumber: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Job & Org */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Keka Job & Organization</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Employee Number *</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.employeeNumber}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, employeeNumber: e.target.value })}
                      placeholder="e.g. EMP-101"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Date Joined *</label>
                    <input
                      type="date"
                      value={newKekaEmpForm.dateJoined}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, dateJoined: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Department</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.department}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, department: e.target.value })}
                      placeholder="e.g. Product Engineering"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Job Title</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.jobTitle}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, jobTitle: e.target.value })}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Secondary Job Title</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.secondaryJobTitle}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, secondaryJobTitle: e.target.value })}
                      placeholder="e.g. Squad Lead"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Business Unit</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.businessUnit}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, businessUnit: e.target.value })}
                      placeholder="e.g. Core Platform"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Personal & Demographics */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Demographics, Entity & Location</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Gender</label>
                    <select
                      value={newKekaEmpForm.gender}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, gender: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value={0}>Unspecified</option>
                      <option value={1}>Male</option>
                      <option value={2}>Female</option>
                      <option value={3}>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Date of Birth</label>
                    <input
                      type="date"
                      value={newKekaEmpForm.dateOfBirth}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, dateOfBirth: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nationality</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.nationality}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, nationality: e.target.value })}
                      placeholder="e.g. Indian"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Location / Branch</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.location}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, location: e.target.value })}
                      placeholder="e.g. Bangalore, India"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Legal Entity</label>
                    <input
                      type="text"
                      value={newKekaEmpForm.legalEntity}
                      onChange={(e) => setNewKekaEmpForm({ ...newKekaEmpForm, legalEntity: e.target.value })}
                      placeholder="e.g. Tech Corp Pvt Ltd"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/75 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddKekaEmpModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingEmp}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-70 transition-colors"
              >
                {isCreatingEmp ? 'Creating in Keka...' : 'Create Employee in Keka'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. UPDATE JOB DETAILS MODAL (PUT /hris/employees/jobdetails)              */}
      {/* ========================================================================= */}
      {jobDetailsModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleUpdateJobDetailsSubmit}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Update Keka Job Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setJobDetailsModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900">{jobDetailsModalItem.keka_name || 'Employee'}</p>
              <p className="text-[11px] text-slate-500 font-mono">{jobDetailsModalItem.keka_employee_id}</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Job Title</label>
                  <input
                    type="text"
                    value={jobDetailsForm.jobTitle}
                    onChange={(e) => setJobDetailsForm({ ...jobDetailsForm, jobTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Secondary Job Title</label>
                  <input
                    type="text"
                    value={jobDetailsForm.secondaryJobTitle}
                    onChange={(e) => setJobDetailsForm({ ...jobDetailsForm, secondaryJobTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Department</label>
                  <input
                    type="text"
                    value={jobDetailsForm.department}
                    onChange={(e) => setJobDetailsForm({ ...jobDetailsForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Business Unit</label>
                  <input
                    type="text"
                    value={jobDetailsForm.businessUnit}
                    onChange={(e) => setJobDetailsForm({ ...jobDetailsForm, businessUnit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Location</label>
                  <input
                    type="text"
                    value={jobDetailsForm.location}
                    onChange={(e) => setJobDetailsForm({ ...jobDetailsForm, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Reports-To Email</label>
                  <input
                    type="email"
                    value={jobDetailsForm.reportsToEmail}
                    onChange={(e) => setJobDetailsForm({ ...jobDetailsForm, reportsToEmail: e.target.value })}
                    placeholder="manager@company.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setJobDetailsModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingJob}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-xs"
              >
                {isUpdatingJob ? 'Updating in Keka...' : 'Update Job Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EMPLOYEE EXIT REQUEST MODAL (POST /hris/employees/{id}/exitrequest)     */}
      {/* ========================================================================= */}
      {exitModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleExitRequestSubmit}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Submit Keka Exit Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setExitModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 space-y-1">
              <p className="font-bold text-slate-900">{exitModalItem.keka_name || 'Employee'}</p>
              <p className="text-[11px] text-slate-500 font-mono">{exitModalItem.keka_employee_id}</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Exit Type *</label>
                  <select
                    value={exitForm.exitType}
                    onChange={(e) => setExitForm({ ...exitForm, exitType: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value={0}>Voluntary</option>
                    <option value={1}>Involuntary</option>
                    <option value={2}>Retirement</option>
                    <option value={3}>Death</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Last Working Date *</label>
                  <input
                    type="date"
                    value={exitForm.lastWorkingDate}
                    onChange={(e) => setExitForm({ ...exitForm, lastWorkingDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Resignation Date</label>
                  <input
                    type="date"
                    value={exitForm.resignationDate}
                    onChange={(e) => setExitForm({ ...exitForm, resignationDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Exit Reason</label>
                  <input
                    type="text"
                    value={exitForm.exitReason}
                    onChange={(e) => setExitForm({ ...exitForm, exitReason: e.target.value })}
                    placeholder="e.g. Better opportunity"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rehireCheck"
                  checked={exitForm.isOkToRehire}
                  onChange={(e) => setExitForm({ ...exitForm, isOkToRehire: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="rehireCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Eligible for rehire in future
                </label>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Comments / Remarks</label>
                <textarea
                  rows={2}
                  value={exitForm.comments}
                  onChange={(e) => setExitForm({ ...exitForm, comments: e.target.value })}
                  placeholder="Additional context or handover details"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setExitModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingExit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold shadow-xs"
              >
                {isCreatingExit ? 'Submitting...' : 'Submit Exit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LOG PUNCH ENTRY MODAL (POST /attendance/employee/{id}/timeentry)       */}
      {/* ========================================================================= */}
      {punchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handlePushTimeEntrySubmit}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Log Attendance Punch to Keka</span>
              </h3>
              <button
                type="button"
                onClick={() => setPunchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Keka Employee Identifier (UUID or EMP Number) *</label>
                <input
                  type="text"
                  value={punchForm.employeeIdentifier}
                  onChange={(e) => setPunchForm({ ...punchForm, employeeIdentifier: e.target.value })}
                  placeholder="e.g. EMP-101 or Keka UUID"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Timestamp (ISO format) *</label>
                <input
                  type="datetime-local"
                  value={punchForm.timestamp ? punchForm.timestamp.slice(0, 16) : ''}
                  onChange={(e) => setPunchForm({ ...punchForm, timestamp: new Date(e.target.value).toISOString() })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Punch Status *</label>
                <select
                  value={punchForm.punchStatus}
                  onChange={(e) => setPunchForm({ ...punchForm, punchStatus: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={0}>In (Punch-In)</option>
                  <option value={1}>Out (Punch-Out)</option>
                  <option value={2}>Break-In</option>
                  <option value={3}>Break-Out</option>
                  <option value={99}>Other</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPunchModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPushingPunch || !punchForm.employeeIdentifier?.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-xs"
              >
                {isPushingPunch ? 'Logging...' : 'Log Punch'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
