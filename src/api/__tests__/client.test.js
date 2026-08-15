import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageKeys } from '@/lib/constants';

const requestHandlers = [];
const responseHandlers = [];

const mockInstance = vi.fn(async (config) => ({
  data: { ok: true },
  status: 200,
  config,
}));
mockInstance.interceptors = {
  request: {
    use: (fulfilled) => {
      requestHandlers.push(fulfilled);
      return 0;
    },
  },
  response: {
    use: (fulfilled, rejected) => {
      responseHandlers.push({ fulfilled, rejected });
      return 0;
    },
  },
};
mockInstance.defaults = { headers: {} };

const mockAxiosPost = vi.fn();
const mockGetStore = vi.fn();

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockInstance),
    post: (...args) => mockAxiosPost(...args),
  },
}));

vi.mock('@/api/storeAccess', () => ({
  getStore: (...args) => mockGetStore(...args),
  injectStore: vi.fn(),
}));

describe('api client interceptors', () => {
  let requestInterceptor;
  let responseRejected;
  let dispatch;

  beforeEach(async () => {
    vi.resetModules();
    requestHandlers.length = 0;
    responseHandlers.length = 0;
    mockAxiosPost.mockReset();
    mockGetStore.mockReset();
    mockInstance.mockClear();
    localStorage.clear();
    dispatch = vi.fn();
    mockGetStore.mockReturnValue({ dispatch });

    await import('@/api/client');
    requestInterceptor = requestHandlers[0];
    responseRejected = responseHandlers[0].rejected;

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/admin', assign: vi.fn() },
    });
  });

  it('attaches Bearer token only when present', async () => {
    const without = await requestInterceptor({ headers: {} });
    expect(without.headers.Authorization).toBeUndefined();

    localStorage.setItem(storageKeys.accessToken, 'tok');
    const withTok = await requestInterceptor({ headers: {} });
    expect(withTok.headers.Authorization).toBe('Bearer tok');
  });

  it('skips refresh on auth paths', async () => {
    await expect(
      responseRejected({
        config: { url: '/auth/login' },
        response: { status: 401, data: { message: 'bad' } },
        message: 'bad',
      })
    ).rejects.toMatchObject({ response: { status: 401 } });
    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('force-logouts on session-dead 403 messages', async () => {
    for (const message of [
      'Account disabled',
      'Org deactivated',
      'Please complete your account',
      'Invalid access token',
      'Authentication required',
    ]) {
      dispatch.mockClear();
      window.location.assign.mockClear();
      await expect(
        responseRejected({
          config: { url: '/jobs' },
          response: { status: 403, data: { message } },
          message,
        })
      ).rejects.toBeTruthy();
      expect(dispatch).toHaveBeenCalledWith({ type: 'auth/clearSession' });
      expect(window.location.assign).toHaveBeenCalledWith('/login');
    }
  });

  it('rejects benign 403 without logout', async () => {
    await expect(
      responseRejected({
        config: { url: '/jobs' },
        response: { status: 403, data: { message: 'Forbidden resource' } },
        message: 'Forbidden resource',
      })
    ).rejects.toBeTruthy();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refreshes once on 401 and retries original request', async () => {
    localStorage.setItem(storageKeys.refreshToken, 'rt');
    mockAxiosPost.mockResolvedValueOnce({
      data: { data: { accessToken: 'new-access', refreshToken: 'new-rt' } },
    });
    mockInstance.mockResolvedValueOnce({ data: { ok: true }, status: 200 });

    const result = await responseRejected({
      config: { url: '/jobs', headers: {} },
      response: { status: 401, data: { message: 'expired' } },
      message: 'expired',
    });

    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'auth/setTokens',
      payload: { accessToken: 'new-access', refreshToken: 'new-rt' },
    });
    expect(result.data.ok).toBe(true);
    expect(mockInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer new-access' }),
        _retry: true,
      })
    );
  });

  it('dedupes concurrent refresh calls', async () => {
    localStorage.setItem(storageKeys.refreshToken, 'rt');
    let resolveRefresh;
    mockAxiosPost.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        })
    );
    mockInstance.mockResolvedValue({ data: { ok: true } });

    const p1 = responseRejected({
      config: { url: '/jobs', headers: {} },
      response: { status: 401 },
      message: 'expired',
    });
    const p2 = responseRejected({
      config: { url: '/candidates', headers: {} },
      response: { status: 401 },
      message: 'expired',
    });

    resolveRefresh({ data: { data: { accessToken: 'shared' } } });
    await Promise.all([p1, p2]);
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
  });

  it('logs out when refresh token missing or response invalid', async () => {
    await expect(
      responseRejected({
        config: { url: '/jobs', headers: {} },
        response: { status: 401 },
        message: 'expired',
      })
    ).rejects.toBeTruthy();
    expect(dispatch).toHaveBeenCalledWith({ type: 'auth/clearSession' });

    dispatch.mockClear();
    localStorage.setItem(storageKeys.refreshToken, 'rt');
    mockAxiosPost.mockResolvedValueOnce({ data: { data: {} } });
    await expect(
      responseRejected({
        config: { url: '/jobs', headers: {} },
        response: { status: 401 },
        message: 'expired',
      })
    ).rejects.toBeTruthy();
    expect(dispatch).toHaveBeenCalledWith({ type: 'auth/clearSession' });
  });

  it('does not loop when retry already failed', async () => {
    await expect(
      responseRejected({
        config: { url: '/jobs', headers: {}, _retry: true },
        response: { status: 401 },
        message: 'expired',
      })
    ).rejects.toBeTruthy();
    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'auth/clearSession' });
  });

  it('skips redirect when already on login', async () => {
    window.location.pathname = '/login';
    await expect(
      responseRejected({
        config: { url: '/jobs', headers: {}, _retry: true },
        response: { status: 401 },
        message: 'expired',
      })
    ).rejects.toBeTruthy();
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it('passes through successful responses', async () => {
    const responseFulfilled = responseHandlers[0].fulfilled;
    expect(responseFulfilled({ data: 1 })).toEqual({ data: 1 });
  });

  it('rejects when config is missing or non-401 status', async () => {
    await expect(
      responseRejected({ response: { status: 500 }, message: 'boom' })
    ).rejects.toBeTruthy();
    await expect(
      responseRejected({
        config: { url: '/jobs' },
        response: { status: 404, data: {} },
        message: 'missing',
      })
    ).rejects.toBeTruthy();
  });

  it('creates Authorization header object when headers are missing', async () => {
    const withoutHeaders = await requestInterceptor({});
    expect(withoutHeaders.headers).toBeUndefined();

    localStorage.setItem(storageKeys.accessToken, 'tok');
    const withTok = await requestInterceptor({});
    expect(withTok.headers.Authorization).toBe('Bearer tok');

    localStorage.setItem(storageKeys.refreshToken, 'rt');
    mockAxiosPost.mockResolvedValueOnce({
      data: { data: { accessToken: 'new' } },
    });
    mockInstance.mockResolvedValueOnce({ data: { ok: true } });
    await responseRejected({
      config: { url: '/jobs' },
      response: { status: 401 },
      message: 'expired',
    });
    expect(mockInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer new' }),
      })
    );
  });

  it('exports shouldSkipRefresh and isSessionDeadStatus helpers', async () => {
    const { shouldSkipRefresh, isSessionDeadStatus } = await import('@/api/client');
    expect(shouldSkipRefresh(null)).toBe(false);
    expect(shouldSkipRefresh({ url: undefined })).toBe(false);
    expect(shouldSkipRefresh({ url: '/auth/signup/abc' })).toBe(true);
    expect(isSessionDeadStatus(401)).toBe(true);
    expect(isSessionDeadStatus(500)).toBe(false);
    expect(isSessionDeadStatus(403, 'ok')).toBe(false);
    expect(isSessionDeadStatus(403)).toBe(false);
  });
});
