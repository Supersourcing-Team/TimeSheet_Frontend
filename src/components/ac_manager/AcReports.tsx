import React from 'react';
import { FileText, BarChart3, Download } from 'lucide-react';

interface AcReportsProps {
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AcReports: React.FC<AcReportsProps> = ({ onShowToast }) => {
  return (
    <div className="space-y-6 text-slate-800">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Financial Reports & Exports</h1>
        <p className="text-xs text-slate-500 font-medium">
          Export client billing ledgers, profit & loss summaries, and audit trail reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 w-fit">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Portfolio Profitability Summary</h3>
            <p className="text-xs text-slate-500 mt-1">
              Full P&L breakdown across all active client accounts with revenue margins and tool costs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onShowToast('Export Started', 'Portfolio P&L Summary downloaded as PDF', 'success')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download P&L Report (PDF)</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 w-fit">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Client Billing Ledger (CSV)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Itemized timesheet billable hours and hourly rates for client invoice processing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onShowToast('Export Started', 'Client Billing Ledger exported as CSV', 'success')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Billing CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
