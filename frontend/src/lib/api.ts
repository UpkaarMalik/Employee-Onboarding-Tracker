import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

console.log('DEBUG — VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('DEBUG — api.defaults.baseURL:', api.defaults.baseURL);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}

export function isSessionExpired(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}