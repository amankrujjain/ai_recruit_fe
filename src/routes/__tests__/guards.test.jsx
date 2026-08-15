import { describe, it, expect, vi } from 'vitest';
import { screen, render, waitFor, act } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { PublicRoute } from '@/routes/PublicRoute';
import { RoleRoute } from '@/routes/RoleRoute';
import { DashboardRedirect } from '@/routes/DashboardRedirect';
import {
  PageTitleProvider,
  usePageTitle,
  usePageTitleState,
} from '@/context/PageTitleContext';
import { usePageBootstrap } from '@/hooks/usePageBootstrap';
import { useAuthInit } from '@/hooks/useAuth';
import { Roles } from '@/lib/roles';

vi.mock('@/api/authApi', () => ({
  loginRequest: vi.fn(),
  getProfileRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

import { getProfileRequest } from '@/api/authApi';

const authState = (overrides = {}) => ({
  auth: {
    account: null,
    token: null,
    loading: false,
    error: null,
    initialized: true,
    ...overrides,
  },
});

describe('route guards', () => {
  it('ProtectedRoute shows spinner until initialized', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Secret</div>} />
        </Route>
      </Routes>,
      { preloadedState: authState({ initialized: false }), route: '/' }
    );
    expect(screen.queryByText('Secret')).toBeNull();
  });

  it('ProtectedRoute redirects unauthenticated users', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Secret</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>,
      { preloadedState: authState({ token: null }), route: '/' }
    );
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('ProtectedRoute renders outlet when authenticated', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Secret</div>} />
        </Route>
      </Routes>,
      { preloadedState: authState({ token: 't' }), route: '/' }
    );
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('PublicRoute returns null while initializing and redirects authed users', () => {
    const { unmount } = renderWithProviders(
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<div>Login form</div>} />
        </Route>
        <Route path="/dashboard" element={<div>Dash</div>} />
      </Routes>,
      { preloadedState: authState({ initialized: false }), route: '/login' }
    );
    expect(screen.queryByText('Login form')).toBeNull();
    unmount();

    renderWithProviders(
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<div>Login form</div>} />
        </Route>
        <Route path="/dashboard" element={<div>Dash</div>} />
      </Routes>,
      { preloadedState: authState({ token: 't' }), route: '/login' }
    );
    expect(screen.getByText('Dash')).toBeInTheDocument();
  });

  it('PublicRoute renders outlet for guests', () => {
    renderWithProviders(
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<div>Login form</div>} />
        </Route>
      </Routes>,
      { preloadedState: authState({ token: null, initialized: true }), route: '/login' }
    );
    expect(screen.getByText('Login form')).toBeInTheDocument();
  });

  it('RoleRoute redirects wrong/missing roles', () => {
    renderWithProviders(
      <Routes>
        <Route element={<RoleRoute allowedRoles={[Roles.ADMIN]} />}>
          <Route path="/admin" element={<div>Admin</div>} />
        </Route>
        <Route path="/recruiter" element={<div>Recruiter home</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>,
      {
        preloadedState: authState({
          token: 't',
          account: { role: Roles.RECRUITER },
        }),
        route: '/admin',
      }
    );
    expect(screen.getByText('Recruiter home')).toBeInTheDocument();
  });

  it('RoleRoute allows matching role', () => {
    renderWithProviders(
      <Routes>
        <Route element={<RoleRoute allowedRoles={[Roles.ADMIN]} />}>
          <Route path="/admin" element={<div>Admin</div>} />
        </Route>
      </Routes>,
      {
        preloadedState: authState({
          token: 't',
          account: { role: Roles.ADMIN },
        }),
        route: '/admin',
      }
    );
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('DashboardRedirect navigates by role', () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<DashboardRedirect />} />
        <Route path="/admin" element={<div>Admin dash</div>} />
      </Routes>,
      {
        preloadedState: authState({
          token: 't',
          account: { role: Roles.ADMIN },
        }),
        route: '/',
      }
    );
    expect(screen.getByText('Admin dash')).toBeInTheDocument();
  });
});

function TitleProbe({ title }) {
  usePageTitle(title);
  const state = usePageTitleState();
  return <div data-testid="title">{state.title}</div>;
}

function TitleSetterProbe() {
  const { title, setTitle } = usePageTitleState();
  return (
    <div>
      <div data-testid="title">{title}</div>
      <button type="button" onClick={() => setTitle('Custom')}>
        set
      </button>
      <button type="button" onClick={() => setTitle('')}>
        clear
      </button>
      <button type="button" onClick={() => setTitle(null)}>
        null
      </button>
    </div>
  );
}

describe('PageTitleContext', () => {
  it('sets title and resets on unmount; skips empty', () => {
    const { unmount, rerender } = render(
      <PageTitleProvider>
        <TitleProbe title="Jobs" />
      </PageTitleProvider>
    );
    expect(screen.getByTestId('title')).toHaveTextContent('Jobs');

    rerender(
      <PageTitleProvider>
        <TitleProbe title="" />
      </PageTitleProvider>
    );
    // empty title skips set — previous provider state remounted so default
    expect(screen.getByTestId('title')).toHaveTextContent('RecruitAI');

    unmount();
  });

  it('setTitle falls back to defaultTitle when next is falsy', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(
      <PageTitleProvider defaultTitle="App">
        <TitleSetterProbe />
      </PageTitleProvider>
    );
    expect(screen.getByTestId('title')).toHaveTextContent('App');
    await user.click(screen.getByRole('button', { name: 'set' }));
    expect(screen.getByTestId('title')).toHaveTextContent('Custom');
    await user.click(screen.getByRole('button', { name: 'clear' }));
    expect(screen.getByTestId('title')).toHaveTextContent('App');
    await user.click(screen.getByRole('button', { name: 'set' }));
    await user.click(screen.getByRole('button', { name: 'null' }));
    expect(screen.getByTestId('title')).toHaveTextContent('App');
  });
});

function BootstrapProbe({ load, deps }) {
  const booting = usePageBootstrap(load, deps);
  return <div>{booting ? 'booting' : 'ready'}</div>;
}

describe('usePageBootstrap', () => {
  it('starts booting then settles, including on error', async () => {
    const load = vi.fn().mockRejectedValue(new Error('fail'));
    render(<BootstrapProbe load={load} deps={[]} />);
    expect(screen.getByText('booting')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('ready')).toBeInTheDocument());
  });
});

function AuthInitProbe() {
  useAuthInit();
  return <div>init</div>;
}

describe('useAuthInit', () => {
  it('fetches profile when token exists then marks initialized', async () => {
    getProfileRequest.mockResolvedValueOnce({
      data: { data: { accountId: '1', email: 'a@b.com' } },
    });
    const { store } = renderWithProviders(<AuthInitProbe />, {
      preloadedState: authState({
        token: 't',
        initialized: false,
        account: { accountId: '1' },
      }),
    });
    await waitFor(() => expect(store.getState().auth.initialized).toBe(true));
    expect(getProfileRequest).toHaveBeenCalled();
  });

  it('skips profile fetch when no token', async () => {
    getProfileRequest.mockClear();
    const { store } = renderWithProviders(<AuthInitProbe />, {
      preloadedState: authState({ token: null, initialized: false }),
    });
    await waitFor(() => expect(store.getState().auth.initialized).toBe(true));
    expect(getProfileRequest).not.toHaveBeenCalled();
  });
});
