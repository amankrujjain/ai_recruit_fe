import axios from 'axios';
import { API_BASE, storageKeys } from '@/lib/constants';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(storageKeys.accessToken);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(storageKeys.accessToken);
      localStorage.removeItem(storageKeys.refreshToken);
      localStorage.removeItem(storageKeys.account);
      localStorage.removeItem(storageKeys.user);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
