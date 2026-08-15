import axios from 'axios';
import { API_BASE, storageKeys } from '@/lib/constants';
import { getStore } from './storeAccess';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

/** Paths that must not trigger refresh / session-clear redirect */
const AUTH_NO_REFRESH = [
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/signup',
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

/** Plain action types — avoids importing authSlice (which imports authApi → client). */
const SET_TOKENS = 'auth/setTokens';
const CLEAR_SESSION = 'auth/clearSession';

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem(storageKeys.refreshToken);
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  // Plain axios — avoid interceptor recursion on /auth/refresh
  const { data } = await axios.post(
    `${API_BASE}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const payload = data?.data;
  if (!payload?.accessToken) {
    throw new Error('Invalid refresh response');
  }

  getStore().dispatch({
    type: SET_TOKENS,
    payload: {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    },
  });

  return payload.accessToken;
};

const forceLogoutToLogin = () => {
  getStore().dispatch({ type: CLEAR_SESSION });
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(storageKeys.accessToken);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
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

    // Account/org disabled etc. — clear session even when access JWT is still valid (403)
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
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const accessToken = await refreshPromise;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch {
      forceLogoutToLogin();
      return Promise.reject(error);
    }
  }
);

export default apiClient;
export { shouldSkipRefresh, isSessionDeadStatus };
