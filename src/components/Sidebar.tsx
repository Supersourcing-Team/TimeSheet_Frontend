import React from 'react';
import { ActivePortalMode } from '../types';
import {
  LayoutDashboard,
  Clock,
  Calendar,
  FolderKanban,
  Palmtree,
  Moon,
  BarChart3,
  DollarSign,
  Users,
  CheckSquare,
  UserCog,
  Briefcase,
  Building2,
  ShieldCheck,
  TrendingUp,
  CalendarCheck,
  CalendarX,
  CalendarDays,
  Settings,
  Wrench,
  Plus,
  HelpCircle,
  FileText,
} from 'lucide-react';

export type EmployeeTab =
  | 'my_dashboard'
  | 'submit_timesheet'
  | 'timesheets_history'
  | 'my_projects'
  | 'leave_management'
  | 'weekend_work';

export type PMTab =
  | 'pm_dashboard'
  | 'pm_my_projects'
  | 'pm_resource_allocation'
  | 'pm_timesheet_review'
  | 'pm_weekend_work';

export type ACManagerTab =
  | 'ac_dashboard'
  | 'project_financials'
  | 'budget_vs_actual'
  | 'employee_utilization'
  | 'tool_utilization'
  | 'ac_reports';

export type AdminTab =
  | 'admin_overview'
  | 'user_management'
  | 'admin_leave_approvals'
  | 'admin_holidays'
  | 'admin_leave_types'
  | 'admin_working_calendar'
  | 'admin_settings';

