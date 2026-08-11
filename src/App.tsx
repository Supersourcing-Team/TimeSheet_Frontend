import React, { useState, useEffect } from 'react';
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
  WorkingCalendarConfig,
  SystemSettingsConfig,
} from './types';
import {
  CURRENT_USER,
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TIMESHEETS,
  INITIAL_LEAVE_BALANCE,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_WEEKEND_WORK,
  INITIAL_ACTIVITIES,
  INITIAL_HOLIDAYS,
  INITIAL_LEAVE_TYPES,
  INITIAL_WORKING_CALENDAR,
  INITIAL_SETTINGS,
} from './data/initialData';
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

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (parsed === null || parsed === undefined) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

import { fetchCurrentUserApi, logoutApi } from './utils/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return loadStorage<User | null>('chronos_current_user', null);
  });

  const [portalMode, setPortalMode] = useState<ActivePortalMode>(() => {
    if (currentUser) return currentUser.role as ActivePortalMode;
    return 'employee';
  });


  // Automatically check & restore backend user session if access token exists
  useEffect(() => {
    const token = localStorage.getItem('chronos_access_token');
    if (token) {
      fetchCurrentUserApi(token)
        .then((user) => {
          setCurrentUser(user);
          setPortalMode(user.role as ActivePortalMode);
        })
        .catch(() => {
          // If token invalid/expired, clear token
          localStorage.removeItem('chronos_access_token');
          localStorage.removeItem('chronos_refresh_token');
        });
    }
  }, []);

  const [activeEmployeeTab, setActiveEmployeeTab] = useState<EmployeeTab>('my_dashboard');
  const [activePmTab, setActivePmTab] = useState<PMTab>('pm_dashboard');
  const [activeAcTab, setActiveAcTab] = useState<ACManagerTab>('ac_dashboard');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('admin_overview');

  // Persistent States
  const [users, setUsers] = useState<User[]>(() => {
    return loadStorage('chronos_users', INITIAL_USERS);
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    return loadStorage('chronos_projects', INITIAL_PROJECTS);
  });

  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(() => {
    return loadStorage('chronos_timesheets', INITIAL_TIMESHEETS);
  });

  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>(() => {
    return loadStorage('chronos_leave_balance', INITIAL_LEAVE_BALANCE);
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    return loadStorage('chronos_leave_requests', INITIAL_LEAVE_REQUESTS);
  });

  const [weekendRequests, setWeekendRequests] = useState<WeekendWorkRequest[]>(() => {
    return loadStorage('chronos_weekend_requests', INITIAL_WEEKEND_WORK);
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    return loadStorage('chronos_activities', INITIAL_ACTIVITIES);
  });

  const [holidays, setHolidays] = useState(() => {
    return loadStorage('chronos_holidays', INITIAL_HOLIDAYS);
  });

  const [leaveTypes, setLeaveTypes] = useState(() => {
    return loadStorage('chronos_leave_types', INITIAL_LEAVE_TYPES);
  });

  const [workingCalendar, setWorkingCalendar] = useState(() => {
    return loadStorage('chronos_working_calendar', INITIAL_WORKING_CALENDAR);
  });

  const [settings, setSettings] = useState(() => {
    return loadStorage('chronos_settings', INITIAL_SETTINGS);
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // LocalStorage Persistence Sync
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('chronos_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('chronos_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('chronos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('chronos_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('chronos_timesheets', JSON.stringify(timesheets));
  }, [timesheets]);

  useEffect(() => {
    localStorage.setItem('chronos_leave_balance', JSON.stringify(leaveBalance));
  }, [leaveBalance]);

  useEffect(() => {
    localStorage.setItem('chronos_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('chronos_weekend_requests', JSON.stringify(weekendRequests));
  }, [weekendRequests]);

  useEffect(() => {
    localStorage.setItem('chronos_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('chronos_holidays', JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem('chronos_leave_types', JSON.stringify(leaveTypes));
  }, [leaveTypes]);

  useEffect(() => {
    localStorage.setItem('chronos_working_calendar', JSON.stringify(workingCalendar));
  }, [workingCalendar]);

  useEffect(() => {
    localStorage.setItem('chronos_settings', JSON.stringify(settings));
  }, [settings]);

  // Toast Helper
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

  // Login handler
  const handleSelectUserRole = (user: User) => {
    setCurrentUser(user);
    setPortalMode(user.role as ActivePortalMode);
    showToast(`Logged in as ${user.name}`, `Role: ${user.role.replace('_', ' ').toUpperCase()}`, 'success');
  };

  const handleLogout = () => {
    const token = localStorage.getItem('chronos_access_token');
    if (token) {
      logoutApi(token);
    }
    localStorage.removeItem('chronos_access_token');
    localStorage.removeItem('chronos_refresh_token');
    localStorage.removeItem('chronos_current_user');
    setCurrentUser(null);
  };


  // Handlers for Employee Actions
  const handleTimesheetSubmit = (entries: Omit<TimesheetEntry, 'id'>[]) => {
    if (!currentUser) return;
    const newEntriesWithIds: TimesheetEntry[] = entries.map((e, index) => ({
      ...e,
      id: `ts-${Date.now()}-${index}`,
    }));

    setTimesheets((prev) => [...newEntriesWithIds, ...prev]);

    const totalHours = entries.reduce((s, e) => s + e.hours, 0);
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        action: 'Submitted timesheet log',
        target: `${totalHours} hrs on ${entries[0]?.date}`,
        timestamp: 'Just now',
        type: 'timesheet',
      },
      ...prev,
    ]);
  };

  const handleDeleteTimesheet = (id: string) => {
    setTimesheets((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTimesheet = (updatedEntry: TimesheetEntry) => {
    setTimesheets((prev) =>
      prev.map((t) => (t.id === updatedEntry.id ? updatedEntry : t))
    );
  };

  const handleApplyLeave = (req: Omit<LeaveRequest, 'id'>) => {
    if (!currentUser) return;
    const newReq: LeaveRequest = {
      ...req,
      id: `lv-${Date.now()}`,
    };
    setLeaveRequests((prev) => [newReq, ...prev]);

    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        action: 'Applied for leave',
        target: `${req.type} (${req.daysCount} days)`,
        timestamp: 'Just now',
        type: 'leave',
      },
      ...prev,
    ]);
  };

  const handleCancelLeave = (id: string) => {
    setLeaveRequests((prev) => prev.filter((l) => l.id !== id));
  };

  const handleRequestWeekendWork = (req: Omit<WeekendWorkRequest, 'id'>) => {
    const newReq: WeekendWorkRequest = {
      ...req,
      id: `ww-${Date.now()}`,
    };
    setWeekendRequests((prev) => [newReq, ...prev]);
  };

  // Handlers for Admin/PM/AC Actions
  const handleApproveTimesheet = (id: string) => {
    setTimesheets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'approved' } : t))
    );
  };

  const handleRejectTimesheet = (id: string, reason: string) => {
    setTimesheets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: 'rejected', rejectionReason: reason } : t
      )
    );
  };

  const handleBulkApproveTimesheets = (ids: string[]) => {
    setTimesheets((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, status: 'approved' } : t))
    );
  };

  const handleApproveLeave = (id: string, comment?: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: 'approved',
              reviewedBy: currentUser?.name || 'Admin',
              reviewComment: comment || 'Approved by Admin',
            }
          : l
      )
    );
    const targetReq = leaveRequests.find((r) => r.id === id);
    if (targetReq && currentUser) {
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          action: 'Approved leave request',
          target: `${targetReq.userName} (${targetReq.type})`,
          timestamp: 'Just now',
          type: 'leave',
        },
        ...prev,
      ]);
    }
  };

  const handleRejectLeave = (id: string, comment?: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: 'rejected',
              reviewedBy: currentUser?.name || 'Admin',
              reviewComment: comment || 'Rejected by Admin',
            }
          : l
      )
    );
    const targetReq = leaveRequests.find((r) => r.id === id);
    if (targetReq && currentUser) {
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          action: 'Rejected leave request',
          target: `${targetReq.userName} (${targetReq.type})`,
          timestamp: 'Just now',
          type: 'leave',
        },
        ...prev,
      ]);
    }
  };

  const handleUpdateProjectBudget = (projectId: string, newBudget: number, newRate: number) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, budget: newBudget, hourlyRate: newRate } : p
      )
    );
  };

  const handleToggleUserProject = (userId: string, projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const currentIds = p.assignedUserIds || [];
          const exists = currentIds.includes(userId);
          const updatedIds = exists
            ? currentIds.filter((id) => id !== userId)
            : [...currentIds, userId];
          return { ...p, assignedUserIds: updatedIds };
        }
        return p;
      })
    );
  };

  const handleAddToolToProject = (projectId: string, tool: Omit<ProjectTool, 'id'>) => {
    const newTool: ProjectTool = {
      ...tool,
      id: `t-${Date.now()}`,
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, tools: [...(p.tools || []), newTool] } : p
      )
    );
  };

  const handleAddProject = (newProj: Omit<Project, 'id'>) => {
    const project: Project = {
      ...newProj,
      id: `proj-${Date.now()}`,
    };
    setProjects((prev) => [project, ...prev]);
  };

  const handleUpdateProject = (updatedProj: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
  };

  const handleAssignUserToProject = (projectId: string, userId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const currentIds = p.assignedUserIds || [];
          if (!currentIds.includes(userId)) {
            return { ...p, assignedUserIds: [...currentIds, userId] };
          }
        }
        return p;
      })
    );
  };

  const handleRemoveUserFromProject = (projectId: string, userId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const currentIds = p.assignedUserIds || [];
          return {
            ...p,
            assignedUserIds: currentIds.filter((id) => id !== userId),
          };
        }
        return p;
      })
    );
  };

  const handleRemoveToolFromProject = (projectId: string, toolId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const currentTools = p.tools || [];
          return {
            ...p,
            tools: currentTools.filter((t) => t.id !== toolId),
          };
        }
        return p;
      })
    );
  };

  const handleApproveWeekendWork = (id: string) => {
    if (!currentUser) return;
    setWeekendRequests((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: 'approved', reviewedBy: currentUser.name } : w
      )
    );
  };

  const handleRejectWeekendWork = (id: string, comment?: string) => {
    if (!currentUser) return;
    setWeekendRequests((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: 'rejected', reviewedBy: currentUser.name } : w
      )
    );
  };

  const handleAddUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
    };
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'active' ? 'inactive' : u.status === 'inactive' ? 'resigned' : 'active';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleResetUserPassword = (userId: string) => {
    showToast('Password Reset', 'Password reset instructions dispatched to user email.', 'success');
  };

  const handleAddHoliday = (item: Omit<HolidayItem, 'id'>) => {
    const newHoliday: HolidayItem = {
      ...item,
      id: `hol-${Date.now()}`,
    };
    setHolidays((prev) => [...prev, newHoliday]);
  };

  const handleEditHoliday = (updatedItem: HolidayItem) => {
    setHolidays((prev) => prev.map((h) => (h.id === updatedItem.id ? updatedItem : h)));
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  const handleAddLeaveType = (item: Omit<LeaveTypeConfig, 'id'>) => {
    const newType: LeaveTypeConfig = {
      ...item,
      id: `lt-${Date.now()}`,
    };
    setLeaveTypes((prev) => [...prev, newType]);
  };

  const handleEditLeaveType = (updatedItem: LeaveTypeConfig) => {
    setLeaveTypes((prev) => prev.map((l) => (l.id === updatedItem.id ? updatedItem : l)));
  };

  const handleToggleLeaveTypeStatus = (id: string) => {
    setLeaveTypes((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l))
    );
  };

  // Counts for pending items
  const pendingTimesheetsCount = (timesheets || []).filter((t) => t.status === 'pending').length;
  const pendingLeavesCount = (leaveRequests || []).filter((l) => l.status === 'pending').length;
  const pendingWeekendCount = (weekendRequests || []).filter((w) => w.status === 'pending').length;

  // Render Login Page if no active user session
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <LoginPage users={users} onLogin={handleSelectUserRole} onSelectUserRole={handleSelectUserRole} />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        portalMode={portalMode}
        onTogglePortalMode={(mode) => setPortalMode(mode)}
        pendingApprovalsCount={pendingTimesheetsCount + pendingLeavesCount}
        onLogout={handleLogout}
      />

      <div className="flex flex-1">
        {/* Left Navigation Sidebar */}
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
            if (portalMode === 'employee') {
              setActiveEmployeeTab('submit_timesheet');
            } else {
              showToast('Timesheet Action', 'Opening timesheet submission portal...', 'info');
            }
          }}
        />

        {/* Main Content Area */}
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
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'admin_leave_approvals' && currentUser && (
                <AdminLeaveApprovals
                  currentUser={currentUser}
                  leaveRequests={leaveRequests}
                  users={users}
                  onApproveLeave={handleApproveLeave}
                  onRejectLeave={handleRejectLeave}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'admin_holidays' && (
                <HolidaysManagement
                  holidays={holidays}
                  onAddHoliday={handleAddHoliday}
                  onEditHoliday={handleEditHoliday}
                  onDeleteHoliday={handleDeleteHoliday}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'admin_leave_types' && (
                <LeaveTypesManagement
                  leaveTypes={leaveTypes}
                  onAddLeaveType={handleAddLeaveType}
                  onEditLeaveType={handleEditLeaveType}
                  onToggleLeaveTypeStatus={handleToggleLeaveTypeStatus}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'admin_working_calendar' && (
                <WorkingCalendar
                  config={workingCalendar}
                  onUpdateConfig={(newConfig) => setWorkingCalendar(newConfig)}
                  onShowToast={showToast}
                />
              )}

              {activeAdminTab === 'admin_settings' && (
                <SettingsManagement
                  settings={settings}
                  onUpdateSettings={(newSettings) => setSettings(newSettings)}
                  onShowToast={showToast}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating Notification Toasts */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
