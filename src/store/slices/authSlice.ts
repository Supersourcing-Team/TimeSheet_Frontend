import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, ActivePortalMode } from '../../types';

interface AuthState {
  user: User | null;
  portalMode: ActivePortalMode;
}

const initialState: AuthState = {
  user: null,
  portalMode: 'employee', // default, will be overridden on login
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User }>
    ) => {
      const { user } = action.payload;
      state.user = user;
      state.portalMode = user.role as ActivePortalMode;
    },
    logout: (state) => {
      state.user = null;
      state.portalMode = 'employee';
      localStorage.removeItem('chronos_current_user'); // cleanup old localstorage
    },
    setPortalMode: (state, action: PayloadAction<ActivePortalMode>) => {
      state.portalMode = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      if (!state.user) {
        state.portalMode = 'employee';
      }
    }
  },
});

export const { setCredentials, logout, setPortalMode, setUser } = authSlice.actions;
export default authSlice.reducer;
