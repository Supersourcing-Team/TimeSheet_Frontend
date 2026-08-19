import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setPortalMode, logout } from './store/slices/authSlice';
import {
  useGetUsersQuery,
  useGetProjectsQuery,
  useGetTimesheetsQuery,
  useGetManagedTimesheetsQuery,
  useGetLeaveRequestsQuery,
  useGetMyLeaveRequestsQuery,
  useGetWeekendRequestsQuery,
  useGetManagedWeekendRequestsQuery,
  useSubmitWeekendWorkMutation,
  useApproveWeekendWorkMutation,
  useRejectWeekendWorkMutation,
  useCancelWeekendWorkMutation,
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useCreateTimesheetsMutation,
  useUpdateTimesheetMutation,
  useDeleteTimesheetMutation,
  useCreateLeaveRequestMutation,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation,
  useCancelLeaveRequestMutation,
  useGetMyLeaveBalancesQuery,
  useGetLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
  useGetMyProjectAssignmentsQuery,
  useGetWorkingCalendarQuery,
  useUpdateWorkingCalendarMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetClientsQuery,
  useCreateClientMutation,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAssignUserToProjectMutation,
  useRemoveUserFromProjectMutation,
  useCreateToolMutation,
  useAllocateToolMutation,
  useDeallocateToolMutation,
} from './store/api/dataApi';
import { useGetCurrentUserQuery, useLogoutMutation } from './store/api/authApi';
import { setCredentials } from './store/slices/authSlice';
import { apiSlice } from './store/apiSlice';

import {
  User,
  Project,
  TimesheetEntry,
  LeaveBalance,
  LeaveRequest,
  WeekendWorkRequest,
  ActivityLog,
  ToastMessage,
  ActivePortalMode,
  ProjectTool,
  HolidayItem,
  LeaveTypeConfig,
} from './types';

import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { Sidebar, EmployeeTab, AdminTab, PMTab, ACManagerTab } from './components/Sidebar';
import { ToastContainer } from './components/Toast';

import { MyDashboard } from './components/employee/MyDashboard';
import { SubmitTimesheet } from './components/employee/SubmitTimesheet';
import { TimesheetsHistory } from './components/employee/TimesheetsHistory';
import { MyProjects } from './components/employee/MyProjects';
import { LeaveManagement } from './components/employee/LeaveManagement';
import { WeekendWork } from './components/employee/WeekendWork';

import { PMDashboard } from './components/pm/PMDashboard';
import { PMMyProjects } from './components/pm/PMMyProjects';
import { PMResourceAllocation } from './components/pm/PMResourceAllocation';
import { PMTimesheetReview } from './components/pm/PMTimesheetReview';
import { PMWeekendWorkRequests } from './components/pm/PMWeekendWorkRequests';

import { AccountManagerDashboard } from './components/ac_manager/AccountManagerDashboard';

