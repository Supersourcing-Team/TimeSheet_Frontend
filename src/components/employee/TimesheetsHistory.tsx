import React, { useState } from 'react';
import { User, TimesheetEntry, Project, LeaveRequest } from '../../types';
import { useGetMyLeaveRequestsQuery } from '../../store/api/dataApi';
import {
  Calendar as CalendarIcon,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Search,
  X,
  Trash2,
  Edit3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
  CalendarX,
} from 'lucide-react';

interface TimesheetsHistoryProps {
  currentUser: User;
  timesheets: TimesheetEntry[];
  projects: Project[];
  onDeleteTimesheet?: (id: string) => void;
  onUpdateTimesheet?: (entry: TimesheetEntry) => void;
  onEditRequest?: (entry: TimesheetEntry) => void;
  onSubmitTimesheets?: (entries: Omit<TimesheetEntry, 'id'>[]) => void;
  onNavigateToSubmit?: (date: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const TimesheetsHistory: React.FC<TimesheetsHistoryProps> = ({
  currentUser,
  timesheets,
  projects,
  onDeleteTimesheet,
  onUpdateTimesheet,
  onEditRequest,
  onSubmitTimesheets,
  onNavigateToSubmit,
  onShowToast,
}) => {
  const assignedProjects = (projects || []).filter((p) => p.assignedUserIds?.includes(currentUser.id));

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDateModal, setSelectedDateModal] = useState<string | null>(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [editNonBillableDesc, setEditNonBillableDesc] = useState<string>('');

  // Add for date modal states
  const [addingForDate, setAddingForDate] = useState<string | null>(null);
  const [addProjectId, setAddProjectId] = useState<string>('');
  const [addHours, setAddHours] = useState<number>(8);
  const [addBillableHours, setAddBillableHours] = useState<number>(8);
  const [addCategory, setAddCategory] = useState<TimesheetEntry['category']>('Development');
  const [addBillableDesc, setAddBillableDesc] = useState<string>('');
  const [addNonBillableDesc, setAddNonBillableDesc] = useState<string>('');

  // Month navigation for Calendar
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const userTimesheets = (timesheets || []).filter((t) => t.userId === currentUser.id);

  // Fetch leave requests for leave status visualization
  const { data: leaveData } = useGetMyLeaveRequestsQuery(undefined as any);
  const myLeaves: LeaveRequest[] = leaveData || [];

  // Helper: get first active leave for a date
  const getLeaveForDate = (dateStr: string): LeaveRequest | undefined => {
    return myLeaves.find(
      (lr) =>
        lr.startDate <= dateStr &&
        lr.endDate >= dateStr &&
        (lr.status === 'approved' || lr.status === 'pending')
    );
  };

  const formatLeaveBadgeLabel = (lr: LeaveRequest): string => {
    const dur = lr.leaveDurationType;
    if (!dur || dur === 'full_day') return 'On Leave';
    if (dur === 'half_day') {
      return lr.halfDayPeriod === 'first' ? 'Leave – 1st Half' : 'Leave – 2nd Half';
    }
    if (dur === 'partial_day' && lr.partialStartTime && lr.partialEndTime) {
      return `Leave ${lr.partialStartTime}–${lr.partialEndTime}`;
    }
    return 'On Leave';
  };

  // Calendar logic
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const formattedDay = d < 10 ? `0${d}` : `${d}`;
    const formattedMonth = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    calendarDays.push(dateStr);
  }

  // Filtered List View items
  const filteredTimesheets = userTimesheets.filter((ts) => {
    if (selectedProjectFilter !== 'all' && ts.projectId !== selectedProjectFilter) return false;
    if (selectedStatusFilter !== 'all' && ts.status !== selectedStatusFilter) return false;
    if (
      searchQuery &&
      !ts.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !ts.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = 'ID,Date,Project,Category,Hours,Billable,Status,BillableDescription,NonBillableDescription\n';
    const rows = filteredTimesheets
      .map(
        (t) =>
          `"${t.id}","${t.date}","${t.projectName}","${t.category}",${t.billableHours + t.nonBillableHours},${t.billableHours},"${t.status}","${(
            t.billableDescription || t.description
          ).replace(/"/g, '""')}","${(t.nonBillableDescription || '').replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Timesheets_History_${currentUser.name.replace(' ', '_')}.csv`;
    a.click();
    onShowToast('Exported to CSV', 'Your timesheet history log was downloaded successfully.', 'success');
  };

  const modalEntries = selectedDateModal
    ? userTimesheets.filter((ts) => ts.date === selectedDateModal)
    : [];

  const handleStartEdit = (entry: TimesheetEntry) => {
    if (onEditRequest) {
      onEditRequest(entry);
    }
  };

  const handleStartAddForDate = (dateStr: string) => {
    const defaultProjId = assignedProjects[0]?.id || (projects && projects[0]?.id) || '';
    setAddingForDate(dateStr);
    setAddProjectId(defaultProjId);
    setAddHours(8);
    setAddBillableHours(8);
    setAddCategory('Development');
    setAddBillableDesc('');
    setAddNonBillableDesc('');
  };

  const handleSaveNewEntryForDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingForDate || !addProjectId) return;

    const targetProject = (projects || []).find((p) => p.id === addProjectId);
    const projectName = targetProject ? targetProject.name : 'Project';

    const newEntry: Omit<TimesheetEntry, 'id'> = {
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      projectId: addProjectId,
      projectName: projectName,
      date: addingForDate,
      billableHours: Number(addBillableHours),
      nonBillableHours: Math.max(0, Number(addHours) - Number(addBillableHours)),
      category: addCategory,
      description: addBillableDesc || 'Daily work log',
      billableDescription: addBillableDesc,
      nonBillableDescription: addNonBillableDesc,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    if (onSubmitTimesheets) {
      onSubmitTimesheets([newEntry]);
    }
    onShowToast('Timesheet Logged', `Added ${addHours}h for ${projectName} on ${addingForDate}`, 'success');
    setAddingForDate(null);
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header & View Mode Switcher */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight">Timesheet History</h2>
          <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
            Click on any date or entry to view, edit, update, or log your daily task hours and track approval statuses.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Calendar vs List Toggle */}
          <div className="bg-white/10 p-1 rounded-xl border border-white/20 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'calendar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-200 hover:text-white'
                }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-200 hover:text-white'
                }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-300" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-base font-extrabold text-slate-900 min-w-[140px] text-center">
                {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>8.0h+ Complete</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Partial (&lt;8h)</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span>Leave Day</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span>Off / Weekend</span>
              </span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-bold text-slate-400 uppercase py-2"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="h-24 bg-slate-50/50 rounded-xl" />;
              }

              const dayEntries = userTimesheets.filter((t) => t.date === dateStr);
              const dayTotalHours = dayEntries.reduce((acc, curr) => acc + (curr.billableHours + curr.nonBillableHours), 0);
              const leaveForDay = getLeaveForDate(dateStr);
              const isFullDayLeave = leaveForDay && (!leaveForDay.leaveDurationType || leaveForDay.leaveDurationType === 'full_day');

              const dateObj = new Date(dateStr);
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
              const todayStr = new Date().toISOString().split('T')[0];
              const isFutureDate = dateStr > todayStr;

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => {
                    
                    if (dayEntries.length === 0 && onNavigateToSubmit) {
                      onNavigateToSubmit(dateStr);
                    } else {
                      setSelectedDateModal(dateStr);
                    }
                  }}
                  disabled={false}
                  className={`h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isFutureDate
                      ? 'bg-white border-slate-100 hover:border-blue-400 hover:scale-[1.02] cursor-pointer'
                      : isFullDayLeave
                        ? 'bg-rose-50 border-rose-300 hover:border-rose-500 hover:scale-[1.02] hover:shadow-md cursor-pointer'
                        : isWeekend
                          ? 'bg-slate-50 border-slate-200/60 opacity-60 hover:scale-[1.02] hover:shadow-md cursor-pointer'
                          : dayTotalHours >= 8
                            ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-500 hover:scale-[1.02] hover:shadow-md cursor-pointer'
                            : dayTotalHours > 0
                              ? 'bg-amber-50/40 border-amber-300 hover:border-amber-500 hover:scale-[1.02] hover:shadow-md cursor-pointer'
                              : leaveForDay
                                ? 'bg-rose-50/60 border-rose-200 hover:border-rose-400 hover:scale-[1.02] hover:shadow-md cursor-pointer'
                                : 'bg-white border-slate-200 hover:border-blue-400 hover:scale-[1.02] hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-extrabold text-slate-900">
                      {dateStr.split('-')[2]}
                    </span>
                    {dayTotalHours > 0 && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          dayTotalHours >= 8
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {dayTotalHours}h
                      </span>
                    )}
                    {leaveForDay && dayTotalHours === 0 && (
                      <CalendarX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>

                  <div className="space-y-1">
                    {/* Leave badge */}
                    {leaveForDay && (
                      <div className="text-[9px] truncate px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-extrabold border border-rose-200 flex items-center gap-1">
                        <CalendarX className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{formatLeaveBadgeLabel(leaveForDay)}</span>
                      </div>
                    )}
                    {dayEntries.slice(0, leaveForDay ? 1 : 2).map((e) => (
                      <div
                        key={e.id}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-100 flex items-center justify-between"
                      >
                        <span className="truncate">{e.projectName}</span>
                        <span className="font-extrabold shrink-0 ml-1">{e.billableHours + e.nonBillableHours}h</span>
                      </div>
                    ))}
                    {dayEntries.length > (leaveForDay ? 1 : 2) && (
                      <div className="text-[9px] text-slate-500 font-bold px-1">
                        +{dayEntries.length - (leaveForDay ? 1 : 2)} more
                      </div>
                    )}
                    {dayEntries.length === 0 && !leaveForDay && !isWeekend && !isFutureDate && (
                      <span className="text-[10px] text-slate-400 italic">Click to log</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          {/* Filter Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search descriptions..."
                className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>

            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="all">All Projects</option>
              {assignedProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="submitted">Submitted</option>
            </select>

            <div className="text-right flex items-center justify-end text-xs text-slate-500 font-bold">
              Total Found: {filteredTimesheets.length} entries
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-3">Billable Work</th>
                  <th className="py-3 px-3">Non-Billable Work</th>
                  <th className="py-3 px-3 text-right">Hours (Billable)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Leave request rows */}
                {myLeaves
                  .filter((lr) => lr.status === 'approved' || lr.status === 'pending')
                  .map((lr) => (
                    <tr key={`leave-${lr.id}`} className="bg-rose-50/60 hover:bg-rose-50 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-rose-800 whitespace-nowrap">
                        {lr.startDate === lr.endDate ? lr.startDate : `${lr.startDate} – ${lr.endDate}`}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <CalendarX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="font-bold text-rose-700">{lr.type}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-rose-600 max-w-xs font-medium">
                        {formatLeaveBadgeLabel(lr)}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 max-w-xs italic text-[11px]">
                        {lr.reason || '—'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold text-rose-700 whitespace-nowrap">
                        {lr.leaveDurationType === 'full_day' ? '8h (full)' : lr.leaveDurationType === 'half_day' ? '4h (half)' : 'Partial'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize bg-rose-100 text-rose-700 border border-rose-200">
                          {lr.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-400 text-[10px] italic">—</td>
                    </tr>
                  ))}
                {filteredTimesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">{ts.date}</td>
                    <td className="py-3.5 px-3 font-bold text-blue-600">{ts.projectName}</td>
                    <td className="py-3.5 px-3 text-slate-800 max-w-xs font-medium">
                      {ts.billableDescription || ts.description}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 max-w-xs italic text-[11px]">
                      {ts.nonBillableDescription || 'N/A'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      {ts.billableHours + ts.nonBillableHours}h <span className="text-emerald-600 font-semibold">({ts.billableHours}h billable)</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize bg-emerald-100 text-emerald-800"
                      >
                        {ts.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(ts)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
                          title="Edit timesheet entry"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTimesheet(ts.id);
                            onShowToast('Deleted Entry', 'Timesheet entry removed.', 'info');
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Delete log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DAY LOG DETAILS MODAL (When Date is Clicked in Calendar) */}
      {selectedDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Timesheet Logs • {selectedDateModal}
                </h3>
                <p className="text-xs text-slate-500">
                  Total Logged:{' '}
                  <span className="font-extrabold text-blue-600">
                    {modalEntries.reduce((sum, e) => sum + (e.billableHours + e.nonBillableHours), 0)} Hours
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDateModal(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {modalEntries.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs space-y-3">
                  <p>No hours logged for this date.</p>
                  <button
                    type="button"
                    onClick={() => {
                      const dateToLog = selectedDateModal;
                      setSelectedDateModal(null);
                      if (dateToLog) {
                        if (onNavigateToSubmit) {
                          onNavigateToSubmit(dateToLog);
                        } else {
                          handleStartAddForDate(dateToLog);
                        }
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Hours for {selectedDateModal}</span>
                  </button>
                </div>
              ) : (
                modalEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600">{entry.projectName}</span>
                      <span className="font-extrabold text-slate-900">
                        {entry.billableHours + entry.nonBillableHours}h ({entry.billableHours}h billable)
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <p className="text-slate-800 font-semibold">
                        <span className="text-emerald-700 font-bold">Billable Work: </span>
                        {entry.billableDescription || entry.description}
                      </p>
                      {entry.nonBillableDescription && (
                        <p className="text-slate-500 italic">
                          <span className="font-bold text-slate-600">Non-Billable: </span>
                          {entry.nonBillableDescription}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-600 font-bold bg-slate-200 px-2 py-0.5 rounded">
                        {entry.category}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDateModal(null);
                            handleStartEdit(entry);
                          }}
                          className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit & Update</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTimesheet(entry.id);
                            onShowToast('Removed', 'Log entry deleted.', 'info');
                          }}
                          className="text-[11px] text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {modalEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const dateToLog = selectedDateModal;
                    setSelectedDateModal(null);
                    if (dateToLog) {
                      if (onNavigateToSubmit) {
                        onNavigateToSubmit(dateToLog);
                      } else {
                        handleStartAddForDate(dateToLog);
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Another Entry</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDateModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ADD TIMESHEET FOR CLICKED DATE MODAL */}
      {addingForDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Log Hours • {addingForDate}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Add a new timesheet entry for this specific date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddingForDate(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewEntryForDate} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Project</label>
                <select
                  value={addProjectId}
                  onChange={(e) => setAddProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Code Review">Code Review</option>
                    <option value="Testing">Testing</option>
                    <option value="Documentation">Documentation</option>
                    <option value="DevOps">DevOps</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-slate-700 font-bold mb-1">Total Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={addHours}
                    onChange={(e) => setAddHours(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-slate-700 font-bold mb-1">Billable (h)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={addHours}
                    value={addBillableHours}
                    onChange={(e) => setAddBillableHours(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-slate-700 font-bold mb-1">Non-Bill (h)</label>
                  <input
                    type="number"
                    value={Math.max(0, addHours - addBillableHours)}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3 py-2 font-bold cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Billable Work Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={addBillableDesc}
                  onChange={(e) => setAddBillableDesc(e.target.value)}
                  placeholder="Describe billable deliverables completed..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Non-Billable Work Description (Optional)
                </label>
                <input
                  type="text"
                  value={addNonBillableDesc}
                  onChange={(e) => setAddNonBillableDesc(e.target.value)}
                  placeholder="e.g. Team standup, documentation..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddingForDate(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 font-extrabold rounded-xl shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