interface SidebarProps {
  portalMode: ActivePortalMode;
  activeEmployeeTab: EmployeeTab;
  onSelectEmployeeTab: (tab: EmployeeTab) => void;
  activePmTab?: PMTab;
  onSelectPmTab?: (tab: PMTab) => void;
  activeAcTab?: ACManagerTab;
  onSelectAcTab?: (tab: ACManagerTab) => void;
  activeAdminTab: AdminTab;
  onSelectAdminTab: (tab: AdminTab) => void;
  pendingTimesheetsCount: number;
  pendingLeavesCount: number;
  pendingWeekendCount: number;
  onQuickAddTimesheet?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  portalMode,
  activeEmployeeTab,
  onSelectEmployeeTab,
  activePmTab,
  onSelectPmTab,
  activeAcTab,
  onSelectAcTab,
  activeAdminTab,
  onSelectAdminTab,
  pendingTimesheetsCount,
  pendingLeavesCount,
  pendingWeekendCount,
  onQuickAddTimesheet,
}) => {
  const employeeNavItems: Array<{
    id: EmployeeTab;
    label: string;
    icon: any;
    desc: string;
    badge?: number;
  }> = [
    {
      id: 'my_dashboard',
      label: 'My Dashboard',
      icon: LayoutDashboard,
      desc: 'Weekly Hours & Stats',
    },
    {
      id: 'submit_timesheet',
      label: 'Submit Daily Timesheet',
      icon: Clock,
      desc: 'Separate Billable & Non-Billable Notes',
    },
    {
      id: 'timesheets_history',
      label: 'Timesheets History',
      icon: Calendar,
      desc: 'Calendar & List Log Views',
    },
    {
      id: 'my_projects',
      label: 'My Assigned Projects',
      icon: FolderKanban,
      desc: 'Sprint Projects & Tools',
    },
    {
      id: 'leave_management',
      label: 'Leave Management',
      icon: Palmtree,
      desc: 'Balances & Leave Request Form',
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
    },
    {
      id: 'weekend_work',
      label: 'Weekend Work Requests',
      icon: Moon,
      desc: 'Overtime & Pre-approvals',
      badge: pendingWeekendCount > 0 ? pendingWeekendCount : undefined,
    },
  ];

  const pmNavItems: Array<{
    id: PMTab;
    label: string;
    icon: any;
    desc: string;
    badge?: number;
  }> = [
    {
      id: 'pm_dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Project KPIs & Overview',
    },
    {
      id: 'pm_my_projects',
      label: 'My Projects',
      icon: Briefcase,
      desc: 'Projects, Team & Tools',
    },
    {
      id: 'pm_resource_allocation',
      label: 'Resource Allocation',
      icon: Users,
      desc: 'Assign Employees & Tools',
    },
    {
      id: 'pm_timesheet_review',
      label: 'Timesheet Review',
      icon: CheckSquare,
      desc: 'Read-Only Team Logs',
      badge: pendingTimesheetsCount > 0 ? pendingTimesheetsCount : undefined,
    },
    {
      id: 'pm_weekend_work',
      label: 'Weekend Work Requests',
      icon: CalendarX,
      desc: 'Approve Weekend Overtime',
      badge: pendingWeekendCount > 0 ? pendingWeekendCount : undefined,
    },
  ];

  const acNavItems: Array<{
    id: ACManagerTab;
    label: string;
    icon: any;
    desc: string;
    badge?: string | number;
  }> = [
    {
      id: 'ac_dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Portfolio Overview & Financials',
    },
    {
      id: 'project_financials',
      label: 'Project Financials',
      icon: DollarSign,
      desc: 'Budgets, Costs & Profitability',
    },
    {
      id: 'budget_vs_actual',
      label: 'Budget vs Actual',
      icon: TrendingUp,
      desc: 'Variance & Consumption Rates',
    },
    {
      id: 'employee_utilization',
      label: 'Employee Utilization',
      icon: Users,
      desc: 'Resource Capacity & Billables',
    },
    {
      id: 'tool_utilization',
      label: 'Tool Utilization',
      icon: Wrench,
      desc: 'Software Licenses & SaaS Costs',
    },
    {
      id: 'ac_reports',
      label: 'Reports',
      icon: BarChart3,
      desc: 'Financial Summary & Audit Exports',
    },
  ];

  const adminNavItems: Array<{
    id: AdminTab;
    label: string;
    icon: any;
    desc: string;
    badge?: number;
  }> = [
    {
      id: 'admin_overview',
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Master KPIs & User Activity',
    },
    {
      id: 'user_management',
      label: 'User Management',
      icon: Users,
      desc: 'Employees, Roles & Status',
    },
    {
      id: 'admin_leave_approvals',
      label: 'Leave Approvals',
      icon: Palmtree,
      desc: 'Review & Approve Employee Leaves',
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
    },
    {
      id: 'admin_holidays',
      label: 'Holidays',
      icon: CalendarCheck,
      desc: 'Organization Holiday Calendar',
    },
    {
      id: 'admin_leave_types',
      label: 'Leave Types',
      icon: CalendarX,
      desc: 'Leave Categories & Entitlements',
    },
    {
      id: 'admin_working_calendar',
      label: 'Working Calendar',
      icon: CalendarDays,
      desc: 'Standard Working Hours & Days',
    },
    {
      id: 'admin_settings',
      label: 'Settings',
      icon: Settings,
      desc: 'System Configuration & Branding',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 text-slate-700 flex flex-col shrink-0 min-h-[calc(100vh-61px)] shadow-xs">
      {/* Mode Indicator Banner */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
            Active Workspace
          </span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
            {portalMode.replace('_', ' ')} MODE
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        {portalMode === 'employee' ? (
          <div>
            <div className="px-3 py-2 text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
              Employee Navigation
            </div>
            {employeeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeEmployeeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectEmployeeTab(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold leading-tight truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate mt-0.5 ${
                          isActive ? 'text-blue-100 font-medium' : 'text-slate-400 font-normal'
                        }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  {item.badge !== undefined && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-900 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : portalMode === 'pm' ? (
          <div>
           
            {pmNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePmTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectPmTab && onSelectPmTab(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold leading-tight truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate mt-0.5 ${
                          isActive ? 'text-blue-100 font-medium' : 'text-slate-400 font-normal'
                        }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  {item.badge !== undefined && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-900 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : portalMode === 'ac_manager' ? (
          <div>
            <div className="px-3 py-2 text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
              ProjectOS • Enterprise Tier
            </div>
            {acNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeAcTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectAcTab && onSelectAcTab(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group mb-0.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold leading-tight truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate mt-0.5 ${
                          isActive ? 'text-blue-100 font-medium' : 'text-slate-400 font-normal'
                        }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  {item.badge !== undefined && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500 text-white shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="px-3 py-2 text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
              Management & Admin Portal
            </div>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectAdminTab(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold leading-tight truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate mt-0.5 ${
                          isActive ? 'text-blue-100 font-medium' : 'text-slate-400 font-normal'
                        }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  {item.badge !== undefined && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Quick Action & Footer Links */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
        

      </div>
    </aside>
  );
};
