import React, { useState } from 'react';
import { User, Project, WeekendWorkRequest } from '../../types';
import {
  Moon,
  Plus,
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';

interface WeekendWorkProps {
  currentUser: User;
  projects: Project[];
  weekendRequests: WeekendWorkRequest[];
  holidays: any[]; // Or import HolidayItem
  onRequestWeekendWork: (request: Omit<WeekendWorkRequest, 'id'>) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const WeekendWork: React.FC<WeekendWorkProps> = ({
  currentUser,
  projects,
  weekendRequests,
  holidays,
  onRequestWeekendWork,
  onShowToast,
}) => {
  const safeProjects = projects || [];
  const assignedProjects = safeProjects.filter((p) => p.assignedUserIds?.includes(currentUser.id));
  const [projectId, setProjectId] = useState(assignedProjects[0]?.id || '');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedHours, setPlannedHours] = useState(6.0);
  const [objective, setObjective] = useState(
    'Deploy Zero-Downtime database migration script for Sprint 14 release.'
  );

  const userRequests = (weekendRequests || []).filter((r) => r.userId === currentUser.id);

  const approvedHours = userRequests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.plannedHours, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if weekend
    const [year, month, dayStr] = workDate.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(dayStr));
    const day = dateObj.getDay(); // 0 = Sun, 6 = Sat
    const isHoliday = holidays.some((h) => h.date === workDate);

    if (day !== 0 && day !== 6 && !isHoliday) {
      onShowToast(
        'Date Validation Error',
        'Selected date is a weekday and not a holiday. Please pick a weekend or a holiday.',
        'error'
      );
      return;
    }

    const proj = projects.find((p) => p.id === projectId);

    onRequestWeekendWork({
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      projectId,
      projectName: proj?.name || 'General Project',
      workDate,
      plannedHours,
      deliverableObjective: objective,
      status: 'pending',
      requestedOn: new Date().toISOString().split('T')[0],
    });

    onShowToast(
      'Weekend Request Submitted',
      `Requested ${plannedHours} hours for ${workDate}. Awaiting PM approval.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Guideline Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Weekend Work Pre-Approvals</h2>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
            Policy Compliant
          </span>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-slate-200">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-300 font-extrabold">Enterprise Guideline:</strong> All weekend overtime requires PM pre-authorization 24 hours prior to work execution. Approved weekend hours are compensated at 1.5x overtime billing or eligible for compensatory off credits.
          </p>
        </div>
      </div>

      {/* Grid Form & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form 2/3 */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-lg space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200">
            Submit New Weekend Work Request
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Dropdown */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  Project Assignment
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {assignedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  Weekend Date (Sat/Sun)
                </label>
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Planned Hours */}
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                Planned Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="16"
                value={plannedHours}
                onChange={(e) => setPlannedHours(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-black-slate-300 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            {/* Deliverable Objective */}
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                Specific Deliverable / Objective
              </label>
              <textarea
                rows={3}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Detail the critical tasks requiring weekend work..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-600/30 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Weekend Request</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Stats 1/3 */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-lg space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Weekend Work Stats
            </h4>

            <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-300/60 space-y-1">
              <p className="text-[10px] text-slate-500">Approved Weekend Hours This Month</p>
              <p className="text-2xl font-extrabold text-amber-500">{approvedHours} Hours</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-300/60 space-y-1">
              <p className="text-[10px] text-slate-500">Pending Requests</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {userRequests.filter((r) => r.status === 'pending').length} Requests
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-lg space-y-4 text-xs">
        <h3 className="text-base font-bold text-slate-900">Weekend Work History</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Objective</th>
                <th className="py-2.5 px-3 text-right">Planned Hours</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {userRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {req.workDate}
                  </td>
                  <td className="py-3 px-3 font-semibold text-blue-600 whitespace-nowrap">
                    {req.projectName}
                  </td>
                  <td className="py-3 px-3 text-slate-700 max-w-sm truncate" title={req.deliverableObjective}>
                    {req.deliverableObjective}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {req.plannedHours}h
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${req.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : req.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                    >
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
