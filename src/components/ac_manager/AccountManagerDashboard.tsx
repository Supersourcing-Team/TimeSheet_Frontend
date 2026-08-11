import React, { useState } from 'react';
import { Project, User, TimesheetEntry, ProjectTool } from '../../types';
import { ACManagerTab } from '../Sidebar';
import { formatINR } from '../../utils/formatters';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Briefcase,
  PieChart,
  BarChart3,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Users,
  Wrench,
  ChevronRight,
  Download,
  Edit3,
  Calendar,
  Rocket,
  ShieldCheck,
  CreditCard,
  UserCheck,
  ExternalLink,
  ArrowUpRight,
  HelpCircle,
  X,
  Layers,
} from 'lucide-react';

interface AccountManagerDashboardProps {
  currentUser: User;
  projects: Project[];
  allUsers: User[];
  timesheets: TimesheetEntry[];
  activeTab?: ACManagerTab;
  onNavigateTab?: (tab: ACManagerTab) => void;
  onUpdateProjectBudget: (projectId: string, newBudget: number, newRate: number) => void;
  onAddToolToProject: (projectId: string, tool: Omit<ProjectTool, 'id'>) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AccountManagerDashboard: React.FC<AccountManagerDashboardProps> = ({
  currentUser,
  projects,
  allUsers,
  timesheets,
  activeTab = 'ac_dashboard',
  onNavigateTab,
  onUpdateProjectBudget,
  onAddToolToProject,
  onShowToast,
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState('Q3 FY 2024');
  const [chartInterval, setChartInterval] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');
  const [snapshotFilter, setSnapshotFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editBudget, setEditBudget] = useState(0);
  const [editRate, setEditRate] = useState(0);

  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [selectedToolProjectId, setSelectedToolProjectId] = useState('');
  const [newToolName, setNewToolName] = useState('');
  const [newToolCategory, setNewToolCategory] = useState<'Cloud' | 'Design' | 'Dev' | 'AI' | 'SaaS' | 'Testing'>('Cloud');
  const [newToolCost, setNewToolCost] = useState(15000);
  const [newToolUsersCount, setNewToolUsersCount] = useState(5);

  const safeProjects = projects || [];
  const safeTimesheets = timesheets || [];
  const safeAllUsers = allUsers || [];

  // Crores & Lakhs formatting helper
  const formatCr = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    }
    return formatINR(amount);
  };

  // Aggregates
  const totalBudget = safeProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  
  // Calculate revenue & expenses based on approved timesheets or realistic fallback for portfolio view
  const approvedTimesheets = safeTimesheets.filter((t) => t.status === 'approved');
  
  const totalRevenue = approvedTimesheets.length > 0
    ? approvedTimesheets.reduce((sum, t) => {
        const prj = safeProjects.find((p) => p.id === t.projectId);
        const rate = prj ? prj.hourlyRate : 3500;
        return sum + (t.billableHours || 0) * rate;
      }, 0)
    : 158000000; // ₹15.8 Cr baseline

  const totalCost = approvedTimesheets.length > 0
    ? approvedTimesheets.reduce((sum, t) => {
        const u = safeAllUsers.find((usr) => usr.id === t.userId);
        const rate = u ? u.hourlyRate : 1800;
        return sum + (t.hours || 0) * rate;
      }, 0) + 12000000
    : 82000000; // ₹8.2 Cr baseline

  const totalProfit = totalRevenue - totalCost;
  const activeProjectsCount = safeProjects.filter((p) => p.status === 'active').length || 36;

