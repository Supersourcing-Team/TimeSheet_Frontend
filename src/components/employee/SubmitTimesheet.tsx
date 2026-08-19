import React, { useState } from 'react';
import { User, Project, TimesheetEntry } from '../../types';
import { ProjectAssignment, TimesheetCreatePayload, useCreateTimesheetsMutation } from '../../store/api/dataApi';
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
} from 'lucide-react';

interface SubmitTimesheetProps {
  currentUser: User;
  projects: Project[];
  /** Project assignments for the current user — needed to resolve project_assignment_id */
  projectAssignments?: ProjectAssignment[];
  onUpdateTimesheet?: (entry: TimesheetEntry) => void;
  editingEntry?: TimesheetEntry | null;
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

export const SubmitTimesheet: React.FC<SubmitTimesheetProps> = ({
  currentUser,
  projects,
  projectAssignments = [],
  onSubmitTimesheet,
  onUpdateTimesheet,
  editingEntry,
  onClearEditing,
  onShowToast,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [createTimesheets, { isLoading: isSubmitting }] = useCreateTimesheetsMutation();
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
      projectId: projects[0]?.id || '',
      date: today,
      billableHours: 0,
      nonBillableHours: 0,
      billableDescription: '',
      nonBillableDescription: '',
    }];
  });

  const assignedProjects = (projects || []).filter((p) => p.assignedUserIds?.includes(currentUser.id));

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        projectId: assignedProjects[0]?.id || projects[0]?.id || '',
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
  const targetDayHours = 8.0;

  const handleSubmit = async () => {
    if (grandTotal < 8) {
      onShowToast('Validation Error', 'You must log a minimum of 8 hours per day.', 'error');
      return;
    }
    if (grandTotal > 24) {
      onShowToast('Validation Error', 'You cannot log more than 24 hours in a single day.', 'error');
      return;
    }

    if (editingEntry && onUpdateTimesheet) {
      const row = rows[0];
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
          projectId: projects[0]?.id || '',
          date: today,
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
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900 font-sans">
      {/* Header Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 font-medium text-xs border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Daily Work Logging & Overtime Accounting</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {editingEntry ? 'Edit Timesheet Entry' : 'Submit Daily Timesheet'}
          </h2>
          <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
            {editingEntry 
              ? 'Update your daily logged work hours and descriptions. Minimum 8 hours total.'
              : 'Record your daily project activity hours with separate client billable deliverables and internal non-billable overhead.'}
          </p>
        </div>
      </div>

      {/* Target Progress & Summary Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-600">
            <span>Daily Target:</span>
            <span className="font-black text-slate-900 font-mono">{targetDayHours.toFixed(1)} Hours</span>
            <span className="text-slate-300 mx-2">•</span>
            <span>Logged Today:</span>
            <span
              className={`font-black font-mono px-2 py-0.5 rounded ${
                grandTotal >= targetDayHours ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50'
              }`}
            >
              {grandTotal.toFixed(1)} Hours
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              Billable: <span className="font-mono font-black">{totalBillable.toFixed(1)}h</span>
            </span>
            <span className="text-slate-800 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
              Non-Billable: <span className="font-mono font-black">{totalNonBillable.toFixed(1)}h</span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              grandTotal >= targetDayHours ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(100, (grandTotal / targetDayHours) * 100)}%` }}
          />
        </div>

        {grandTotal < targetDayHours && (
          <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              You are currently <strong className="font-mono">{(targetDayHours - grandTotal).toFixed(1)} hours</strong> short of the 8.0h daily target.
            </span>
          </p>
        )}
      </div>

      {/* Task Rows Form */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Tasks Breakdown ({rows.length} {rows.length === 1 ? 'row' : 'rows'})</span>
          </h3>
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project Row</span>
          </button>
        </div>

        <div className="space-y-6">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4 relative"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Project Dropdown */}
                <div className="md:col-span-5 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Project
                  </label>
                  <select
                    value={row.projectId}
                    onChange={(e) => handleRowChange(idx, 'projectId', e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {assignedProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Input */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => handleRowChange(idx, 'date', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    value={row.billableHours}
                    onChange={(e) =>
                      handleRowChange(idx, 'billableHours', parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-white border border-emerald-300 text-emerald-800 font-extrabold rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Non-Billable Hours */}
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Non-Bill (h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={row.nonBillableHours}
                    onChange={(e) =>
                      handleRowChange(idx, 'nonBillableHours', parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-white border border-slate-300 text-slate-800 font-bold rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Delete Button */}
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200"
                    title="Remove Task Row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* SEPARATE DESCRIPTIONS FOR BILLABLE AND NON-BILLABLE HOURS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80">
                {/* Billable Work Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Billable Work Description / Client Scope</span>
                    <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Invoiced to Client
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    value={row.billableDescription}
                    onChange={(e) => handleRowChange(idx, 'billableDescription', e.target.value)}
                    placeholder="E.g. Built API endpoint, fixed payment bug, wrote design specs..."
                    className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Non-Billable Work Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                    <span>Non-Billable Description / Internal Notes</span>
                    <span className="text-[9px] text-slate-500 font-semibold bg-slate-200 px-1.5 py-0.5 rounded">
                      Internal Overhead
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    value={row.nonBillableDescription}
                    onChange={(e) => handleRowChange(idx, 'nonBillableDescription', e.target.value)}
                    placeholder="E.g. Daily standup meeting, local docker debugging, JIRA updates..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold"
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
              disabled={isSubmitting}
              onClick={() => handleSubmit()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 text-xs font-extrabold transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isSubmitting ? 'Saving...' : (editingEntry ? 'Update & Save' : 'Submit Timesheet')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
