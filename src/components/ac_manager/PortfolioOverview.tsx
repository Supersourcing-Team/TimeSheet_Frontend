import React, { useState, useMemo } from 'react';
import { Project, TimesheetEntry } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Calendar, Download, CreditCard, DollarSign, TrendingUp, ShieldCheck, UserCheck, Rocket, Landmark } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PortfolioOverviewProps {
  projects: Project[];
  timesheets: TimesheetEntry[];
  totalBudget: number;
  totalCost: number;
  totalEarnedValue: number;
  totalCostVariance: number;
  totalForecastCost: number;
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
  totalEarnedValue,
  totalCostVariance,
  totalForecastCost,
  activeProjectsCount,
  onShowToast,
  setEditingProject,
  setEditBudget,
  }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;
  const currentQStr = `Q${currentQuarter} ${currentYear}`;
  
  const [selectedQuarter, setSelectedQuarter] = useState(currentQStr);
  const [chartInterval, setChartInterval] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
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
  
  const totalProfit = totalEarnedValue - totalCost;

  // Generate historical chart data using milestone achievement dates
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    const isMonthly = chartInterval === 'monthly';
    
    // Go back 5 periods
    for (let i = 5; i >= 0; i--) {
      let d: Date;
      let label: string;
      
      if (isMonthly) {
        d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        label = `${d.toLocaleString('default', { month: 'short' })} '${d.getFullYear().toString().slice(-2)}`;
      } else if (chartInterval === 'quarterly') {
        d = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
        const q = Math.floor(d.getMonth() / 3) + 1;
        label = `Q${q} '${d.getFullYear().toString().slice(-2)}`;
      } else {
        d = new Date(now.getFullYear() - i, 0, 1);
        label = `${d.getFullYear()}`;
      }
      
      let cumulativeEV = 0;
      let cumulativeAC = 0;
      
      safeProjects.forEach(p => {
        if (p.milestones) {
          p.milestones.forEach(m => {
            if (m.status === 'achieved' && m.actual_achievement_date) {
              const achievedDate = new Date(m.actual_achievement_date);
              
              const isBeforeOrEqual = 
                achievedDate.getFullYear() < d.getFullYear() || 
                (achievedDate.getFullYear() === d.getFullYear() && achievedDate.getMonth() <= d.getMonth());
                
              if (chartInterval === 'yearly') {
                  if (achievedDate.getFullYear() <= d.getFullYear()) {
                      cumulativeEV += m.earned_value || 0;
                      cumulativeAC += m.actual_cost || 0;
                  }
              } else if (isBeforeOrEqual) {
                cumulativeEV += m.earned_value || 0;
                cumulativeAC += m.actual_cost || 0;
              }
            }
          });
        }
      });
      
      data.push({
        name: label,
        Revenue: cumulativeEV,
        Cost: cumulativeAC,
        Profit: cumulativeEV - cumulativeAC
      });
    }
    return data;
  }, [safeProjects, chartInterval]);

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
    .sort((a, b) => (b.budget || 0) - (a.budget || 0))
    .slice(0, 3)
    .map((p, index) => {
      const budget = p.budget || 0;
      const actualCost = p.actual_cost || 0;
      const consumedPercent = budget > 0 ? Math.min(100, Math.round((actualCost / budget) * 100)) : 0;
      const remainingPercent = 100 - consumedPercent;

      const colors = ['bg-blue-600', 'bg-amber-600', 'bg-rose-600'];
      const statusColor = colors[index % colors.length];

      return {
        name: p.name,
        client: p.client,
        value: formatCr(budget),
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
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 uppercase">
              Revenue
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Revenue (Earned)</p>
            <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{formatCr(totalEarnedValue)}</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-xl bg-slate-50 text-slate-600`}>
              <Landmark className="w-5 h-5" />
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700`}>
              Spend
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Actual Cost</p>
            <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{formatCr(totalCost)}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-xl ${totalProfit >= 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'} shadow-xs`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${totalProfit >= 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
              Margin
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Profit</p>
            <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{formatCr(totalProfit)}</p>
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
          <div className="pt-4 pb-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  tickFormatter={(value) => {
                    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
                    if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`;
                    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                    return `₹${value}`;
                  }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }}
                  formatter={(value: number) => formatINR(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Cost" stroke="#64748b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Profit" stroke="#d97706" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
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
              Project contract budgets, actual costs, earned values and health analysis.
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
                <th className="py-3 px-4">Actual Cost</th>
                <th className="py-3 px-4">Earned Value</th>
                <th className="py-3 px-4">CPI</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSnapshotProjects.map((p) => {
                const cost = p.actual_cost || 0;
                const earned_value = p.earned_value || 0;
                const cpi = p.cpi || 0;
                const health = p.health || 'GREEN';

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
                    <td className="py-3.5 px-4 text-slate-600">{formatCr(cost)}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">{formatCr(earned_value)}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-bold">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] ${cpi >= 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {cpi.toFixed(2)}x
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${health === 'GREEN'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : health === 'AMBER'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                      >
                        {health}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(p);
                          setEditBudget(p.budget);
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
