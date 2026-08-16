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

export function unwrapPaginated<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export async function fetchAllPages<T = any>(
  fetcher: (params?: Record<string, any>) => Promise<{ data: any }>,
  params?: Record<string, any>,
): Promise<T[]> {
  const all: T[] = [];
  const basePath = new URL(api.defaults.baseURL ?? '', window.location.origin).pathname;
  let res = await fetcher({ ...params, page: 1 });
  while (true) {
    const results = res.data?.results ?? res.data;
    if (Array.isArray(results)) all.push(...results);
    const next = res.data?.next;
    if (!next || !Array.isArray(results) || results.length === 0) break;
    let nextUrl: URL;
    try {
      nextUrl = new URL(next, window.location.origin);
    } catch {
      break;
    }
    if (!nextUrl.pathname.startsWith(basePath) || nextUrl.pathname.includes('..')) break;
    const relPath = nextUrl.pathname.slice(basePath.length);
    res = await api.get(relPath + nextUrl.search);
  }
  return all;
}
