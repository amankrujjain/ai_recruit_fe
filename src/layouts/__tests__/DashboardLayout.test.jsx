import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { DashboardLayout } from '@/layouts/DashboardLayout';

vi.mock('@/components/layout/DashboardShell', () => ({
  DashboardShell: ({ children }) => <div data-testid="shell">{children}</div>,
}));

vi.mock('@/components/layout/PageContentSkeleton', () => ({
  PageContentSkeleton: () => <div data-testid="skeleton">loading</div>,
}));

describe('DashboardLayout', () => {
  it('wraps outlet in shell and page title provider', () => {
    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<div>Admin home</div>} />
        </Route>
      </Routes>,
      { route: '/admin' }
    );

    expect(screen.getByTestId('shell')).toBeInTheDocument();
    expect(screen.getByText('Admin home')).toBeInTheDocument();
  });
});
