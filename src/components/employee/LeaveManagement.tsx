import { Pagination } from '../common/Pagination';
import React from 'react';
import { User, LeaveBalance, LeaveRequest, LeaveTypeConfig } from '../../types';
import { Trash2 } from 'lucide-react';
import { AmbientMesh } from '../3d/AmbientMesh';
import { Badge } from '../ui/badge';

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
    <div className="space-y-6 relative">
      {/* 3D Ambient WebGL Accent */}
      <AmbientMesh opacity={0.05} color={0x0891b2} />

      {/* Top Bar Hero */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>My Leaves</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            View your past and upcoming leaves history.
          </p>
        </div>
      </div>

      {/* Leave Request History Table */}
      <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="text-base font-extrabold text-slate-900">My Leave History</h3>
          <span className="text-xs text-slate-500 font-semibold">
            Total Leaves: {userRequests.length}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Dates</th>
                <th className="py-3 px-3">Total Days</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRequests.map((req) => {
                const status = getLeaveStatus(req);
                return (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-sky-700 whitespace-nowrap">
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
                      <Badge
                        variant={
                          status === 'active'
                            ? 'default'
                            : status === 'upcoming'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {status === 'upcoming' && (
                          <button
                            onClick={() => {
                              onCancelLeave(req.id);
                              onShowToast('Cancelled Leave', 'Upcoming leave withdrawn.', 'info');
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors active:scale-95"
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