const AdminOverview = React.lazy(() => import('./components/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
AdminOverview.displayName = 'AdminOverview';
const UserManagement = React.lazy(() => import('./components/admin/UserManagement').then(m => ({ default: m.UserManagement })));
UserManagement.displayName = 'UserManagement';
const AdminLeaveApprovals = React.lazy(() => import('./components/admin/AdminLeaveApprovals').then(m => ({ default: m.AdminLeaveApprovals })));
AdminLeaveApprovals.displayName = 'AdminLeaveApprovals';
const HolidaysManagement = React.lazy(() => import('./components/admin/HolidaysManagement').then(m => ({ default: m.HolidaysManagement })));
HolidaysManagement.displayName = 'HolidaysManagement';
const LeaveTypesManagement = React.lazy(() => import('./components/admin/LeaveTypesManagement').then(m => ({ default: m.LeaveTypesManagement })));
LeaveTypesManagement.displayName = 'LeaveTypesManagement';
const WorkingCalendar = React.lazy(() => import('./components/admin/WorkingCalendar').then(m => ({ default: m.WorkingCalendar })));
WorkingCalendar.displayName = 'WorkingCalendar';
const SettingsManagement = React.lazy(() => import('./components/admin/SettingsManagement').then(m => ({ default: m.SettingsManagement })));
SettingsManagement.displayName = 'SettingsManagement';

// Initial mocks for things not yet in backend API endpoints
import { INITIAL_LEAVE_BALANCE, INITIAL_ACTIVITIES, INITIAL_LEAVE_TYPES, INITIAL_WORKING_CALENDAR, INITIAL_SETTINGS } from './data/initialData';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const dispatch = useDispatch();
  const { user: currentUser, portalMode } = useSelector((state: RootState) => state.auth);

  // Attempt to restore session on load
  const { data: userProfile, isLoading: isAuthLoading } = useGetCurrentUserQuery(undefined, {
    skip: !!currentUser, // don't fetch if we already have the user in state
  });

  // Initialize URL Sync variables
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const urlPortal = searchParams.get('portal');
  const urlTab = searchParams.get('tab');

  // If user profile is successfully fetched, set the credentials
  React.useEffect(() => {
    if (userProfile && !currentUser) {
      dispatch(setCredentials({ user: userProfile }));
      // Restore portal mode if explicitly provided in the URL and valid
      if (urlPortal && ['employee', 'pm', 'ac_manager', 'admin'].includes(urlPortal)) {
        setTimeout(() => dispatch(setPortalMode(urlPortal as ActivePortalMode)), 0);
      }
    }
  }, [userProfile, currentUser, dispatch, urlPortal]);

  // Local UI State initialized from URL
  const [activeEmployeeTab, setActiveEmployeeTab] = useState<EmployeeTab>(
    () => (urlPortal === 'employee' && urlTab ? urlTab : 'my_dashboard') as EmployeeTab
  );
  const [activePmTab, setActivePmTab] = useState<PMTab>(
    () => (urlPortal === 'pm' && urlTab ? urlTab : 'pm_dashboard') as PMTab
  );
  const [activeAcTab, setActiveAcTab] = useState<ACManagerTab>(
    () => (urlPortal === 'ac_manager' && urlTab ? urlTab : 'ac_dashboard') as ACManagerTab
  );
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>(
    () => (urlPortal === 'admin' && urlTab ? urlTab : 'admin_overview') as AdminTab
  );

  // Sync state changes to URL
  React.useEffect(() => {
    if (currentUser) {
      const params = new URLSearchParams(window.location.search);
      params.set('portal', portalMode);
      if (portalMode === 'employee') params.set('tab', activeEmployeeTab);
      else if (portalMode === 'pm') params.set('tab', activePmTab);
      else if (portalMode === 'ac_manager') params.set('tab', activeAcTab);
      else if (portalMode === 'admin') params.set('tab', activeAdminTab);
      
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    } else {
      // Clear URL parameters when logged out
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [currentUser, portalMode, activeEmployeeTab, activePmTab, activeAcTab, activeAdminTab]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [editingTimesheet, setEditingTimesheet] = useState<TimesheetEntry | null>(null);

  // RTK Queries (Skipped if not logged in)
  const skip = !currentUser;
  const isAdmin = currentUser?.role === 'admin';
  const isPm = currentUser?.role === 'pm';
  
  const { data: users = [] } = useGetUsersQuery(undefined, { skip });
  const { data: projects = [] } = useGetProjectsQuery(undefined, { skip });
  const { data: clients = [] } = useGetClientsQuery(undefined, { skip: skip || !isPm });
  const { data: myTimesheets = [] } = useGetTimesheetsQuery(undefined, { skip });
  const { data: managedTimesheets = [] } = useGetManagedTimesheetsQuery(undefined, { skip: skip || !isPm });
  
  const timesheets = React.useMemo(() => {
    const map = new Map<string, TimesheetEntry>();
    myTimesheets.forEach(t => map.set(t.id, t));
    if (isPm) {
      managedTimesheets.forEach(t => map.set(t.id, t));
    }
    return Array.from(map.values());
  }, [myTimesheets, managedTimesheets, isPm]);
  // Admins need all leave requests; others just need theirs
  const { data: allLeaveRequests = [] } = useGetLeaveRequestsQuery(undefined, { skip: skip || !isAdmin });
  const { data: myLeaveRequests = [] } = useGetMyLeaveRequestsQuery(undefined, { skip: skip || isAdmin });
  const leaveRequests = isAdmin ? allLeaveRequests : myLeaveRequests;

  const { data: myWeekendRequests = [] } = useGetWeekendRequestsQuery(undefined, { skip });
  const { data: pendingWeekendRequests = [] } = useGetManagedWeekendRequestsQuery(undefined, { skip: skip || (!isPm && !isAdmin) });
  const weekendRequests = isPm || isAdmin ? pendingWeekendRequests : myWeekendRequests;
  const { data: holidays = [] } = useGetHolidaysQuery(undefined, { skip });
  const { data: myProjectAssignments = [] } = useGetMyProjectAssignmentsQuery(undefined, { skip });
  const { data: fetchedLeaveBalance } = useGetMyLeaveBalancesQuery(undefined, { skip });
  const { data: leaveTypes = [] } = useGetLeaveTypesQuery(undefined, { skip });

  const { data: fetchedWorkingCalendar } = useGetWorkingCalendarQuery(undefined, { skip });
  const { data: fetchedSettings } = useGetSettingsQuery(undefined, { skip });
  
  const [createProjectMutation] = useCreateProjectMutation();
  const [updateProjectMutation] = useUpdateProjectMutation();
  const [deleteProjectMutation] = useDeleteProjectMutation();
  const [assignUserMutation] = useAssignUserToProjectMutation();
  const [removeUserMutation] = useRemoveUserFromProjectMutation();
  const [createTool] = useCreateToolMutation();
  const [allocateTool] = useAllocateToolMutation();
  const [removeToolMutation] = useDeallocateToolMutation();
  // Fallbacks for data not yet wired up
  const leaveBalance = fetchedLeaveBalance || {
    annualLeaveTotal: 0,
    annualLeaveUsed: 0,
    sickLeaveTotal: 0,
    sickLeaveUsed: 0,
    parentalLeaveTotal: 0,
    parentalLeaveUsed: 0,
    compOffTotal: 0,
    compOffUsed: 0,
  };
  const workingCalendar = fetchedWorkingCalendar || INITIAL_WORKING_CALENDAR;
  const [activities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);
  const settings = fetchedSettings || INITIAL_SETTINGS;

  // RTK Mutations
  const [updateWorkingCalendar] = useUpdateWorkingCalendarMutation();
  const [updateSettingsMutation] = useUpdateSettingsMutation();
  const [createTimesheets] = useCreateTimesheetsMutation();
  const [updateTimesheetApi] = useUpdateTimesheetMutation();
  const [deleteTimesheetApi] = useDeleteTimesheetMutation();
  const [createLeaveRequest] = useCreateLeaveRequestMutation();
  const [approveLeaveRequest] = useApproveLeaveRequestMutation();
  const [rejectLeaveRequest] = useRejectLeaveRequestMutation();
  const [cancelLeaveRequest] = useCancelLeaveRequestMutation();
  const [createHoliday] = useCreateHolidayMutation();
  const [updateHoliday] = useUpdateHolidayMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();
  const [createLeaveType] = useCreateLeaveTypeMutation();
  const [updateLeaveType] = useUpdateLeaveTypeMutation();
  const [deleteLeaveType] = useDeleteLeaveTypeMutation();
  const [submitWeekendWork] = useSubmitWeekendWorkMutation();
  const [approveWeekendWork] = useApproveWeekendWorkMutation();
  const [rejectWeekendWork] = useRejectWeekendWorkMutation();
  const [logoutApi] = useLogoutMutation();

  const showToast = (title: string, description?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      title,
      description,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (e) {
      console.error('Logout API failed:', e);
    } finally {
      dispatch(apiSlice.util.resetApiState());
      dispatch(logout());
    }
  };

  // --- Timesheet Handlers ---
  const handleTimesheetSubmit = async (entries: Omit<TimesheetEntry, 'id'>[]) => {
    try {
      const payload = entries.map(e => ({
        project_assignment_id: Number(e.projectId),
        timesheet_date: e.date,
        billable_hours: e.billableHours,
        non_billable_hours: e.nonBillableHours,
        billable_work_summary: e.billableDescription || e.description,
        non_billable_work_summary: e.nonBillableDescription,
      }));
      await createTimesheets(payload as any).unwrap();
      showToast('Success', 'Timesheets submitted', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to submit timesheets', 'error');
    }
  };

  const handleDeleteTimesheet = async (id: string) => {
    try {
      await deleteTimesheetApi(id).unwrap();
      showToast('Success', 'Timesheet entry deleted', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to delete timesheet', 'error');
    }
  };

  const handleUpdateTimesheet = async (updatedEntry: TimesheetEntry) => {
    try {
      await updateTimesheetApi({
        id: updatedEntry.id,
        billable_hours: updatedEntry.billableHours,
        non_billable_hours: updatedEntry.nonBillableHours,
        billable_work_summary: updatedEntry.billableDescription || updatedEntry.description,
        non_billable_work_summary: updatedEntry.nonBillableDescription,
        timesheet_date: updatedEntry.date,
      }).unwrap();
      showToast('Success', 'Timesheet entry updated', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to update timesheet', 'error');
    }
  };

  // --- Leave Handlers ---
  const handleApplyLeave = async (req: Omit<LeaveRequest, 'id'>) => {
    try {
      // Map frontend type to leave_type_id dynamically using the fetched leaveTypes
      const matchedType = leaveTypes.find(lt => lt.name.toLowerCase() === req.type.toLowerCase());
      const leaveTypeId = matchedType ? matchedType.id : 3; // Fallback to 3 if not found

      await createLeaveRequest({
        leave_type_id: leaveTypeId,
        start_date: req.startDate,
        end_date: req.endDate,
        reason: req.reason,
      }).unwrap();
      showToast('Success', 'Leave request submitted successfully', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to apply for leave', 'error');
    }
  };

  const handleCancelLeave = async (id: string) => {
    try {
      await cancelLeaveRequest(id).unwrap();
      showToast('Success', 'Leave request cancelled', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to cancel leave', 'error');
    }
  };

  const handleApproveLeave = async (id: string, comment?: string) => {
    try {
      await approveLeaveRequest({ id, comment }).unwrap();
      showToast('Success', 'Leave approved', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to approve leave', 'error');
    }
  };

  const handleRejectLeave = async (id: string, comment?: string) => {
    try {
      await rejectLeaveRequest({ id, rejection_reason: comment }).unwrap();
      showToast('Success', 'Leave rejected', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to reject leave', 'error');
    }
  };

  // --- Weekend Work ---
  const handleRequestWeekendWork = async (req: Omit<WeekendWorkRequest, 'id'>) => {
    try {
      const assignment = myProjectAssignments.find(a => String(a.project_id) === req.projectId);
      const assignmentId = assignment ? assignment.id : Number(req.projectId); // fallback
      
      await submitWeekendWork({
        project_assignment_id: assignmentId,
        work_date: req.workDate,
        planned_hours: req.plannedHours,
        reason: req.deliverableObjective,
      }).unwrap();
      showToast('Success', 'Weekend work request submitted successfully', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to submit weekend work request', 'error');
    }
  };

  const handleApproveWeekendWork = async (id: string) => {
    try {
      await approveWeekendWork({ id }).unwrap();
      showToast('Success', 'Weekend work approved', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to approve weekend work', 'error');
    }
  };

  const handleRejectWeekendWork = async (id: string, comment?: string) => {
    try {
      await rejectWeekendWork({ id, rejection_reason: comment }).unwrap();
      showToast('Success', 'Weekend work rejected', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to reject weekend work', 'error');
    }
  };

  // --- Projects / PM / AC ---
  const handleUpdateProjectBudget = (projectId: string, newBudget: number, newRate: number) => {
    showToast('Info', 'Project budget update pending', 'info');
  };

  const [createClientMutation] = useCreateClientMutation();

  const handleCreateClient = async (name: string) => {
    try {
      await createClientMutation({ name }).unwrap();
      showToast('Success', `Client "${name}" created successfully`, 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to create client', 'error');
    }
  };

  const handleAddProject = async (newProj: Omit<Project, 'id'>) => {
    if (!currentUser) return;
    try {
      await createProjectMutation({
        client_id: Number(newProj.client), // using client field to pass client_id
        project_manager_id: Number(currentUser.id),
        project_name: newProj.name,
        description: newProj.description,
        budget: newProj.budget,
        hourly_rate: newProj.hourlyRate,
        allocated_hours: newProj.allocatedHours,
        start_date: newProj.startDate,
        end_date: newProj.endDate,
      }).unwrap();
      showToast('Success', 'Project created successfully', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to create project', 'error');
    }
  };

  const handleUpdateProject = async (updatedProj: Project) => {
    try {
      await updateProjectMutation({
        id: updatedProj.id,
        project_name: updatedProj.name,
        status: updatedProj.status,
        budget: updatedProj.budget,
        hourly_rate: updatedProj.hourlyRate,
        allocated_hours: updatedProj.allocatedHours,
        start_date: updatedProj.startDate,
        end_date: updatedProj.endDate,
      }).unwrap();
      showToast('Success', 'Project updated successfully', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to update project', 'error');
    }
  };

  const handleAssignUserToProject = async (projectId: string, userId: string) => {
    try {
      await assignUserMutation({
        project_id: Number(projectId),
        user_id: Number(userId),
      }).unwrap();
      showToast('Success', 'User assigned successfully', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to assign user', 'error');
    }
  };

  const handleRemoveUserFromProject = async (projectId: string, userId: string) => {
    try {
      await removeUserMutation({ projectId, userId }).unwrap();
      showToast('Success', 'User removed from project successfully', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to remove user', 'error');
    }
  };

  const handleAddToolToProject = async (projectId: string, tool: Omit<import('./types').ProjectTool, 'id'>) => {
    try {
      const newTool = await createTool({ name: tool.name, category: tool.category, cost_per_month: tool.monthlyCost }).unwrap();
      await allocateTool({ tool_id: newTool.id, project_id: Number(projectId), allocation_date: tool.allocationDate }).unwrap();
      showToast('Success', 'Tool added and allocated to project', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to add tool', 'error');
    }
  };

  const handleRemoveToolFromProject = async (projectId: string, toolId: string) => {
    try {
      await removeToolMutation(toolId).unwrap();
      showToast('Success', 'Tool removed', 'success');
    } catch (e: any) {
      showToast('Error', 'Failed to remove tool', 'error');
    }
  };

  // --- User / Admin ---
  const handleAddUser = (user: Omit<User, 'id'>) => {
    showToast('Info', 'Add user API pending', 'info');
  };

  const handleUpdateUser = (updatedUser: User) => {
    showToast('Info', 'Update user API pending', 'info');
  };

  const handleToggleUserStatus = (userId: string) => {
    showToast('Info', 'Toggle user status pending', 'info');
  };

  // --- Holidays / Settings ---
  const handleAddHoliday = async (item: Omit<HolidayItem, 'id'>) => {
    try {
      await createHoliday(item).unwrap();
      showToast('Success', 'Holiday Added', 'success');
    } catch (e: any) {
      showToast('Error', e.message || 'Failed to add holiday', 'error');
    }
  };

  const handleEditHoliday = async (updatedItem: HolidayItem) => {
    try {
      await updateHoliday(updatedItem).unwrap();
      showToast('Success', 'Holiday Updated', 'success');
    } catch (e: any) {
      showToast('Error', e.message || 'Failed to update holiday', 'error');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteHoliday(id).unwrap();
      showToast('Success', 'Holiday deleted', 'success');
    } catch (e) {
      showToast('Error', 'Failed to delete holiday', 'error');
    }
  };

  // --- Leave Types Handlers ---
  const handleAddLeaveType = async (type: Omit<LeaveTypeConfig, 'id'>) => {
    try {
      await createLeaveType({
        name: type.name,
        code: type.code,
        daysPerYear: type.daysPerYear,
        isPaid: type.isPaid,
        requiresDocument: type.requiresDocument,
        description: type.description,
      }).unwrap();
      showToast('Success', 'Leave type added', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to add leave type', 'error');
    }
  };

  const handleEditLeaveType = async (updated: LeaveTypeConfig) => {
    try {
      await updateLeaveType({
        id: updated.id,
        name: updated.name,
        code: updated.code,
        daysPerYear: updated.daysPerYear,
        isPaid: updated.isPaid,
        requiresDocument: updated.requiresDocument,
        description: updated.description,
      }).unwrap();
      showToast('Success', 'Leave type updated', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to update leave type', 'error');
    }
  };

  const handleToggleLeaveTypeStatus = async (id: string) => {
    try {
      await deleteLeaveType(id).unwrap();
      showToast('Success', 'Leave type status toggled', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to toggle status', 'error');
    }
  };

  // -----------------------------------------------------------------
  const pendingTimesheetsCount = (timesheets || []).filter((t: any) => t.status === 'pending').length;
  const pendingLeavesCount = (leaveRequests || []).filter((l: any) => l.status === 'pending').length;
  const pendingWeekendCount = (weekendRequests || []).filter((w: any) => w.status === 'pending').length;

  if (isAuthLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#f8fafe] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans relative">
        <LoginPage />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Header
        currentUser={currentUser}
        portalMode={portalMode}
        onTogglePortalMode={(mode) => dispatch(setPortalMode(mode))}
        pendingApprovalsCount={pendingTimesheetsCount + pendingLeavesCount}
        onLogout={handleLogout}
      />

      <div className="flex flex-1">
        <Sidebar
          portalMode={portalMode}
          activeEmployeeTab={activeEmployeeTab}
          onSelectEmployeeTab={(tab) => setActiveEmployeeTab(tab)}
          activePmTab={activePmTab}
          onSelectPmTab={(tab) => setActivePmTab(tab)}
          activeAcTab={activeAcTab}
          onSelectAcTab={(tab) => setActiveAcTab(tab)}
          activeAdminTab={activeAdminTab}
          onSelectAdminTab={(tab) => setActiveAdminTab(tab)}
          pendingTimesheetsCount={pendingTimesheetsCount}
          pendingLeavesCount={pendingLeavesCount}
          pendingWeekendCount={pendingWeekendCount}
          onQuickAddTimesheet={() => {
            if (portalMode === 'employee') setActiveEmployeeTab('submit_timesheet');
          }}
        />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {portalMode === 'employee' && (
            <>
              {activeEmployeeTab === 'my_dashboard' && (
                <MyDashboard
                  currentUser={currentUser}
                  timesheets={timesheets}
                  projects={projects}
                  leaveBalance={leaveBalance}
                  leaveRequests={leaveRequests}
                  holidays={holidays || []}
                  onNavigateTab={(tab) => setActiveEmployeeTab(tab)}
                />
              )}

              {activeEmployeeTab === 'submit_timesheet' && (
                <SubmitTimesheet
                  currentUser={currentUser}
                  projects={projects}
                  projectAssignments={myProjectAssignments}
                  onSubmitTimesheet={handleTimesheetSubmit}
                  onUpdateTimesheet={handleUpdateTimesheet}
                  editingEntry={editingTimesheet}
                  onClearEditing={() => setEditingTimesheet(null)}
                  onShowToast={showToast}
                />
              )}

              {activeEmployeeTab === 'timesheets_history' && (
                <TimesheetsHistory
                  currentUser={currentUser}
                  timesheets={timesheets}
                  projects={projects}
                  onDeleteTimesheet={handleDeleteTimesheet}
                  onUpdateTimesheet={handleUpdateTimesheet}
                  onSubmitTimesheets={handleTimesheetSubmit}
                  onEditRequest={(entry) => {
                    setEditingTimesheet(entry);
                    setActiveEmployeeTab('submit_timesheet');
                  }}
                  onShowToast={showToast}
                />
              )}

              {activeEmployeeTab === 'my_projects' && (
                <MyProjects
                  currentUser={currentUser}
                  projects={projects}
                  allUsers={users}
                />
              )}

              {activeEmployeeTab === 'leave_management' && (
                <LeaveManagement
                  currentUser={currentUser}
                  leaveBalance={leaveBalance}
                  leaveRequests={leaveRequests}
                  onApplyLeave={handleApplyLeave}
                  onCancelLeave={handleCancelLeave}
                  onShowToast={showToast}
                />
              )}

              {activeEmployeeTab === 'weekend_work' && (
                <WeekendWork
                  currentUser={currentUser}
                  projects={projects}
                  weekendRequests={weekendRequests}
                  holidays={holidays || []}
                  onRequestWeekendWork={handleRequestWeekendWork}
                  onShowToast={showToast}
                />
              )}
            </>
          )}

          {portalMode === 'pm' && (
            <>
              {activePmTab === 'pm_dashboard' && (
                <PMDashboard
                  currentUser={currentUser}
                  projects={projects}
                  allUsers={users}
                  timesheets={timesheets}
                  weekendRequests={weekendRequests}
                  onNavigateTab={(tab) => setActivePmTab(tab as PMTab)}
                  onShowToast={showToast}
                />
              )}

              {activePmTab === 'pm_my_projects' && (
                <PMMyProjects
                  currentUser={currentUser}
                  projects={projects}
                  allUsers={users}
                  clients={clients}
                  timesheets={timesheets}
                  onAddProject={handleAddProject}
                  onUpdateProject={handleUpdateProject}
                  onCreateClient={handleCreateClient}
                  onAssignUserToProject={handleAssignUserToProject}
                  onRemoveUserFromProject={handleRemoveUserFromProject}
                  onAddToolToProject={handleAddToolToProject}
                  onRemoveToolFromProject={handleRemoveToolFromProject}
                  onShowToast={showToast}
                />
              )}

              {activePmTab === 'pm_resource_allocation' && (
                <PMResourceAllocation
                  currentUser={currentUser}
                  projects={projects}
                  allUsers={users}
                  onAssignUserToProject={handleAssignUserToProject}
                  onRemoveUserFromProject={handleRemoveUserFromProject}
                  onAddToolToProject={handleAddToolToProject}
                  onRemoveToolFromProject={handleRemoveToolFromProject}
                  onShowToast={showToast}
                />
              )}

              {activePmTab === 'pm_timesheet_review' && (
                <PMTimesheetReview
                  currentUser={currentUser}
                  projects={projects}
                  allUsers={users}
                  timesheets={timesheets}
                />
              )}

              {activePmTab === 'pm_weekend_work' && (
                <PMWeekendWorkRequests
                  currentUser={currentUser}
                  projects={projects}
                  allUsers={users}
                  weekendRequests={weekendRequests}
                  onApproveWeekendWork={handleApproveWeekendWork}
                  onRejectWeekendWork={handleRejectWeekendWork}
                  onShowToast={showToast}
                />
              )}
            </>
          )}

          {portalMode === 'ac_manager' && (
            <AccountManagerDashboard
              currentUser={currentUser}
              projects={projects}
              allUsers={users}
              timesheets={timesheets}
              activeTab={activeAcTab}
              onNavigateTab={(tab) => setActiveAcTab(tab)}
              onUpdateProjectBudget={handleUpdateProjectBudget}
              onAddToolToProject={handleAddToolToProject}
              onShowToast={showToast}
            />
          )}

          {portalMode === 'admin' && (
            <ErrorBoundary>
              <React.Suspense fallback={<div className="flex h-full items-center justify-center p-12 text-slate-400 font-medium animate-pulse">Loading admin module...</div>}>
                {activeAdminTab === 'admin_overview' && (
                <AdminOverview
                  users={users}
                  projects={projects}
                  timesheets={timesheets}
                  leaveRequests={leaveRequests}
                  activities={activities}
                  onNavigateTab={(tab) => setActiveAdminTab(tab)}
                  onApproveLeave={handleApproveLeave}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'user_management' && (
                <UserManagement
                  currentUser={currentUser}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'admin_leave_approvals' && currentUser && (
                <AdminLeaveApprovals
                  currentUser={currentUser}
                  users={users}
                  leaveRequests={leaveRequests}
                  onApproveLeave={handleApproveLeave}
                  onRejectLeave={handleRejectLeave}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'admin_holidays' && (
                <HolidaysManagement
                  holidays={holidays}
                  onAddHoliday={handleAddHoliday}
                  onUpdateHoliday={handleEditHoliday}
                  onDeleteHoliday={handleDeleteHoliday}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'admin_leave_types' && (
                <LeaveTypesManagement
                  leaveTypes={leaveTypes}
                  onAddLeaveType={handleAddLeaveType}
                  onUpdateLeaveType={handleEditLeaveType}
                  onToggleLeaveTypeStatus={handleToggleLeaveTypeStatus}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'admin_working_calendar' && (
                <WorkingCalendar
                  config={workingCalendar}
                  onUpdateConfig={async (newConfig) => {
                    try {
                      await updateWorkingCalendar(newConfig).unwrap();
                      showToast('Success', 'Working calendar updated', 'success');
                    } catch (e: any) {
                      showToast('Error', e?.data?.message || 'Failed to update working calendar', 'error');
                    }
                  }}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'admin_settings' && (
                <SettingsManagement
                  settings={settings}
                  onUpdateSettings={async (newSettings) => {
                    try {
                      await updateSettingsMutation(newSettings).unwrap();
                      showToast('Success', 'Settings updated successfully', 'success');
                    } catch (e: any) {
                      showToast('Error', e?.data?.message || 'Failed to update settings', 'error');
                    }
                  }}
                  onShowToast={showToast}
                />
              )}
              </React.Suspense>
            </ErrorBoundary>
          )}
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
