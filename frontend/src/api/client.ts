import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = sessionStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token/`, {
            refresh: refreshToken,
          });
          const { access, refresh } = response.data?.tokens ?? {};
          if (!access) {
            throw new Error('No access token in refresh response');
          }
          sessionStorage.setItem('access_token', access);
          if (refresh) {
            sessionStorage.setItem('refresh_token', refresh);
          }
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch {
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export interface PaginatedData<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

export function unwrapPaginated<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

export async function fetchAllPages<T = unknown>(
  fetcher: (params?: Record<string, unknown>) => Promise<{ data: T[] }>,
  params?: Record<string, unknown>,
): Promise<T[]> {
  const all: T[] = [];
  const basePath = new URL(api.defaults.baseURL ?? '', window.location.origin).pathname;
  let body = (await fetcher({ ...params, page: 1 })).data as PaginatedData<T> | T[];
  while (true) {
    const results = Array.isArray(body) ? body : body.results ?? [];
    all.push(...results);
    const next = Array.isArray(body) ? null : body.next;
    if (!next || results.length === 0) break;
    let nextUrl: URL;
    try {
      nextUrl = new URL(next, window.location.origin);
    } catch {
      break;
    }
    if (!nextUrl.pathname.startsWith(basePath) || nextUrl.pathname.includes('..')) break;
    const relPath = nextUrl.pathname.slice(basePath.length);
    const res = await api.get(relPath + nextUrl.search);
    body = res.data as PaginatedData<T> | T[];
  }
  return all;
}
