import React, { useState } from 'react';
import { ActivePortalMode, User } from '../types';
import {
  Search,
  Bell,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Sparkles,
  LogOut,
  Building2,
  Briefcase,
  Users,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface HeaderProps {
  currentUser: User;
  portalMode: ActivePortalMode;
  onTogglePortalMode: (mode: ActivePortalMode) => void;
  pendingApprovalsCount: number;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  portalMode,
  onTogglePortalMode,
  pendingApprovalsCount,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    {
      id: 'n1',
      title: 'Timesheet Approved',
      desc: 'Your timesheet for Project Apollo (8 hrs) was approved.',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: 'n2',
      title: 'Leave Request Received',
      desc: 'Sarah Chen applied for 3 days annual leave starting Aug 25.',
      time: '4 hours ago',
      unread: true,
    },
    {
      id: 'n3',
      title: 'Client Contract Updated',
      desc: 'Apex Financial budget cap updated to ₹45,00,000.',
      time: '1 day ago',
      unread: false,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 shadow-xs">
      {/* Left Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 shadow-md shadow-blue-600/20 text-white font-extrabold text-xl">
          C
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight text-slate-900">
              SuperTime
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              ENTERPRISE
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold hidden sm:block">
            Timesheet & Resource Governance • INR (₹)
          </p>
        </div>
      </div>

      {/* Center Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4 relative">
        <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects, timesheets, employees, tools or client accounts..."
          className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Portal Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTogglePortalMode('employee')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${portalMode === 'employee'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Employee</span>
          </button>

          <button
            type="button"
            onClick={() => onTogglePortalMode('pm')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${portalMode === 'pm'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PM</span>
            {pendingApprovalsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTogglePortalMode('ac_manager')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${portalMode === 'ac_manager'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AC Manager</span>
          </button>

          <button
            type="button"
            onClick={() => onTogglePortalMode('admin')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${portalMode === 'admin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 text-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Notifications
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  3 Unread
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-lg object-cover ring-2 ring-blue-500/20"
            />
            <div className="text-left hidden lg:block">
              <p className="text-xs font-bold text-slate-900 leading-none">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-blue-600 mt-0.5 leading-none font-extrabold capitalize">
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 text-slate-800">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200 mb-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/20"
                />
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">{currentUser.name}</h4>
                  <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                    Role: {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 text-slate-700 flex justify-between items-center font-semibold">
                  <span>Hourly Rate:</span>
                  <span className="font-extrabold text-blue-600">{formatINR(currentUser.hourlyRate)}/hr</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
