import React, { useState } from 'react';
import { User, LeaveBalance, LeaveRequest, LeaveTypeConfig } from '../../types';
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
  leaveTypes: LeaveTypeConfig[];
  onApplyLeave: (request: Omit<LeaveRequest, 'id'>) => void;
  onCancelLeave: (id: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({
  currentUser,
  leaveBalance,
  leaveRequests,
  leaveTypes,
  onApplyLeave,
  onCancelLeave,
  onShowToast,
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveRequest['type']>(
    (leaveTypes?.filter(lt => lt.status === 'active')?.[0]?.name as LeaveRequest['type']) || 'Annual Leave'
  );
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [isHalfDay, setIsHalfDay] = useState(false);

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

  const userRequests = (leaveRequests || []).filter((r) => r.userId === currentUser.id);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (daysRequested <= 0) {
      onShowToast('Invalid Dates', 'End date cannot be earlier than start date.', 'error');
      return;
    }

    const hasOverlap = userRequests.some(req => {
      if (req.status === 'rejected' || req.status === 'cancelled') return false;
      const reqStart = new Date(req.startDate).getTime();
      const reqEnd = new Date(req.endDate).getTime();
      const newStart = new Date(startDate).getTime();
      const newEnd = new Date(endDate).getTime();
      return reqStart <= newEnd && reqEnd >= newStart;
    });

    if (hasOverlap) {
      onShowToast('Duplicate Leave', 'You already have a leave request that overlaps with these dates.', 'error');
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

      isHalfDay,
      status: 'approved',
      appliedOn: new Date().toISOString().split('T')[0],
    });

    onShowToast(
      'Leave Marked!',
      `Successfully marked ${daysRequested} days of ${leaveType} starting ${startDate}.`,
      'success'
    );
    setShowApplyModal(false);
  };

  const getLeaveStatus = (req: LeaveRequest) => {
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    const today = new Date();
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    today.setHours(0,0,0,0);
  
    if (today < start) return 'upcoming';
    if (today > end) return 'completed';
    return 'active';
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>My Leaves</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            View your upcoming leaves and mark new absences.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Mark Leave</span>
        </button>
      </div>

      {/* Leave Request History Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">My Leave History</h3>
          <span className="text-xs text-slate-500 font-semibold">
            Total Leaves: {userRequests.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Dates</th>
                <th className="py-3 px-3">Total Days</th>
                <th className="py-3 px-3">Reason</th>

                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {userRequests.map((req) => {
                const status = getLeaveStatus(req);
                return (
                <tr key={req.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-3.5 px-3 font-bold text-emerald-700 whitespace-nowrap">
                    {req.type}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                    {req.startDate} to {req.endDate}
                  </td>
                  <td className="py-3.5 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                    {req.daysCount} {req.daysCount === 1 ? 'day' : 'days'}
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 max-w-xs truncate" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${status === 'active'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : status === 'upcoming'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {status === 'upcoming' && (
                        <button
                          onClick={() => {
                            onCancelLeave(req.id);
                            onShowToast('Cancelled Leave', 'Upcoming leave withdrawn.', 'info');
                          }}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Cancel Leave"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPLY LEAVE FORM MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleFormSubmit}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-emerald-400" />
                <span>Mark Leave</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-700 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Leave Type */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveRequest['type'])}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {leaveTypes.filter(lt => lt.status === 'active').map(lt => (
                    <option key={lt.id} value={lt.name}>
                      {lt.name} {lt.isPaid ? '(Paid)' : '(Unpaid)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  className="rounded border-slate-300 bg-slate-50 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="halfDay" className="text-slate-600 font-medium">
                  Request as Half-Day Leave
                </label>
              </div>

              {/* Total Requested Preview */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-300 flex justify-between items-center text-slate-200 font-bold">
                <span>Calculated Working Days:</span>
                <span className="text-emerald-400 text-sm">{daysRequested} Days</span>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  Reason / Description
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-700 text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold shadow-lg shadow-emerald-600/30 text-white"
              >
                Mark Leave
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
