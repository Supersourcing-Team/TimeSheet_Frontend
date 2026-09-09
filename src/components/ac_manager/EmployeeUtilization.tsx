import React, { useState, useMemo } from 'react';
import { Project } from '../../types';
import {
  useGetUtilizationDashboardQuery,
  useGetEmployeeUtilizationQuery,
  useGetMilestonesByProjectQuery,
} from '../../store/api/dataApi';
import { formatINR } from '../../utils/formatters';
import {
  Users,
  Clock,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Download,
  Filter,
  Search,
  RotateCcw,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

interface EmployeeUtilizationProps {
  projects: Project[];
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const EmployeeUtilization: React.FC<EmployeeUtilizationProps> = ({
  projects,
  onShowToast,
}) => {
  // Filter states
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Query milestones for the dropdown when a project is selected
  const numericProjectId = selectedProjectId ? Number(selectedProjectId) : undefined;
  const { data: projectMilestones = [] } = useGetMilestonesByProjectQuery(numericProjectId!, {
    skip: !numericProjectId,
  });

  // Query parameters for utilization APIs
  const queryParams = useMemo(() => {
    const params: { project_id?: number; milestone_id?: number; milestone_status?: string } = {};
    if (selectedProjectId) params.project_id = Number(selectedProjectId);
    if (selectedMilestoneId) params.milestone_id = Number(selectedMilestoneId);
    if (selectedStatus) params.milestone_status = selectedStatus;
    return params;
  }, [selectedProjectId, selectedMilestoneId, selectedStatus]);

  // RTK Queries
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isFetching: isDashboardFetching,
    refetch: refetchDashboard,
  } = useGetUtilizationDashboardQuery(queryParams);

  const {
    data: employeeData,
    isLoading: isEmployeesLoading,
    isFetching: isEmployeesFetching,
    refetch: refetchEmployees,
  } = useGetEmployeeUtilizationQuery(queryParams);


  const isRefreshing = isDashboardFetching || isEmployeesFetching;

  const handleRefresh = () => {
    refetchDashboard();
    refetchEmployees();
    onShowToast?.('Refreshed', 'Utilization metrics updated from backend.', 'info');
  };

  const handleResetFilters = () => {
    setSelectedProjectId('');
    setSelectedMilestoneId('');
    setSelectedStatus('');
    setSearchQuery('');
  };

  // Safe defaults
  const capacity = dashboardData?.capacity || {
    total_employees: 0,
    available_hours: 0,
    billable_hours: 0,
    non_billable_hours: 0,
    employee_utilization_pct: 0,
  };

  const cost = dashboardData?.cost || {
    employee_cost: 0,
    tool_cost: 0,
    total_actual_cost: 0,
  };

  const budget = dashboardData?.budget || {
    total_budget: 0,
    budget_utilization_pct: 0,
    remaining_budget: 0,
    cost_variance: 0,
    cost_variance_pct: 0,
  };

  const forecast = dashboardData?.forecast || {
    forecasted_final_cost: 0,
    projected_overrun: 0,
  };

  const employees = employeeData?.employees || [];

  // Filtered employee rows
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter((emp) =>
      emp.employee_name.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);


  // CSV Export helper
  const handleExportCSV = () => {
      if (!employees.length) {
        onShowToast?.('Export Error', 'No employee data to export.', 'error');
        return;
      }
      const headers = ['Employee Name', 'Available Hours', 'Billable Hours', 'Non-Billable Hours', 'Utilization (%)', 'Hourly Cost (INR)', 'Total Cost (INR)'];
      const rows = employees.map((e) => [
        `"${e.employee_name}"`,
        e.available_hours,
        e.billable_hours,
        e.non_billable_hours,
        e.utilization_pct,
        e.hourly_cost,
        e.employee_cost,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `employee_utilization_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast?.('Exported', 'Employee utilization data exported as CSV.', 'success');
  };

  const getUtilColor = (pct: number) => {
    if (pct >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (pct >= 60) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (pct >= 30) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6 text-slate-800 pb-12">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Employee Utilization & Cost Control
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-700 uppercase tracking-wider">
              AC Manager
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Capacity derived from milestone working dates; actual effort and cost calculated solely from verified timesheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh metrics"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Scope & Attribution Filters</span>
          </div>
          {(selectedProjectId || selectedMilestoneId || selectedStatus) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Project Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedMilestoneId('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            >
              <option value="">All Projects ({projects?.length || 0})</option>
              {(projects || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.client})
                </option>
              ))}
            </select>
          </div>

          {/* Milestone Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Milestone
            </label>
            <select
              value={selectedMilestoneId}
              onChange={(e) => setSelectedMilestoneId(e.target.value)}
              disabled={!selectedProjectId}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
            >
              <option value="">
                {!selectedProjectId ? 'Select a project first' : `All Project Milestones (${projectMilestones?.length || 0})`}
              </option>
              {projectMilestones.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.status})
                </option>
              ))}
            </select>
          </div>

          {/* Milestone Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Milestone Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            >
              <option value="">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── KPI Cards: 4 Dimension Pillars ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Capacity & Utilization Pillar */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Capacity & Utilization
              </span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {capacity.employee_utilization_pct}%
                </span>
                <span className="text-xs font-semibold text-slate-500">Utilization</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, capacity.employee_utilization_pct))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-slate-100 text-[11px]">
            <div>
              <span className="text-slate-400 block font-medium">Available Cap:</span>
              <span className="font-bold text-slate-800">{capacity.available_hours} hrs</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Billable Effort:</span>
              <span className="font-bold text-blue-600">{capacity.billable_hours} hrs</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Non-Billable:</span>
              <span className="font-bold text-slate-600">{capacity.non_billable_hours} hrs</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Active Headcount:</span>
              <span className="font-bold text-slate-800">{capacity.total_employees} logged</span>
            </div>
          </div>
        </div>

        {/* 2. Employee & Tool Cost Pillar */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Actual Spend
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatINR(cost.total_actual_cost)}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Total Incurred Project Cost
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-slate-100 text-[11px]">
            <div>
              <span className="text-slate-400 block font-medium">Employee Cost:</span>
              <span className="font-bold text-slate-800">{formatINR(cost.employee_cost)}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Tool & SaaS Cost:</span>
              <span className="font-bold text-slate-800">{formatINR(cost.tool_cost)}</span>
            </div>
            <div className="col-span-2 text-[10px] text-slate-400 flex items-center gap-1 mt-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>Calculated from rate cards & tool hourly rates (Cost / 22 / 8 × Logged Hours)</span>
            </div>
          </div>
        </div>

        {/* 3. Budget Consumption Pillar */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Budget & Variance
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatINR(budget.total_budget)}
                </span>
                <span className="text-xs font-semibold text-slate-500">Budget</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budget.budget_utilization_pct > 100
                      ? 'bg-rose-500'
                      : budget.budget_utilization_pct > 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, budget.budget_utilization_pct))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-slate-100 text-[11px]">
            <div>
              <span className="text-slate-400 block font-medium">Consumed:</span>
              <span className="font-bold text-slate-800">{budget.budget_utilization_pct}%</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Remaining:</span>
              <span className="font-bold text-emerald-600">{formatINR(budget.remaining_budget)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block font-medium">Cost Variance (Budget - Actual):</span>
              <span
                className={`font-black ${
                  budget.cost_variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {budget.cost_variance >= 0 ? '+' : ''}
                {formatINR(budget.cost_variance)} ({budget.cost_variance_pct}%)
              </span>
            </div>
          </div>
        </div>

        {/* 4. Forecast & Risk Pillar */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              forecast.projected_overrun > 0
                ? 'bg-gradient-to-r from-rose-500 to-red-500'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
            }`}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Cost Forecast & Risk
              </span>
              <div
                className={`p-1.5 rounded-lg ${
                  forecast.projected_overrun > 0
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {forecast.projected_overrun > 0 ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatINR(forecast.forecasted_final_cost)}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Forecasted Completion Cost
              </span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Projected Overrun:</span>
              <span
                className={`font-black ${
                  forecast.projected_overrun > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {forecast.projected_overrun > 0
                  ? `+${formatINR(forecast.projected_overrun)} (Over Budget)`
                  : 'On Track (No Overrun)'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              Extrapolated from current burn rate & milestone progress.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs & Search Bar ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder='Search employee name...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* ── Tab Content: Employee Breakdown Table ─────────────────────── */}
          <div className="overflow-x-auto">
            {isEmployeesLoading ? (
              <div className="py-16 text-center text-xs font-semibold text-slate-400">
                Loading employee utilization data...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No employee timesheet records found</p>
                <p className="text-[11px] text-slate-400">
                  Only employees with filled timesheets in the selected scope are included in utilization.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4 text-right">Available Hrs</th>
                    <th className="py-3 px-4 text-right">Billable Hrs</th>
                    <th className="py-3 px-4 text-right">Non-Billable</th>
                    <th className="py-3 px-4 text-center">Utilization</th>
                    <th className="py-3 px-4 text-right">Hourly Rate</th>
                    <th className="py-3 px-4 text-right">Employee Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.employee_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs">
                            {emp.employee_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{emp.employee_name}</p>
                            <span className="text-[10px] text-slate-400">ID #{emp.employee_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        {emp.available_hours} hrs
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">
                        {emp.billable_hours} hrs
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-500">
                        {emp.non_billable_hours} hrs
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1 w-24">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${getUtilColor(
                              emp.utilization_pct
                            )}`}
                          >
                            {emp.utilization_pct}%
                          </span>
                          <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{ width: `${Math.min(100, Math.max(0, emp.utilization_pct))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        {formatINR(emp.hourly_cost)}/hr
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatINR(emp.employee_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
      </div>
    </div>
  );
};
