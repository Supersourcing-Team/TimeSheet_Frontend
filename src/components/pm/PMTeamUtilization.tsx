import React, { useState } from 'react';
import { Project, User, TimesheetEntry } from '../../types';
import {
  TrendingUp,
  Users,
  Search,
  Filter,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  PieChart,
  Briefcase,
  ArrowUpRight,
} from 'lucide-react';

interface PMTeamUtilizationProps {
  currentUser: User;
  projects: Project[];
  allUsers: User[];
  timesheets: TimesheetEntry[];
}

export const PMTeamUtilization: React.FC<PMTeamUtilizationProps> = ({
  currentUser,
  projects = [],
  allUsers = [],
  timesheets = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [utilizationCategory, setUtilizationCategory] = useState<'all' | 'high' | 'optimal' | 'low'>('all');

  // PM's projects
  const pmProjects = (projects || []).filter(
    (p) =>
      (p.pmName && currentUser?.name && p.pmName.toLowerCase() === currentUser.name.toLowerCase()) ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'pm'
  );
  const pmProjectIds = pmProjects.map((p) => p.id);

  // Standard monthly baseline hours per employee (e.g., 160 hrs = 20 days * 8 hrs)
  const BASELINE_EXPECTED_HOURS = 160;

  // Compute team member metrics
  const teamMemberMetrics = (allUsers || []).map((user) => {
    // Filter timesheets for this user across PM's managed projects (or all projects if PM manages all)
    const userTimesheets = (timesheets || []).filter((t) => {
      const isUser = t.userId === user.id;
      const isPmProject = pmProjectIds.length === 0 || pmProjectIds.includes(t.projectId);
      const isSelectedProject = selectedProject === 'all' || t.projectId === selectedProject;
      return isUser && isPmProject && isSelectedProject;
    });

    const totalLogged = userTimesheets.reduce((sum, t) => sum + t.hours, 0);
    const billableHours = userTimesheets.reduce((sum, t) => sum + (t.billableHours || 0), 0);
    const nonBillableHours = userTimesheets.reduce((sum, t) => sum + (t.nonBillableHours || 0), 0);

    const utilizationPct = Math.min(100, Math.round((billableHours / BASELINE_EXPECTED_HOURS) * 100));

    // Find assigned PM projects
    const assignedPmProjects = pmProjects.filter((p) =>
      (p.assignedUserIds || []).includes(user.id)
    );

    let statusCategory: 'high' | 'optimal' | 'low' = 'optimal';
    if (utilizationPct > 85) statusCategory = 'high';
    else if (utilizationPct < 65) statusCategory = 'low';

    return {
      user,
      totalLogged,
      billableHours,
      nonBillableHours,
      utilizationPct,
      assignedPmProjects,
      statusCategory,
    };
  });

  // Filtered list
  const filteredMetrics = teamMemberMetrics.filter((m) => {
    const matchesSearch =
      m.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.user.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.user.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      utilizationCategory === 'all' || m.statusCategory === utilizationCategory;

    return matchesSearch && matchesCategory;
  });

  // Aggregate stats
  const totalBillable = teamMemberMetrics.reduce((sum, m) => sum + m.billableHours, 0);
  const totalLoggedAll = teamMemberMetrics.reduce((sum, m) => sum + m.totalLogged, 0);
  const avgUtilization = teamMemberMetrics.length > 0
    ? Math.round(teamMemberMetrics.reduce((sum, m) => sum + m.utilizationPct, 0) / teamMemberMetrics.length)
    : 0;

  const highCount = teamMemberMetrics.filter((m) => m.statusCategory === 'high').length;
  const optimalCount = teamMemberMetrics.filter((m) => m.statusCategory === 'optimal').length;
  const lowCount = teamMemberMetrics.filter((m) => m.statusCategory === 'low').length;

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 font-medium text-xs border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Productivity & Capacity Analytics</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Team Utilization & Billability</h1>
          <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
            Track resource utilization percentages, billable efficiency vs non-billable overhead, and team workload balances across managed projects.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-center">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">Avg Team Utilization</span>
            <span className="text-xl font-black text-emerald-300">{avgUtilization}%</span>
          </div>
        </div>
      </div>

      {/* KPI & Threshold Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
            Total Billable Hours
          </span>
          <div className="text-2xl font-black text-emerald-600">{totalBillable}h</div>
          <p className="text-[11px] text-slate-500 font-medium">Out of {totalLoggedAll}h logged</p>
        </div>

        <button
          onClick={() => setUtilizationCategory('high')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            utilizationCategory === 'high'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
            High Workload (&gt;85%)
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">{highCount} Members</div>
          <p className="text-[11px] text-amber-800 font-semibold mt-0.5">At risk of burnout</p>
        </button>

        <button
          onClick={() => setUtilizationCategory('optimal')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            utilizationCategory === 'optimal'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
            Optimal Range (65-85%)
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{optimalCount} Members</div>
          <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">Healthy billable balance</p>
        </button>

        <button
          onClick={() => setUtilizationCategory('low')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            utilizationCategory === 'low'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/20'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">
            Underutilized (&lt;65%)
          </span>
          <div className="text-2xl font-black text-blue-700 mt-1">{lowCount} Members</div>
          <p className="text-[11px] text-blue-800 font-semibold mt-0.5">Available for allocation</p>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Projects</option>
            {pmProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={utilizationCategory}
            onChange={(e) => setUtilizationCategory(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Utilization Ranges</option>
            <option value="high">High Workload (&gt;85%)</option>
            <option value="optimal">Optimal (65-85%)</option>
            <option value="low">Low (&lt;65%)</option>
          </select>
        </div>
      </div>

      {/* Utilization Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMetrics.map(({ user, totalLogged, billableHours, nonBillableHours, utilizationPct, assignedPmProjects, statusCategory }) => (
          <div
            key={user.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-sm truncate">{user.name}</h3>
                    <p className="text-xs text-blue-600 font-semibold truncate">{user.title}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                    statusCategory === 'high'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : statusCategory === 'optimal'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {utilizationPct}% Util
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>Utilization Target (160h Baseline):</span>
                  <span>{billableHours}h Billable</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      statusCategory === 'high'
                        ? 'bg-amber-500'
                        : statusCategory === 'optimal'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${utilizationPct}%` }}
                  />
                </div>
              </div>

              {/* Hours Breakdown */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                  <span className="font-extrabold text-slate-900">{totalLogged}h</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Billable</span>
                  <span className="font-extrabold text-emerald-700">{billableHours}h</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Non-Bill</span>
                  <span className="font-extrabold text-slate-700">{nonBillableHours}h</span>
                </div>
              </div>

              {/* Assigned Projects */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Assigned PM Projects ({assignedPmProjects.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {assignedPmProjects.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">No assigned projects</span>
                  ) : (
                    assignedPmProjects.map((p) => (
                      <span
                        key={p.id}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold text-[10px]"
                      >
                        {p.code}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Department: {user.department}</span>
              <span className="font-bold text-slate-800">
                {Math.round((billableHours / (totalLogged || 1)) * 100)}% Billable Efficiency
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
