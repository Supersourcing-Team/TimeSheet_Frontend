import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link2,
  Loader2,
  RefreshCw,
  ExternalLink,
  Hash,
  Clock,
  Heart,
  Globe,
  UserCheck,
  Edit,
  Building,
} from 'lucide-react';
import { BackendUser } from '../../utils/api';
import { KekaMappingPreviewItem } from '../../types';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'keka' | 'system';
  kekaDetails?: any;
  userDetails?: BackendUser | null;
  initialItem?: any;
  isLoading: boolean;
  error?: any;
  onRetry?: () => void;
  onSyncSingleKeka?: (item: KekaMappingPreviewItem) => void;
  isSyncingSingle?: boolean;
  onOpenEditUser?: (user: BackendUser) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  type,
  kekaDetails,
  userDetails,
  initialItem,
  isLoading,
  error,
  onRetry,
  onSyncSingleKeka,
  isSyncingSingle,
  onOpenEditUser,
}) => {
  if (!isOpen) return null;

  // Resolve display fields depending on type and loaded payload
  const isKeka = type === 'keka';

  // For Keka: merge loaded details with initial preview item
  const rawKeka = kekaDetails?.data || kekaDetails || {};
  const kekaDisplayName =
    rawKeka.displayName ||
    (rawKeka.firstName && `${rawKeka.firstName} ${rawKeka.lastName || ''}`.trim()) ||
    initialItem?.keka_name ||
    'Keka Employee';

  const kekaEmail = rawKeka.email || initialItem?.keka_email || '—';
  const kekaEmpNumber = rawKeka.employeeNumber || initialItem?.keka_employee_number || '—';

  // Extract job title
  const kekaJobTitle =
    (typeof rawKeka.jobTitle === 'object' ? rawKeka.jobTitle?.title : rawKeka.jobTitle) ||
    initialItem?.keka_job_title ||
    '—';

  // Extract department from groups or fallback
  const kekaDept =
    rawKeka.groups?.find((g: any) => g.groupType === 2)?.title ||
    rawKeka.department ||
    initialItem?.keka_department ||
    'Unassigned';

  // Extract location
  const kekaLocation =
    rawKeka.groups?.find((g: any) => g.groupType === 3)?.title ||
    rawKeka.city ||
    rawKeka.location ||
    'Bengaluru, India';

  // Extract legal entity
  const kekaEntity =
    rawKeka.groups?.find((g: any) => g.groupType === 9)?.title ||
    rawKeka.legalEntity ||
    'Aadit Technologies';

  // Resolve employment status label
  const rawStatus = rawKeka.employmentStatus;
  let kekaEmploymentStatus = initialItem?.employment_status || 'Working';
  if (rawStatus === 1) kekaEmploymentStatus = 'Working';
  else if (rawStatus === 2) kekaEmploymentStatus = 'Relieved';
  else if (rawStatus === 3) kekaEmploymentStatus = 'Notice Period';
  else if (typeof rawStatus === 'string') kekaEmploymentStatus = rawStatus;

  // Resolve gender
  let genderLabel = 'Unspecified';
  if (rawKeka.gender === 1) genderLabel = 'Male';
  else if (rawKeka.gender === 2) genderLabel = 'Female';
  else if (rawKeka.gender === 3) genderLabel = 'Other';

  // Manager
  const managerName =
    rawKeka.reportsTo?.firstName || rawKeka.reportsTo?.lastName
      ? `${rawKeka.reportsTo.firstName || ''} ${rawKeka.reportsTo.lastName || ''}`.trim()
      : null;
  const managerEmail = rawKeka.reportsTo?.email;

  // Joining date
  const joiningDateStr = rawKeka.joiningDate || initialItem?.date_of_joining;
  const formattedJoiningDate = joiningDateStr
    ? new Date(joiningDateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : '—';

  // For System User
  const systemUser = userDetails || initialItem;
  const systemUserName = systemUser
    ? `${systemUser.first_name || ''} ${systemUser.last_name || ''}`.trim() || systemUser.email
    : 'Timesheet User';

  const systemInitials = isKeka
    ? kekaDisplayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
    : `${systemUser?.first_name?.[0] || '?'}${systemUser?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── TOP HEADER ──────────────────────────────────────────────── */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-sky-50/70 via-white to-blue-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shrink-0">
              {systemInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {isKeka ? kekaDisplayName : systemUserName}
                </h2>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" />
                  {isKeka ? kekaEmpNumber : systemUser?.employee_id || '—'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>{isKeka ? kekaEmail : systemUser?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200">
                <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                <span>Calling API…</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BODY CONTENT ────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Could not fetch extra live details from API. Displaying directory cached record.</span>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-[10px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          {/* ── STATUS PILLS & QUICK ACTION BAR ───────────────────────── */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Directory Tag */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                {isKeka ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-sky-600" />
                    <span>Keka HR Directory</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Timesheet Database</span>
                  </>
                )}
              </span>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${isKeka
                    ? kekaEmploymentStatus.toLowerCase().includes('work') || kekaEmploymentStatus.toLowerCase().includes('active')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                    : systemUser?.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{isKeka ? kekaEmploymentStatus : systemUser?.status || 'Active'}</span>
              </span>

              {/* Sync Status Badge */}
              {isKeka ? (
                initialItem?.status === 'mapped' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Synced with Timesheet</span>
                  </span>
                ) : initialItem?.status === 'local_match' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Ready to Link</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Not Synced to Timesheet</span>
                  </span>
                )
              ) : systemUser?.is_keka_synced ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Keka Synced</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Local Account Only</span>
                </span>
              )}
            </div>

            {/* Quick Context Action */}
            {isKeka && initialItem?.status !== 'mapped' && onSyncSingleKeka && (
              <button
                type="button"
                onClick={() => onSyncSingleKeka(initialItem)}
                disabled={isSyncingSingle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSyncingSingle ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Sync this Employee Now</span>
              </button>
            )}

            {!isKeka && onOpenEditUser && systemUser && (
              <button
                type="button"
                onClick={() => onOpenEditUser(systemUser)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit User Profile</span>
              </button>
            )}
          </div>

          {/* ── KEY ATTRIBUTES GRID ───────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-sky-500" />
                Role / Title
              </span>
              <p className="text-xs font-extrabold text-slate-800 mt-1 truncate" title={isKeka ? kekaJobTitle : systemUser?.role?.name}>
                {isKeka ? kekaJobTitle : systemUser?.role?.name || '—'}
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-sky-500" />
                Department
              </span>
              <p className="text-xs font-extrabold text-slate-800 mt-1 truncate" title={isKeka ? kekaDept : systemUser?.department?.name}>
                {isKeka ? kekaDept : systemUser?.department?.name || 'Unassigned'}
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-sky-500" />
                Joining Date
              </span>
              <p className="text-xs font-extrabold text-slate-800 mt-1">
                {formattedJoiningDate}
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-500" />
                Location
              </span>
              <p className="text-xs font-extrabold text-slate-800 mt-1 truncate" title={isKeka ? kekaLocation : 'Head Office'}>
                {isKeka ? kekaLocation : 'Head Office'}
              </p>
            </div>
          </div>

          {/* ── SECTION 1: WORK & ORGANIZATION DETAILS ────────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Work &amp; Organization</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] font-semibold">Official Email:</span>
                <p className="font-bold text-slate-800 mt-0.5">{isKeka ? kekaEmail : systemUser?.email}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-semibold">Employee ID:</span>
                <p className="font-bold text-slate-800 mt-0.5">{isKeka ? kekaEmpNumber : systemUser?.employee_id || '—'}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-semibold">Department:</span>
                <p className="font-bold text-slate-800 mt-0.5">{isKeka ? kekaDept : systemUser?.department?.name || 'Unassigned'}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-semibold">Job Designation:</span>
                <p className="font-bold text-slate-800 mt-0.5">{isKeka ? kekaJobTitle : systemUser?.role?.name || '—'}</p>
              </div>

              {isKeka && (
                <>
                  <div>
                    <span className="text-slate-400 text-[11px] font-semibold">Reporting Manager:</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {managerName ? `${managerName} (${managerEmail || 'No email'})` : 'No Reporting Manager'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] font-semibold">Business Entity:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{kekaEntity}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── SECTION 2: PERSONAL & CONTACT INFORMATION ─────────────── */}
          {isKeka && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Personal Details</h3>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] font-semibold">Personal Email:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{rawKeka.personalEmail || '—'}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-semibold">Mobile Phone:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{rawKeka.mobilePhone || rawKeka.workPhone || '—'}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-semibold">Gender:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{genderLabel}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-semibold">Date of Birth:</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {rawKeka.dateOfBirth
                      ? new Date(rawKeka.dateOfBirth).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                      : '—'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-semibold">Blood Group:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{rawKeka.bloodGroup || '—'}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-semibold">City &amp; Country:</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {rawKeka.city || 'Bengaluru'}, {rawKeka.countryCode || 'IN'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION 3: SYSTEM INTEGRATION DIAGNOSTICS ─────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Sync &amp; Mapping Diagnostics</h3>
            </div>
            <div className="p-4 space-y-2 text-xs">
              {isKeka ? (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Keka Employee UUID:</span>
                    <span className="font-mono text-slate-800 font-semibold">{initialItem?.keka_employee_id || rawKeka.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Mapping Status:</span>
                    <span className="font-semibold text-slate-800 capitalize">{initialItem?.status || 'unmapped'}</span>
                  </div>
                  {initialItem?.matched_local_user_name && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Matched Timesheet User:</span>
                      <span className="font-bold text-emerald-700">
                        {initialItem.matched_local_user_name} ({initialItem.matched_local_user_email})
                      </span>
                    </div>
                  )}
                  {initialItem?.reason && (
                    <div className="py-1">
                      <span className="text-slate-500 block text-[11px]">Sync Diagnostic Reason:</span>
                      <p className="text-slate-700 font-medium italic mt-0.5">{initialItem.reason}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">System User ID:</span>
                    <span className="font-mono text-slate-800 font-semibold">{systemUser?.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Keka Synced Flag:</span>
                    <span className="font-semibold text-slate-800">
                      {systemUser?.is_keka_synced ? 'Yes (Linked to Keka HR API)' : 'No (Local database account)'}
                    </span>
                  </div>
                  {systemUser?.keka_employee_id && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Linked Keka UUID:</span>
                      <span className="font-mono text-slate-800 font-semibold">{systemUser.keka_employee_id}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {isKeka ? 'Live data retrieved from Keka HR API endpoint' : 'System record stored in Timesheet database'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