  // Filtered projects for snapshot table
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

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    onUpdateProjectBudget(editingProject.id, editBudget, editRate);
    onShowToast('Client Budget Updated', `Updated budget for ${editingProject.name} to ${formatINR(editBudget)}`, 'success');
    setEditingProject(null);
  };

  const handleCreateTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToolProjectId || !newToolName) return;
    onAddToolToProject(selectedToolProjectId, {
      name: newToolName,
      category: newToolCategory,
      monthlyCost: newToolCost,
      assignedUsersCount: newToolUsersCount,
    });
    onShowToast('SaaS Tool Added', `Added ${newToolName} to project.`, 'success');
    setShowAddToolModal(false);
    setNewToolName('');
  };

  // Top 3 Projects Utilization mock or calculated list matching screenshot aesthetics
  const top3Projects = [
    {
      name: 'Global ERP Modernization',
      client: 'Reliance Industries',
      value: '₹2.4 Cr',
      consumedPercent: 82,
      remainingPercent: 18,
      statusColor: 'bg-blue-600',
    },
    {
      name: 'Smart Logistics AI',
      client: 'Tata Steel',
      value: '₹1.8 Cr',
      consumedPercent: 45,
      remainingPercent: 55,
      statusColor: 'bg-amber-600',
    },
    {
      name: 'FinTech Hub Integration',
      client: 'ICICI Bank',
      value: '₹3.1 Cr',
      consumedPercent: 94,
      remainingPercent: 6,
      statusColor: 'bg-rose-600',
    },
  ];

  return (
    <div className="space-y-6 text-slate-800">
      {/* ------------------- DASHBOARD TAB: PORTFOLIO OVERVIEW ------------------- */}
      {(activeTab === 'ac_dashboard' || activeTab === 'ac_overview') && (
        <div className="space-y-6">
          {/* Top Title & Controls Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Portfolio Overview</h1>
              <p className="text-xs text-slate-500 font-medium">
                Real-time financial performance and resource health.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Filter Dropdown */}
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

              {/* Export Report Button */}
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

          {/* 6 Metric KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            {/* Card 1: Total Project Budget */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white uppercase">
                  Budget
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Total Project Budget</p>
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">₹12.5 Cr</p>
              </div>
            </div>

            {/* Card 2: Total Project Cost */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 uppercase">
                  Actual
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Total Project Cost</p>
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">₹8.2 Cr</p>
              </div>
            </div>

            {/* Card 3: Total Revenue */}
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
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">₹15.8 Cr</p>
              </div>
            </div>

            {/* Card 4: Total Profit */}
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
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">₹7.6 Cr</p>
              </div>
            </div>

            {/* Card 5: Avg. Utilization */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 uppercase">
                  HR
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Avg. Utilization</p>
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">74.2%</p>
              </div>
            </div>

            {/* Card 6: Active Projects */}
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

          {/* Middle Section: Chart + Top Utilization & Employee Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Monthly Profit Trend Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Monthly Profit Trend</h3>
                  <p className="text-xs text-slate-500">Historical analysis of financial cycles</p>
                </div>

                {/* Monthly / Quarterly / Yearly toggle */}
                <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setChartInterval('monthly')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      chartInterval === 'monthly'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartInterval('quarterly')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      chartInterval === 'quarterly'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Quarterly
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartInterval('yearly')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      chartInterval === 'yearly'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              {/* Chart Visual Surface */}
              <div className="pt-4 pb-2">
                <div className="h-64 w-full relative flex flex-col justify-between">
                  {/* Grid background lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div key={idx} className="w-full border-b border-slate-100" />
                    ))}
                  </div>

                  {/* SVG Chart paths */}
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

                    {/* Revenue Area & Line */}
                    <path
                      d="M 10 120 Q 100 80, 200 60 T 380 40 T 490 20 L 490 170 L 10 170 Z"
                      fill="url(#revenueGrad)"
                    />
                    <path
                      d="M 10 120 Q 100 80, 200 60 T 380 40 T 490 20"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Cost Line */}
                    <path
                      d="M 10 140 Q 100 110, 200 100 T 380 80 T 490 65"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2.5"
                      strokeDasharray="4,4"
                      strokeLinecap="round"
                    />

                    {/* Profit Line */}
                    <path
                      d="M 10 160 Q 100 140, 200 120 T 380 100 T 490 85"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Key Hover / Data Points */}
                    <circle cx="200" cy="60" r="5" fill="#2563eb" className="stroke-2 stroke-white" />
                    <circle cx="380" cy="40" r="5" fill="#2563eb" className="stroke-2 stroke-white" />
                    <circle cx="490" cy="20" r="5" fill="#2563eb" className="stroke-2 stroke-white" />

                    <circle cx="200" cy="120" r="4" fill="#d97706" className="stroke-2 stroke-white" />
                    <circle cx="380" cy="100" r="4" fill="#d97706" className="stroke-2 stroke-white" />
                    <circle cx="490" cy="85" r="4" fill="#d97706" className="stroke-2 stroke-white" />
                  </svg>

                  {/* X Axis labels */}
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold pt-2 border-t border-slate-100">
                    <span>Q1 FY24</span>
                    <span>Q2 FY24</span>
                    <span>Q3 FY24 (Current)</span>
                    <span>Q4 FY24 (Projected)</span>
                  </div>
                </div>
              </div>

              {/* Chart Legend */}
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

            {/* Right Column: Top 3 Projects Utilization + Employee Summary */}
            <div className="space-y-6">
              {/* Top 3 Projects Utilization */}
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

                      {/* Progress Bar */}
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

              {/* Employee Utilization Summary */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Employee Utilization Summary</h3>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center divide-x divide-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">High</p>
                    <p className="text-xl font-black text-amber-600 mt-0.5">92%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Avg</p>
                    <p className="text-xl font-black text-blue-600 mt-0.5">74%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Low</p>
                    <p className="text-xl font-black text-slate-500 mt-0.5">41%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card: Financial Snapshot Table */}
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

            {/* Table */}
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
                    const revenue = loggedHrs * (p.hourlyRate || 3500);
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
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${
                              p.status === 'active'
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
                              setEditRate(p.hourlyRate || 3500);
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
      )}

      {/* ------------------- OTHER AC MANAGER TABS ------------------- */}
      {activeTab === 'project_financials' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Project Financials</h1>
              <p className="text-xs text-slate-500 font-medium">
                Detailed contract budget allocations, client billing rates, and labor expenditure.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Total Client Contracts</span>
              <p className="text-2xl font-black text-slate-900">{formatCr(totalBudget)}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Recognized Revenue</span>
              <p className="text-2xl font-black text-emerald-600">{formatCr(totalRevenue)}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Net Operating Profit</span>
              <p className="text-2xl font-black text-blue-600">{formatCr(totalProfit)}</p>
            </div>
          </div>

          {/* Detailed Financial Table */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Contract & Billing Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Project Name</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Billing Rate / Hr</th>
                    <th className="py-3 px-4">Contract Budget</th>
                    <th className="py-3 px-4">Logged Hours</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 text-slate-600">{p.client}</td>
                      <td className="py-3 px-4 font-bold text-blue-600">{formatINR(p.hourlyRate || 3500)}/hr</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatINR(p.budget)}</td>
                      <td className="py-3 px-4 text-slate-700">{p.loggedHours || 120} hrs</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProject(p);
                            setEditBudget(p.budget);
                            setEditRate(p.hourlyRate || 3500);
                          }}
                          className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold"
                        >
                          Update Budget
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'budget_vs_actual' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Budget vs Actual Variance</h1>
            <p className="text-xs text-slate-500 font-medium">
              Monitor burn rates, remaining contract allocations, and over-budget risk indicators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safeProjects.map((p) => {
              const consumed = Math.min(100, Math.round(((p.loggedHours || 80) / (p.allocatedHours || 200)) * 100));
              return (
                <div key={p.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-500">{p.client}</p>
                    </div>
                    <span className="text-xs font-black text-blue-700">{formatCr(p.budget)}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Budget Consumed</span>
                      <span className={consumed > 85 ? 'text-rose-600' : 'text-blue-600'}>{consumed}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${consumed > 85 ? 'bg-rose-600' : 'bg-blue-600'}`}
                        style={{ width: `${consumed}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Logged: {p.loggedHours || 80} hrs</span>
                    <span>Allocated: {p.allocatedHours || 200} hrs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'employee_utilization' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Employee Utilization</h1>
            <p className="text-xs text-slate-500 font-medium">
              Resource capacity, billable hours breakdown, and team utilization targets.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Team Billable Rates & Capacity</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Hourly Cost</th>
                    <th className="py-3 px-4">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeAllUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 text-slate-600 uppercase text-[10px] font-bold">{u.role}</td>
                      <td className="py-3 px-4 text-slate-600">{u.department}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatINR(u.hourlyRate)}/hr</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                          78% Optimal
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tool_utilization' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Tool Utilization</h1>
              <p className="text-xs text-slate-500 font-medium">
                SaaS software licenses, cloud infrastructure, and tool expenses per project.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddToolModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Allocate SaaS Tool</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeProjects.flatMap((p) =>
              (p.tools || []).map((t) => (
                <div key={`${p.id}-${t.id}`} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                      {t.category}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{p.name}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{t.name}</h3>
                    <p className="text-xl font-black text-slate-900 mt-1">{formatINR(t.monthlyCost)}/mo</p>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
                    <span>Assigned Seats: {t.assignedUsersCount} users</span>
                    <span>Yearly: {formatINR(t.monthlyCost * 12)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'ac_reports' && (
        <div className="space-y-6">
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
      )}

      {/* Edit Budget Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Edit Contract Budget</h3>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Updating budget parameters for <strong className="text-slate-900">{editingProject.name}</strong> ({editingProject.client}).
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contract Budget Amount (INR ₹)
                </label>
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client Hourly Billing Rate (INR ₹)
                </label>
                <input
                  type="number"
                  value={editRate}
                  onChange={(e) => setEditRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tool Modal */}
      {showAddToolModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Allocate SaaS Tool</h3>
              <button
                type="button"
                onClick={() => setShowAddToolModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTool} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Project</label>
                <select
                  value={selectedToolProjectId}
                  onChange={(e) => setSelectedToolProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Project --</option>
                  {safeProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tool Name</label>
                <input
                  type="text"
                  placeholder="e.g. Figma Enterprise, AWS Cloud, OpenAI API"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newToolCategory}
                    onChange={(e) => setNewToolCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="Cloud">Cloud</option>
                    <option value="Design">Design</option>
                    <option value="Dev">Dev</option>
                    <option value="AI">AI</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Testing">Testing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Cost (₹)</label>
                  <input
                    type="number"
                    value={newToolCost}
                    onChange={(e) => setNewToolCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddToolModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Allocate Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
