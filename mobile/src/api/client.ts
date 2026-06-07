import { API_BASE_URL } from './config';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../auth/tokenStorage';
import type { ApiResponse, AuthPayload } from '../types';

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  retrying?: boolean;
};

function buildUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function refreshAccessToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(buildUrl('/api/v1/auth/refresh-token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    await clearTokens();
    return false;
  }

  const payload = (await response.json()) as ApiResponse<AuthPayload>;
  await saveTokens(payload.data?.accessToken, payload.data?.refreshToken);
  return Boolean(payload.data?.accessToken);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.skipAuth ? null : await getAccessToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  if (response.status === 401 && !options.skipAuth && !options.retrying) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retrying: true });
    }
  }

  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !json?.success) {
    throw new Error(json?.message || `Request failed with status ${response.status}`);
  }

  return json.data;
}
