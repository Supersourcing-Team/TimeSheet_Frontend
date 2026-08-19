import React, { useState } from 'react';
import { Project, User, WeekendWorkRequest } from '../../types';
import {
  CalendarX,
  Moon,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Users,
  Briefcase,
  AlertCircle,
  Sparkles,
  X,
  MessageSquare,
} from 'lucide-react';

interface PMWeekendWorkRequestsProps {
  currentUser: User;
  projects: Project[];
  allUsers: User[];
  weekendRequests: WeekendWorkRequest[];
  onApproveWeekendWork: (id: string) => void;
  onRejectWeekendWork: (id: string, comment?: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PMWeekendWorkRequests: React.FC<PMWeekendWorkRequestsProps> = ({
  currentUser,
  projects = [],
  allUsers = [],
  weekendRequests = [],
  onApproveWeekendWork,
  onRejectWeekendWork,
  onShowToast,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectingRequest, setRejectingRequest] = useState<WeekendWorkRequest | null>(null);
  const [rejectComment, setRejectComment] = useState('Scope does not justify weekend overtime allocation.');

  // PM's project IDs
  const pmProjects = (projects || []).filter(
    (p) =>
      (p.pmName && currentUser?.name && p.pmName.toLowerCase() === currentUser.name.toLowerCase()) ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'pm'
  );
  const pmProjectIds = pmProjects.map((p) => p.id);

  // Filter requests for PM's projects
  const pmRequests = (weekendRequests || []).filter(
    (w) => pmProjectIds.length === 0 || pmProjectIds.includes(w.projectId)
  );

  const filteredRequests = pmRequests.filter((req) => {
    const matchesSearch =
      req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.deliverableObjective.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = pmRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = pmRequests.filter((r) => r.status === 'approved').length;
  const rejectedCount = pmRequests.filter((r) => r.status === 'rejected').length;

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;

    onRejectWeekendWork(rejectingRequest.id, rejectComment);
    onShowToast('Request Rejected', `Rejected weekend work request for ${rejectingRequest.userName}.`, 'info');
    setRejectingRequest(null);
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          
          <h1 className="text-2xl font-black tracking-tight">Weekend Work Approvals</h1>
          <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
            Review and approve weekend overtime requests submitted by team members. Pre-approvals ensure proper overtime accounting, sprint capacity planning, and deliverable tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-400/30 font-bold text-xs flex items-center gap-2">
            <Moon className="w-4 h-4 text-amber-300" />
            <span>{pendingCount} Pending Requests</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition-all ${statusFilter === 'pending'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
            Pending Review
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount} Requests</div>
          <p className="text-[11px] text-amber-800 font-semibold mt-0.5">Requires manager approval</p>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-2xl border text-left transition-all ${statusFilter === 'approved'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
            Approved Requests
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{approvedCount} Requests</div>
          <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">Approved overtime work</p>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-2xl border text-left transition-all ${statusFilter === 'rejected'
              ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200 hover:border-rose-300'
            }`}
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">
            Rejected Requests
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">{rejectedCount} Requests</div>
          <p className="text-[11px] text-rose-800 font-semibold mt-0.5">Declined overtime</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, project, deliverable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Request Cards / Table */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No weekend work requests found.</p>
            <p className="text-xs text-slate-400">No submissions matching the selected status filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={req.userAvatar}
                        alt={req.userName}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
                      />
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{req.userName}</h3>
                        <p className="text-[11px] font-bold text-blue-600">{req.projectName}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black capitalize ${req.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Weekend Date:</span>
                      <span className="font-bold text-slate-900 font-mono">{req.workDate}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Planned Overtime:</span>
                      <span className="font-extrabold text-indigo-700">{req.plannedHours} Hours</span>
                    </div>
                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Deliverable Objective:</span>
                      <p className="font-medium text-slate-800 mt-0.5 leading-relaxed">
                        {req.deliverableObjective}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Requested on: {req.requestedOn}
                  </span>

                  {req.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onApproveWeekendWork(req.id);
                          onShowToast('Request Approved', `Approved weekend work for ${req.userName}`, 'success');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingRequest(req)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500">
                      Reviewed by: {req.reviewedBy || currentUser.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REJECT COMMENTS MODAL */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmReject}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 text-xs font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900">
                Reject Overtime • {rejectingRequest.userName}
              </h3>
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600">
                Please provide feedback for declining weekend work on {rejectingRequest.workDate} ({rejectingRequest.plannedHours}h).
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Reason for Rejection
                </label>
                <textarea
                  rows={3}
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Confirm Decline
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
