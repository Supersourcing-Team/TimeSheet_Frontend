import { apiSlice } from '../apiSlice';
import { mapBackendUserToFrontendUser } from './authApi';
import { Project, TimesheetEntry, LeaveRequest, WeekendWorkRequest, User, HolidayItem, LeaveTypeConfig } from '../../types';

// Assuming standard paginated response { success, data: { items: [...] } } or just { success, data: [...] }
export const dataApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Projects
    getProjects: builder.query<Project[], void>({
      query: () => '/projects',
      transformResponse: (res: any) => res.data?.items || res.data || [],
      providesTags: ['Project'],
    }),
    
    // Timesheets
    getTimesheets: builder.query<TimesheetEntry[], void>({
      query: () => '/timesheets/me',
      transformResponse: (res: any) => res.data?.items || res.data || [],
      providesTags: ['Timesheet'],
    }),
    createTimesheets: builder.mutation<void, Omit<TimesheetEntry, 'id'>[]>({
      query: (entries) => ({
        url: '/timesheets', 
        method: 'POST',
        body: entries.length === 1 ? entries[0] : entries, // backend might expect single TimesheetCreate, handle accordingly
      }),
      invalidatesTags: ['Timesheet'],
    }),
    updateTimesheetStatus: builder.mutation<void, { id: string, status: string, reason?: string }>({
      query: ({ id, ...body }) => ({
        url: `/timesheets/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Timesheet'],
    }),

    // Leave Requests
    getLeaveRequests: builder.query<LeaveRequest[], void>({
      query: () => '/leave-requests',
      transformResponse: (res: any) => res.data?.items || res.data || [],
      providesTags: ['LeaveRequest'],
    }),
    getMyLeaveRequests: builder.query<LeaveRequest[], void>({
      query: () => '/leave-requests/me',
      transformResponse: (res: any) => res.data?.items || res.data || [],
      providesTags: ['LeaveRequest'],
    }),
    createLeaveRequest: builder.mutation<void, Omit<LeaveRequest, 'id'>>({
      query: (body) => ({
        url: '/leave-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LeaveRequest'],
    }),
    updateLeaveStatus: builder.mutation<void, { id: string, status: string, comment?: string }>({
      query: ({ id, ...body }) => ({
        url: `/leave-requests/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['LeaveRequest'],
    }),

    // Weekend requests
    getWeekendRequests: builder.query<WeekendWorkRequest[], void>({
      query: () => '/weekend-work/me',
      transformResponse: (res: any) => res.data?.items || res.data || [],
      providesTags: ['WeekendWork'],
    }),
    
    // Users
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      transformResponse: (res: any) => {
        const items = res.data?.items || res.data || [];
        return items.map(mapBackendUserToFrontendUser);
      },
      providesTags: ['User'],
    }),
    
    // Settings / Holidays
    getHolidays: builder.query<HolidayItem[], void>({
      query: () => '/holidays',
      transformResponse: (res: any) => {
        const items = Array.isArray(res) ? res : (res.data || []);
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return items.map((h: any) => {
          const dateObj = new Date(h.date);
          return {
            ...h,
            month: months[dateObj.getMonth()],
            day: String(dateObj.getDate()).padStart(2, '0'),
            dayOfWeek: days[dateObj.getDay()]
          };
        });
      },
      providesTags: ['Holiday'],
    }),
    createHoliday: builder.mutation<HolidayItem, Omit<HolidayItem, 'id'>>({
      query: (body) => ({
        url: '/holidays',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Holiday'],
    }),
    updateHoliday: builder.mutation<HolidayItem, Partial<HolidayItem> & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/holidays/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Holiday'],
    }),
    deleteHoliday: builder.mutation<void, string>({
      query: (id) => ({
        url: `/holidays/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Holiday'],
    }),

    // Leave Types
    getLeaveTypes: builder.query<LeaveTypeConfig[], void>({
      query: () => '/leave-types',
      transformResponse: (res: any) => Array.isArray(res) ? res : (res.data || []),
      providesTags: ['LeaveType'],
    }),
    createLeaveType: builder.mutation<LeaveTypeConfig, Omit<LeaveTypeConfig, 'id'>>({
      query: (body) => ({
        url: '/leave-types',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LeaveType'],
    }),
    updateLeaveType: builder.mutation<LeaveTypeConfig, Partial<LeaveTypeConfig> & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/leave-types/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['LeaveType'],
    }),
    deleteLeaveType: builder.mutation<void, string>({
      query: (id) => ({
        url: `/leave-types/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LeaveType'],
    }),

    // Roles
    getRoles: builder.query<any[], void>({
      query: () => '/roles',
      transformResponse: (res: any) => res.data || [],
    }),

    // Admin Dashboard
    getDashboardSummary: builder.query<any, void>({
      query: () => '/dashboard/summary',
      transformResponse: (res: any) => res.data || {},
    }),

    createUser: builder.mutation<User, any>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<User, any>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetTimesheetsQuery,
  useCreateTimesheetsMutation,
  useUpdateTimesheetStatusMutation,
  useGetLeaveRequestsQuery,
  useGetMyLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useUpdateLeaveStatusMutation,
  useGetWeekendRequestsQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useGetLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
  useGetRolesQuery,
  useGetDashboardSummaryQuery,
} = dataApi;
