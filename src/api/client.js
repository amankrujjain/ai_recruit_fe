import axios from 'axios';
import { API_BASE } from '@/lib/constants';
import { getStore } from './storeAccess';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Paths that must not trigger refresh / session-clear redirect */
const AUTH_NO_REFRESH = [
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/signup',
  '/auth/me',
];

const shouldSkipRefresh = (config) => {
  const url = config?.url || '';
  return AUTH_NO_REFRESH.some((path) => url.includes(path));
};

const isSessionDeadStatus = (status, message = '') => {
  if (status === 401) return true;
  if (status !== 403) return false;
  const msg = String(message).toLowerCase();
  return (
    msg.includes('disabled')
    || msg.includes('deactivated')
    || msg.includes('complete your account')
    || msg.includes('access token')
    || msg.includes('authentication')
  );
};

let refreshPromise = null;

const CLEAR_SESSION = 'auth/clearSession';

/** Silently refresh session cookies (Alignlie-style — empty body, credentials). */
const refreshSession = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .finally(() => {
        refreshPromise = null;
      });
  }
  await refreshPromise;
};

const forceLogoutToLogin = () => {
  getStore().dispatch({ type: CLEAR_SESSION });
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
};

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const method = String(config.method || 'get').toLowerCase();
  if (method === 'get') {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers.Pragma = 'no-cache';
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (!original || shouldSkipRefresh(original)) {
      return Promise.reject(error);
    }

    if (status === 403 && isSessionDeadStatus(status, message)) {
      forceLogoutToLogin();
      return Promise.reject(error);
    }

    if (status !== 401) {
      return Promise.reject(error);
    }

    if (original._retry) {
      forceLogoutToLogin();
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      await refreshSession();
      return apiClient(original);
    } catch {
      forceLogoutToLogin();
      return Promise.reject(error);
    }
  }
);

export default apiClient;
export { shouldSkipRefresh, isSessionDeadStatus, refreshSession };
