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
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useCreateTimesheetsMutation,
  useUpdateTimesheetStatusMutation,
  useCreateLeaveRequestMutation,
  useUpdateLeaveStatusMutation,
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

import { AdminOverview } from './components/admin/AdminOverview';
import { UserManagement } from './components/admin/UserManagement';
import { AdminLeaveApprovals } from './components/admin/AdminLeaveApprovals';
import { HolidaysManagement } from './components/admin/HolidaysManagement';
import { LeaveTypesManagement } from './components/admin/LeaveTypesManagement';
import { WorkingCalendar } from './components/admin/WorkingCalendar';
import { SettingsManagement } from './components/admin/SettingsManagement';

// Initial mocks for things not yet in backend API endpoints
import { INITIAL_LEAVE_BALANCE, INITIAL_ACTIVITIES, INITIAL_LEAVE_TYPES, INITIAL_WORKING_CALENDAR, INITIAL_SETTINGS } from './data/initialData';

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
  const { data: timesheets = [] } = useGetTimesheetsQuery(undefined, { skip });
  
  // Admins need all leave requests; others just need theirs
  const { data: allLeaveRequests = [] } = useGetLeaveRequestsQuery(undefined, { skip: skip || !isAdmin });
  const { data: myLeaveRequests = [] } = useGetMyLeaveRequestsQuery(undefined, { skip: skip || isAdmin });
  const leaveRequests = isAdmin ? allLeaveRequests : myLeaveRequests;

  const { data: weekendRequests = [] } = useGetWeekendRequestsQuery(undefined, { skip });
  const { data: holidays = [] } = useGetHolidaysQuery(undefined, { skip });

  // Fallbacks for data not yet wired up
  const [leaveBalance] = useState<LeaveBalance>(INITIAL_LEAVE_BALANCE);
  const [activities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);
  const [leaveTypes] = useState(INITIAL_LEAVE_TYPES);
  const [workingCalendar] = useState(INITIAL_WORKING_CALENDAR);
  const [settings] = useState(INITIAL_SETTINGS);

  // RTK Mutations
  const [createTimesheets] = useCreateTimesheetsMutation();
  const [updateTimesheetStatus] = useUpdateTimesheetStatusMutation();
  const [createLeaveRequest] = useCreateLeaveRequestMutation();
  const [updateLeaveStatus] = useUpdateLeaveStatusMutation();
  const [createHoliday] = useCreateHolidayMutation();
  const [updateHoliday] = useUpdateHolidayMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();
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
      await createTimesheets(entries).unwrap();
      showToast('Success', 'Timesheets submitted', 'success');
    } catch (e: any) {
      showToast('Error', e?.data?.message || 'Failed to submit timesheets', 'error');
    }
  };

  const handleDeleteTimesheet = (id: string) => {
    showToast('Info', 'Delete not yet integrated with API', 'info');
  };

  const handleUpdateTimesheet = (updatedEntry: TimesheetEntry) => {
    showToast('Info', 'Update not yet integrated with API', 'info');
  };

  const handleApproveTimesheet = async (id: string) => {
    try {
      await updateTimesheetStatus({ id, status: 'approved' }).unwrap();
      showToast('Success', 'Timesheet approved', 'success');
    } catch (e) {
      showToast('Error', 'Failed to approve', 'error');
    }
  };

  const handleRejectTimesheet = async (id: string, reason: string) => {
    try {
      await updateTimesheetStatus({ id, status: 'rejected', reason }).unwrap();
      showToast('Success', 'Timesheet rejected', 'success');
    } catch (e) {
      showToast('Error', 'Failed to reject', 'error');
    }
  };

  // --- Leave Handlers ---
  const handleApplyLeave = async (req: Omit<LeaveRequest, 'id'>) => {
    try {
      await createLeaveRequest(req).unwrap();
      showToast('Success', 'Leave applied', 'success');
    } catch (e) {
      showToast('Error', 'Failed to apply leave', 'error');
    }
  };

  const handleCancelLeave = (id: string) => {
    showToast('Info', 'Cancel leave not yet integrated', 'info');
  };

  const handleApproveLeave = async (id: string, comment?: string) => {
    try {
      await updateLeaveStatus({ id, status: 'approved', comment }).unwrap();
      showToast('Success', 'Leave approved', 'success');
    } catch (e) {
      showToast('Error', 'Failed to approve leave', 'error');
    }
  };

  const handleRejectLeave = async (id: string, comment?: string) => {
    try {
      await updateLeaveStatus({ id, status: 'rejected', comment }).unwrap();
      showToast('Success', 'Leave rejected', 'success');
    } catch (e) {
      showToast('Error', 'Failed to reject leave', 'error');
    }
  };

  // --- Weekend Work ---
  const handleRequestWeekendWork = (req: Omit<WeekendWorkRequest, 'id'>) => {
    showToast('Info', 'Weekend work API pending', 'info');
  };

  const handleApproveWeekendWork = (id: string) => {
    showToast('Info', 'Weekend work API pending', 'info');
  };

  const handleRejectWeekendWork = (id: string, comment?: string) => {
    showToast('Info', 'Weekend work API pending', 'info');
  };

  // --- Projects / PM / AC ---
  const handleUpdateProjectBudget = (projectId: string, newBudget: number, newRate: number) => {
    showToast('Info', 'Project budget update pending', 'info');
  };

  const handleAddProject = (newProj: Omit<Project, 'id'>) => {
    showToast('Info', 'Add project pending', 'info');
  };

  const handleUpdateProject = (updatedProj: Project) => {
    showToast('Info', 'Update project pending', 'info');
  };

  const handleAssignUserToProject = (projectId: string, userId: string) => {
    showToast('Info', 'Assign user pending', 'info');
  };

  const handleRemoveUserFromProject = (projectId: string, userId: string) => {
    showToast('Info', 'Remove user pending', 'info');
  };

  const handleAddToolToProject = (projectId: string, tool: Omit<ProjectTool, 'id'>) => {
    showToast('Info', 'Add tool pending', 'info');
  };

  const handleRemoveToolFromProject = (projectId: string, toolId: string) => {
    showToast('Info', 'Remove tool pending', 'info');
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
      showToast('Success', 'Holiday Deleted', 'success');
    } catch (e: any) {
      showToast('Error', e.message || 'Failed to delete holiday', 'error');
    }
  };

  const handleAddLeaveType = (item: Omit<LeaveTypeConfig, 'id'>) => {
    showToast('Info', 'API pending', 'info');
  };

  const handleEditLeaveType = (updatedItem: LeaveTypeConfig) => {
    showToast('Info', 'API pending', 'info');
  };

  const handleToggleLeaveTypeStatus = (id: string) => {
    showToast('Info', 'API pending', 'info');
  };


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
                  onApproveTimesheet={handleApproveTimesheet}
                  onRejectTimesheet={handleRejectTimesheet}
                  onNavigateTab={(tab) => setActivePmTab(tab as PMTab)}
                  onShowToast={showToast}
                />
              )}

              {activePmTab === 'pm_my_projects' && (
                <PMMyProjects
                  currentUser={currentUser}
                  projects={projects}
                  allUsers={users}
                  timesheets={timesheets}
                  onAddProject={handleAddProject}
                  onUpdateProject={handleUpdateProject}
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
            <>
              {activeAdminTab === 'admin_overview' && (
                <AdminOverview
                  users={users}
                  projects={projects}
                  timesheets={timesheets}
                  leaveRequests={leaveRequests}
                  activities={activities}
                  onNavigateTab={(tab) => setActiveAdminTab(tab)}
                  onApproveTimesheet={handleApproveTimesheet}
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
                  leaveRequests={leaveRequests}
                  onApproveLeave={handleApproveLeave}
                  onRejectLeave={handleRejectLeave}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'holidays' && (
                <HolidaysManagement
                  holidays={holidays}
                  onAddHoliday={handleAddHoliday}
                  onEditHoliday={handleEditHoliday}
                  onDeleteHoliday={handleDeleteHoliday}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'leave_types' && (
                <LeaveTypesManagement
                  leaveTypes={leaveTypes}
                  onAddLeaveType={handleAddLeaveType}
                  onEditLeaveType={handleEditLeaveType}
                  onToggleStatus={handleToggleLeaveTypeStatus}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'working_calendar' && (
                <WorkingCalendar
                  calendar={workingCalendar}
                  onUpdateCalendar={() => { showToast('Info', 'API pending', 'info'); }}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'settings' && (
                <SettingsManagement
                  settings={settings}
                  onUpdateSettings={() => { showToast('Info', 'API pending', 'info'); }}
                  onShowToast={showToast}
                />
              )}
            </>
          )}
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
