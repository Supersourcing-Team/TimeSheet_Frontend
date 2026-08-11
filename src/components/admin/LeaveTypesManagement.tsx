import React, { useState } from 'react';
import { LeaveTypeConfig } from '../../types';
import {
  CalendarX,
  Plus,
  Edit2,
  X,
  Search,
  CheckCircle2,
  XCircle,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

interface LeaveTypesManagementProps {
  leaveTypes: LeaveTypeConfig[];
  onAddLeaveType: (type: Omit<LeaveTypeConfig, 'id'>) => void;
  onUpdateLeaveType: (updated: LeaveTypeConfig) => void;
  onToggleLeaveTypeStatus: (typeId: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const LeaveTypesManagement: React.FC<LeaveTypesManagementProps> = ({
  leaveTypes,
  onAddLeaveType,
  onUpdateLeaveType,
  onToggleLeaveTypeStatus,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingType, setEditingType] = useState<LeaveTypeConfig | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [daysPerYear, setDaysPerYear] = useState(12);
  const [isPaid, setIsPaid] = useState(true);
  const [description, setDescription] = useState('');
  const [requiresDocument, setRequiresDocument] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDaysPerYear, setEditDaysPerYear] = useState(12);
  const [editIsPaid, setEditIsPaid] = useState(true);
  const [editDescription, setEditDescription] = useState('');
  const [editRequiresDocument, setEditRequiresDocument] = useState(false);

  const filteredTypes = (leaveTypes || []).filter(
    (lt) =>
      lt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lt.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lt.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      onShowToast('Validation Error', 'Please enter Leave Name and Code.', 'error');
      return;
    }

    onAddLeaveType({
      name,
      code: code.toUpperCase(),
      daysPerYear,
      isPaid,
      status: 'active',
      description,
      requiresDocument,
    });

    onShowToast('Leave Type Created', `Added "${name} (${code.toUpperCase()})" to policies`, 'success');
    setShowAddModal(false);
    setName('');
    setCode('');
    setDescription('');
  };

  const handleOpenEdit = (lt: LeaveTypeConfig) => {
    setEditingType(lt);
    setEditName(lt.name);
    setEditCode(lt.code);
    setEditDaysPerYear(lt.daysPerYear);
    setEditIsPaid(lt.isPaid);
    setEditDescription(lt.description);
    setEditRequiresDocument(!!lt.requiresDocument);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;

    onUpdateLeaveType({
      ...editingType,
      name: editName,
      code: editCode.toUpperCase(),
      daysPerYear: editDaysPerYear,
      isPaid: editIsPaid,
      description: editDescription,
      requiresDocument: editRequiresDocument,
    });

    onShowToast('Leave Type Updated', `Updated policy details for ${editName}`, 'success');
    setEditingType(null);
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CalendarX className="w-5 h-5 text-blue-600" />
            <span>Leave Type Management & Entitlement Rules</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure leave categories (Casual, Sick, Earned, Comp-Off, Maternity/Paternity). In accordance with policy, leave types can be activated or deactivated, but not deleted.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Leave Type</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-xs">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leave type name or code..."
              className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            />
          </div>

          <div className="text-xs text-slate-500 font-bold">
            Configured Leave Policies: {leaveTypes.length}
          </div>
        </div>

        {/* Leave Types Grid/List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTypes.map((lt) => (
            <div
              key={lt.id}
              className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                lt.status === 'active'
                  ? 'bg-white border-slate-200 shadow-2xs hover:border-blue-300'
                  : 'bg-slate-50/80 border-slate-200 opacity-75'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black">
                      {lt.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                        lt.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {lt.status}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      lt.isPaid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {lt.isPaid ? 'Paid Leave' : 'Unpaid (LOP)'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">{lt.name}</h3>
                  <p className="text-xs text-blue-600 font-bold mt-0.5">
                    {lt.daysPerYear} Days / Year Standard Entitlement
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {lt.description}
                </p>

                {lt.requiresDocument && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Supporting document/certificate required</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEdit(lt)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200 flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3 text-blue-600" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => {
                    onToggleLeaveTypeStatus(lt.id);
                    onShowToast('Status Toggled', `Toggled active state for ${lt.name}`, 'info');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    lt.status === 'active'
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {lt.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE LEAVE TYPE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleAddSubmit}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900">Create New Leave Policy</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    Leave Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sabbatical Leave"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SAB"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    Days / Year Allowance
                  </label>
                  <input
                    type="number"
                    value={daysPerYear}
                    onChange={(e) => setDaysPerYear(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    Payment Status
                  </label>
                  <select
                    value={isPaid ? 'true' : 'false'}
                    onChange={(e) => setIsPaid(e.target.value === 'true')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="true">Paid Leave</option>
                    <option value="false">Unpaid (Loss of Pay)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                  Description & Policy Rules
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain eligibility, rollover terms, and notice period..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requiresDocument"
                  checked={requiresDocument}
                  onChange={(e) => setRequiresDocument(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="requiresDocument" className="font-bold text-slate-800 text-xs">
                  Require Medical Certificate / Verification Document
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
              >
                Save Leave Type
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT LEAVE TYPE MODAL */}
      {editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleEditSubmit}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900">Edit Leave Policy Details</h3>
              <button
                type="button"
                onClick={() => setEditingType(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    Leave Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    Code
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    Days / Year Allowance
                  </label>
                  <input
                    type="number"
                    value={editDaysPerYear}
                    onChange={(e) => setEditDaysPerYear(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    Payment Status
                  </label>
                  <select
                    value={editIsPaid ? 'true' : 'false'}
                    onChange={(e) => setEditIsPaid(e.target.value === 'true')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="true">Paid Leave</option>
                    <option value="false">Unpaid (Loss of Pay)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editRequiresDocument"
                  checked={editRequiresDocument}
                  onChange={(e) => setEditRequiresDocument(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editRequiresDocument" className="font-bold text-slate-800 text-xs">
                  Require Supporting Document/Verification
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingType(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
              >
                Save Policy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
