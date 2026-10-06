import { ActivityLog } from '../types';

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    userName: 'Alex Morgan',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    action: 'Submitted timesheet for',
    target: 'Fintech Mobile Rebrand (7.5 hrs)',
    timestamp: '10 minutes ago',
    type: 'timesheet',
  },
  {
    id: 'act-2',
    userName: 'Sarah Chen',
    userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    action: 'Approved leave request for',
    target: 'Priya Patel (5 Days)',
    timestamp: '1 hour ago',
    type: 'leave',
  },
  {
    id: 'act-3',
    userName: 'Rajesh Sharma',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    action: 'Reviewed account budget for',
    target: 'Apex Financial India (₹45,00,000)',
    timestamp: '2 hours ago',
    type: 'project',
  },
  {
    id: 'act-4',
    userName: 'Elena Rostova',
    userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    action: 'Logged design assets for',
    target: 'Fintech Rebrand (8.0 hrs)',
    timestamp: '3 hours ago',
    type: 'timesheet',
  }
];

export const INITIAL_WORKING_CALENDAR = {
  fullDayHours: 8.0,
  halfDayHours: 4.0,
  partialDayMinHours: 2.0,
  partialDayMaxHours: 6.0,
  workingDays: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  },
  timeZone: 'Asia/Kolkata (IST UTC+05:30)',
};

export const INITIAL_SETTINGS = {
  orgName: 'SuperTime Enterprise Solutions Pvt. Ltd.',
  orgRegId: 'CIN-U72900MH2021PTC368912',
  contactEmail: 'admin@supersourcing.com',
  companyLogoUrl: '0',
  timeZone: 'Asia/Kolkata (IST UTC+05:30)',
  emailNotifications: true,
  timesheetApprovalReminders: true,
  leaveRequestAlerts: true,
  primaryColor: '#004ac6',
};
