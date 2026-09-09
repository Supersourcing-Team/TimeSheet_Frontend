import { Pagination } from '../common/Pagination';
import React from 'react';
import { User, LeaveBalance, LeaveRequest, LeaveTypeConfig } from '../../types';
import {
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
  leaveRequests,
  onCancelLeave,
  onShowToast,
}) => {
  const userRequests = (leaveRequests || []).filter((r) => r.userId === currentUser.id);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const paginatedRequests = userRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getLeaveStatus = (req: LeaveRequest) => {
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    today.setHours(0, 0, 0, 0);

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
            View your past and upcoming leaves history.
          </p>
        </div>
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
              {paginatedRequests.map((req) => {
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
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          status === 'active'
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
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={userRequests.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};
