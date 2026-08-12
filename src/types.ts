/// <reference types="vite/client" />

export type UserRole = 'employee' | 'pm' | 'ac_manager' | 'admin';
export type ActivePortalMode = 'employee' | 'pm' | 'ac_manager' | 'admin';


export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
  title: string;
  status: 'active' | 'inactive' | 'on_leave' | 'resigned';
  hourlyRate: number; // in INR ₹
  joinDate: string;
  allocatedProjectsCount: number;
}

export interface HolidayItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  month: string;
  day: string;
  dayOfWeek: string;
  type: 'National' | 'Global' | 'Regional' | 'Observance';
  description?: string;
  is_mandatory: boolean;
}

export interface LeaveTypeConfig {
  id: string;
  name: string;
  code: string;
  daysPerYear: number;
  isPaid: boolean;
  status: 'active' | 'inactive';
  description: string;
  requiresDocument?: boolean;
}

export interface WorkingCalendarConfig {
  fullDayHours: number;
  halfDayHours: number;
  partialDayMinHours: number;
  partialDayMaxHours: number;
  workingDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  timeZone: string;
}

export interface SystemSettingsConfig {
  orgName: string;
  orgRegId: string;
  contactEmail: string;
  companyLogoUrl: string;
  timeZone: string;
  emailNotifications: boolean;
  timesheetApprovalReminders: boolean;
  leaveRequestAlerts: boolean;
  primaryColor: string;
}

export interface ProjectTool {
  id: string;
  name: string;
  category: 'Cloud' | 'Design' | 'Dev' | 'AI' | 'SaaS' | 'Testing';
  monthlyCost: number; // in INR ₹
  assignedUsersCount: number;
  allocationDate?: string;
  deallocationDate?: string;
  status?: 'active' | 'deallocated';
}

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  accountManagerName?: string;
  pmName: string;
  pmAvatar: string;
  status: 'active' | 'completed' | 'on_hold' | 'planning';
  budget: number; // in INR ₹
  hourlyRate: number; // in INR ₹
  allocatedHours: number;
  loggedHours: number;
  billableHours: number;
  startDate: string;
  endDate: string;
  description: string;
  tools: ProjectTool[];
  assignedUserIds: string[];
}

export interface TimesheetEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  projectId: string;
  projectName: string;
  date: string; // YYYY-MM-DD
  hours: number;
  billableHours: number;
  nonBillableHours: number;
  description: string; // Combined summary or main task
  billableDescription?: string; // Separate description for billable work
  nonBillableDescription?: string; // Separate description for non-billable work
  category: 'Development' | 'Design' | 'Meeting' | 'Code Review' | 'Testing' | 'Documentation' | 'DevOps';
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt?: string;
}

export interface LeaveBalance {
  annualLeaveTotal: number;
  annualLeaveUsed: number;
  sickLeaveTotal: number;
  sickLeaveUsed: number;
  parentalLeaveTotal: number;
  parentalLeaveUsed: number;
  compOffTotal: number;
  compOffUsed: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'Annual Leave' | 'Sick Leave' | 'Parental Leave' | 'Compensatory Off';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  backupContact?: string;
  isHalfDay?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  reviewedBy?: string;
  reviewComment?: string;
}

export interface WeekendWorkRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  projectId: string;
  projectName: string;
  workDate: string; // YYYY-MM-DD (Sat or Sun)
  plannedHours: number;
  deliverableObjective: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedOn: string;
  reviewedBy?: string;
}

export interface ActivityLog {
  id: string;
  userName: string;
  userAvatar: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'timesheet' | 'leave' | 'project' | 'user' | 'system';
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

declare global {
  interface Window {
    google?: any;
  }
}

