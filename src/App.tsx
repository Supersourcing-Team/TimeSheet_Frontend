import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setPortalMode, logout } from './store/slices/authSlice';
import {
  useGetUsersQuery,
  useGetProjectsQuery,
  useGetTimesheetsQuery,
  useGetLeaveRequestsQuery,
  useGetMyLeaveRequestsQuery,
  useGetWeekendRequestsQuery,
  useGetPendingWeekendRequestsQuery,
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
  useGetClientsQuery,
  useCreateClientMutation,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAssignUserToProjectMutation,
  useRemoveUserFromProjectMutation,
  useAllocateToolMutation,
  useDeallocateToolMutation,
} from './store/api/dataApi';
import { useGetCurrentUserQuery, useLogoutMutation } from './store/api/authApi';
import { setCredentials } from './store/slices/authSlice';

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
import { PMTeamUtilization } from './components/pm/PMTeamUtilization';

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

  // If user profile is successfully fetched, set the credentials
  React.useEffect(() => {
    if (userProfile && !currentUser) {
      dispatch(setCredentials({ user: userProfile }));
    }
  }, [userProfile, currentUser, dispatch]);

  // Local UI State
  const [activeEmployeeTab, setActiveEmployeeTab] = useState<EmployeeTab>('my_dashboard');
  const [activePmTab, setActivePmTab] = useState<PMTab>('pm_dashboard');
  const [activeAcTab, setActiveAcTab] = useState<ACManagerTab>('ac_dashboard');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('admin_overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // RTK Queries (Skipped if not logged in)
  const skip = !currentUser;
  const isAdmin = currentUser?.role === 'admin';
  const isPm = currentUser?.role === 'pm';
  
  const { data: users = [] } = useGetUsersQuery(undefined, { skip });
  const { data: projects = [] } = useGetProjectsQuery(undefined, { skip });
  const { data: clients = [] } = useGetClientsQuery(undefined, { skip: skip || !isPm });
  const { data: timesheets = [] } = useGetTimesheetsQuery(undefined, { skip });
  
  // Admins need all leave requests; others just need theirs
  const { data: allLeaveRequests = [] } = useGetLeaveRequestsQuery(undefined, { skip: skip || !isAdmin });
  const { data: myLeaveRequests = [] } = useGetMyLeaveRequestsQuery(undefined, { skip: skip || isAdmin });
  const leaveRequests = isAdmin ? allLeaveRequests : myLeaveRequests;

  const { data: myWeekendRequests = [] } = useGetWeekendRequestsQuery(undefined, { skip });
  const { data: pendingWeekendRequests = [] } = useGetPendingWeekendRequestsQuery(undefined, { skip: skip || (!isPm && !isAdmin) });
  const weekendRequests = isPm || isAdmin ? pendingWeekendRequests : myWeekendRequests;
  const { data: holidays = [] } = useGetHolidaysQuery(undefined, { skip });
  const { data: myProjectAssignments = [] } = useGetMyProjectAssignmentsQuery(undefined, { skip });
  const { data: fetchedLeaveBalance } = useGetMyLeaveBalancesQuery(undefined, { skip });
  const { data: leaveTypes = [] } = useGetLeaveTypesQuery(undefined, { skip });

  const { data: fetchedWorkingCalendar } = useGetWorkingCalendarQuery(undefined, { skip });
  
  const [createProjectMutation] = useCreateProjectMutation();
  const [updateProjectMutation] = useUpdateProjectMutation();
  const [deleteProjectMutation] = useDeleteProjectMutation();
  const [assignUserMutation] = useAssignUserToProjectMutation();
  const [removeUserMutation] = useRemoveUserFromProjectMutation();
  const [createToolMutation] = useAllocateToolMutation(); // we'll use allocate directly since FE says "add tool"
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
  const [settings] = useState(INITIAL_SETTINGS);

  // RTK Mutations
  const [updateWorkingCalendar] = useUpdateWorkingCalendarMutation();
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
      // The API takes the project_assignment_id, but the frontend currently only passes projectId and userId.
      // For now, this is a bit tricky since we don't have assignmentId directly here.
      // But we can find it if we look it up in projects data.
      const project = projects.find(p => p.id === projectId);
      // Wait, we need the assignment ID. 
      // Actually, we'll need backend to accept DELETE /project-assignments?project_id=X&user_id=Y or we just skip this stub logic update.
      // But wait! RTK query is already written as: url: `/project-assignments/${assignmentId}`
      // Let's assume the frontend will pass assignmentId in `userId` parameter for now, or we find it.
      // To prevent breaking, let's keep it as stub for a sec or use a workaround.
      // Let's pass the assignment ID.
      showToast('Info', 'Remove user pending (requires assignment ID lookup)', 'info');
    } catch (e: any) {
      showToast('Error', 'Failed to remove user', 'error');
    }
  };

  const handleAddToolToProject = async (projectId: string, tool: Omit<import('./types').ProjectTool, 'id'>) => {
    try {
      // Need to create tool first then allocate. For now, assume tool is created and we allocate.
      // Or just stub it for now if createTool is not fully wired.
      showToast('Info', 'Add tool pending (requires tool creation flow)', 'info');
    } catch (e: any) {
      showToast('Error', 'Failed to add tool', 'error');
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans relative">
        {isAuthLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-white shadow-md rounded-full border border-blue-100 animate-pulse">
             <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-xs font-bold text-blue-600">Checking existing session...</p>
          </div>
        )}
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
                  onNavigateTab={(tab) => setActiveEmployeeTab(tab)}
                />
              )}

              {activeEmployeeTab === 'submit_timesheet' && (
                <SubmitTimesheet
                  currentUser={currentUser}
                  projects={projects}
                  projectAssignments={myProjectAssignments}
                  onSubmitTimesheet={handleTimesheetSubmit}
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

              {activePmTab === 'pm_team_utilization' && (
                <PMTeamUtilization
                  currentUser={currentUser}
                  projects={projects}
                  allUsers={users}
                  timesheets={timesheets}
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
                  onUpdateSettings={() => { showToast('Info', 'API pending', 'info'); }}
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
