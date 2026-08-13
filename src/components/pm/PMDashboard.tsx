import React from 'react';
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
} from 'lucide-react';

interface PMDashboardProps {
  currentUser: User;
  projects: Project[];
  allUsers: User[];
  timesheets: TimesheetEntry[];
  weekendRequests: WeekendWorkRequest[];
  onNavigateTab: (tab: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PMDashboard: React.FC<PMDashboardProps> = ({
  currentUser,
  projects = [],
  allUsers = [],
  timesheets = [],
  weekendRequests = [],
  onNavigateTab,
  onShowToast,
}) => {
  const safeProjects = projects || [];
  const safeTimesheets = timesheets || [];
  const safeWeekendRequests = weekendRequests || [];
  const safeAllUsers = allUsers || [];

  // PM's projects
  const pmProjects = safeProjects.filter(
    (p) =>
      (p.pmName && currentUser?.name && p.pmName.toLowerCase() === currentUser.name.toLowerCase()) ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'pm'
  );

  const pmProjectIds = pmProjects.map((p) => p.id);

  // All team members assigned to PM's projects
  const assignedTeamUserIds = Array.from(new Set(pmProjects.flatMap((p) => p.assignedUserIds || [])));
  const totalTeamMembersCount = assignedTeamUserIds.length;

  // Pending Weekend Work Requests for PM's projects
  const pendingWeekendRequests = safeWeekendRequests.filter(
    (w) => w.status === 'pending' && (pmProjectIds.length === 0 || pmProjectIds.includes(w.projectId))
  );

  // Timesheets for PM's projects
  const pmTimesheets = safeTimesheets.filter(
    (t) => pmProjectIds.length === 0 || pmProjectIds.includes(t.projectId)
  );

  // Calculations for stats
  const totalLoggedHours = pmProjects.reduce((sum, p) => sum + p.loggedHours, 0);
  const totalBillableHours = pmProjects.reduce((sum, p) => sum + p.billableHours, 0);

  // Today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTimesheets = pmTimesheets.filter((t) => t.date === todayStr);
  const todayLoggedHours = todayTimesheets.reduce((sum, t) => sum + t.hours, 0);

  // This Week's billable hours
  const thisWeekBillableHours = pmTimesheets.reduce((sum, t) => sum + (t.billableHours || 0), 0);

  // Average Team Utilization
  const totalLoggedForUtilization = pmTimesheets.reduce((sum, t) => sum + t.hours, 0);
  const totalBillableForUtilization = pmTimesheets.reduce((sum, t) => sum + (t.billableHours || 0), 0);
  const avgUtilization = totalLoggedForUtilization > 0
    ? Math.min(100, Math.round((totalBillableForUtilization / totalLoggedForUtilization) * 100))
    : 85;

  // Recent 5 timesheet submissions
  const recentTimesheets = [...pmTimesheets].reverse().slice(0, 5);

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 font-medium text-xs border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Project Execution & Resource Management Hub</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Project Manager Portal</h1>
          <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
            Welcome back, <span className="font-bold text-white">{currentUser.name}</span>. Track active sprint delivery, review employee timesheet logs, manage team allocations, and approve weekend overtime requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('pm_resource_allocation')}
            className="px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-blue-700" />
            <span>Resource Allocation</span>
          </button>
          <button
            onClick={() => onNavigateTab('pm_timesheet_review')}
            className="px-4 py-2 rounded-xl bg-blue-700/80 hover:bg-blue-700 text-white font-bold text-xs border border-blue-500/40 transition-all flex items-center gap-1.5"
          >
            <CheckSquare className="w-4 h-4 text-blue-200" />
            <span>Review Timesheets</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - 6 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Active Projects */}
        <div
          onClick={() => onNavigateTab('pm_my_projects')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5 hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Active Projects
            </span>
            <Briefcase className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900">{pmProjects.length}</div>
          <p className="text-[11px] text-slate-500 font-medium truncate">Managed projects</p>
        </div>

        {/* Total Team Members */}
        <div
          onClick={() => onNavigateTab('pm_resource_allocation')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5 hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Team Members
            </span>
            <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-indigo-900">{totalTeamMembersCount}</div>
          <p className="text-[11px] text-slate-500 font-medium truncate">Assigned resources</p>
        </div>

        {/* Pending Weekend Requests */}
        <div
          onClick={() => onNavigateTab('pm_weekend_work')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5 hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
              Weekend Overtime
            </span>
            <Moon className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingWeekendRequests.length}</div>
          <p className="text-[11px] text-amber-700 font-semibold truncate">Pending approvals</p>
        </div>

        {/* This Week's Billable Hours */}
        <div
          onClick={() => onNavigateTab('pm_timesheet_review')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5 hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
              Week Billable
            </span>
            <Clock className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{thisWeekBillableHours}h</div>
          <p className="text-[11px] text-emerald-700 font-medium truncate">Billable logged</p>
        </div>

        {/* Today's Logged Hours */}
        <div
          onClick={() => onNavigateTab('pm_timesheet_review')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5 hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Today's Hours
            </span>
            <Calendar className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900">{todayLoggedHours}h</div>
          <p className="text-[11px] text-slate-500 font-medium truncate">Submitted today</p>
        </div>

        {/* Average Team Utilization */}
        <div
          onClick={() => onNavigateTab('pm_team_utilization')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5 hover:border-purple-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700">
              Avg Utilization
            </span>
            <TrendingUp className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-purple-900">{avgUtilization}%</div>
          <p className="text-[11px] text-purple-700 font-medium truncate">Billable ratio</p>
        </div>
      </div>

      {/* Main Grid: Projects Overview & Recent Timesheet Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Project Progress Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Managed Projects & Resource Status</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Track sprint progress, allocated tools, and billable hour utilization per project.
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('pm_my_projects')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All Projects</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pmProjects.map((proj) => {
                const progressPct = proj.allocatedHours > 0
                  ? Math.min(100, Math.round((proj.loggedHours / proj.allocatedHours) * 100))
                  : 0;

                const assignedCount = (proj.assignedUserIds || []).length;
                const toolsCount = (proj.tools || []).length;

                return (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 hover:border-blue-300 transition-all"
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

                    {/* Hours Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-slate-500">Logged vs Allocated Hours:</span>
                        <span className="font-bold text-slate-800">
                          {proj.loggedHours} / {proj.allocatedHours}h ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            progressPct > 90
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                      <div className="flex items-center gap-3">
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
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Recent Submitted Timesheets</span>
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Review-only access. Timesheets are tracked for billable & non-billable auditing.
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('pm_timesheet_review')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0"
              >
                View Log
              </button>
            </div>

            {recentTimesheets.length === 0 ? (
              <p className="text-center text-slate-400 py-6 font-medium">No recent timesheets submitted.</p>
            ) : (
              <div className="space-y-3">
                {recentTimesheets.map((ts) => (
                  <div
                    key={ts.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
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
                        {ts.hours}h ({ts.billableHours}h Billable)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
