import React, { useState } from 'react';
import { TimesheetEntry, Project, User } from '../../types';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  Clock,
  MessageSquare,
  X,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface TimesheetReviewProps {
  timesheets: TimesheetEntry[];
  projects: Project[];
  users: User[];
  onApproveTimesheet: (id: string) => void;
  onRejectTimesheet: (id: string, reason: string) => void;
  onBulkApproveTimesheets: (ids: string[]) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const TimesheetReview: React.FC<TimesheetReviewProps> = ({
  timesheets,
  projects,
  users,
  onApproveTimesheet,
  onRejectTimesheet,
  onBulkApproveTimesheets,
  onShowToast,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('pending');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Rejection modal state
  const [rejectingTimesheet, setRejectingTimesheet] = useState<TimesheetEntry | null>(null);
  const [rejectReason, setRejectReason] = useState('Non-billable hours ratio needs elaboration.');

  const safeTimesheets = timesheets || [];
  const safeProjects = projects || [];

  const filtered = safeTimesheets.filter((ts) => {
    if (selectedStatusFilter !== 'all' && ts.status !== selectedStatusFilter) return false;
    if (selectedProjectFilter !== 'all' && ts.projectId !== selectedProjectFilter) return false;
    if (
      searchQuery &&
      !ts.userName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !ts.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    onBulkApproveTimesheets(selectedIds);
    onShowToast('Bulk Approved!', `Approved ${selectedIds.length} timesheets.`, 'success');
    setSelectedIds([]);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTimesheet) return;
    onRejectTimesheet(rejectingTimesheet.id, rejectReason);
    onShowToast('Timesheet Rejected', `Returned to ${rejectingTimesheet.userName} with feedback.`, 'info');
    setRejectingTimesheet(null);
  };

  const pendingHours = timesheets
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.hours, 0);

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 font-medium text-xs border border-blue-400/30">
            <CheckSquare className="w-3.5 h-3.5 text-blue-300" />
            <span>Timesheet Approvals & Audit Governance</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Timesheet Review & Approvals</h2>
          <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
            Review logged project hours, verify client billable entries vs internal overhead, and approve or reject submissions with feedback notes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkApprove}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-xs shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/80">Pending Action</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {timesheets.filter((t) => t.status === 'pending').length} Submissions
          </p>
          <p className="text-[11px] text-amber-800 font-medium mt-0.5">Requires manager review</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Pending Hours</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{pendingHours} Hours</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Awaiting verification</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300 text-xs shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900/80">Approved This Month</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {timesheets
              .filter((t) => t.status === 'approved')
              .reduce((sum, t) => sum + t.hours, 0)}{' '}
            Hours
          </p>
          <p className="text-[11px] text-emerald-800 font-medium mt-0.5">Audited & processed</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4 text-xs">
        {/* Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee or description..."
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-end text-slate-400 font-semibold">
            Showing {filtered.length} entries
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Project</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Hours</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.map((ts) => (
                <tr key={ts.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(ts.id)}
                      onChange={() => toggleSelectOne(ts.id)}
                      className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={ts.userAvatar}
                        alt={ts.userName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="font-bold text-slate-100">{ts.userName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-purple-300">{ts.projectName}</td>
                  <td className="py-3.5 px-3 text-slate-300 font-mono text-[11px]">{ts.date}</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      {ts.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 max-w-xs truncate" title={ts.description}>
                    {ts.description}
                  </td>
                  <td className="py-3.5 px-3 text-right font-extrabold text-white">
                    {ts.hours}h <span className="text-slate-400 font-normal">({ts.billableHours}b)</span>
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        ts.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : ts.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {ts.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {ts.status !== 'approved' && (
                        <button
                          onClick={() => {
                            onApproveTimesheet(ts.id);
                            onShowToast('Approved', `Approved timesheet for ${ts.userName}`, 'success');
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {ts.status !== 'rejected' && (
                        <button
                          onClick={() => setRejectingTimesheet(ts)}
                          className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-[11px] transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECT MODAL */}
      {rejectingTimesheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmReject}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-extrabold text-white">
                Reject Timesheet • {rejectingTimesheet.userName}
              </h3>
              <button
                type="button"
                onClick={() => setRejectingTimesheet(null)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-300">
                Provide feedback to {rejectingTimesheet.userName} explaining why this timesheet entry is being returned for correction.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Rejection Reason / Comments
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingTimesheet(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Return Entry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
