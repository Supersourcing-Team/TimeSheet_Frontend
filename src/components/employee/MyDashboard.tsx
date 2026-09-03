import React, { useState } from 'react';
import { User, TimesheetEntry, Project, LeaveBalance, LeaveRequest, HolidayItem } from '../../types';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  Layers,
  FolderKanban,
  FileText,
  Palmtree,
  Moon,
  X,
} from 'lucide-react';
import { UpcomingLeavesWidget } from '../shared/UpcomingLeavesWidget';
import { useGetUpcomingLeavesQuery } from '../../store/api/dataApi';
import { EmployeeTab } from '../Sidebar';

interface MyDashboardProps {
  currentUser: User;
  timesheets: TimesheetEntry[];
  projects: Project[];
  leaveBalance: LeaveBalance;
  leaveRequests: LeaveRequest[];
  holidays: HolidayItem[];
  onNavigateTab: (tab: EmployeeTab) => void;
}

export const MyDashboard: React.FC<MyDashboardProps> = React.memo(({
  currentUser,
  timesheets = [],
  projects = [],
  leaveBalance,
  leaveRequests = [],
  holidays = [],
  onNavigateTab,
}) => {
  const userTimesheets = React.useMemo(() => {
    return (timesheets || []).filter((t) => t.userId === currentUser.id);
  }, [timesheets, currentUser.id]);

  const {
    currentWeekTimesheets,
    totalLoggedHoursThisWeek,
    completionPercentage,
    billableThisWeek,
    targetWeeklyHours,
  } = React.useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const dayOfWeek = todayDate.getDay();
    const diffToMonday = todayDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const mondayThisWeek = new Date(todayDate.getFullYear(), todayDate.getMonth(), diffToMonday);
    const fridayThisWeek = new Date(mondayThisWeek.getFullYear(), mondayThisWeek.getMonth(), mondayThisWeek.getDate() + 4);

    const formatYMD = (d: Date) => {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    };

    const startOfWeek = formatYMD(mondayThisWeek);
    const endOfWeek = formatYMD(fridayThisWeek);

    const weekSheets = userTimesheets.filter((t) => t.date >= startOfWeek && t.date <= endOfWeek);
    const totalLogged = weekSheets.reduce(
      (acc, curr) => acc + ((curr as any).hours || (curr.billableHours + curr.nonBillableHours) || 0),
      0
    );
    const target = 40;
    const completion = Math.min(100, Math.round((totalLogged / target) * 100));
    const billable = weekSheets.reduce((acc, curr) => acc + curr.billableHours, 0);

    return {
      currentWeekTimesheets: weekSheets,
      totalLoggedHoursThisWeek: totalLogged,
      completionPercentage: completion,
      billableThisWeek: billable,
      targetWeeklyHours: target,
    };
  }, [userTimesheets]);

  const focusProject = React.useMemo(() => {
    const safeProjects = projects || [];
    return safeProjects.find((p) => p.assignedUserIds?.includes(currentUser.id)) || safeProjects[0];
  }, [projects, currentUser.id]);

  const { data: upcomingLeaves = [] } = useGetUpcomingLeavesQuery();
  const [showLeavesModal, setShowLeavesModal] = useState(false);

  const { nextHoliday, remainingDays } = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = (holidays || [])
      .filter(h => new Date(h.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const next = upcoming[0];
    let days = 0;
    if (next) {
      const holidayDate = new Date(next.date);
      days = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    }
    return { nextHoliday: next, remainingDays: days };
  }, [holidays]);

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Banner / Hero Greeting */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            You have logged <span className="font-extrabold text-white">{totalLoggedHoursThisWeek} hours</span> out of your {targetWeeklyHours}h weekly goal. All timesheet entries are synchronized.
          </p>
        </div>

        {/* Quick Actions Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('submit_timesheet')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-extrabold text-xs shadow-md transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Log Daily Hours</span>
          </button>
          <button
            onClick={() => onNavigateTab('leave_management')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition-all"
          >
            <Palmtree className="w-4 h-4 text-emerald-300" />
            <span>Apply Leave</span>
          </button>
          <button
            onClick={() => onNavigateTab('weekend_work')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition-all"
          >
            <Moon className="w-4 h-4 text-amber-300" />
            <span>Weekend Request</span>
          </button>
        </div>
      </div>

      {/* Grid KPI Cards & Weekly Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gauge Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="7"
                className="text-slate-100"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="7"
                strokeDasharray={200}
                strokeDashoffset={200 - (200 * completionPercentage) / 100}
                strokeLinecap="round"
                className="text-blue-600 transition-all duration-1000 ease-out"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-900">
              {completionPercentage}%
            </span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              This Week Target
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {totalLoggedHoursThisWeek} <span className="text-xs text-slate-400 font-normal">/ {targetWeeklyHours}h</span>
            </div>
            <div className="text-xs text-blue-700 mt-1 font-bold flex items-center gap-1">
              <span>{billableThisWeek}h Billable</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-normal">{(totalLoggedHoursThisWeek - billableThisWeek).toFixed(1)}h Non-billable</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Projects */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Assigned Projects
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900">
              {(projects || []).filter((p) => p.assignedUserIds?.includes(currentUser.id)).length} Active
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Primary: <span className="text-blue-600 font-bold">{focusProject?.name}</span>
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('my_projects')}
            className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
          >
            <span>View All Projects</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: My Leaves */}
        <div
          onClick={() => setShowLeavesModal(true)}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
              My Leaves
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Palmtree className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900">
              {upcomingLeaves.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Upcoming or ongoing leaves
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('leave_management');
            }}
            className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
          >
            <span>Request Leave</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: Upcoming Holiday */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Next Public Holiday
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-extrabold text-slate-900">{nextHoliday ? nextHoliday.name : 'No Upcoming Holidays'}</div>
            <p className="text-xs text-blue-600 mt-0.5 font-bold">
              {nextHoliday ? new Date(nextHoliday.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {nextHoliday ? `${nextHoliday.type} Holiday${nextHoliday.description ? ` • ${nextHoliday.description}` : ''}` : '-'}
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 font-semibold">
            {nextHoliday ? `${remainingDays} days remaining` : ''}
          </div>
        </div>
      </div>

      {/* Middle Section: Active Project Highlight & This Week Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column 2/3: This Week Timesheet Entries Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">This Week Timesheet Logs</h3>
              <p className="text-xs text-slate-500">Daily breakdown of logged tasks, billable vs non-billable notes</p>
            </div>
            <button
              onClick={() => onNavigateTab('timesheets_history')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1"
            >
              <span>Calendar History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Billable Work Description</th>
                  <th className="py-2.5 px-3 text-right">Logged Hours</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {userTimesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {ts.date}
                    </td>
                    <td className="py-3 px-3 font-bold text-blue-600 whitespace-nowrap">
                      {ts.projectName}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                        {ts.category || 'Development'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 max-w-xs truncate" title={ts.billableDescription || ts.description}>
                      {ts.billableDescription || ts.description}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      {ts.billableHours + ts.nonBillableHours}h <span className="text-[10px] text-emerald-600 font-bold">({ts.billableHours}h billable)</span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${ts.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ts.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                          }`}
                      >
                        {ts.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        <span className="capitalize">{ts.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column 1/3: Focus Project & Manager Info */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Primary Assignment
              </span>
              <span className="text-xs text-slate-500 font-bold">{focusProject?.code}</span>
            </div>

            <h4 className="text-base font-black text-slate-900">{focusProject?.name}</h4>
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {focusProject?.description}
            </p>

            <div className="pt-2 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500 font-semibold">
                <span>Client:</span>
                <span className="font-extrabold text-slate-900">{focusProject?.client}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 font-semibold">
                <span>Hours Logged:</span>
                <span className="font-bold text-blue-600">
                  {focusProject?.loggedHours || 0}h
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 font-bold">
                    PM: {focusProject?.pmName}
                  </span>
                </div>
                <button
                  onClick={() => onNavigateTab('my_projects')}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>

          {/* Quick Leave Request Status Widget */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Recent Leave Requests
              </h4>
              <button
                onClick={() => onNavigateTab('leave_management')}
                className="text-[11px] text-emerald-700 hover:underline font-bold"
              >
                Apply New
              </button>
            </div>

            <div className="space-y-2">
              {leaveRequests.slice(0, 2).map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900">{req.type}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {req.startDate} to {req.endDate} ({req.daysCount} days)
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${req.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : req.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                      }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* My Leaves Modal */}
      {showLeavesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div
            className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900">My Leaves Details</h2>
              <button
                onClick={() => setShowLeavesModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <UpcomingLeavesWidget 
                title="My Upcoming Leaves" 
                subtitle="Your approved and pending leaves" 
                emptyTitle="No upcoming leaves" 
                emptySubtitle="You don't have any upcoming leaves scheduled."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
MyDashboard.displayName = 'MyDashboard';

