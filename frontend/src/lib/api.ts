export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function getAccessToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
}

export function buildApiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface FetchOptions extends RequestInit {
  body?: any;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = buildApiUrl(path);
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const accessToken = getAccessToken();
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  let response = await fetch(url, fetchOptions);

  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/register' && path !== '/auth/refresh') {
    // Attempt token refresh
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      // Retry request with new token
      const newAccessToken = localStorage.getItem('accessToken');
      if (newAccessToken) {
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        // If body was parsed to string, re-assign it
        response = await fetch(url, fetchOptions);
      }
    } else {
      // Refresh failed, clear and redirect to login
      clearAuthData();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const json = await response.json();
      errorMessage = json.message || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const json = await response.json();
  return json.data as T;
}

async function attemptTokenRefresh(): Promise<boolean> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  if (!refreshToken) return false;

  try {
    const url = `${API_BASE_URL}/auth/refresh`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const json = await res.json();
    const data = json.data;
    if (data && data.accessToken && data.refreshToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function clearAuthData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}
