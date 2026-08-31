import { User, UserRole } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export function mapBackendRoleToFrontendRole(backendRole: string): UserRole {
  const roleStr = (backendRole || '').toLowerCase();
  if (roleStr.includes('admin')) return 'admin';
  if (roleStr.includes('project') || roleStr === 'pm') return 'pm';
  if (roleStr.includes('account') || roleStr === 'ac_manager') return 'ac_manager';
  return 'employee';
}

export function mapBackendUserToFrontendUser(backendUser: {
  id: number | string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  employee_id?: string;
}): User {
  const name = [backendUser.first_name, backendUser.last_name].filter(Boolean).join(' ') || backendUser.email;
  const role = mapBackendRoleToFrontendRole(backendUser.role);

  return {
    id: String(backendUser.id),
    name: name,
    email: backendUser.email,
    avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80`,
    role: role,
    department: role === 'admin' ? 'Executive' : role === 'pm' ? 'Project Management' : role === 'ac_manager' ? 'Account Management' : 'Engineering',
    title: backendUser.role,
    status: 'active',
    hourlyRate: 1500,
    joinDate: new Date().toISOString().split('T')[0],
    allocatedProjectsCount: 2,
  };
}

export interface AuthSuccessData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export async function loginWithGoogleApi(credential: string): Promise<AuthSuccessData> {
  const response = await fetch(`${API_BASE_URL}/auth/google/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credential }),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json.message || (json.errors && json.errors[0]?.msg) || 'Google SSO Login failed';
    throw new Error(errorMsg);
  }

  const data = json.data;
  const frontendUser = mapBackendUserToFrontendUser(data.user);

  return {
    user: frontendUser,
  } as AuthSuccessData;
}

export async function fetchCurrentUserApi(): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Session expired');
  }

  return mapBackendUserToFrontendUser(json.data);
}

export async function refreshAccessTokenApi(): Promise<AuthSuccessData> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Token refresh failed');
  }

  const data = json.data;
  const frontendUser = mapBackendUserToFrontendUser(data.user);

  return {
    user: frontendUser,
  } as AuthSuccessData;
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Stateless logout ignore network errors
  }
}

// ---------------------------------------------------------------------------
// Users API
// ---------------------------------------------------------------------------

export interface BackendUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  role_id: number;
  joining_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  role: { id: number; name: string; description: string | null; created_at: string };
}

export interface PaginatedUsersResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: BackendUser[];
}

export interface UserCreatePayload {
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  role_id: number;
  joining_date?: string | null;
  status?: string;
}

export interface UserUpdatePayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  employee_id?: string;
  role_id?: number;
  joining_date?: string | null;
  status?: string;
}

function authHeader() {
  return { 'Content-Type': 'application/json' };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Request failed');
  }
  return json.data as T;
}

export async function fetchUsersApi(
  params?: { page?: number; limit?: number; role_id?: number; status?: string; search?: string }
): Promise<PaginatedUsersResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.role_id) query.set('role_id', String(params.role_id));
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE_URL}/users?${query}`, { credentials: 'include', headers: authHeader() });
  return handleResponse<PaginatedUsersResponse>(res);
}

export async function fetchUserByIdApi(userId: number): Promise<BackendUser> {
  const res = await fetch(`${API_BASE_URL}/users/${userId}`, { credentials: 'include', headers: authHeader() });
  return handleResponse<BackendUser>(res);
}

export async function createUserApi(payload: UserCreatePayload): Promise<BackendUser> {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeader(),
    body: JSON.stringify(payload),
  });
  return handleResponse<BackendUser>(res);
}

export async function updateUserApi(userId: number, payload: UserUpdatePayload): Promise<BackendUser> {
  const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeader(),
    body: JSON.stringify(payload),
  });
  return handleResponse<BackendUser>(res);
}

export async function toggleUserStatusApi(userId: number, status: 'Active' | 'Inactive'): Promise<BackendUser> {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: authHeader(),
    body: JSON.stringify({ status }),
  });
  return handleResponse<BackendUser>(res);
}

// ---------------------------------------------------------------------------
// Roles API
// ---------------------------------------------------------------------------

export interface BackendRole {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export async function fetchRolesApi(): Promise<BackendRole[]> {
  const res = await fetch(`${API_BASE_URL}/roles`, { credentials: 'include', headers: authHeader() });
  return handleResponse<BackendRole[]>(res);
}
