import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  CalendarRange,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  useMarkLeaveFromTimesheetMutation,
  useGetLeaveTypesQuery,
  MarkLeavePayload,
} from '../../store/api/dataApi';

interface MarkLeaveModalProps {
  /** The currently selected date in YYYY-MM-DD format (pre-fills the form). */
  selectedDate: string;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

type DurationType = 'full_day' | 'half_day' | 'partial_day' | 'multiple_days';
type HalfPeriod = 'first' | 'second';

const DURATION_OPTIONS: { value: DurationType; label: string; desc: string }[] = [
  { value: 'full_day', label: 'Full Day', desc: 'Mark the entire day as leave.' },
  { value: 'half_day', label: 'Half Day', desc: 'First or second half. Up to 4h timesheet.' },
  { value: 'partial_day', label: 'Partial Day', desc: 'Specific time window. Max 2 hours.' },
  { value: 'multiple_days', label: 'Multiple Days', desc: 'Full-day leave for a date range.' },
];

export const MarkLeaveModal: React.FC<MarkLeaveModalProps> = ({
  selectedDate,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [durationType, setDurationType] = useState<DurationType>('full_day');
  const [halfPeriod, setHalfPeriod] = useState<HalfPeriod>('first');
  const [partialStart, setPartialStart] = useState('09:00');
  const [partialEnd, setPartialEnd] = useState('11:00');
  const [singleDate, setSingleDate] = useState(selectedDate);
  const [rangeStart, setRangeStart] = useState(selectedDate);
  const [rangeEnd, setRangeEnd] = useState(selectedDate);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: leaveTypes = [], isLoading: loadingTypes } = useGetLeaveTypesQuery();
  const activeLeaveTypes = leaveTypes.filter((lt) => lt.status === 'active');

  const [markLeave, { isLoading: isSaving }] = useMarkLeaveFromTimesheetMutation();

  const getPartialDuration = (): number => {
    const [sh, sm] = partialStart.split(':').map(Number);
    const [eh, em] = partialEnd.split(':').map(Number);
    return (eh * 60 + em - sh * 60 - sm) / 60;
  };

  const formatTime12h = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const suffix = h < 12 ? 'AM' : 'PM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:${String(m).padStart(2, '0')} ${suffix}`;
  };

  const validateAndBuild = (): MarkLeavePayload | null => {
    setValidationError(null);

    let finalLeaveTypeId = leaveTypeId;
    if (durationType !== 'multiple_days') {
      finalLeaveTypeId = activeLeaveTypes[0]?.id?.toString() || '';
    }

    if (!finalLeaveTypeId) {
      setValidationError('Please select a leave type or ensure active leave types exist.');
      return null;
    }

    if (durationType === 'partial_day') {
      const [sh, sm] = partialStart.split(':').map(Number);
      const [eh, em] = partialEnd.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      if (endMins <= startMins) {
        setValidationError('End time must be after start time.');
        return null;
      }
      const dur = (endMins - startMins) / 60;
      if (dur > 2) {
        setValidationError(`Maximum partial leave duration is 2 hours. You selected ${dur.toFixed(1)}h.`);
        return null;
      }
    }

    if (durationType === 'multiple_days') {
      if (!rangeStart || !rangeEnd) {
        setValidationError('Please select both start and end dates.');
        return null;
      }
      if (rangeStart > rangeEnd) {
        setValidationError('Start date must be before end date.');
        return null;
      }
    }

    const payload: MarkLeavePayload = {
      leave_type_id: Number(finalLeaveTypeId),
      leave_duration_type: durationType,
      reason: 'Marked from timesheet',
    };

    if (durationType === 'multiple_days') {
      payload.start_date = rangeStart;
      payload.end_date = rangeEnd;
    } else {
      payload.leave_date = singleDate;
    }

    if (durationType === 'half_day') payload.half_day_period = halfPeriod;
    if (durationType === 'partial_day') {
      payload.partial_start_time = partialStart;
      payload.partial_end_time = partialEnd;
    }

    return payload;
  };

  const handleSave = async () => {
    const payload = validateAndBuild();
    if (!payload) return;

    try {
      await markLeave(payload).unwrap();
      const labels: Record<DurationType, string> = {
        full_day: 'Full Day',
        half_day: halfPeriod === 'first' ? 'First Half' : 'Second Half',
        partial_day: `Partial (${formatTime12h(partialStart)} – ${formatTime12h(partialEnd)})`,
        multiple_days: `${rangeStart} to ${rangeEnd}`,
      };
      onShowToast('Leave Marked', `${labels[durationType]} leave recorded successfully.`, 'success');
      onSuccess();
    } catch (e: any) {
      const msg = e?.data?.message || e?.data?.detail || 'Failed to mark leave.';
      setValidationError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-rose-600 to-rose-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight">Mark Leave</h2>
              <p className="text-xs text-rose-100 mt-0.5">
                {durationType === 'multiple_days' ? 'Select date range' : `Date: ${selectedDate}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-rose-700/40 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Leave Type Selector (Only for Multiple Days) */}
          {durationType === 'multiple_days' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Leave Type</label>
              {loadingTypes ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : (
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-rose-400 focus:outline-none"
                >
                  <option value="">— Select leave type —</option>
                  {activeLeaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Duration Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Duration Type</label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDurationType(opt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    durationType === opt.value
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {durationType === opt.value && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Full Day */}
          {durationType === 'full_day' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-rose-700">Full Day Leave</p>
                  <p className="text-[10px] text-rose-600 mt-0.5">Timesheet entry will be blocked for this date.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Half Day */}
          {durationType === 'half_day' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>
              </div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Which half?</label>
              <div className="grid grid-cols-2 gap-3">
                {(['first', 'second'] as HalfPeriod[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setHalfPeriod(p)}
                    className={`p-3.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                      halfPeriod === p
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300'
                    }`}
                  >
                    {p === 'first' ? '🌅 First Half' : '🌇 Second Half'}
                    <p className="text-[10px] font-normal text-slate-400 mt-0.5">
                      {p === 'first' ? '9:00 AM – 1:00 PM' : '1:00 PM – 6:00 PM'}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                You can log up to 4h of timesheet for the remaining half.
              </p>
            </div>
          )}

          {/* Partial Day */}
          {durationType === 'partial_day' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>
              </div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Time Window (Max 2h)</label>
              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">From</label>
                  <input
                    type="time"
                    value={partialStart}
                    onChange={(e) => setPartialStart(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">To</label>
                  <input
                    type="time"
                    value={partialEnd}
                    onChange={(e) => setPartialEnd(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>
              </div>
              {(() => {
                const dur = getPartialDuration();
                const isOver = dur > 2;
                const isZeroOrNeg = dur <= 0;
                return !isZeroOrNeg ? (
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-[11px] font-semibold ${isOver ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {isOver
                      ? `⚠ ${dur.toFixed(1)}h exceeds the 2-hour maximum.`
                      : `Duration: ${dur.toFixed(1)}h — ${formatTime12h(partialStart)} to ${formatTime12h(partialEnd)}`}
                  </div>
                ) : null;
              })()}
              <p className="text-[10px] text-slate-500">Maximum partial leave is 2 hours per day.</p>
            </div>
          )}

          {/* Multiple Days */}
          {durationType === 'multiple_days' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={rangeStart}
                    max={today}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">End Date</label>
                  <input
                    type="date"
                    value={rangeEnd}
                    max={today}
                    min={rangeStart}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                All working days in this range will be marked as full-day leave.
              </p>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-semibold">{validationError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !leaveTypeId}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Leave'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

