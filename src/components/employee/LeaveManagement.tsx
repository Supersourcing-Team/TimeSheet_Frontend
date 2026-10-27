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
    <div className="space-y-6 text-slate-900 font-sans pb-12 relative">
      {/* 3D Ambient WebGL Accent */}
      <AmbientMesh opacity={0.05} color={0x6366f1} />

      {/* Top Bar Hero */}
      <section className="relative overflow-hidden rounded-[26px] border border-white/70 bg-gradient-to-r from-[#bfdbfe] via-[#c4b5fd] via-[#ddd6fe] to-[#fbcfe8] p-6 text-slate-900 shadow-[0_16px_45px_rgba(99,102,241,0.14)] sm:p-7">
        {/* Soft ambient glow */}
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-pink-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              My Leaves &amp; Absences
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
              Review your approved, pending, and upcoming leave requests and withdrawal history.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-xs font-black text-indigo-700 shadow-sm border border-white/80 backdrop-blur-md">
            <span>Total Requests: {userRequests.length}</span>
          </span>
        </div>
      </section>

      {/* Leave Request History Table */}
      <div className="p-6 rounded-[24px] border border-slate-200/90 bg-white/95 backdrop-blur-sm shadow-[0_10px_35px_rgba(30,50,90,0.055)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-950">My Leave History</h3>
          <span className="text-xs text-slate-500 font-extrabold">
            Total Logged: {userRequests.length}
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[9px] font-black bg-gradient-to-r from-slate-100/90 via-indigo-50/40 to-slate-100/90">
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
                  <tr key={req.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="w-fit rounded-full border border-indigo-200/60 bg-gradient-to-r from-indigo-50 to-violet-50 px-2.5 py-1 text-[9px] font-extrabold text-indigo-700 inline-block">
                        {req.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {req.startDate} to {req.endDate}
                    </td>
                    <td className="py-3.5 px-3 font-black text-slate-900 whitespace-nowrap">
                      {req.daysCount} {req.daysCount === 1 ? 'day' : 'days'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold capitalize border ${
                          status === 'active'
                            ? 'border-emerald-200/60 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-700'
                            : status === 'upcoming'
                            ? 'border-indigo-200/60 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700'
                            : 'border-slate-200 bg-slate-100 text-slate-600'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {status === 'upcoming' && (
                          <button
                            type="button"
                            onClick={() => {
                              onCancelLeave(req.id);
                              onShowToast('Cancelled Leave', 'Upcoming leave withdrawn.', 'info');
                            }}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors active:scale-95 cursor-pointer"
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
