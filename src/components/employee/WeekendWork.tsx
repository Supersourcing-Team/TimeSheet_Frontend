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
  Zap,
} from 'lucide-react';

interface WeekendWorkProps {
  currentUser: User;
  projects: Project[];
  weekendRequests: WeekendWorkRequest[];
  holidays: any[];
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
  
  // Work Summary & Hours state
  const [billableHours, setBillableHours] = useState<number>(6.0);
  const [billableSummary, setBillableSummary] = useState('');
  const [nonBillableHours, setNonBillableHours] = useState<number>(0);
  const [nonBillableSummary, setNonBillableSummary] = useState('');
  const [objective, setObjective] = useState('');

  const totalHours = (Number(billableHours) || 0) + (Number(nonBillableHours) || 0);

  const userRequests = (weekendRequests || []).filter((r) => r.userId === currentUser.id);

  const approvedHours = userRequests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + (r.plannedHours || (r.billableHours || 0) + (r.nonBillableHours || 0)), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      onShowToast('Project Required', 'Please select an assigned project.', 'error');
      return;
    }

    if (totalHours <= 0) {
      onShowToast('Hours Required', 'Please specify billable or non-billable hours worked.', 'error');
      return;
    }

    if (billableHours > 0 && !billableSummary.trim()) {
      onShowToast('Summary Required', 'Please provide a summary for billable hours worked.', 'error');
      return;
    }

    const selectedProj = assignedProjects.find((p) => p.id === projectId);
    const mainObjective = objective.trim() || billableSummary.trim() || nonBillableSummary.trim() || 'Weekend Overtime Work';

    onRequestWeekendWork({
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      projectId,
      projectName: selectedProj?.name || 'Project Assignment',
      workDate,
      plannedHours: totalHours,
      billableHours: Number(billableHours) || 0,
      billableWorkSummary: billableSummary.trim(),
      nonBillableHours: Number(nonBillableHours) || 0,
      nonBillableWorkSummary: nonBillableSummary.trim(),
      deliverableObjective: mainObjective,
      status: 'pending',
      requestedOn: new Date().toISOString().split('T')[0],
    });

    onShowToast(
      'Weekend Request Submitted',
      'Request with work summary submitted. Once approved by your PM, it will automatically reflect in your timesheet.',
      'success'
    );

    // Reset form
    setBillableSummary('');
    setNonBillableSummary('');
    setObjective('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Moon className="w-6 h-6 text-indigo-300" />
              <span>Weekend Work & Overtime Timesheet</span>
            </h2>
            <p className="text-xs text-slate-300">
              Submit your weekend work with task summaries. When your Project Manager approves, it automatically logs your timesheet!
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 text-xs font-bold w-max flex items-center gap-1.5 backdrop-blur-xs">
            <Zap className="w-3.5 h-3.5 text-indigo-300" />
            <span>Auto-Timesheet on PM Approval</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 flex items-start gap-3 text-xs text-slate-200 backdrop-blur-xs">
          <p className="leading-relaxed">
            <strong className="text-blue-200 font-extrabold">Streamlined Flow:</strong> Fill in your weekend hours and task breakdown below. Once approved by your PM, you will <strong className="underline decoration-blue-300/50 text-white">not need to submit a separate timesheet</strong>—it will automatically populate in your timesheet history and logs.
          </p>
        </div>
      </div>

      {/* Grid Form & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form 2/3 */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-md space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center justify-between">
            <span>Submit Weekend Work & Timesheet Details</span>
            <span className="text-xs font-black text-blue-600">Total: {totalHours.toFixed(1)} hrs</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Dropdown */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Assigned Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  required
                >
                  {assignedProjects.length === 0 ? (
                    <option value="">No active project assignments</option>
                  ) : (
                    assignedProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Work Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Weekend Date (Sat / Sun / Holiday) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Billable Section */}
            <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Billable Client Work</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Hours:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={billableHours === 0 ? '' : billableHours}
                    onChange={(e) => setBillableHours(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-20 bg-white border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <textarea
                rows={2}
                value={billableSummary}
                onChange={(e) => setBillableSummary(e.target.value)}
                placeholder="Describe client deliverable tasks completed (features built, bugs fixed, deploy work)..."
                className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
              />
            </div>

            {/* Non-Billable Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-700 text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Non-Billable Internal Work (Optional)</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Hours:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={nonBillableHours === 0 ? '' : nonBillableHours}
                    onChange={(e) => setNonBillableHours(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <textarea
                rows={2}
                value={nonBillableSummary}
                onChange={(e) => setNonBillableSummary(e.target.value)}
                placeholder="Internal sync, documentation, tech research, or setup..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-500 focus:outline-none text-xs"
              />
            </div>

            {/* General Reason / Objective (Optional override) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Overall Justification / Reason <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="e.g. Critical release deployment and performance tuning for milestone delivery"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={assignedProjects.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Weekend Work Request</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Stats 1/3 */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Weekend Work Stats
            </h4>

            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
              <p className="text-[10px] font-bold text-slate-600">Approved Weekend Hours</p>
              <p className="text-2xl font-black text-blue-600">{approvedHours.toFixed(1)} hrs</p>
              <p className="text-[10px] text-slate-500">Automatically reflected in your timesheet</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p className="text-[10px] font-bold text-slate-600">Pending PM Approval</p>
              <p className="text-2xl font-black text-slate-900">
                {userRequests.filter((r) => r.status === 'pending').length} Requests
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md space-y-4 text-xs">
        <h3 className="text-base font-extrabold text-slate-900">Weekend Work History</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Billable Work</th>
                <th className="py-2.5 px-3 text-center">Billable / Non-Billable</th>
                <th className="py-2.5 px-3 text-right">Total Hours</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No weekend work requests submitted yet.
                  </td>
                </tr>
              ) : (
                userRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {req.workDate}
                    </td>
                    <td className="py-3 px-3 font-semibold text-blue-600 whitespace-nowrap">
                      {req.projectName}
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs">
                      <p className="font-semibold text-slate-800 truncate" title={req.deliverableObjective}>
                        {req.deliverableObjective}
                      </p>
                      {req.billableWorkSummary && req.billableWorkSummary !== req.deliverableObjective && (
                        <p className="text-[10px] text-slate-500 truncate" title={req.billableWorkSummary}>
                          {req.billableWorkSummary}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap font-medium text-slate-600">
                      <span className="text-blue-700 font-bold">{req.billableHours || 0}h</span>
                      <span className="text-slate-400"> / </span>
                      <span className="text-slate-600">{req.nonBillableHours || 0}h</span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {(req.plannedHours || (req.billableHours || 0) + (req.nonBillableHours || 0)).toFixed(1)}h
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          req.status === 'approved'
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
