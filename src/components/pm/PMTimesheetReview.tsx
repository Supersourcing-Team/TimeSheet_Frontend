import React, { useState } from 'react';
import { Project, User, TimesheetEntry } from '../../types';
import {
  CheckSquare,
  Search,
  Filter,
  Users,
  Briefcase,
  Calendar,
  Clock,
  Eye,
  FileText,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface PMTimesheetReviewProps {
  currentUser: User;
  projects: Project[];
  allUsers: User[];
  timesheets: TimesheetEntry[];
}

export const PMTimesheetReview: React.FC<PMTimesheetReviewProps> = ({
  currentUser,
  projects = [],
  allUsers = [],
  timesheets = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [viewingDesc, setViewingDesc] = useState<{ billable: string; nonBillable: string } | null>(null);

  // PM's project IDs
  const pmProjects = (projects || []).filter(
    (p) =>
      (p.pmName && currentUser?.name && p.pmName.toLowerCase() === currentUser.name.toLowerCase()) ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'pm'
  );
  const pmProjectIds = pmProjects.map((p) => p.id);

  // Filter timesheets for PM's managed projects
  const pmTimesheets = (timesheets || []).filter(
    (t) => pmProjectIds.length === 0 || pmProjectIds.includes(t.projectId)
  );

  // Apply filters
  const filteredTimesheets = pmTimesheets.filter((t) => {
    const matchesSearch =
      t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.billableDescription && t.billableDescription.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProject = selectedProject === 'all' || t.projectId === selectedProject;
    const matchesUser = selectedUser === 'all' || t.userId === selectedUser;
    const matchesDate = !dateFilter || t.date === dateFilter;

    return matchesSearch && matchesProject && matchesUser && matchesDate;
  });

  // Calculate summary metrics
  const totalLoggedHours = filteredTimesheets.reduce((sum, t) => sum + t.hours, 0);
  const totalBillableHours = filteredTimesheets.reduce((sum, t) => sum + (t.billableHours || 0), 0);
  const totalNonBillableHours = filteredTimesheets.reduce((sum, t) => sum + (t.nonBillableHours || 0), 0);
  const billableRatio = totalLoggedHours > 0 ? Math.round((totalBillableHours / totalLoggedHours) * 100) : 0;

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-300" /> Team Timesheets
          </h1>
          <p className="text-sm text-blue-100/90 max-w-2xl leading-relaxed">
            Review your team's submitted timesheets and work summaries across all assigned projects.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 text-xs">
          <Info className="w-4 h-4 text-blue-300" />
          <span className="font-bold text-white">Review Only</span>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
            Total Entries Shown
          </span>
          <div className="text-2xl font-black text-slate-900">{filteredTimesheets.length}</div>
          <p className="text-[11px] text-slate-500 font-medium">Logged timesheet records</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
            Total Hours Logged
          </span>
          <div className="text-2xl font-black text-blue-700">{totalLoggedHours}h</div>
          <p className="text-[11px] text-slate-500 font-medium">Across selected projects</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-black text-emerald-700 tracking-wider">
            Billable Hours
          </span>
          <div className="text-2xl font-black text-emerald-600">{totalBillableHours}h</div>
          <p className="text-[11px] text-emerald-800 font-semibold">{billableRatio}% billable ratio</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
            Non-Billable Hours
          </span>
          <div className="text-2xl font-black text-slate-700">{totalNonBillableHours}h</div>
          <p className="text-[11px] text-slate-500 font-medium">Meetings, training, standby</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee or task description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {pmProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Employees</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>



          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {dateFilter && (
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <span>Filtering date: <strong>{dateFilter}</strong></span>
            <button
              onClick={() => setDateFilter('')}
              className="text-slate-500 hover:text-slate-800 underline text-[11px]"
            >
              Clear date
            </button>
          </div>
        )}
      </div>

      {/* Timesheets Review Table (READ ONLY) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Timesheet Log</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {filteredTimesheets.length} Records
          </span>
        </div>

        {filteredTimesheets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No timesheets match current filters.</p>
            <p className="text-xs text-slate-400">Try adjusting your project, employee or date filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Work Summary</th>
                  <th className="py-3 px-4 text-right">Hours (B / NB)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTimesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-blue-50/20 transition-colors">
                    {/* Employee */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={ts.userAvatar}
                          alt={ts.userName}
                          className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/20"
                        />
                        <div>
                          <p className="font-extrabold text-slate-900">{ts.userName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Submitted</p>
                        </div>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-blue-700">
                      {ts.projectName}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {ts.date}
                    </td>



                    {/* Work Summary */}
                    <td
                      className="py-3.5 px-4 max-w-sm cursor-pointer group"
                      onClick={() => setViewingDesc({ billable: ts.billableDescription || ts.description, nonBillable: ts.nonBillableDescription })}
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 truncate leading-relaxed group-hover:text-blue-600 transition-colors flex-1">
                          {ts.description || ts.billableDescription || ts.nonBillableDescription || 'No summary provided'}
                        </p>
                        <span className="shrink-0 px-2 py-1 rounded bg-blue-50 text-[10px] font-extrabold text-blue-700 border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-all uppercase tracking-wider">
                          View
                        </span>
                      </div>
                    </td>

                    {/* Hours */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-black text-slate-900 text-sm block">{ts.hours}h Total</span>
                      <span className="text-[10px] font-bold text-emerald-700 block">
                        {ts.billableHours}h Billable / {ts.nonBillableHours}h NB
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                        Submitted Log
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Description Modal */}
      {viewingDesc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Work Summary Details
              </h3>
              <button
                onClick={() => setViewingDesc(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <CheckSquare className="w-4 h-4 opacity-0" /> {/* Spacer hack for X icon */}
                <span className="absolute top-7 right-7 text-lg font-bold">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Billable Summary</h4>
                <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                  {viewingDesc.billable || 'None'}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Non-Billable Summary</h4>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap italic">
                  {viewingDesc.nonBillable || 'No non-billable notes'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
