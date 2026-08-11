import React, { useState } from 'react';
import { User, LeaveBalance, LeaveRequest } from '../../types';
import {
  Palmtree,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  HeartPulse,
  Baby,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface LeaveManagementProps {
  currentUser: User;
  leaveBalance: LeaveBalance;
  leaveRequests: LeaveRequest[];
  onApplyLeave: (request: Omit<LeaveRequest, 'id'>) => void;
  onCancelLeave: (id: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({
  currentUser,
  leaveBalance,
  leaveRequests,
  onApplyLeave,
  onCancelLeave,
  onShowToast,
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] =
    useState<LeaveRequest['type']>('Annual Leave');
  const [startDate, setStartDate] = useState('2025-08-25');
  const [endDate, setEndDate] = useState('2025-08-27');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [backupContact, setBackupContact] = useState('Sarah Chen (sarah.chen@workflow.io)');
  const [reason, setReason] = useState('Family vacation and travel.');

  // Calculate requested days
  const calculateDays = () => {
    if (isHalfDay) return 0.5;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const daysRequested = calculateDays();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (daysRequested <= 0) {
      onShowToast('Invalid Dates', 'End date cannot be earlier than start date.', 'error');
      return;
    }

    onApplyLeave({
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      type: leaveType,
      startDate,
      endDate,
      daysCount: daysRequested,
      reason,
      backupContact,
      isHalfDay,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0],
    });

    onShowToast(
      'Leave Request Submitted!',
      `Requested ${daysRequested} days of ${leaveType} starting ${startDate}.`,
      'success'
    );
    setShowApplyModal(false);
  };

  const userRequests = (leaveRequests || []).filter((r) => r.userId === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-emerald-400" />
            <span>Leave Management & Balances</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track annual, sick, parental and comp-off balances and submit leave applications.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* 4 Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Annual Leave */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Annual Leave
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Palmtree className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {leaveBalance.annualLeaveTotal - leaveBalance.annualLeaveUsed}{' '}
            <span className="text-xs text-slate-400 font-normal">/ {leaveBalance.annualLeaveTotal} Days</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{
                width: `${
                  ((leaveBalance.annualLeaveTotal - leaveBalance.annualLeaveUsed) /
                    leaveBalance.annualLeaveTotal) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Sick Leave */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sick Leave
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {leaveBalance.sickLeaveTotal - leaveBalance.sickLeaveUsed}{' '}
            <span className="text-xs text-slate-400 font-normal">/ {leaveBalance.sickLeaveTotal} Days</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose-500 h-1.5 rounded-full"
              style={{
                width: `${
                  ((leaveBalance.sickLeaveTotal - leaveBalance.sickLeaveUsed) /
                    leaveBalance.sickLeaveTotal) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Parental Leave */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Parental Leave
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Baby className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {leaveBalance.parentalLeaveTotal - leaveBalance.parentalLeaveUsed}{' '}
            <span className="text-xs text-slate-400 font-normal">/ {leaveBalance.parentalLeaveTotal} Days</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-500 h-1.5 rounded-full"
              style={{
                width: `${
                  ((leaveBalance.parentalLeaveTotal - leaveBalance.parentalLeaveUsed) /
                    leaveBalance.parentalLeaveTotal) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Comp Off */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Compensatory Off
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {leaveBalance.compOffTotal - leaveBalance.compOffUsed}{' '}
            <span className="text-xs text-slate-400 font-normal">/ {leaveBalance.compOffTotal} Days</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full"
              style={{
                width: `${
                  ((leaveBalance.compOffTotal - leaveBalance.compOffUsed) /
                    leaveBalance.compOffTotal) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Leave Request History Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">My Leave Application History</h3>
          <span className="text-xs text-slate-400 font-semibold">
            Total Requests: {userRequests.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Dates</th>
                <th className="py-3 px-3">Total Days</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3">Backup Contact</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {userRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-3 font-bold text-emerald-300 whitespace-nowrap">
                    {req.type}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-200 whitespace-nowrap">
                    {req.startDate} to {req.endDate}
                  </td>
                  <td className="py-3.5 px-3 font-extrabold text-white whitespace-nowrap">
                    {req.daysCount} {req.daysCount === 1 ? 'day' : 'days'}
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 max-w-xs truncate" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400 truncate max-w-xs">
                    {req.backupContact || 'N/A'}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : req.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    {req.status === 'pending' && (
                      <button
                        onClick={() => {
                          onCancelLeave(req.id);
                          onShowToast('Cancelled Request', 'Leave application withdrawn.', 'info');
                        }}
                        className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Cancel Request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPLY LEAVE FORM MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleFormSubmit}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-emerald-400" />
                <span>Apply for Leave</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Leave Type */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveRequest['type'])}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Annual Leave">Annual Leave (Paid)</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Parental Leave">Parental Leave</option>
                  <option value="Compensatory Off">Compensatory Off</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Half Day Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="halfDay"
                  checked={isHalfDay}
                  onChange={(e) => setIsHalfDay(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="halfDay" className="text-slate-300 font-medium">
                  Request as Half-Day Leave
                </label>
              </div>

              {/* Total Requested Preview */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between items-center text-slate-200 font-bold">
                <span>Calculated Working Days:</span>
                <span className="text-emerald-400 text-sm">{daysRequested} Days</span>
              </div>

              {/* Backup Contact */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Backup Point of Contact
                </label>
                <input
                  type="text"
                  value={backupContact}
                  onChange={(e) => setBackupContact(e.target.value)}
                  placeholder="Team member covering your tasks..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Reason for Application
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
