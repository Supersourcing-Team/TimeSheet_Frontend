import React, { useState } from 'react';
import { Project, User, TimesheetEntry, WeekendWorkRequest } from '../../types';
import {
  Briefcase,
  Clock,
  Users,
  CheckSquare,
  Moon,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { UpcomingLeavesWidget } from '../shared/UpcomingLeavesWidget';
import { useGetUpcomingLeavesQuery } from '../../store/api/dataApi';

interface PMDashboardProps {
  currentUser: User;
  projects: Project[];
  allUsers: User[];
  timesheets: TimesheetEntry[];
  weekendRequests: WeekendWorkRequest[];
  onNavigateTab: (tab: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PMDashboard: React.FC<PMDashboardProps> = React.memo(({
  currentUser,
  projects = [],
  allUsers = [],
  timesheets = [],
  weekendRequests = [],
  onNavigateTab,
  onShowToast,
}) => {
  const { data: upcomingLeaves = [] } = useGetUpcomingLeavesQuery();
  const [showLeavesModal, setShowLeavesModal] = useState(false);

  const {
    pmProjects,
    pmProjectIds,
    totalTeamMembersCount,
    pendingWeekendRequests,
    pmTimesheets,
    totalLoggedHours,
    totalBillableHours,
    todayLoggedHours,
    thisWeekBillableHours,
    avgUtilization,
    recentTimesheets,
  } = React.useMemo(() => {
    const safeProjects = projects || [];
    const safeTimesheets = timesheets || [];
    const safeWeekendRequests = weekendRequests || [];
    const safeAllUsers = allUsers || [];

    // PM's projects
    const pProjects = safeProjects.filter(
      (p) =>
        (p.pmName && currentUser?.name && p.pmName.toLowerCase() === currentUser.name.toLowerCase()) ||
        currentUser?.role === 'admin' ||
        currentUser?.role === 'pm'
    );

    const pProjectIds = pProjects.map((p) => p.id);

    // All team members assigned to PM's projects
    const assignedTeamUserIds = Array.from(new Set(pProjects.flatMap((p) => p.assignedUserIds || [])));
    const teamCount = assignedTeamUserIds.filter(id => {
      const user = safeAllUsers.find(u => u.id === id);
      return user?.role === 'employee';
    }).length;

    // Pending Weekend Work Requests for PM's projects
    const pendingRequests = safeWeekendRequests.filter(
      (w) => w.status === 'pending' && (pProjectIds.length === 0 || pProjectIds.includes(w.projectId))
    );

    // Timesheets for PM's projects
    const pTimesheets = safeTimesheets.filter(
      (t) => pProjectIds.length === 0 || pProjectIds.includes(t.projectId)
    );

    // Calculations for stats
    const totLogged = pProjects.reduce((sum, p) => sum + p.loggedHours, 0);
    const totBillable = pProjects.reduce((sum, p) => sum + p.billableHours, 0);

    // Today's date YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySheets = pTimesheets.filter((t) => t.date === todayStr);
    const todayLogged = todaySheets.reduce((sum, t) => sum + ((t.billableHours || 0) + (t.nonBillableHours || 0)), 0);

    // This Week's billable hours
    const weekBillable = pTimesheets.reduce((sum, t) => sum + (t.billableHours || 0), 0);

    // Average Team Utilization
    const totalLoggedForUtil = pTimesheets.reduce((sum, t) => sum + ((t.billableHours || 0) + (t.nonBillableHours || 0)), 0);
    const totalBillableForUtil = pTimesheets.reduce((sum, t) => sum + (t.billableHours || 0), 0);
    const utilization = totalLoggedForUtil > 0
      ? Math.min(100, Math.round((totalBillableForUtil / totalLoggedForUtil) * 100))
      : 0;

    // Recent 5 timesheet submissions
    const recent = [...pTimesheets].reverse().slice(0, 5);

    return {
      pmProjects: pProjects,
      pmProjectIds: pProjectIds,
      totalTeamMembersCount: teamCount,
      pendingWeekendRequests: pendingRequests,
      pmTimesheets: pTimesheets,
      totalLoggedHours: totLogged,
      totalBillableHours: totBillable,
      todayLoggedHours: todayLogged,
      thisWeekBillableHours: weekBillable,
      avgUtilization: utilization,
      recentTimesheets: recent,
    };
  }, [projects, timesheets, weekendRequests, allUsers, currentUser]);

  return (
    <div className="space-y-6 text-slate-900 font-sans pb-8">
      {/* Header Banner */}
      <div className="p-5 bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-sky-600" />
            <span>Project Manager Portal</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Welcome back, <span className="font-bold text-slate-800">{currentUser.name}</span>. Track active sprint delivery, review employee timesheet logs, manage team allocations, and approve weekend overtime requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('pm_resource_allocation')}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-600" />
            <span>Resource Allocation</span>
          </button>
          <button
            onClick={() => onNavigateTab('pm_timesheet_review')}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Review Timesheets</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Projects */}
        <div
          onClick={() => onNavigateTab('pm_my_projects')}
          className="p-5 bg-white border border-slate-200 space-y-2 hover:border-sky-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Projects
            </span>
            <Briefcase className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pmProjects.length}</div>
          <p className="text-[11px] text-slate-500 truncate">Managed projects</p>
        </div>

        {/* Total Team Members */}
        <div
          onClick={() => onNavigateTab('pm_resource_allocation')}
          className="p-5 bg-white border border-slate-200 space-y-2 hover:border-sky-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Team Members
            </span>
            <Users className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalTeamMembersCount}</div>
          <p className="text-[11px] text-slate-500 truncate">Assigned resources</p>
        </div>

        {/* Pending Weekend Requests */}
        <div
          onClick={() => onNavigateTab('pm_weekend_work')}
          className="p-5 bg-white border border-slate-200 space-y-2 hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Weekend Overtime
            </span>
            <Moon className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{pendingWeekendRequests.length}</div>
          <p className="text-[11px] text-amber-700 font-semibold truncate">Pending approvals</p>
        </div>

        {/* This Week's Billable Hours */}
        <div
          onClick={() => onNavigateTab('pm_timesheet_review')}
          className="p-5 bg-white border border-slate-200 space-y-2 hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Week Billable
            </span>
            <Clock className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{thisWeekBillableHours}h</div>
          <p className="text-[11px] text-emerald-700 truncate">Billable logged</p>
        </div>

        {/* Team Leaves */}
        <div
          onClick={() => setShowLeavesModal(true)}
          className="p-5 bg-white border border-slate-200 space-y-2 hover:border-sky-400 transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Team Leaves
            </span>
            <Calendar className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{upcomingLeaves?.length || 0}</div>
          <p className="text-[11px] text-slate-500 truncate">Upcoming or ongoing leaves</p>
        </div>
      </div>

      {/* Main Grid: Projects Overview & Recent Timesheet Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Project Progress Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white border border-slate-200 space-y-5 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>Managed Projects &amp; Resource Status</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track sprint progress, allocated tools, and billable hour utilization per project.
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('pm_my_projects')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All Projects</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pmProjects.map((proj) => {
                const assignedCount = (proj.assignedUserIds || []).length;
                const toolsCount = (proj.tools || []).length;

                return (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl bg-white/80 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] space-y-3.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-blue-200/60 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold font-mono text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
                        {proj.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
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
                      <h3 className="font-extrabold text-slate-900 text-sm">{proj.name}</h3>
                      <p className="text-slate-500 text-[11px] font-medium">{proj.client}</p>
                    </div>

                    {/* Hours */}
                    <div className="flex justify-between items-center text-[11px] font-medium pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Logged Hours:</span>
                      <span className="font-bold text-blue-600">
                        {proj.loggedHours} hrs
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">{assignedCount} Members</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">{toolsCount} Tools</span>
                        </span>
                      </div>

                      <span className="text-emerald-700 font-extrabold">
                        {proj.billableHours}h Billable
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Recent Timesheet Submissions (Review-Only) */}
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 space-y-5 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-sky-600" />
                  <span>Recent Submitted Timesheets</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Review-only access. Timesheets are tracked for billable &amp; non-billable auditing.
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('pm_timesheet_review')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 shrink-0 cursor-pointer"
              >
                <span>View Log</span>
              </button>
            </div>

            {recentTimesheets.length === 0 ? (
              <p className="text-center text-slate-400 py-6 font-medium">No recent timesheets submitted.</p>
            ) : (
              <div className="space-y-3">
                {recentTimesheets.map((ts) => (
                  <div
                    key={ts.id}
                    className="p-4 bg-slate-50/50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={ts.userAvatar}
                          alt={ts.userName}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-500/20"
                        />
                        <span className="font-bold text-slate-900">{ts.userName}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        {ts.projectName}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 line-clamp-2 font-medium">
                      {ts.billableDescription || ts.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
                      <span>{ts.date}</span>
                      <span className="font-bold text-slate-900">
                        {((ts.billableHours || 0) + (ts.nonBillableHours || 0))}h ({ts.billableHours || 0}h Billable)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Leaves Modal */}
      {showLeavesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div
            className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900">Team Leaves Details</h2>
              <button
                onClick={() => setShowLeavesModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <UpcomingLeavesWidget />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
PMDashboard.displayName = 'PMDashboard';

