import React, { useState } from 'react';
import { User, Project, TimesheetEntry, LeaveRequest, ActivityLog } from '../../types';
import { useGetDashboardSummaryQuery } from '../../store/api/dataApi';
import {
  Users,
  Clock,
  Calendar,
  FolderKanban,
  UserX,
  Plus,
  Download,
  MoreVertical,
  Filter,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Palmtree,
  Sparkles,
} from 'lucide-react';
import { AdminTab } from '../Sidebar';

interface AdminOverviewProps {
  users: User[];
  projects: Project[];
  timesheets: TimesheetEntry[];
  leaveRequests: LeaveRequest[];
  activities: ActivityLog[];
  onNavigateTab: (tab: AdminTab) => void;
  onApproveTimesheet: (id: string) => void;
  onApproveLeave: (id: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  users,
  projects,
  timesheets,
  leaveRequests,
  activities,
  onNavigateTab,
  onApproveTimesheet,
  onApproveLeave,
  onShowToast,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'on_leave' | 'inactive'>('all');
  const [selectedLeaveDetailModal, setSelectedLeaveDetailModal] = useState<LeaveRequest | null>(null);

  const safeUsers = users || [];
  const safeLeaveRequests = leaveRequests || [];
  const safeTimesheets = timesheets || [];
  const safeProjects = projects || [];

  const { data: dashboardData, isLoading } = useGetDashboardSummaryQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Map API data to component variables
  const activeUsersCount = users.filter((u) => u.status === 'active').length;
  const onLeaveUsersCount = users.filter((u) => u.status === 'on_leave').length || 0;
  
  const pendingLeaves = dashboardData?.recent_leaves?.filter((l: any) => l.status.toLowerCase() === 'pending') || [];
  const activeProjectsCount = dashboardData?.role_overview?.active_org_projects || 0;
  
  const nextHoliday = dashboardData?.upcoming_holiday;

  // Department distribution calculation for pie/doughnut chart
  const deptMap: { [key: string]: number } = {
    Engineering: 45,
    Design: 15,
    Marketing: 20,
    Admin: 10,
    HR: 10,
  };

  // User status filter for recent activity table
  const filteredUsers = safeUsers.filter((u) => {
    if (statusFilter === 'all') return true;
    return u.status === statusFilter;
  });

  const barChartData = [
    { day: 'Mon', active: 1100, inactive: 148 },
    { day: 'Tue', active: 1248, inactive: 0 },
    { day: 'Wed', active: 1240, inactive: 8 },
    { day: 'Thu', active: 1200, inactive: 48 },
    { day: 'Fri', active: 1210, inactive: 38 },
    { day: 'Sat', active: 450, inactive: 798 },
    { day: 'Sun', active: 380, inactive: 868 },
  ];

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Welcome back, here's what's happening today across Chronos Enterprise.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('user_management')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
          <button
            onClick={() => onShowToast('Export Started', 'Exporting Chronos dashboard summary report (CSV)...', 'info')}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Bento Grid - Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Active Users */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
              +2.5%
            </span>
          </div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Active Users
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{activeUsersCount || 0}</h3>
        </div>

        {/* Pending Leave */}
        <button
          type="button"
          onClick={() => onNavigateTab('admin_leave_approvals')}
          className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs hover:shadow-md hover:border-amber-300 transition-all text-left cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
          </div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Pending Leave
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {pendingLeaves.length}
          </h3>
        </button>

        {/* Next Holiday */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Next Holiday
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {nextHoliday ? `${nextHoliday.days_remaining} Days` : 'N/A'}
          </h3>
        </div>

        {/* Active Projects */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Active Projects
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{activeProjectsCount}</h3>
        </div>

        {/* On Leave Today */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            On Leave Today
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{onLeaveUsersCount}</h3>
        </div>
      </div>

      {/* Charts and Upcoming Holidays Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Charts Section (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Distribution Chart */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">User Distribution</h3>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Doughnut SVG Visualization */}
            <div className="relative h-48 flex items-center justify-center my-2">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                {/* Segment 1: Eng 45% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#004ac6"
                  strokeWidth="14"
                  strokeDasharray="107 131"
                  strokeDashoffset="0"
                />
                {/* Segment 2: Design 15% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#2563eb"
                  strokeWidth="14"
                  strokeDasharray="35 203"
                  strokeDashoffset="-107"
                />
                {/* Segment 3: Marketing 20% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#505f76"
                  strokeWidth="14"
                  strokeDasharray="48 190"
                  strokeDashoffset="-142"
                />
                {/* Segment 4: Admin 10% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#943700"
                  strokeWidth="14"
                  strokeDasharray="24 214"
                  strokeDashoffset="-190"
                />
                {/* Segment 5: HR 10% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#ba1a1a"
                  strokeWidth="14"
                  strokeDasharray="24 214"
                  strokeDashoffset="-214"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xs font-black text-slate-900">100%</span>
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Staff</span>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]" />
                <span>Engineering (45%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                <span>Design (15%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#505f76]" />
                <span>Marketing (20%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#943700]" />
                <span>Admin (10%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" />
                <span>HR (10%)</span>
              </div>
            </div>
          </div>

          {/* Active vs Inactive Chart */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Active vs Inactive</h3>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Stacked Bar Chart Visual */}
            <div className="h-48 flex items-end justify-between gap-2 px-2 pt-4">
              {barChartData.map((d) => {
                const total = d.active + d.inactive;
                const activeHeight = (d.active / total) * 100;
                const inactiveHeight = (d.inactive / total) * 100;

                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full max-w-[20px] bg-slate-100 rounded-lg flex flex-col overflow-hidden h-36">
                      <div
                        className="bg-slate-200 w-full transition-all"
                        style={{ height: `${inactiveHeight}%` }}
                        title={`Inactive: ${d.inactive}`}
                      />
                      <div
                        className="bg-blue-600 w-full transition-all"
                        style={{ height: `${activeHeight}%` }}
                        title={`Active: ${d.active}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{d.day}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
                <span>Inactive</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Card: Upcoming Holidays (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900">Upcoming Holidays</h3>
            <button
              onClick={() => onShowToast('Working Calendar', 'Navigating to corporate holiday schedule', 'info')}
              className="text-blue-600 hover:text-blue-700 text-xs font-bold"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {nextHoliday ? (
              <div
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                  <span className="text-[9px] font-extrabold text-blue-600 uppercase leading-none">
                    {new Date(nextHoliday.date).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-sm font-black text-slate-900 leading-tight mt-0.5">
                    {new Date(nextHoliday.date).getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{nextHoliday.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{nextHoliday.days_remaining} days away</p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-4">No upcoming holidays scheduled</div>
            )}
          </div>

          <div className="pt-2 text-[11px] text-slate-400 text-center font-medium">
            Holiday calendar is synchronized with HR policy.
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent User Activity & Pending Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent User Activity Table (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-slate-900">Recent User Activity</h3>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-2.5 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-extrabold">
                <tr>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.slice(0, 5).map((user, idx) => {
                  const empId = `EMP-${4052 - idx * 65}`;
                  const initials = (user?.name || 'User')
                    .split(' ')
                    .map((n) => n[0] || '')
                    .join('')
                    .toUpperCase() || 'U';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-slate-400">{empId}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/10"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-extrabold text-[10px] flex items-center justify-center">
                              {initials}
                            </div>
                          )}
                          <span className="font-bold text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{user.title}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : user.status === 'on_leave'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {user.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {user.joinDate || '12 Oct 2022'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onNavigateTab('user_management')}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Leave Card (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Pending Leave</h3>
            <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
              {pendingLeaves.length > 0 ? pendingLeaves.length : 12} Total
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-80">
            {dashboardData?.recent_leaves?.length > 0 ? (
              dashboardData.recent_leaves.map((req: any) => (
                <div key={req.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs ring-2 ring-amber-500/20">
                        LR
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate capitalize">
                          {req.status}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {req.type} - {req.days_count} Days
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                      {req.start_date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('admin_leave_approvals')}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Review Request
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 text-center py-6">No recent leave requests found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
