import React, { useState } from 'react';
import { FileText, BarChart3, Download, Loader2 } from 'lucide-react';

interface AcReportsProps {
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AcReports: React.FC<AcReportsProps> = ({ onShowToast }) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const handleDownload = async (
    endpoint: string,
    defaultFilename: string,
    reportName: string,
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/reports/${endpoint}`, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf, text/csv, application/json, */*',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        try {
          const errJson = await response.json();
          errorMsg = errJson.message || errJson.detail || errorMsg;
        } catch {
          // Response body is not JSON
        }
        throw new Error(errorMsg);
      }

      // Check for filename in Content-Disposition header
      const disposition = response.headers.get('Content-Disposition');
      let filename = defaultFilename;
      if (disposition && disposition.includes('filename=')) {
        const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      onShowToast('Export Complete', `${reportName} downloaded successfully.`, 'success');
    } catch (err: any) {
      onShowToast('Export Failed', err.message || `Failed to download ${reportName}.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Financial Reports & Exports</h1>
        <p className="text-xs text-slate-500 font-medium">
          Export client billing ledgers, profit & loss summaries, and audit trail reports directly from the server.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF P&L Summary */}
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
            disabled={downloadingPdf}
            onClick={() =>
              handleDownload('portfolio-pnl', 'portfolio_pnl_summary.pdf', 'Portfolio P&L Report (PDF)', setDownloadingPdf)
            }
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {downloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download P&L Report (PDF)</span>
              </>
            )}
          </button>
        </div>

        {/* CSV Billing Ledger */}
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
            disabled={downloadingCsv}
            onClick={() =>
              handleDownload('billing-ledger', 'client_billing_ledger.csv', 'Client Billing Ledger (CSV)', setDownloadingCsv)
            }
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {downloadingCsv ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting CSV...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Billing CSV</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

