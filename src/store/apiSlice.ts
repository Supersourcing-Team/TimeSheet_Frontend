import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { RootState } from './index';
import { logout } from './slices/authSlice';
import { mapBackendUserToFrontendUser } from '../utils/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  timeout: 10000, // 10 second timeout to prevent infinite hanging
});

const mutex = new Mutex();

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await baseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const data = (refreshResult.data as any).data;
          if (data && data.user) {
            const normalizedUser = mapBackendUserToFrontendUser(data.user);
            api.dispatch({
              type: 'auth/setCredentials',
              payload: {
                user: normalizedUser,
              },
            });
            result = await baseQuery(args, api, extraOptions);
          } else {
            api.dispatch(logout());
            // Clear stale cache so the next user never sees another user's data
            api.dispatch(apiSlice.util.resetApiState());
          }
        } else {
          api.dispatch(logout());
          // Clear stale cache on refresh failure too
          api.dispatch(apiSlice.util.resetApiState());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User',
    'Department', 'Project', 'Timesheet', 'LeaveRequest', 'LeaveBalance', 'WeekendWork', 'Holiday', 'LeaveType', 'Role', 'Tool'],
  endpoints: (builder) => ({}),
});
