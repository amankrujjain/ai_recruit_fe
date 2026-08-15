import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/hooks/useAuth', () => ({
  useAuthInit: vi.fn(),
}));

vi.mock('@/routes/AppRoutes', () => ({
  AppRoutes: () => <div data-testid="app-routes">routes</div>,
}));

vi.mock('@/components/ui/Toaster', () => ({
  AppToaster: () => <div data-testid="app-toaster">toaster</div>,
}));

vi.mock('@/store', () => ({
  default: {
    getState: () => ({
      auth: { token: null, account: null, initialized: true, loading: false, error: null },
    }),
    dispatch: vi.fn(),
    subscribe: vi.fn(),
    replaceReducer: vi.fn(),
  },
}));

vi.mock('@/api/storeAccess', () => ({
  injectStore: vi.fn(),
  getStore: vi.fn(() => ({ dispatch: vi.fn() })),
}));

import App from '@/App';
import { useAuthInit } from '@/hooks/useAuth';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wires Provider, BrowserRouter, auth init, routes, and toaster', () => {
    render(<App />);
    expect(useAuthInit).toHaveBeenCalled();
    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
    expect(screen.getByTestId('app-toaster')).toBeInTheDocument();
  });
});
