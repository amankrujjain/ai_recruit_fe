import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { storageKeys } from '@/lib/constants';

vi.mock('@/api/authApi', () => ({
  loginRequest: vi.fn(),
  getProfileRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

import { loginRequest, getProfileRequest, logoutRequest } from '@/api/authApi';
import authReducer, {
  loginUser,
  fetchProfile,
  logoutUser,
  clearAuthError,
  setInitialized,
  setTokens,
  clearSession,
  selectIsAuthenticated,
} from '@/store/slices/authSlice';

const makeStore = (preloaded) =>
  configureStore({ reducer: { auth: authReducer }, preloadedState: preloaded });

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('handles sync reducers and selectors', () => {
    const store = makeStore();
    store.dispatch(setInitialized());
    store.dispatch(setTokens({ accessToken: 'a', refreshToken: 'r' }));
    expect(store.getState().auth.initialized).toBe(true);
    expect(store.getState().auth.token).toBe('a');
    expect(localStorage.getItem(storageKeys.accessToken)).toBe('a');
    expect(localStorage.getItem(storageKeys.refreshToken)).toBe('r');
    expect(selectIsAuthenticated(store.getState())).toBe(true);

    store.dispatch({ type: clearAuthError.type });
    store.dispatch(setTokens({ accessToken: 'b' }));
    expect(localStorage.getItem(storageKeys.accessToken)).toBe('b');

    store.dispatch(clearSession());
    expect(store.getState().auth.account).toBeNull();
    expect(store.getState().auth.token).toBeNull();
    expect(localStorage.getItem(storageKeys.accessToken)).toBeNull();
  });

  it('loginUser pending/fulfilled/rejected', async () => {
    const store = makeStore();
    loginRequest.mockResolvedValueOnce({
      data: {
        data: {
          account: { accountId: '1', email: 'a@b.com' },
          accessToken: 'access',
          refreshToken: 'refresh',
        },
      },
    });

    await store.dispatch(loginUser({ email: 'a@b.com', password: 'x' }));
    expect(store.getState().auth.token).toBe('access');
    expect(store.getState().auth.account.email).toBe('a@b.com');
    expect(localStorage.getItem(storageKeys.account)).toContain('a@b.com');

    loginRequest.mockRejectedValueOnce({ response: { data: { message: 'bad creds' } } });
    await store.dispatch(loginUser({ email: 'a@b.com', password: 'x' }));
    expect(store.getState().auth.error).toBe('bad creds');

    loginRequest.mockRejectedValueOnce(new Error('network'));
    await store.dispatch(loginUser({ email: 'a@b.com', password: 'x' }));
    expect(store.getState().auth.error).toBe('Login failed');
  });

  it('fetchProfile updates account or clears session on reject', async () => {
    const store = makeStore({
      auth: {
        account: { accountId: '1' },
        token: 't',
        loading: false,
        error: null,
        initialized: true,
      },
    });
    localStorage.setItem(storageKeys.accessToken, 't');

    getProfileRequest.mockResolvedValueOnce({
      data: { data: { accountId: '1', email: 'new@x.com' } },
    });
    await store.dispatch(fetchProfile());
    expect(store.getState().auth.account.email).toBe('new@x.com');

    getProfileRequest.mockRejectedValueOnce({});
    await store.dispatch(fetchProfile());
    expect(store.getState().auth.token).toBeNull();
    expect(localStorage.getItem(storageKeys.accessToken)).toBeNull();
  });

  it('logoutUser clears state even when API fails', async () => {
    const store = makeStore({
      auth: {
        account: { accountId: '1' },
        token: 't',
        loading: false,
        error: null,
        initialized: true,
      },
    });
    logoutRequest.mockRejectedValueOnce(new Error('down'));
    await store.dispatch(logoutUser());
    expect(store.getState().auth.account).toBeNull();
    expect(store.getState().auth.token).toBeNull();
  });

  it('migrates legacy userId when loading saved account', async () => {
    vi.resetModules();
    localStorage.setItem(
      storageKeys.user,
      JSON.stringify({ userId: 'legacy-1', email: 'old@x.com' })
    );
    const mod = await import('@/store/slices/authSlice');
    const store = configureStore({ reducer: { auth: mod.default } });
    expect(store.getState().auth.account.accountId).toBe('legacy-1');
  });

  it('ignores invalid saved account JSON', async () => {
    vi.resetModules();
    localStorage.setItem(storageKeys.account, '{not-json');
    const mod = await import('@/store/slices/authSlice');
    const store = configureStore({ reducer: { auth: mod.default } });
    expect(store.getState().auth.account).toBeNull();
  });
});
