import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FolderKanban,
  Flame,
  Layers,
  LayoutDashboard,
  Moon,
  Palmtree,
  Plus,
  Sparkles,
  UsersRound,
  X,
  ArrowUpRight,
  MoreHorizontal,
  BriefcaseBusiness,
  CircleUserRound,
} from 'lucide-react';

import {
  User,
  TimesheetEntry,
  Project,
  LeaveBalance,
  LeaveRequest,
  HolidayItem,
} from '../../types';

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
  onOpenMarkLeave?: () => void;
}

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const formatHours = (value: number) =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);

const getInitials = (name?: string) =>
  (name || 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const projectAccent = [
  {
    icon: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25',
    bar: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600',
    soft: 'bg-gradient-to-br from-blue-50/70 to-indigo-50/40',
    codeBg: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    border: 'hover:border-indigo-300 hover:shadow-[0_12px_32px_rgba(99,102,241,0.15)]',
  },
  {
    icon: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/25',
    bar: 'bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500',
    soft: 'bg-gradient-to-br from-purple-50/70 to-pink-50/40',
    codeBg: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    border: 'hover:border-purple-300 hover:shadow-[0_12px_32px_rgba(168,85,247,0.15)]',
  },
  {
    icon: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25',
    bar: 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500',
    soft: 'bg-gradient-to-br from-amber-50/70 to-orange-50/40',
    codeBg: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    border: 'hover:border-amber-300 hover:shadow-[0_12px_32px_rgba(245,158,11,0.15)]',
  },
  {
    icon: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25',
    bar: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
    soft: 'bg-gradient-to-br from-emerald-50/70 to-teal-50/40',
    codeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    border: 'hover:border-emerald-300 hover:shadow-[0_12px_32px_rgba(16,185,129,0.15)]',
  },
];

export const MyDashboard: React.FC<MyDashboardProps> = React.memo(({
  currentUser,
  timesheets = [],
  projects = [],
  leaveBalance,
  leaveRequests = [],
  holidays = [],
  onNavigateTab,
  onOpenMarkLeave,
}) => {
  const [showLeavesModal, setShowLeavesModal] = useState(false);

  const userTimesheets = useMemo(
    () => (timesheets || []).filter((t) => t.userId === currentUser.id),
    [timesheets, currentUser.id],
  );

  const {
    currentWeekTimesheets,
    totalLoggedHoursThisWeek,
    completionPercentage,
    billableThisWeek,
    nonBillableThisWeek,
    targetWeeklyHours,
    dailyHours,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const diffToMonday =
      today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

    const monday = new Date(
      today.getFullYear(),
      today.getMonth(),
      diffToMonday,
    );

    const friday = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + 4,
    );

    const formatYMD = (date: Date) => {
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${mm}-${dd}`;
    };

    const startOfWeek = formatYMD(monday);
    const endOfWeek = formatYMD(friday);

    const weekSheets = userTimesheets.filter(
      (entry) => entry.date >= startOfWeek && entry.date <= endOfWeek,
    );

    const totalLogged = weekSheets.reduce(
      (acc, entry) =>
        acc +
        ((entry as any).hours ||
          entry.billableHours +
            entry.nonBillableHours ||
          0),
      0,
    );

    const target = 40;
    const completion = Math.min(
      100,
      Math.round((totalLogged / target) * 100),
    );

    const billable = weekSheets.reduce(
      (acc, entry) => acc + entry.billableHours,
      0,
    );

    const nonBillable = Math.max(0, totalLogged - billable);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const hoursByDay = weekDays.map((day, index) => {
      const date = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + index,
      );

      const key = formatYMD(date);

      return {
        day,
        date: key,
        hours: weekSheets
          .filter((entry) => entry.date === key)
          .reduce(
            (sum, entry) =>
              sum +
              ((entry as any).hours ||
                entry.billableHours +
                  entry.nonBillableHours ||
                0),
            0,
          ),
      };
    });

    return {
      currentWeekTimesheets: weekSheets,
      totalLoggedHoursThisWeek: totalLogged,
      completionPercentage: completion,
      billableThisWeek: billable,
      nonBillableThisWeek: nonBillable,
      targetWeeklyHours: target,
      dailyHours: hoursByDay,
    };
  }, [userTimesheets]);

  const assignedProjects = useMemo(
    () =>
      (projects || []).filter((project) =>
        project.assignedUserIds?.includes(currentUser.id),
      ),
    [projects, currentUser.id],
  );

  const focusProject = useMemo(
    () => assignedProjects[0] || projects?.[0],
    [assignedProjects, projects],
  );

  const { data: upcomingLeaves = [] } = useGetUpcomingLeavesQuery();

  const { nextHoliday, remainingDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = (holidays || [])
      .filter((holiday) => new Date(holiday.date) >= today)
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime(),
      );

    const next = upcoming[0];

    if (!next) {
      return {
        nextHoliday: undefined,
        remainingDays: 0,
      };
    }

    const holidayDate = new Date(next.date);

    return {
      nextHoliday: next,
      remainingDays: Math.max(
        0,
        Math.ceil(
          (holidayDate.getTime() - today.getTime()) /
            (1000 * 3600 * 24),
        ),
      ),
    };
  }, [holidays]);

  const maxDailyHours = Math.max(
    8,
    ...dailyHours.map((item) => item.hours),
  );

  const visibleProjects = assignedProjects.slice(0, 4);

  const quickAction = (
    label: string,
    subtitle: string,
    icon: React.ReactNode,
    iconBg: string,
    cardBg: string,
    onClick: () => void,
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex min-h-[88px] flex-1 items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.99] cursor-pointer',
        cardBg,
      )}
    >
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
          iconBg,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <span className="block truncate text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
          {label}
        </span>
        <span className="block truncate text-[10px] font-semibold text-slate-500">
          {subtitle}
        </span>
      </div>
    </button>
  );

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/25 to-slate-100/70 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      {/* Ambient gradient glow backdrop */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/15 to-violet-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-500/15 to-pink-500/15 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-10 left-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-cyan-400/10 to-teal-400/10 blur-[110px]" />

      <div className="relative z-10 mx-auto max-w-[1600px] space-y-6">

        {/* Hero Banner */}
     <section className="relative overflow-hidden rounded-[26px] border border-white/70 bg-gradient-to-r from-[#bfdbfe] via-[#c4b5fd] via-[#ddd6fe] to-[#fbcfe8] p-6 text-slate-900 shadow-[0_16px_45px_rgba(99,102,241,0.14)] sm:p-8">
  {/* Soft ambient glow */}
  <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-pink-300/20 blur-3xl" />

  <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
    <div>
      <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-3 py-1 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5 text-violet-600" />
        <span>Good day &bull; Employee Portal</span>
      </div>

      <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
        Welcome back, {currentUser.name}!
      </h1>

      <p className="mt-1.5 max-w-2xl text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
        Here&apos;s what&apos;s happening with your work and timesheets today.
        Keep going, you&apos;re right on track!
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => onNavigateTab('submit_timesheet')}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-indigo-700 shadow-lg shadow-indigo-500/10 cursor-pointer"
      >
        <Plus className="h-4 w-4 text-indigo-600 stroke-[3]" />
        Submit Timesheet
      </button>

      <button
        type="button"
        onClick={() => onNavigateTab('weekend_work')}
        className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/40 px-5 py-2.5 text-xs font-black text-slate-700 shadow-sm backdrop-blur-md cursor-pointer"
      >
        <Moon className="h-4 w-4 text-violet-600" />
        Weekend Request
      </button>
    </div>
  </div>
</section>

        {/* 5-Card KPI row */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {/* Active Projects */}
          <div className="group rounded-[22px] border border-sky-200/70 bg-gradient-to-br from-white via-sky-50/50 to-blue-50/70 p-4.5 shadow-[0_8px_25px_rgba(14,165,233,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_14px_35px_rgba(14,165,233,0.18)]">
            <div className="flex items-start justify-between">
              <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-2.5 text-white shadow-md shadow-sky-500/25">
                <FolderKanban className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-sky-200/60 bg-gradient-to-r from-sky-500/15 to-blue-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700">
                Active
              </span>
            </div>
            <p className="mt-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Projects
            </p>
            <div className="mt-0.5 flex items-end gap-2">
              <span className="text-2xl font-black text-slate-950">
                {assignedProjects.length}
              </span>
              <span className="mb-0.5 text-[11px] font-bold text-sky-600">
                assigned
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Projects assigned to you
            </p>
          </div>

          {/* Team Members */}
          <div className="group rounded-[22px] border border-violet-200/70 bg-gradient-to-br from-white via-violet-50/50 to-purple-50/70 p-4.5 shadow-[0_8px_25px_rgba(139,92,246,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_14px_35px_rgba(139,92,246,0.18)]">
            <div className="flex items-start justify-between">
              <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 text-white shadow-md shadow-violet-500/25">
                <UsersRound className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-violet-200/60 bg-gradient-to-r from-violet-500/15 to-purple-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700">
                Collaborators
              </span>
            </div>
            <p className="mt-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Team Members
            </p>
            <div className="mt-0.5 text-2xl font-black text-slate-950">
              {assignedProjects.reduce(
                (total, project) =>
                  total + (project.assignedUserIds?.length || 0),
                0,
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Across your projects
            </p>
          </div>

          {/* This Week Hours */}
          <div className="group rounded-[22px] border border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/70 p-4.5 shadow-[0_8px_25px_rgba(16,185,129,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_14px_35px_rgba(16,185,129,0.18)]">
            <div className="flex items-start justify-between">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 text-white shadow-md shadow-emerald-500/25">
                <Clock3 className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-emerald-200/60 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                {completionPercentage}%
              </span>
            </div>
            <p className="mt-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              This Week Hours
            </p>
            <div className="mt-0.5 text-xl font-black text-slate-950">
              {formatHours(totalLoggedHoursThisWeek)}
              <span className="text-xs font-semibold text-slate-400">
                {' '}/ {targetWeeklyHours}h
              </span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 transition-all duration-700 shadow-xs shadow-emerald-500/20"
                style={{
                  width: `${Math.min(completionPercentage, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Weekend OT */}
          <div className="group rounded-[22px] border border-amber-200/70 bg-gradient-to-br from-white via-amber-50/50 to-orange-50/70 p-4.5 shadow-[0_8px_25px_rgba(245,158,11,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_14px_35px_rgba(245,158,11,0.18)]">
            <div className="flex items-start justify-between">
              <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 text-white shadow-md shadow-amber-500/25">
                <Flame className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-amber-200/60 bg-gradient-to-r from-amber-500/15 to-orange-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700">
                Status
              </span>
            </div>
            <p className="mt-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Weekend OT
            </p>
            <div className="mt-0.5 text-2xl font-black text-slate-950">
              0h
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Pending requests
            </p>
          </div>

          {/* Team Leaves */}
          <div className="group rounded-[22px] border border-rose-200/70 bg-gradient-to-br from-white via-rose-50/50 to-pink-50/70 p-4.5 shadow-[0_8px_25px_rgba(244,63,94,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-[0_14px_35px_rgba(244,63,94,0.18)]">
            <div className="flex items-start justify-between">
              <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-2.5 text-white shadow-md shadow-rose-500/25">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-rose-200/60 bg-gradient-to-r from-rose-500/15 to-pink-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-700">
                Scheduled
              </span>
            </div>
            <p className="mt-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Team Leaves
            </p>
            <div className="mt-0.5 text-2xl font-black text-slate-950">
              {upcomingLeaves.length}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Upcoming / active
            </p>
          </div>
        </section>

        {/* Main workspace */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2.05fr)_minmax(330px,0.95fr)]">

          {/* Projects */}
          <div className="rounded-[24px] border border-slate-200/90 bg-white/95 p-5 shadow-[0_10px_35px_rgba(30,50,90,0.055)] backdrop-blur-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2 text-white shadow-md shadow-indigo-500/25">
                    <BriefcaseBusiness className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-black text-slate-950">
                    Managed Projects &amp; Resource Status
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Track sprint progress, allocated tools, and billable utilization.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('my_projects')}
                className="hidden items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 sm:flex cursor-pointer transition-colors"
              >
                View All Projects
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleProjects.map((project, index) => {
                const accent =
                  projectAccent[index % projectAccent.length];

                const projectHours =
                  project.loggedHours || 0;

                const projectTarget = 40;
                const progress = Math.min(
                  100,
                  Math.round(
                    (projectHours / projectTarget) * 100,
                  ),
                );

                return (
                  <div
                    key={project.id}
                    className={cn(
                      'group relative overflow-hidden rounded-[20px] border border-slate-200/90 bg-white p-4.5 transition-all duration-300 hover:-translate-y-1',
                      accent.border,
                    )}
                  >
                    <div
                      className={cn(
                        'absolute inset-x-0 top-0 h-1.5',
                        accent.bar,
                      )}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105',
                            accent.icon,
                          )}
                        >
                          {index % 2 === 0 ? (
                            <Layers className="h-5 w-5" />
                          ) : (
                            <Sparkles className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="mb-0.5 flex items-center gap-2">
                            <span
                              className={cn(
                                'rounded-md px-2 py-0.5 text-[9px] font-black',
                                accent.codeBg,
                              )}
                            >
                              {project.code}
                            </span>
                          </div>
                          <h3 className="truncate text-sm font-black text-slate-950">
                            {project.name}
                          </h3>
                          <p className="truncate text-[10px] text-slate-500">
                            {project.description ||
                              'Project delivery and resource management'}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full border border-emerald-200/60 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 px-2.5 py-1 text-[9px] font-extrabold text-emerald-700">
                        Active
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span>Logged Hours</span>
                        <span className="font-bold text-slate-700">
                          {formatHours(projectHours)} / 40h
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700 shadow-xs',
                            accent.bar,
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <UsersRound className="h-3.5 w-3.5 text-slate-400" />
                          {project.assignedUserIds?.length || 0} Members
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          0 Tools
                        </span>
                      </div>

                      <span className="font-black text-emerald-600">
                        {formatHours(
                          projectHours,
                        )}h Billable
                      </span>
                    </div>
                  </div>
                );
              })}

              {visibleProjects.length === 0 && (
                <div className="col-span-full flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-500">
                  No assigned projects available.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('my_projects')}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-indigo-50/80 py-2.5 text-xs font-black text-indigo-600 transition hover:bg-indigo-100 sm:hidden cursor-pointer"
            >
              View All Projects
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Weekly progress */}
          <div className="rounded-[24px] border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/35 p-5 shadow-[0_10px_35px_rgba(30,50,90,0.055)] backdrop-blur-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2 text-white shadow-md shadow-emerald-500/25">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-black text-slate-950">
                    This Week Progress
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Your weekly time distribution and billable share.
                </p>
              </div>

              <span className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-xs backdrop-blur-sm">
                This Week
              </span>
            </div>

            <div className="mt-5 flex items-center gap-5">
              <div className="relative h-28 w-28 shrink-0">
                <svg
                  viewBox="0 0 120 120"
                  className="h-full w-full -rotate-90"
                >
                  <defs>
                    <linearGradient id="totalCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="billableCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="url(#totalCircleGrad)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="289"
                    strokeDashoffset={
                      289 -
                      (289 *
                        Math.min(
                          completionPercentage,
                          100,
                        )) /
                        100
                    }
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="url(#billableCircleGrad)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="289"
                    strokeDashoffset={
                      289 -
                      (289 *
                        Math.min(
                          (billableThisWeek /
                            Math.max(
                              totalLoggedHoursThisWeek,
                              1,
                            )) *
                            completionPercentage,
                          100,
                        )) /
                        100
                    }
                    className="opacity-95"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-950">
                    {completionPercentage}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">
                    GOAL
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-2xl font-black text-slate-950">
                  {formatHours(totalLoggedHoursThisWeek)}h
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  of {targetWeeklyHours}h weekly goal
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between gap-5 text-[11px]">
                    <span className="flex items-center gap-2 font-bold text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-xs" />
                      Billable
                    </span>
                    <span className="font-black text-slate-900">
                      {formatHours(billableThisWeek)}h
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-5 text-[11px]">
                    <span className="flex items-center gap-2 font-bold text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-xs" />
                      Non-billable
                    </span>
                    <span className="font-black text-slate-900">
                      {formatHours(nonBillableThisWeek)}h
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex h-28 items-end justify-between gap-2">
                {dailyHours.map((item) => {
                  const totalHeight = Math.max(
                    6,
                    Math.round(
                      (item.hours / maxDailyHours) * 92,
                    ),
                  );

                  const billableHeight =
                    item.hours > 0
                      ? Math.max(
                          4,
                          Math.round(
                            totalHeight *
                              Math.min(
                                1,
                                billableThisWeek /
                                  Math.max(
                                    totalLoggedHoursThisWeek,
                                    1,
                                  ),
                              ),
                          ),
                        )
                      : 0;

                  return (
                    <div
                      key={item.day}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <div className="flex h-24 w-full max-w-[28px] items-end justify-center overflow-hidden rounded-t-lg bg-slate-100/70">
                        <div
                          className="relative w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-cyan-400 shadow-xs"
                          style={{ height: `${totalHeight}px` }}
                        >
                          <div
                            className="absolute bottom-0 left-0 w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-400"
                            style={{
                              height: `${Math.min(
                                billableHeight,
                                totalHeight,
                              )}px`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-5 shadow-[0_8px_30px_rgba(30,50,90,0.045)] backdrop-blur-sm sm:p-6">
          <div className="mb-3.5 flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-2 text-white shadow-md shadow-orange-500/25">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-950">
                Quick Actions
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickAction(
              'Submit Timesheet',
              'Log hours for today',
              <Clock3 className="h-6 w-6 stroke-[2.2]" />,
              'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30',
              'border-blue-200/70 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 hover:border-blue-400 hover:shadow-blue-500/15',
              () => onNavigateTab('submit_timesheet'),
            )}

            {quickAction(
              'Request Leave',
              'Apply for planned leaves',
              <Calendar className="h-6 w-6 stroke-[2.2]" />,
              'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/30',
              'border-rose-200/70 bg-gradient-to-br from-rose-50/70 via-white to-pink-50/50 hover:border-rose-400 hover:shadow-rose-500/15',
              () => {
                if (onOpenMarkLeave) {
                  onOpenMarkLeave();
                } else {
                  onNavigateTab('submit_timesheet');
                }
              },
            )}

            {quickAction(
              'View My Logs',
              'Review history & audit',
              <FileText className="h-6 w-6 stroke-[2.2]" />,
              'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30',
              'border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 hover:border-emerald-400 hover:shadow-emerald-500/15',
              () => onNavigateTab('timesheets_history'),
            )}

            {quickAction(
              'My Projects',
              'Active team & tasks',
              <UsersRound className="h-6 w-6 stroke-[2.2]" />,
              'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-purple-500/30',
              'border-violet-200/70 bg-gradient-to-br from-violet-50/70 via-white to-purple-50/50 hover:border-violet-400 hover:shadow-violet-500/15',
              () => onNavigateTab('my_projects'),
            )}
          </div>
        </section>

        {/* Bottom content */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]">

          {/* Recent timesheets */}
          <div className="rounded-[24px] border border-slate-200/90 bg-white/95 p-5 shadow-[0_10px_35px_rgba(30,50,90,0.055)] backdrop-blur-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2 text-white shadow-md shadow-indigo-500/25">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-black text-slate-950">
                    Recent Submitted Timesheets
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Your latest timesheet activity and logged hours.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('timesheets_history')}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 cursor-pointer transition-colors"
              >
                View Log
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="hidden grid-cols-[1.5fr_1fr_1fr_110px_28px] gap-3 bg-gradient-to-r from-slate-100/90 via-indigo-50/40 to-slate-100/90 px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-slate-500 sm:grid">
                <span>Employee / Task</span>
                <span>Date</span>
                <span>Project</span>
                <span>Hours</span>
                <span />
              </div>

              <div className="divide-y divide-slate-100">
                {currentWeekTimesheets
                  .slice(0, 5)
                  .map((ts) => (
                    <div
                      key={ts.id}
                      className="grid grid-cols-1 gap-2 px-4 py-3.5 transition hover:bg-indigo-50/30 sm:grid-cols-[1.5fr_1fr_1fr_110px_28px] sm:items-center sm:gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-[10px] font-black text-white shadow-md shadow-indigo-500/25">
                          {getInitials(currentUser.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-extrabold text-slate-900">
                            {currentUser.name}
                          </p>
                          <p
                            className="truncate text-[10px] text-slate-500"
                            title={
                              ts.billableDescription ||
                              ts.description
                            }
                          >
                            {ts.billableDescription ||
                              ts.description ||
                              'Timesheet entry'}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold text-slate-500">
                        {ts.date}
                      </span>

                      <span className="w-fit rounded-full border border-indigo-200/60 bg-gradient-to-r from-indigo-50 to-violet-50 px-2.5 py-1 text-[9px] font-extrabold text-indigo-700">
                        {ts.projectName}
                      </span>

                      <div className="text-xs font-black text-slate-900">
                        {formatHours(
                          ts.billableHours +
                            ts.nonBillableHours,
                        )}
                        h
                        <span className="ml-1 rounded-md border border-emerald-200/50 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                          {formatHours(
                            ts.billableHours,
                          )}
                          h billable
                        </span>
                      </div>

                      <button
                        type="button"
                        className="hidden rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 sm:block cursor-pointer"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                {currentWeekTimesheets.length === 0 && (
                  <div className="px-5 py-12 text-center text-sm text-slate-500">
                    No timesheet entries for this week yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Holiday + leave */}
          <div className="space-y-5">
            <div className="rounded-[24px] border border-slate-200/90 bg-white/95 p-5 shadow-[0_10px_35px_rgba(30,50,90,0.055)] backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-2 text-white shadow-md shadow-orange-500/25">
                      <Palmtree className="h-4 w-4" />
                    </div>
                    <h2 className="text-base font-black text-slate-950">
                      Upcoming Holidays &amp; Leaves
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLeavesModal(true)}
                  className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 cursor-pointer transition-colors"
                >
                  View All
                </button>
              </div>

              <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/10 p-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25">
                    <Palmtree className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Next Holiday
                    </p>
                    <p className="truncate text-xs font-black text-slate-900">
                      {nextHoliday?.name ||
                        'No Upcoming Holidays'}
                    </p>
                    <p className="mt-0.5 text-[9px] font-semibold text-slate-500">
                      {nextHoliday
                        ? new Date(
                            nextHoliday.date,
                          ).toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            },
                          )
                        : '-'}
                    </p>
                  </div>

                  {nextHoliday && (
                    <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 px-3 py-1.5 text-center text-white shadow-sm shadow-orange-500/25">
                      <p className="text-lg font-black leading-tight">
                        {remainingDays}
                      </p>
                      <p className="text-[8px] font-bold uppercase tracking-wider text-amber-100">
                        Days left
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3.5 space-y-2">
                {upcomingLeaves.slice(0, 2).map((leave: any, index: number) => (
                  <div
                    key={leave.id || index}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-gradient-to-r from-white to-slate-50/70 p-3 transition-colors hover:border-indigo-100"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-[9px] font-black text-white shadow-sm">
                      {getInitials(
                        leave.userName ||
                          leave.name ||
                          'User',
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-black text-slate-900">
                        {leave.userName ||
                          leave.name ||
                          'Team Member'}
                      </p>
                      <p className="truncate text-[9px] text-slate-500">
                        {leave.type ||
                          leave.leaveType ||
                          'Leave'}{' '}
                        •{' '}
                        {leave.startDate ||
                          leave.date ||
                          ''}
                      </p>
                    </div>

                    <span className="rounded-full border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-teal-50 px-2.5 py-1 text-[8px] font-black text-emerald-700">
                      {leave.status || 'Approved'}
                    </span>
                  </div>
                ))}

                {upcomingLeaves.length === 0 && (
                  <p className="py-3 text-center text-[10px] text-slate-400">
                    No upcoming leaves.
                  </p>
                )}
              </div>
            </div>

            {/* Primary assignment */}
            <div className="rounded-[24px] border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/50 p-5 shadow-[0_10px_35px_rgba(99,102,241,0.08)] backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-xs shadow-indigo-500/25">
                  Primary Assignment
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {focusProject?.code || '-'}
                </span>
              </div>

              <div className="mt-3.5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/30">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-slate-950">
                    {focusProject?.name ||
                      'No primary project'}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                    {focusProject?.description ||
                      'Your primary project assignment will appear here.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-indigo-100/80 bg-white/80 p-3.5 shadow-xs">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Client
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-black text-slate-800">
                    {focusProject?.client || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Hours Logged
                  </p>
                  <p className="mt-0.5 text-[11px] font-black text-indigo-600">
                    {formatHours(
                      focusProject?.loggedHours || 0,
                    )}
                    h
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <CircleUserRound className="h-3.5 w-3.5 text-indigo-500" />
                  PM: {focusProject?.pmName || '-'}
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab('my_projects')}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-600 hover:text-indigo-700 cursor-pointer transition-colors"
                >
                  View Details
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Leave modal */}
        {showLeavesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    My Leaves Details
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Your approved and pending leaves.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLeavesModal(false)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto p-6">
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
    </div>
  );
});

MyDashboard.displayName = 'MyDashboard';

export default MyDashboard;
