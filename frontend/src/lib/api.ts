import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (axios.isAxiosError(error) && error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  },
);

export function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}

export function isSessionExpired(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}