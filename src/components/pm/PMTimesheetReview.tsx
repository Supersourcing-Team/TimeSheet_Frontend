import { Pagination } from '../common/Pagination';
import React, { useState, useEffect, useMemo } from 'react';
import {
  useGetUpcomingLeavesQuery,
  useGetDailyEodPreviewQuery,
  useSendDailyEodToSlackMutation,
  DailyEodEntry,
} from '../../store/api/dataApi';
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
  Download,
  FileSpreadsheet,
  CalendarDays,
  Building2,
  RefreshCw,
  Layers,
  Send,
  AlertCircle,
} from 'lucide-react';

interface PMTimesheetReviewProps {
  currentUser: User;
  projects: Project[];
  allUsers: User[];
  timesheets: TimesheetEntry[];
}

export const PMTimesheetReview: React.FC<PMTimesheetReviewProps> = React.memo(({
  currentUser,
  projects = [],
  allUsers = [],
  timesheets = [],
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState<'review' | 'eod'>('review');

  // Review Tab State
  const { data: upcomingLeaves = [] } = useGetUpcomingLeavesQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [viewingDesc, setViewingDesc] = useState<{ billable: string; nonBillable: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // EOD Tab State
  const [eodDate, setEodDate] = useState<string>(today);
  const [eodSearch, setEodSearch] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [eodCurrentPage, setEodCurrentPage] = useState<number>(1);
  const [eodItemsPerPage, setEodItemsPerPage] = useState<number>(10);
  const [slackFeedback, setSlackFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [sendDailyEodToSlack, { isLoading: isSendingSlack }] = useSendDailyEodToSlackMutation();

  const {
    data: eodPreviewData,
    isLoading: isEodLoading,
    refetch: refetchEod,
  } = useGetDailyEodPreviewQuery(eodDate, {
    skip: activeTab !== 'eod',
  });

  // PM's project IDs
  const pmProjects = useMemo(() => {
    return (projects || []).filter(
      (p) =>
        (p.pmName && currentUser?.name && p.pmName.toLowerCase() === currentUser.name.toLowerCase()) ||
        currentUser?.role === 'admin' ||
        currentUser?.role === 'pm'
    );
  }, [projects, currentUser]);

  const pmProjectIds = useMemo(() => pmProjects.map((p) => p.id), [pmProjects]);

  // Filter timesheets for PM's managed projects
  const pmTimesheets = useMemo(() => {
    return (timesheets || []).filter(
      (t) => pmProjectIds.length === 0 || pmProjectIds.includes(t.projectId)
    );
  }, [timesheets, pmProjectIds]);

  // Apply filters for review tab
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProject, selectedUser, dateFilter]);

  const filteredTimesheets = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return pmTimesheets.filter((t) => {
      const matchesSearch =
        !search ||
        t.userName.toLowerCase().includes(search) ||
        t.projectName.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        (t.billableDescription && t.billableDescription.toLowerCase().includes(search));

      const matchesProject = selectedProject === 'all' || t.projectId === selectedProject;
      const matchesUser = selectedUser === 'all' || t.userId === selectedUser;
      const matchesDate = !dateFilter || t.date === dateFilter;

      return matchesSearch && matchesProject && matchesUser && matchesDate;
    });
  }, [pmTimesheets, searchTerm, selectedProject, selectedUser, dateFilter]);

  // Calculate summary metrics for review tab
  const { totalLoggedHours, totalBillableHours, totalNonBillableHours, billableRatio } = useMemo(() => {
    const logged = filteredTimesheets.reduce((sum, t) => sum + (t.billableHours + t.nonBillableHours), 0);
    const billable = filteredTimesheets.reduce((sum, t) => sum + (t.billableHours || 0), 0);
    const nonBillable = filteredTimesheets.reduce((sum, t) => sum + (t.nonBillableHours || 0), 0);
    const ratio = logged > 0 ? Math.round((billable / logged) * 100) : 0;
    return {
      totalLoggedHours: logged,
      totalBillableHours: billable,
      totalNonBillableHours: nonBillable,
      billableRatio: ratio,
    };
  }, [filteredTimesheets]);

  const paginatedTimesheets = filteredTimesheets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filtered EOD entries
  const filteredEodEntries = useMemo(() => {
    const entries = eodPreviewData?.entries || [];
    if (!eodSearch.trim()) return entries;
    const query = eodSearch.toLowerCase();
    return entries.filter(
      (e) =>
        e.employee_name.toLowerCase().includes(query) ||
        e.employee_email.toLowerCase().includes(query) ||
        e.department.toLowerCase().includes(query) ||
        e.project_name.toLowerCase().includes(query) ||
        e.billable_work_summary.toLowerCase().includes(query) ||
        e.non_billable_work_summary.toLowerCase().includes(query)
    );
  }, [eodPreviewData, eodSearch]);

  const paginatedEodEntries = useMemo(() => {
    return filteredEodEntries.slice(
      (eodCurrentPage - 1) * eodItemsPerPage,
      eodCurrentPage * eodItemsPerPage
    );
  }, [filteredEodEntries, eodCurrentPage, eodItemsPerPage]);

  useEffect(() => {
    setEodCurrentPage(1);
  }, [eodSearch, eodDate]);

  // Handle Export Download
  const handleExportDailyEod = async (format: 'xlsx' | 'csv') => {
    try {
      setIsExporting(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await fetch(
        `${API_BASE_URL}/reports/daily-eod/export?date=${eodDate}&format=${format}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to generate export (${response.statusText})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily_eod_report_${eodDate.replace(/-/g, '')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading daily EOD report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Send to Slack
  const handleSendToSlack = async () => {
    try {
      setSlackFeedback(null);
      const res = await sendDailyEodToSlack({ date: eodDate }).unwrap();
      setSlackFeedback({
        type: 'success',
        message: res.message || 'Daily EOD report sent to Slack channel successfully!',
      });
      setTimeout(() => setSlackFeedback(null), 6000);
    } catch (err: any) {
      const errDetail = err?.data?.detail || err?.data?.message || 'Failed to dispatch report to Slack';
      setSlackFeedback({
        type: 'error',
        message: errDetail,
      });
      setTimeout(() => setSlackFeedback(null), 8000);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-300" /> Team Timesheets & EOD Reports
          </h1>
          <p className="text-sm text-blue-100/90 max-w-2xl leading-relaxed">
            Review your team's submitted timesheets and generate consolidated daily EOD reports across all employees.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-white/10 p-1.5 rounded-xl border border-white/20 shrink-0">
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'review'
                ? 'bg-white text-blue-950 shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Timesheet Log</span>
          </button>
          <button
            onClick={() => setActiveTab('eod')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'eod'
                ? 'bg-white text-blue-950 shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Daily EOD Report</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REVIEW LOG */}
      {/* ========================================================================= */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {/* Summary KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                Total Logged Hours
              </span>
              <p className="text-2xl font-black text-slate-900">{totalLoggedHours.toFixed(1)}h</p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Across filtered entries</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-black text-emerald-600 tracking-wider">
                Billable Hours
              </span>
              <p className="text-2xl font-black text-emerald-700">{totalBillableHours.toFixed(1)}h</p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Invoiced to clients</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                Non-Billable Hours
              </span>
              <p className="text-2xl font-black text-slate-700">{totalNonBillableHours.toFixed(1)}h</p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <Briefcase className="w-3 h-3 text-slate-400" />
                <span>Internal / Overhead</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-black text-blue-600 tracking-wider">
                Billable Ratio
              </span>
              <p className="text-2xl font-black text-blue-700">{billableRatio}%</p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600">
                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                <span>Target: &gt; 80%</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by employee, project, or task..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Project Filter */}
              <div className="min-w-[150px]">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
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
              <div className="min-w-[150px]">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
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
              <div className="min-w-[140px]">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {dateFilter && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDateFilter('')}
                  className="text-slate-500 hover:text-slate-800 underline text-[11px] cursor-pointer"
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
                    {paginatedTimesheets.map((ts) => {
                      const userLeaves = upcomingLeaves.filter(
                        (l: any) => l.user_id.toString() === ts.userId.toString()
                      );
                      const isOnLeaveThisDay = userLeaves.some(
                        (l: any) => l.start_date <= ts.date && l.end_date >= ts.date
                      );

                      return (
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
                                <div className="flex items-center gap-2">
                                  <p className="font-extrabold text-slate-900">{ts.userName}</p>
                                  {isOnLeaveThisDay && (
                                    <span className="px-1 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-bold uppercase tracking-wider">
                                      On Leave
                                    </span>
                                  )}
                                </div>
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
                            onClick={() =>
                              setViewingDesc({
                                billable: ts.billableDescription || ts.description,
                                nonBillable: ts.nonBillableDescription,
                              })
                            }
                          >
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-800 truncate leading-relaxed group-hover:text-blue-600 transition-colors flex-1">
                                {ts.description ||
                                  ts.billableDescription ||
                                  ts.nonBillableDescription ||
                                  'No summary provided'}
                              </p>
                              <span className="shrink-0 px-2 py-1 rounded bg-blue-50 text-[10px] font-extrabold text-blue-700 border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-all uppercase tracking-wider">
                                View
                              </span>
                            </div>
                          </td>

                          {/* Hours */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className="font-black text-slate-900 text-sm block">
                              {(ts.billableHours || 0) + (ts.nonBillableHours || 0)}h Total
                            </span>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredTimesheets.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={filteredTimesheets.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONSOLIDATED DAILY EOD REPORT & SLACK INTEGRATION */}
      {/* ========================================================================= */}
      {activeTab === 'eod' && (
        <div className="space-y-6">
          {/* Controls & Export Header Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-black text-slate-900">
                    Daily EOD Report & Slack Dispatch
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Export all employees' separate submitted EOD work summaries and hours for any selected day in a single file or send directly to Slack.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Send to Slack Button */}
                <button
                  type="button"
                  onClick={handleSendToSlack}
                  disabled={isSendingSlack}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  title="Send Daily EOD Report & Excel file to configured Slack channel"
                >
                  <Send className={`w-4 h-4 ${isSendingSlack ? 'animate-pulse' : ''}`} />
                  <span>{isSendingSlack ? 'Sending to Slack...' : 'Send EOD to Slack'}</span>
                </button>

                {/* Download Excel */}
                <button
                  type="button"
                  onClick={() => handleExportDailyEod('xlsx')}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  title="Download consolidated Excel workbook"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Generating...' : 'Download Excel (.xlsx)'}</span>
                </button>

                {/* Export CSV */}
                <button
                  type="button"
                  onClick={() => handleExportDailyEod('csv')}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-300 cursor-pointer disabled:opacity-50"
                  title="Download standard CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={() => refetchEod()}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer"
                  title="Refresh EOD Data"
                >
                  <RefreshCw className={`w-4 h-4 ${isEodLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Slack Feedback Alert Banner */}
            {slackFeedback && (
              <div
                className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-all ${
                  slackFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                {slackFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{slackFeedback.message}</span>
              </div>
            )}

            {/* Date Picker & Search Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4 flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
                <label className="text-xs font-bold text-slate-600 shrink-0">Report Date:</label>
                <input
                  type="date"
                  value={eodDate}
                  onChange={(e) => setEodDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="md:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by employee name, department, project, or work description..."
                  value={eodSearch}
                  onChange={(e) => setEodSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* EOD Metrics Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Submissions</span>
              <p className="text-xl font-black text-slate-900">{eodPreviewData?.total_submissions || 0}</p>
              <p className="text-[10px] text-slate-400 font-medium">Task rows logged</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Active Employees</span>
              <p className="text-xl font-black text-blue-700">{eodPreviewData?.total_employees || 0}</p>
              <p className="text-[10px] text-blue-500 font-medium">Submitted for this day</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Billable (h)</span>
              <p className="text-xl font-black text-emerald-700">{(eodPreviewData?.total_billable_hours || 0).toFixed(1)}h</p>
              <p className="text-[10px] text-emerald-600 font-medium">Client invoiced</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Non-Billable (h)</span>
              <p className="text-xl font-black text-slate-700">{(eodPreviewData?.total_non_billable_hours || 0).toFixed(1)}h</p>
              <p className="text-[10px] text-slate-500 font-medium">Internal overhead</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Grand Total (h)</span>
              <p className="text-xl font-black text-indigo-700">{(eodPreviewData?.grand_total_hours || 0).toFixed(1)}h</p>
              <p className="text-[10px] text-indigo-500 font-medium">Total logged time</p>
            </div>
          </div>

          {/* Consolidated Daily EOD Entries Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Consolidated Employee EOD Submissions — {eodDate}
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {filteredEodEntries.length} {filteredEodEntries.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

            {isEodLoading ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-blue-500" />
                <p className="text-xs font-bold text-slate-600">Loading daily EOD submissions...</p>
              </div>
            ) : filteredEodEntries.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No EOD submissions found for {eodDate}.</p>
                <p className="text-xs text-slate-400">Select another date or check back once team members submit their daily timesheets.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4 bg-emerald-50/50 text-emerald-800">Billable Work Summary</th>
                      <th className="py-3 px-4 bg-slate-100/60 text-slate-700">Non-Billable Notes</th>
                      <th className="py-3 px-4 text-right">Hours (B / NB)</th>
                      <th className="py-3 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedEodEntries.map((e, idx) => (
                      <tr key={e.timesheet_id} className="hover:bg-slate-50 transition-colors">
                        {/* Index */}
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                          {(eodCurrentPage - 1) * eodItemsPerPage + idx + 1}
                        </td>

                        {/* Employee */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-extrabold text-slate-900">{e.employee_name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{e.employee_email}</p>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {e.department}
                          </span>
                        </td>

                        {/* Project */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-blue-700">
                          <p>{e.project_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-normal">{e.project_code}</p>
                        </td>

                        {/* Billable Work Summary */}
                        <td className="py-3.5 px-4 max-w-xs bg-emerald-50/20">
                          {e.billable_work_summary ? (
                            <p className="font-medium text-slate-800 leading-relaxed whitespace-pre-wrap text-xs">
                              {e.billable_work_summary}
                            </p>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No billable work logged</span>
                          )}
                        </td>

                        {/* Non-Billable Work Summary */}
                        <td className="py-3.5 px-4 max-w-xs bg-slate-50/40">
                          {e.non_billable_work_summary ? (
                            <p className="font-medium text-slate-600 leading-relaxed whitespace-pre-wrap text-xs italic">
                              {e.non_billable_work_summary}
                            </p>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>

                        {/* Hours breakdown */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="text-[11px] font-extrabold text-emerald-700 block">
                            {e.billable_hours.toFixed(1)}h B
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 block">
                            {e.non_billable_hours.toFixed(1)}h NB
                          </span>
                        </td>

                        {/* Total Hours */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                            {e.total_hours.toFixed(1)}h
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredEodEntries.length > 0 && (
              <Pagination
                currentPage={eodCurrentPage}
                totalItems={filteredEodEntries.length}
                itemsPerPage={eodItemsPerPage}
                onPageChange={setEodCurrentPage}
                onItemsPerPageChange={setEodItemsPerPage}
              />
            )}
          </div>
        </div>
      )}

      {/* Description Modal (from Review tab) */}
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
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <span className="text-base font-bold">✕</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Billable Summary / Client Scope
                </h4>
                <p className="text-sm text-slate-800 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 leading-relaxed whitespace-pre-wrap">
                  {viewingDesc.billable || 'None'}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Non-Billable Summary / Internal Notes
                </h4>
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
});
PMTimesheetReview.displayName = 'PMTimesheetReview';
