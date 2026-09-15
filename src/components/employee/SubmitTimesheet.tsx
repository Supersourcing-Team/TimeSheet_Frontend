import React, { useState, useEffect } from 'react';
import { User, Project, TimesheetEntry } from '../../types';
import { ProjectAssignment, TimesheetCreatePayload, useCreateTimesheetsMutation, useGetLeaveForDateQuery, useGetHolidaysQuery } from '../../store/api/dataApi';
import { MarkLeaveModal } from './MarkLeaveModal';
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Sparkles,
  Info,
  FileText,
  Loader2,
  ChevronRight,
  Lightbulb,
  ArrowRight,
  Calculator,
  Smartphone,
  Layout,
  Database,
  Layers,
  Bot,
  CalendarX,
  ExternalLink,
} from 'lucide-react';

interface SubmitTimesheetProps {
  currentUser: User;
  projects: Project[];
  timesheets?: TimesheetEntry[];
  onNavigateTab?: (tab: string) => void;
  /** Project assignments for the current user — needed to resolve project_assignment_id */
  projectAssignments?: ProjectAssignment[];
  onUpdateTimesheet?: (entry: TimesheetEntry) => void;
  editingEntry?: TimesheetEntry | null;
  defaultDate?: string | null;
  initialOpenMarkLeave?: boolean;
  onCloseMarkLeaveModal?: () => void;
  onClearEditing?: () => void;
  onSubmitTimesheet: (entries: Omit<TimesheetEntry, 'id'>[]) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

interface FormRow {
  projectId: string;
  date: string;
  billableHours: number;
  nonBillableHours: number;
  billableDescription: string;
  nonBillableDescription: string;
}

const PROJECT_ICON_STYLES = [
  { icon: Calculator, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { icon: Smartphone, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { icon: Layout, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  { icon: Database, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { icon: Bot, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  { icon: Layers, bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
];

export const SubmitTimesheet: React.FC<SubmitTimesheetProps> = ({
  currentUser,
  projects,
  timesheets = [],
  onNavigateTab,
  projectAssignments = [],
  onSubmitTimesheet,
  onUpdateTimesheet,
  editingEntry,
  defaultDate,
  initialOpenMarkLeave,
  onCloseMarkLeaveModal,
  onClearEditing,
  onShowToast,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [showMarkLeaveModal, setShowMarkLeaveModal] = useState(false);

  useEffect(() => {
    if (initialOpenMarkLeave) {
      setShowMarkLeaveModal(true);
      if (onCloseMarkLeaveModal) {
        onCloseMarkLeaveModal();
      }
    }
  }, [initialOpenMarkLeave, onCloseMarkLeaveModal]);
  
  const [createTimesheets, { isLoading: isSubmitting }] = useCreateTimesheetsMutation();
  const assignedProjects = (projects || []).filter((p) => p.assignedUserIds?.includes(currentUser.id));
  const displaySidebarProjects = assignedProjects;

  // Sync initial empty projectId when projects load
  useEffect(() => {
    if (assignedProjects.length > 0 && rows.length > 0 && !rows[0].projectId) {
      setRows(prev => prev.map((r, i) => i === 0 ? { ...r, projectId: assignedProjects[0].id } : r));
    }
  }, [assignedProjects]);

  const [rows, setRows] = useState<FormRow[]>(() => {
    if (editingEntry) {
      return [{
        projectId: editingEntry.projectId,
        date: editingEntry.date,
        billableHours: editingEntry.billableHours,
        nonBillableHours: editingEntry.nonBillableHours,
        billableDescription: editingEntry.billableDescription || editingEntry.description || '',
        nonBillableDescription: editingEntry.nonBillableDescription || '',
      }];
    }
    return [{
      projectId: assignedProjects[0]?.id || '',
      date: defaultDate || today,
      billableHours: 0,
      nonBillableHours: 0,
      billableDescription: '',
      nonBillableDescription: '',
    }];
  });

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        projectId: assignedProjects[0]?.id || '',
        date: today,
        billableHours: 2.0,
        nonBillableHours: 0,
        billableDescription: '',
        nonBillableDescription: '',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) {
      onShowToast('Cannot remove', 'At least one task row is required.', 'error');
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = <K extends keyof FormRow>(
    index: number,
    field: K,
    value: FormRow[K]
  ) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const totalBillable = rows.reduce((sum, r) => sum + (Number(r.billableHours) || 0), 0);
  const totalNonBillable = rows.reduce((sum, r) => sum + (Number(r.nonBillableHours) || 0), 0);
  const grandTotal = totalBillable + totalNonBillable;

  // Fetch leave status for the primary date (first row) — used to derive minimum hours
  const primaryDate = rows[0]?.date || today;
  const { data: leaveStatus, refetch: refetchLeave } = useGetLeaveForDateQuery(primaryDate);
  const { data: holidaysList = [] } = useGetHolidaysQuery();

  const isWeekendSelected = rows.some((r) => {
    if (!r.date) return false;
    const d = new Date(r.date + 'T00:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
  });

  const matchedHoliday = rows.reduce<any>((found, r) => {
    if (found) return found;
    return (holidaysList || []).find((h) => h.date === r.date) || null;
  }, null);
  const isOnFullDayLeave = leaveStatus?.has_leave && leaveStatus.leave_duration_type === 'full_day';
  const effectiveMinHours = leaveStatus?.has_leave ? leaveStatus.available_hours : 8.0;
  const targetDayHours = effectiveMinHours;

  const handleSubmit = async () => {
    if (isWeekendSelected) {
      onShowToast('Weekend Work Required', 'Timesheet submission is not allowed on weekends. Please submit a Weekend Work Request under the Weekend Work tab.', 'error');
      return;
    }
    if (matchedHoliday) {
      onShowToast('Company Holiday', `Timesheet submission is not allowed on company holiday (${matchedHoliday.name}).`, 'error');
      return;
    }
    if (isOnFullDayLeave) {
      onShowToast('Leave Day', 'You are on full-day leave. Timesheet submission is not allowed.', 'error');
      return;
    }
    if (grandTotal < effectiveMinHours) {
      onShowToast('Validation Error', `You must log a minimum of ${effectiveMinHours.toFixed(1)} hours for this day.`, 'error');
      return;
    }
    if (grandTotal > 24) {
      onShowToast('Validation Error', 'You cannot log more than 24 hours in a single day.', 'error');
      return;
    }

    if (editingEntry && onUpdateTimesheet) {
      const row = rows[0];

      if (Number(row.billableHours) > 0 && !row.billableDescription.trim()) {
        onShowToast('Validation Error', 'Billable work description is required when billable hours are logged.', 'error');
        return;
      }

      if (Number(row.nonBillableHours) > 0 && !row.nonBillableDescription.trim()) {
        onShowToast('Validation Error', 'Non-billable work description is required when non-billable hours are logged.', 'error');
        return;
      }

      const targetProject = projects.find((p) => p.id === row.projectId);
      const updated: TimesheetEntry = {
        ...editingEntry,
        projectId: row.projectId,
        projectName: targetProject ? targetProject.name : editingEntry.projectName,
        date: row.date,
        billableHours: Number(row.billableHours),
        nonBillableHours: Number(row.nonBillableHours),
        category: editingEntry.category || 'Development',
        description: row.billableDescription || 'Updated work log',
        billableDescription: row.billableDescription,
        nonBillableDescription: row.nonBillableDescription,
      };

      try {
        onUpdateTimesheet(updated);
        if (onClearEditing) onClearEditing();
      } catch (err: any) {
        onShowToast('Error', 'Failed to update timesheet', 'error');
      }
      return;
    }

    // Build backend payloads — one per row
    const payloads: TimesheetCreatePayload[] = [];
    for (const row of rows) {
      const totalHours = Number(row.billableHours || 0) + Number(row.nonBillableHours || 0);
      if (totalHours === 0) continue;

      // Resolve project_assignment_id from the user's assignments
      const assignmentForProject = projectAssignments.find(
        (a) => String(a.project_id) === String(row.projectId)
      );

      if (!assignmentForProject) {
        onShowToast(
          'Assignment Missing',
          `You are not assigned to the selected project. Please contact your Project Manager.`,
          'error'
        );
        return;
      }

      if (Number(row.billableHours) > 0 && !row.billableDescription.trim()) {
        onShowToast('Validation Error', 'Billable work description is required when billable hours are logged.', 'error');
        return;
      }

      if (Number(row.nonBillableHours) > 0 && !row.nonBillableDescription.trim()) {
        onShowToast('Validation Error', 'Non-billable work description is required when non-billable hours are logged.', 'error');
        return;
      }

      const combinedWorkSummary = [
        row.billableDescription ? `[Billable] ${row.billableDescription}` : '',
        row.nonBillableDescription ? `[Non-Billable] ${row.nonBillableDescription}` : '',
      ]
        .filter(Boolean)
        .join(' | ') || 'Routine project work';

      payloads.push({
        project_assignment_id: assignmentForProject.id,
        timesheet_date: row.date,
        billable_hours: Number(row.billableHours),
        billable_work_summary: row.billableDescription || undefined,
        non_billable_hours: Number(row.nonBillableHours),
        non_billable_work_summary: row.nonBillableDescription || undefined,
      });
    }

    if (payloads.length === 0) {
      onShowToast('Validation Error', 'No valid timesheet rows to submit.', 'error');
      return;
    }

    try {
      await createTimesheets(payloads).unwrap();
      onShowToast(
        'Timesheet Submitted!',
        `Submitted ${grandTotal} hours.`,
        'success'
      );
      // Reset form after successful submit
      setRows([
        {
          projectId: assignedProjects[0]?.id || '',
          date: defaultDate || today,
          billableHours: 0,
          nonBillableHours: 0,
          billableDescription: '',
          nonBillableDescription: '',
        },
      ]);
    } catch (e: any) {
      const msg = e?.data?.detail || e?.data?.message || 'Failed to submit timesheets';
      onShowToast('Error', msg, 'error');
    }
  };

  return (
    <>
      <div className="w-full space-y-6 text-slate-900 font-sans pb-12">
        {/* Header Bar */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black tracking-tight">
              {editingEntry ? 'Edit Timesheet Entry' : 'Submit Daily Timesheet'}
            </h2>
            <p className="text-xs text-blue-100/90 max-w-3xl leading-relaxed">
              {editingEntry
                ? 'Update your daily logged work hours and descriptions.'
                : 'Record your daily project activity hours with separate client billable deliverables and internal non-billable overhead.'}
            </p>
          </div>
          {/* Mark Leave Button */}
          {!editingEntry && (
            <button
              type="button"
              onClick={() => setShowMarkLeaveModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-md shadow-rose-900/30 transition-all hover:scale-[1.02] active:scale-95 shrink-0 cursor-pointer"
            >
              <CalendarX className="w-4 h-4" />
              Mark Leave
            </button>
          )}
        </div>

        {/* Leave Banner */}
        {leaveStatus?.has_leave && (
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl border ${
              isOnFullDayLeave
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <CalendarX className={`w-5 h-5 shrink-0 ${isOnFullDayLeave ? 'text-red-500' : 'text-amber-500'}`} />
            <div className="text-xs font-semibold">
              <span className="font-extrabold">
                {isOnFullDayLeave
                  ? 'On Leave — Full Day'
                  : `On Leave — ${leaveStatus.leave_duration_type === 'half_day' ? 'Half Day' : 'Partial Day'}`}
              </span>
              {((leaveStatus as any).reason || (leaveStatus as any).leave_type) && <span className="opacity-75"> ({((leaveStatus as any).reason || (leaveStatus as any).leave_type)})</span>}
              <p className="text-[11px] font-normal opacity-90 mt-0.5">
                {isOnFullDayLeave
                  ? 'Timesheet submission is blocked for this date.'
                  : `You may log up to ${leaveStatus.available_hours} hours for this date.`}
              </p>
            </div>
          </div>
        )}

        {/* Weekend / Holiday Warnings */}
        {isWeekendSelected && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-extrabold text-amber-900">Weekend Date Selected</p>
              <p className="text-amber-800">Direct timesheet submission is not permitted on weekends. Weekend work requires prior PM approval through a Weekend Work Request.</p>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('weekend_work')}
                  className="inline-flex items-center gap-1.5 font-black text-amber-800 hover:text-amber-950 underline mt-1 cursor-pointer"
                >
                  <span>Go to Weekend Work Requests</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {matchedHoliday && (
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 flex items-start gap-3 shadow-xs">
            <CalendarX className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-extrabold text-orange-900">Company Holiday Selected ({matchedHoliday.name})</p>
              <p className="text-orange-800">Timesheet submission is disabled on official company holidays.</p>
            </div>
          </div>
        )}

        {/* Dynamic Target Indicator Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
              <span>
                Daily Target:{' '}
                <span className="text-slate-900 font-extrabold">{targetDayHours.toFixed(1)} Hours</span>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Logged Today:{' '}
                <span
                  className={`font-black px-2 py-0.5 rounded-md ${
                    grandTotal >= targetDayHours && targetDayHours > 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {grandTotal.toFixed(1)} Hours
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                Billable: {totalBillable.toFixed(1)}h
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Non-Billable: {totalNonBillable.toFixed(1)}h
              </span>
            </div>
          </div>

          {/* Dynamic Filling Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex shadow-inner">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    ((totalBillable) / (targetDayHours > 0 ? targetDayHours : 8)) * 100
                  )}%`,
                }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 rounded-l-full"
                title={`Billable: ${totalBillable.toFixed(1)}h`}
              />
              <div
                style={{
                  width: `${Math.min(
                    Math.max(
                      0,
                      100 - ((totalBillable) / (targetDayHours > 0 ? targetDayHours : 8)) * 100
                    ),
                    ((totalNonBillable) / (targetDayHours > 0 ? targetDayHours : 8)) * 100
                  )}%`,
                }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                title={`Non-Billable: ${totalNonBillable.toFixed(1)}h`}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold px-0.5">
              <span>0h</span>
              <span>{((targetDayHours > 0 ? targetDayHours : 8) / 2).toFixed(1)}h (50%)</span>
              <span>{(targetDayHours > 0 ? targetDayHours : 8).toFixed(1)}h Target (100%)</span>
            </div>
          </div>
        </div>

        {/* Main Work Entry Form Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-black text-sm text-slate-900 tracking-wide uppercase">
                Tasks Breakdown ({rows.length} {rows.length === 1 ? 'Row' : 'Rows'})
              </h3>
            </div>
            {!editingEntry && (
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer border border-blue-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project Row</span>
              </button>
            )}
          </div>

          {/* Task Rows List */}
          <div className="space-y-4">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4 transition-all hover:border-slate-300"
              >
                {/* Project, Date, Hours Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  {/* Project Selection */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Project
                    </label>
                    <select
                      value={row.projectId}
                      onChange={(e) => handleRowChange(idx, 'projectId', e.target.value)}
                      disabled={!!editingEntry}
                      className="w-full bg-white border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 cursor-pointer"
                    >
                      <option value="">Select a Project...</option>
                      {assignedProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code || `PRJ-${p.id}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Input */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Date
                    </label>
                    <input
                      type="date"
                      value={row.date}
                      max={today}
                      onChange={(e) => handleRowChange(idx, 'date', e.target.value)}
                      disabled={!!editingEntry}
                      className="w-full bg-white border border-slate-300 text-slate-800 font-bold rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 cursor-pointer"
                    />
                  </div>

                  {/* Billable Hours */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                      Billable (h)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="0"
                      value={row.billableHours === 0 ? '' : row.billableHours}
                      onChange={(e) =>
                        handleRowChange(idx, 'billableHours', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-white border border-emerald-300 text-emerald-800 font-extrabold rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Non-Billable Hours */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Non-Billable (h)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="0"
                      value={row.nonBillableHours === 0 ? '' : row.nonBillableHours}
                      onChange={(e) =>
                        handleRowChange(idx, 'nonBillableHours', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-white border border-slate-300 text-slate-800 font-bold rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      disabled={rows.length === 1}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove Task Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SEPARATE DESCRIPTIONS FOR BILLABLE AND NON-BILLABLE HOURS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200/80">
                  {/* Billable Work Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Billable Work Description / Client Scope</span>
                      <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        Invoiced to Client
                      </span>
                    </label>
                    <textarea
                      rows={8}
                      value={row.billableDescription}
                      onChange={(e) => handleRowChange(idx, 'billableDescription', e.target.value)}
                      placeholder="E.g. Built API endpoint, fixed payment bug, wrote design specs..."
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y shadow-2xs leading-relaxed"
                    />
                  </div>

                  {/* Non-Billable Work Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                      <span>Non-Billable Description / Internal Notes</span>
                      <span className="text-[9px] text-slate-500 font-semibold bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">
                        Internal Overhead
                      </span>
                    </label>
                    <textarea
                      rows={8}
                      value={row.nonBillableDescription}
                      onChange={(e) => handleRowChange(idx, 'nonBillableDescription', e.target.value)}
                      placeholder="E.g. Daily standup meeting, local docker debugging, JIRA updates..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y shadow-2xs leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit / Draft Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {!editingEntry ? (
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Additional Task Row</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onClearEditing) onClearEditing();
                  onShowToast('Edit Cancelled', 'Returned to new submission mode', 'info');
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
              >
                Cancel Edit
              </button>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting || isWeekendSelected || !!matchedHoliday}
                onClick={() => handleSubmit()}
                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 text-xs font-extrabold transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isSubmitting ? 'Saving...' : (editingEntry ? 'Update & Save' : 'Submit Timesheet')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mark Leave Modal */}
      {showMarkLeaveModal && (
        <MarkLeaveModal
          selectedDate={primaryDate}
          onClose={() => setShowMarkLeaveModal(false)}
          onSuccess={() => {
            setShowMarkLeaveModal(false);
            refetchLeave();
          }}
          onShowToast={onShowToast}
        />
      )}
    </>
  );
};
