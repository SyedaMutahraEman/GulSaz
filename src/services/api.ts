const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'gulsaz_pos_token_v2';
const USER_KEY = 'gulsaz_pos_current_user_v2';

export const STORAGE_CHANGE_EVENT = 'gulsaz_pos_data_changed';

export function notifyChange() {
  window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredAuthUser<T = unknown>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: unknown | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  errors: unknown[];

  constructor(message: string, status = 400, errors: unknown[] = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown[];
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = await response.json();
  } catch {
    // non-JSON response
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message || `Request failed (${response.status})`,
      response.status,
      payload?.errors || []
    );
  }

  return payload.data;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
