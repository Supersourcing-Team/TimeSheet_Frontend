import React, { useState } from 'react';
import { Project, TimesheetEntry } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Calendar, Download, CreditCard, DollarSign, TrendingUp, ShieldCheck, UserCheck, Rocket } from 'lucide-react';

interface PortfolioOverviewProps {
  projects: Project[];
  timesheets: TimesheetEntry[];
  totalBudget: number;
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  activeProjectsCount: number;
  onUpdateProjectBudget: (projectId: string, newBudget: number, newRate: number) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
  setEditingProject: (p: Project | null) => void;
  setEditBudget: (b: number) => void;
  }

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  projects,
  timesheets,
  totalBudget,
  totalCost,
  totalRevenue,
  totalProfit,
  activeProjectsCount,
  onShowToast,
  setEditingProject,
  setEditBudget,
  }) => {
  const [selectedQuarter, setSelectedQuarter] = useState('Q3 FY 2024');
  const [chartInterval, setChartInterval] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');
  const [snapshotFilter, setSnapshotFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const safeProjects = projects || [];
  const safeTimesheets = timesheets || [];

  const formatCr = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    }
    return formatINR(amount);
  };

  const filteredSnapshotProjects = safeProjects.filter((p) => {
    if (snapshotFilter === 'active' && p.status !== 'active') return false;
    if (snapshotFilter === 'completed' && p.status !== 'completed') return false;
    if (
      searchQuery &&
      !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.client.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const top3Projects = safeProjects
    .filter((p) => p.status === 'active')
    .slice(0, 3)
    .map((p, index) => {
      const consumedPercent = p.budget
        ? Math.min(100, Math.round((((p.loggedHours || 0) * 1800) / p.budget) * 100))
        : 0;
      const remainingPercent = 100 - consumedPercent;

      const colors = ['bg-blue-600', 'bg-amber-600', 'bg-rose-600'];
      const statusColor = colors[index % colors.length];

      return {
        name: p.name,
        client: p.client,
        value: formatCr(p.budget),
        consumedPercent,
        remainingPercent,
        statusColor,
      };
    });

  return (
    <div className="space-y-6 text-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Portfolio Overview</h1>
          <p className="text-xs text-slate-500 font-medium">
            Real-time financial performance and resource health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs hover:border-slate-300 transition-all cursor-pointer">
              <Calendar className="w-4 h-4 text-blue-600" />
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1"
              >
                <option value="Q3 FY 2024">Q3 FY 2024</option>
                <option value="Q2 FY 2024">Q2 FY 2024</option>
                <option value="Q1 FY 2024">Q1 FY 2024</option>
                <option value="FY 2024-25">FY 2024-25</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onShowToast('Exporting Report', 'Generating P&L Portfolio Summary PDF...', 'success')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-700 uppercase">
              Revenue
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Revenue</p>
            <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{formatCr(totalRevenue)}</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase">
              Profit
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Profit</p>
            <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{formatCr(totalProfit)}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Rocket className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase">
              Count
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Active Projects</p>
            <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{activeProjectsCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Profit Trend</h3>
              <p className="text-xs text-slate-500">Historical analysis of financial cycles</p>
            </div>
            <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setChartInterval('monthly')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartInterval === 'monthly'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setChartInterval('quarterly')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartInterval === 'quarterly'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Quarterly
              </button>
              <button
                type="button"
                onClick={() => setChartInterval('yearly')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartInterval === 'yearly'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Yearly
              </button>
            </div>
          </div>
          <div className="pt-4 pb-2">
            <div className="h-64 w-full relative flex flex-col justify-between">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="w-full border-b border-slate-100" />
                ))}
              </div>
              <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 500 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 10 120 Q 100 80, 200 60 T 380 40 T 490 20 L 490 170 L 10 170 Z" fill="url(#revenueGrad)" />
                <path d="M 10 120 Q 100 80, 200 60 T 380 40 T 490 20" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                <path d="M 10 140 Q 100 110, 200 100 T 380 80 T 490 65" fill="none" stroke="#64748b" strokeWidth="2.5" strokeDasharray="4,4" strokeLinecap="round" />
                <path d="M 10 160 Q 100 140, 200 120 T 380 100 T 490 85" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
                <circle cx="200" cy="60" r="5" fill="#2563eb" className="stroke-2 stroke-white" />
                <circle cx="380" cy="40" r="5" fill="#2563eb" className="stroke-2 stroke-white" />
                <circle cx="490" cy="20" r="5" fill="#2563eb" className="stroke-2 stroke-white" />
                <circle cx="200" cy="120" r="4" fill="#d97706" className="stroke-2 stroke-white" />
                <circle cx="380" cy="100" r="4" fill="#d97706" className="stroke-2 stroke-white" />
                <circle cx="490" cy="85" r="4" fill="#d97706" className="stroke-2 stroke-white" />
              </svg>
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold pt-2 border-t border-slate-100">
                {chartInterval === 'monthly' && (
                  <>
                    <span>Aug 24</span>
                    <span>Sep 24</span>
                    <span>Oct 24 (Current)</span>
                    <span>Nov 24 (Projected)</span>
                  </>
                )}
                {chartInterval === 'quarterly' && (
                  <>
                    <span>Q1 FY24</span>
                    <span>Q2 FY24</span>
                    <span>Q3 FY24 (Current)</span>
                    <span>Q4 FY24 (Projected)</span>
                  </>
                )}
                {chartInterval === 'yearly' && (
                  <>
                    <span>FY22</span>
                    <span>FY23</span>
                    <span>FY24 (Current)</span>
                    <span>FY25 (Projected)</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 pt-2 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Revenue</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-500" />
              <span>Cost</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-600" />
              <span>Profit</span>
            </span>
          </div>
        </div>
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Top 3 Projects Utilization</h3>
            <div className="space-y-4">
              {top3Projects.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{item.client}</p>
                    </div>
                    <span className="font-black text-blue-700">{item.value}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full ${item.statusColor}`}
                      style={{ width: `${item.consumedPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-blue-700">{item.consumedPercent}% Consumed</span>
                    <span className="text-slate-400">{item.remainingPercent}% Remaining</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Financial Snapshot</h2>
            <p className="text-xs text-slate-500">
              Project contract budgets, actual costs, and profit margin analysis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={snapshotFilter}
              onChange={(e) => setSnapshotFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Projects</option>
              <option value="active">Active Projects</option>
              <option value="completed">Completed Projects</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Budget</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">Profit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSnapshotProjects.map((p) => {
                const prjTimesheets = safeTimesheets.filter(
                  (t) => t.projectId === p.id && t.status === 'approved'
                );
                const loggedHrs = prjTimesheets.reduce((s, t) => s + (t.hours || 0), 0);
                const cost = loggedHrs * 1800; // Average internal cost rate
                const revenue = loggedHrs * 3500;
                const profit = revenue - cost;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div>{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Code: {p.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{p.client}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatCr(p.budget)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatCr(cost > 0 ? cost : p.budget * 0.6)}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">{formatCr(revenue > 0 ? revenue : p.budget * 0.95)}</td>
                    <td className="py-3.5 px-4 text-blue-700 font-bold">{formatCr(profit > 0 ? profit : p.budget * 0.35)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${p.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : p.status === 'completed'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(p);
                          setEditBudget(p.budget);
                          setEditRate3500;
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-bold transition-all"
                      >
                        Edit Budget
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
