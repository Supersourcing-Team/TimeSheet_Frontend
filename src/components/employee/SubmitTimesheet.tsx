import React, { useState, useEffect, useMemo } from 'react';
import { User, Project, TimesheetEntry } from '../../types';
import { ProjectAssignment, TimesheetCreatePayload, useCreateTimesheetsMutation, useGetLeaveForDateQuery, useGetHolidaysQuery, useGetWorkingCalendarQuery } from '../../store/api/dataApi';
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
  Calendar,
  Briefcase,
  ExternalLink,
  ListOrdered,
  Lock,
} from 'lucide-react';
import { AmbientMesh } from '../3d/AmbientMesh';

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
  milestoneId: string;
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

  // Dynamic lock window from Admin Working Calendar configuration
  const { data: workingCalendarConfig } = useGetWorkingCalendarQuery();
  const lockHours = workingCalendarConfig?.timesheetLockHours ?? 24;
  const maxPastDays = Math.max(1, Math.ceil(lockHours / 24));
  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() - maxPastDays);
  const minAllowedDate = minDateObj.toISOString().split('T')[0];

  useEffect(() => {
    if (initialOpenMarkLeave) {
      setShowMarkLeaveModal(true);
      if (onCloseMarkLeaveModal) {
        onCloseMarkLeaveModal();
      }
    }
  }, [initialOpenMarkLeave, onCloseMarkLeaveModal]);

  const [createTimesheets, { isLoading: isSubmitting }] = useCreateTimesheetsMutation();
  const assignedProjects = useMemo(
    () => (projects || []).filter((p) =>
      p.assignedUserIds?.includes(currentUser.id) &&
      p.isActive !== false &&
      p.is_active !== false
    ),
    [projects, currentUser.id]
  );
  const displaySidebarProjects = assignedProjects;

  const [rows, setRows] = useState<FormRow[]>(() => {
    if (editingEntry) {
      return [{
        projectId: editingEntry.projectId,
        milestoneId: editingEntry.milestoneId ? String(editingEntry.milestoneId) : '',
        date: editingEntry.date,
        billableHours: editingEntry.billableHours,
        nonBillableHours: editingEntry.nonBillableHours,
        billableDescription: editingEntry.billableDescription || editingEntry.description || '',
        nonBillableDescription: editingEntry.nonBillableDescription || '',
      }];
    }
    return [{
      projectId: '',
      milestoneId: '',
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
        projectId: '',
        milestoneId: '',
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
    if (field === 'projectId') {
      const targetProj = projects.find((p) => p.id === value);
      const projMilestones = (targetProj?.milestones || []).filter((m) => m.status !== 'achieved');
      updated[index].milestoneId = projMilestones.length === 1 ? String(projMilestones[0].id) : '';
    }
    setRows(updated);
  };

  const isNumberedList = (val: string) => {
    const nonBlank = val.split('\n').filter((l) => l.trim().length > 0);
    return nonBlank.length > 0 && nonBlank.every((l) => /^\s*\d+\.\s*/.test(l));
  };

  const toggleNumberFormat = (
    rowIndex: number,
    field: 'billableDescription' | 'nonBillableDescription'
  ) => {
    const currentVal = rows[rowIndex][field];
    if (!currentVal.trim()) {
      handleRowChange(rowIndex, field, '1. ');
      return;
    }
    const lines = currentVal.split('\n');
    const isNumbered = isNumberedList(currentVal);

    let itemIdx = 0;
    const formatted = lines.map((line) => {
      const clean = line.replace(/^(\s*)(•|-|\*|\d+\.)\s*/, '').trim();
      if (!clean) return line;
      itemIdx++;
      return isNumbered ? `• ${clean}` : `${itemIdx}. ${clean}`;
    });
    handleRowChange(rowIndex, field, formatted.join('\n'));
  };

  const handleDescriptionFocus = (
    e: React.FocusEvent<HTMLTextAreaElement>,
    rowIndex: number,
    field: 'billableDescription' | 'nonBillableDescription'
  ) => {
    const currentVal = rows[rowIndex][field];
    if (!currentVal || !currentVal.trim()) {
      handleRowChange(rowIndex, field, '• ');
      const target = e.currentTarget;
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = 2;
      }, 0);
    }
  };

  const handleDescriptionBlur = (
    rowIndex: number,
    field: 'billableDescription' | 'nonBillableDescription'
  ) => {
    const currentVal = rows[rowIndex][field];
    if (currentVal && !currentVal.replace(/^[•\s]+$/, '')) {
      handleRowChange(rowIndex, field, '');
    }
  };

  const handleDescriptionChange = (
    rowIndex: number,
    field: 'billableDescription' | 'nonBillableDescription',
    newVal: string
  ) => {
    const prevVal = rows[rowIndex][field];
    // If field was empty and user typed or pasted text without bullet/number prefix
    if (!prevVal && newVal.length > 0) {
      if (!newVal.startsWith('• ') && !/^\s*(\d+\.|-|\*)\s+/.test(newVal)) {
        if (newVal === '•' || newVal === '') {
          handleRowChange(rowIndex, field, '');
          return;
        }
        const formatted = newVal
          .split('\n')
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;
            if (/^\s*(•|-|\*|\d+\.)\s*/.test(line)) return line;
            return `• ${trimmed}`;
          })
          .join('\n');
        handleRowChange(rowIndex, field, formatted);
        return;
      }
    }
    handleRowChange(rowIndex, field, newVal);
  };

  const handleDescriptionPaste = (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    rowIndex: number,
    field: 'billableDescription' | 'nonBillableDescription'
  ) => {
    const pasteText = e.clipboardData.getData('text');
    if (!pasteText) return;

    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    const val = rows[rowIndex][field];

    const lines = pasteText.split(/\r?\n/);
    const hasBulletsOrNumbers = lines.some((l) => /^\s*(•|-|\*|\d+\.)\s+/.test(l));

    if (!hasBulletsOrNumbers && (lines.length > 1 || !val.trim())) {
      e.preventDefault();
      const formattedPaste = lines
        .map((line) => {
          const clean = line.trim();
          return clean ? `• ${clean}` : '';
        })
        .join('\n');

      const beforeCursor = val.substring(0, selectionStart);
      const afterCursor = val.substring(selectionEnd);
      const lastNewline = beforeCursor.lastIndexOf('\n');
      const currentLine = beforeCursor.substring(lastNewline + 1);

      if (currentLine === '• ') {
        const lineStart = lastNewline + 1;
        const newText = val.substring(0, lineStart) + formattedPaste + afterCursor;
        handleRowChange(rowIndex, field, newText);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart + formattedPaste.length;
        }, 0);
        return;
      }

      const newText = beforeCursor + formattedPaste + afterCursor;
      handleRowChange(rowIndex, field, newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + formattedPaste.length;
      }, 0);
    }
  };

  const handleSummaryKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    rowIndex: number,
    field: 'billableDescription' | 'nonBillableDescription'
  ) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    const val = rows[rowIndex][field];

    // Clean backspace when cursor is right after "• "
    if (e.key === 'Backspace' && selectionStart === selectionEnd) {
      const beforeCursor = val.substring(0, selectionStart);
      const afterCursor = val.substring(selectionEnd);
      const lastNewline = beforeCursor.lastIndexOf('\n');
      const currentLine = beforeCursor.substring(lastNewline + 1);

      if (currentLine === '• ') {
        e.preventDefault();
        const lineStart = lastNewline + 1;
        const newText = val.substring(0, lineStart) + afterCursor;
        handleRowChange(rowIndex, field, newText);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart;
        }, 0);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const beforeCursor = val.substring(0, selectionStart);
      const afterCursor = val.substring(selectionEnd);
      const lastNewline = beforeCursor.lastIndexOf('\n');
      const currentLine = beforeCursor.substring(lastNewline + 1);

      // Check bullet prefix
      const bulletMatch = currentLine.match(/^(\s*)(•|-|\*)\s+/);
      if (bulletMatch) {
        e.preventDefault();
        const prefix = bulletMatch[0];
        const content = currentLine.substring(prefix.length).trim();

        if (!content) {
          const lineStart = lastNewline + 1;
          const newText = val.substring(0, lineStart) + afterCursor;
          handleRowChange(rowIndex, field, newText);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart;
          }, 0);
          return;
        }

        const insert = '\n• ';
        const newText = beforeCursor + insert + afterCursor;
        handleRowChange(rowIndex, field, newText);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + insert.length;
        }, 0);
        return;
      }

      // Check numbered list prefix
      const numMatch = currentLine.match(/^(\s*)(\d+)\.\s+/);
      if (numMatch) {
        e.preventDefault();
        const prefix = numMatch[0];
        const currentNum = parseInt(numMatch[2], 10);
        const content = currentLine.substring(prefix.length).trim();

        if (!content) {
          const lineStart = lastNewline + 1;
          const newText = val.substring(0, lineStart) + afterCursor;
          handleRowChange(rowIndex, field, newText);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart;
          }, 0);
          return;
        }

        const insert = `\n${currentNum + 1}. `;
        const newText = beforeCursor + insert + afterCursor;
        handleRowChange(rowIndex, field, newText);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + insert.length;
        }, 0);
        return;
      }

      // Default to bullet on next line when typing in description
      if (currentLine.trim()) {
        e.preventDefault();
        const insert = '\n• ';
        const newText = beforeCursor + insert + afterCursor;
        handleRowChange(rowIndex, field, newText);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + insert.length;
        }, 0);
        return;
      }
    }
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

    const isLockedDate = rows.some((r) => r.date < minAllowedDate);
    if (isLockedDate) {
      onShowToast(
        'Submission Locked',
        `Timesheet submission is locked for dates older than ${lockHours} hours (${minAllowedDate}). Please contact your Project Manager or Admin.`,
        'error'
      );
      return;
    }

    if (editingEntry && onUpdateTimesheet) {
      const row = rows[0];

      if (!row.projectId) {
        onShowToast('Validation Error', 'Please select a project.', 'error');
        return;
      }

      const hasRealText = (desc: string) => desc.replace(/[•\s-]/g, '').length > 0;

      if (Number(row.billableHours) > 0 && !hasRealText(row.billableDescription)) {
        onShowToast('Validation Error', 'Billable work description is required when billable hours are logged.', 'error');
        return;
      }

      if (Number(row.nonBillableHours) > 0 && !hasRealText(row.nonBillableDescription)) {
        onShowToast('Validation Error', 'Non-billable work description is required when non-billable hours are logged.', 'error');
        return;
      }

      const targetProject = projects.find((p) => p.id === row.projectId);
      const activeMilestones = (targetProject?.milestones || []).filter(
        (m) => m.status !== 'achieved' || String(m.id) === String(row.milestoneId)
      );
      if (activeMilestones.length > 0 && !row.milestoneId) {
        onShowToast('Validation Error', `Please select a milestone for project "${targetProject?.name}".`, 'error');
        return;
      }

      const targetMilestone = targetProject?.milestones?.find((m) => String(m.id) === String(row.milestoneId));
      const cleanDesc = (text: string) =>
        text
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l && l !== '•')
          .join('\n');

      const cleanedBillable = cleanDesc(row.billableDescription);
      const cleanedNonBillable = cleanDesc(row.nonBillableDescription);

      const updated: TimesheetEntry = {
        ...editingEntry,
        projectId: row.projectId,
        projectName: targetProject ? targetProject.name : editingEntry.projectName,
        milestoneId: row.milestoneId ? Number(row.milestoneId) : undefined,
        milestoneName: targetMilestone?.name,
        date: row.date,
        billableHours: Number(row.billableHours),
        nonBillableHours: Number(row.nonBillableHours),
        category: editingEntry.category || 'Development',
        description: cleanedBillable || 'Updated work log',
        billableDescription: cleanedBillable,
        nonBillableDescription: cleanedNonBillable,
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

      if (!row.projectId) {
        onShowToast('Validation Error', 'Please select a project for all active rows.', 'error');
        return;
      }

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

      const targetProject = projects.find((p) => String(p.id) === String(row.projectId));
      const activeMilestones = (targetProject?.milestones || []).filter(
        (m) => m.status !== 'achieved' || String(m.id) === String(row.milestoneId)
      );
      if (activeMilestones.length > 0 && !row.milestoneId) {
        onShowToast(
          'Validation Error',
          `Milestone selection is required for project "${targetProject?.name || 'Selected Project'}".`,
          'error'
        );
        return;
      }

      const hasRealText = (desc: string) => desc.replace(/[•\s-]/g, '').length > 0;

      if (Number(row.billableHours) > 0 && !hasRealText(row.billableDescription)) {
        onShowToast('Validation Error', 'Billable work description is required when billable hours are logged.', 'error');
        return;
      }

      if (Number(row.nonBillableHours) > 0 && !hasRealText(row.nonBillableDescription)) {
        onShowToast('Validation Error', 'Non-billable work description is required when non-billable hours are logged.', 'error');
        return;
      }

      const cleanDesc = (text: string) =>
        text
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l && l !== '•')
          .join('\n');

      const cleanedBillable = cleanDesc(row.billableDescription);
      const cleanedNonBillable = cleanDesc(row.nonBillableDescription);

      const combinedWorkSummary = [
        cleanedBillable ? `[Billable] ${cleanedBillable}` : '',
        cleanedNonBillable ? `[Non-Billable] ${cleanedNonBillable}` : '',
      ]
        .filter(Boolean)
        .join(' | ') || 'Routine project work';

      payloads.push({
        project_assignment_id: assignmentForProject.id,
        timesheet_date: row.date,
        milestone_id: row.milestoneId ? Number(row.milestoneId) : undefined,
        billable_hours: Number(row.billableHours),
        billable_work_summary: cleanedBillable || undefined,
        non_billable_hours: Number(row.nonBillableHours),
        non_billable_work_summary: cleanedNonBillable || undefined,
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
          milestoneId: '',
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
      <div className="w-full space-y-6 text-slate-900 font-sans pb-12 relative">
        {/* 3D Ambient WebGL Accent */}
        <AmbientMesh opacity={0.05} color={0x6366f1} />

        {/* Header Bar */}
        <div className="p-5 bg-white/85 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {editingEntry ? 'Edit Timesheet Entry' : 'Submit Daily Timesheet'}
            </h2>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
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
              className="flex items-center gap-2 px-3.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
            >
              <CalendarX className="w-4 h-4" />
              <span>Mark Leave</span>
            </button>
          )}
        </div>

        {/* Leave Banner */}
        {leaveStatus?.has_leave && (
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl border ${isOnFullDayLeave
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
        <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 shadow-2xs space-y-3">
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
                  className={`font-black px-2.5 py-0.5 rounded-md border ${
                    grandTotal >= targetDayHours && targetDayHours > 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {grandTotal.toFixed(1)} Hours
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                Billable: {totalBillable.toFixed(1)}h
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                Non-Billable: {totalNonBillable.toFixed(1)}h
              </span>
            </div>
          </div>

          {/* Dynamic Filling Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden flex shadow-inner">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    ((totalBillable) / (targetDayHours > 0 ? targetDayHours : 8)) * 100
                  )}%`,
                }}
                className="h-full bg-emerald-500 transition-all duration-300"
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
                className="h-full bg-slate-400 transition-all duration-300"
                title={`Non-Billable: ${totalNonBillable.toFixed(1)}h`}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold px-0.5">
              <span>0h</span>
              <span>{((targetDayHours > 0 ? targetDayHours : 8) / 2).toFixed(1)}h (50%)</span>
              <span>{(targetDayHours > 0 ? targetDayHours : 8).toFixed(1)}h Target (100%)</span>
            </div>
          </div>
        </div>

        {/* Main Work Entry Form Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100/70">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-wide uppercase">
                Tasks Breakdown ({rows.length} {rows.length === 1 ? 'Row' : 'Rows'})
              </h3>
            </div>
            {!editingEntry && (
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-subtle hover:bg-primary/15 text-primary font-bold text-xs transition-colors cursor-pointer border border-primary-subtle-border shadow-2xs"
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
                className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-4 transition-all hover:border-slate-300"
              >
                {/* Project, Milestone, Date Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                  {/* Project Selection */}
                  <div className="md:col-span-5 lg:col-span-4 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 h-4">
                      <Briefcase className="w-3.5 h-3.5 text-primary" />
                      <span>Project</span>
                    </label>
                    <select
                      value={row.projectId}
                      onChange={(e) => handleRowChange(idx, 'projectId', e.target.value)}
                      disabled={!!editingEntry}
                      required
                      className="w-full h-10 bg-slate-100/80 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 font-bold rounded-xl px-3 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none disabled:opacity-60 cursor-pointer shadow-2xs transition-colors"
                    >
                      <option value="">Select a Project...</option>
                      {assignedProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code || `PRJ-${p.id}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Milestone Selection */}
                  <div className="md:col-span-4 lg:col-span-4 space-y-1.5">
                    {(() => {
                      const targetProj = projects.find((p) => p.id === row.projectId);
                      const allMilestones = targetProj?.milestones || [];
                      const activeMilestones = allMilestones.filter(
                        (m) => m.status !== 'achieved' || String(m.id) === String(row.milestoneId)
                      );
                      const hasActive = activeMilestones.length > 0;
                      return (
                        <>
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between h-4">
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-primary" />
                              <span>Milestone</span>
                              {hasActive && <span className="text-rose-500 font-bold">*</span>}
                            </span>
                            {hasActive && (
                              <span className="text-[9px] text-primary font-semibold bg-primary-subtle px-1.5 py-0.5 rounded border border-primary-subtle-border">
                                {activeMilestones.length} Available
                              </span>
                            )}
                          </label>
                          <select
                            value={row.milestoneId || ''}
                            onChange={(e) => handleRowChange(idx, 'milestoneId', e.target.value)}
                            disabled={!!editingEntry || !row.projectId}
                            required={hasActive}
                            className="w-full h-10 bg-slate-100/80 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 font-medium rounded-xl px-3 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none disabled:opacity-60 cursor-pointer truncate shadow-2xs transition-colors"
                          >
                            <option value="">
                              {!row.projectId
                                ? 'Select a Project first'
                                : hasActive
                                  ? '-- Select Milestone --'
                                  : allMilestones.length > 0
                                    ? 'All Milestones Achieved'
                                    : 'No Milestones Configured'}
                            </option>
                            {activeMilestones.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.status.replace('_', ' ')})
                              </option>
                            ))}
                          </select>
                        </>
                      );
                    })()}
                  </div>

                  {/* Date Input */}
                  <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between h-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Date</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium" title={`Configured lock cutoff: within past ${lockHours} hours`}>
                        &ge; {minAllowedDate.slice(5)}
                      </span>
                    </label>
                    <input
                      type="date"
                      value={row.date}
                      min={minAllowedDate}
                      max={today}
                      onChange={(e) => handleRowChange(idx, 'date', e.target.value)}
                      disabled={!!editingEntry}
                      className="w-full h-10 bg-slate-100/80 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 font-bold rounded-xl px-3 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none disabled:opacity-60 cursor-pointer shadow-2xs transition-colors"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="md:col-span-1 flex flex-col justify-end items-center">
                    <div className="h-4" />
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      disabled={rows.length === 1}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors border border-rose-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                      title="Remove Task Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SEPARATE DESCRIPTIONS FOR BILLABLE AND NON-BILLABLE HOURS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  {/* Billable Work Column */}
                  <div className="p-4 rounded-xl bg-emerald-50/35 border-2 border-emerald-200/90 shadow-2xs space-y-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 transition-all flex flex-col justify-between">
                    {/* Billable Header & Hours Input Bar */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-100/60 border border-emerald-200/80 min-h-[48px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-200 shrink-0" />
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-wide truncate">
                          Billable Work
                        </span>
                        <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 shrink-0">
                          Client Scope
                        </span>
                      </div>

                      {/* Compact Hours Input Pill */}
                      <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border-2 border-emerald-300 shadow-2xs shrink-0">
                        <label className="text-[11px] font-black text-emerald-900 uppercase tracking-wider whitespace-nowrap">
                          Billable (h):
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          placeholder="0.0"
                          value={row.billableHours === 0 ? '' : row.billableHours}
                          onChange={(e) =>
                            handleRowChange(idx, 'billableHours', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                          }
                          className="w-18 h-7 text-center bg-emerald-50/80 hover:bg-white focus:bg-white border border-emerald-300 text-emerald-950 font-black rounded-md text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs transition-colors"
                        />
                        <span className="text-[11px] font-extrabold text-emerald-800">hrs</span>
                      </div>
                    </div>

                    {/* Billable Work Description Subheader & Textarea */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between min-h-[28px]">
                        <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                          <span>Deliverables &amp; Activities</span>
                          <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleNumberFormat(idx, 'billableDescription')}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${isNumberedList(row.billableDescription)
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                              : 'bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-800'
                            }`}
                          title="Toggle between numbered list and default bullets"
                        >
                          <ListOrdered className="w-3.5 h-3.5 text-emerald-700" />
                          <span>1. Numbers</span>
                        </button>
                      </div>

                      <textarea
                        rows={6}
                        value={row.billableDescription}
                        onFocus={(e) => handleDescriptionFocus(e, idx, 'billableDescription')}
                        onBlur={() => handleDescriptionBlur(idx, 'billableDescription')}
                        onChange={(e) => handleDescriptionChange(idx, 'billableDescription', e.target.value)}
                        onKeyDown={(e) => handleSummaryKeyDown(e, idx, 'billableDescription')}
                        onPaste={(e) => handleDescriptionPaste(e, idx, 'billableDescription')}
                        placeholder="• Built and deployed user auth API&#10;• Configured milestone endpoints&#10;• Unit tests in pytest"
                        className="w-full bg-white/95 border border-emerald-200/90 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none resize-y leading-relaxed font-mono shadow-2xs transition-colors"
                      />
                    </div>
                  </div>

                  {/* Non-Billable Work Column */}
                  <div className="p-4 rounded-xl bg-slate-100/50 border-2 border-slate-200/90 shadow-2xs space-y-3 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-400/15 transition-all flex flex-col justify-between">
                    {/* Non-Billable Header & Hours Input Bar */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-200/60 border border-slate-200/80 min-h-[48px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-slate-200 shrink-0" />
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wide truncate">
                          Non-Billable Work
                        </span>
                        <span className="text-[10px] text-slate-700 font-bold bg-slate-200/80 px-2 py-0.5 rounded-md border border-slate-300 shrink-0">
                          Internal Overhead
                        </span>
                      </div>

                      {/* Compact Hours Input Pill */}
                      <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border-2 border-slate-300 shadow-2xs shrink-0">
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider whitespace-nowrap">
                          Non-Bill (h):
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          placeholder="0.0"
                          value={row.nonBillableHours === 0 ? '' : row.nonBillableHours}
                          onChange={(e) =>
                            handleRowChange(idx, 'nonBillableHours', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                          }
                          className="w-18 h-7 text-center bg-slate-100 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 font-black rounded-md text-xs focus:ring-2 focus:ring-slate-400 focus:outline-none shadow-2xs transition-colors"
                        />
                        <span className="text-[11px] font-extrabold text-slate-700">hrs</span>
                      </div>
                    </div>

                    {/* Non-Billable Work Description Subheader & Textarea */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between min-h-[28px]">
                        <label className="text-[11px] font-bold text-slate-700">
                          Internal Tasks &amp; Meetings Description
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleNumberFormat(idx, 'nonBillableDescription')}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${isNumberedList(row.nonBillableDescription)
                              ? 'bg-slate-200 border-slate-300 text-slate-800'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          title="Toggle between numbered list and default bullets"
                        >
                          <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                          <span>1. Numbers</span>
                        </button>
                      </div>

                      <textarea
                        rows={6}
                        value={row.nonBillableDescription}
                        onFocus={(e) => handleDescriptionFocus(e, idx, 'nonBillableDescription')}
                        onBlur={() => handleDescriptionBlur(idx, 'nonBillableDescription')}
                        onChange={(e) => handleDescriptionChange(idx, 'nonBillableDescription', e.target.value)}
                        onKeyDown={(e) => handleSummaryKeyDown(e, idx, 'nonBillableDescription')}
                        onPaste={(e) => handleDescriptionPaste(e, idx, 'nonBillableDescription')}
                        placeholder="• Daily team sync and PM review&#10;• Environment setup and dependency resolution"
                        className="w-full bg-white/95 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-400 focus:border-slate-400 focus:outline-none resize-y leading-relaxed font-mono shadow-2xs transition-colors"
                      />
                    </div>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-subtle text-primary border border-primary-subtle-border hover:bg-primary/10 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
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
                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/25 text-xs font-extrabold transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
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
