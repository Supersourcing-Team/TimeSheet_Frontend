import React from 'react';
import { useGetUpcomingLeavesQuery } from '../../store/api/dataApi';
import { CalendarDays, AlertCircle, Plane } from 'lucide-react';

interface UpcomingLeavesWidgetProps {
  className?: string;
}

export const UpcomingLeavesWidget: React.FC<UpcomingLeavesWidgetProps> = ({ className = '' }) => {
  const { data: upcomingLeaves = [], isLoading, error } = useGetUpcomingLeavesQuery();

  if (isLoading) {
    return (
      <div className={`p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center min-h-[300px] ${className}`}>
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-slate-500 ${className}`}>
        <AlertCircle className="w-8 h-8 mb-2 text-rose-400" />
        <p className="text-sm font-semibold">Failed to load leaves</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden ${className}`}>
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center border border-indigo-200 text-indigo-600 shadow-inner">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Upcoming Leaves</h3>
            <p className="text-xs text-slate-500 font-medium">Team members on leave</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
          {upcomingLeaves.length} {upcomingLeaves.length === 1 ? 'Leave' : 'Leaves'}
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto min-h-[250px] max-h-[400px]">
        {upcomingLeaves.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60 mt-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
              <CalendarDays className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">No upcoming leaves</p>
              <p className="text-xs text-slate-400 mt-1">Your entire team is available.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingLeaves.map((leave: any, idx: number) => {
              const startDate = new Date(leave.start_date);
              const endDate = new Date(leave.end_date);
              const isToday = new Date().toISOString().split('T')[0] === leave.start_date;
              
              const formatShortDate = (date: Date) => {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              };
              
              const dateDisplay = leave.leave_duration_type === 'multiple_days'
                ? `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`
                : formatShortDate(startDate);

              let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
              let badgeText = leave.leave_duration_type.replace('_', ' ');
              if (leave.leave_duration_type === 'half_day' && leave.half_day_period) {
                badgeText = `${leave.half_day_period} Half`;
                badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
              } else if (leave.leave_duration_type === 'partial_day') {
                badgeText = `${leave.partial_start_time} - ${leave.partial_end_time}`;
                badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
              }

              return (
                <div key={idx} className="group p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 relative overflow-hidden flex items-center justify-between gap-4">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm shrink-0">
                      {leave.user?.first_name?.[0] || ''}{leave.user?.last_name?.[0] || ''}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {leave.user?.first_name} {leave.user?.last_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center border capitalize ${badgeColor}`}>
                          {badgeText}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center border bg-rose-50 text-rose-700 border-rose-200 animate-pulse">
                            On Leave Today
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 text-slate-500 font-semibold text-xs">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{dateDisplay}</span>
                    </div>
                    {leave.leave_type?.name && (
                      <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{leave.leave_type.name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
