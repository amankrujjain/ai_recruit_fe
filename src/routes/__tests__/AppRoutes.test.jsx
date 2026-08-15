import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Outlet } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { Roles } from '@/lib/roles';

vi.mock('@/components/auth/AuthLayout', () => ({
  AuthLayout: () => (
    <div data-testid="auth-layout">
      <Outlet />
    </div>
  ),
}));

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: () => (
    <div data-testid="dashboard-layout">
      <Outlet />
    </div>
  ),
}));

vi.mock('@/routes/ProtectedRoute', () => ({
  ProtectedRoute: () => <Outlet />,
}));

vi.mock('@/routes/PublicRoute', () => ({
  PublicRoute: () => <Outlet />,
}));

vi.mock('@/routes/RoleRoute', () => ({
  RoleRoute: () => <Outlet />,
}));

vi.mock('@/routes/DashboardRedirect', () => ({
  DashboardRedirect: () => <div>dashboard-redirect</div>,
}));

vi.mock('@/pages/auth/LoginPage', () => ({
  LoginPage: () => <div>login-page</div>,
}));
vi.mock('@/pages/auth/SignUpPage', () => ({
  SignUpPage: () => <div>signup-page</div>,
}));
vi.mock('@/pages/auth/ForgotPasswordPage', () => ({
  ForgotPasswordPage: () => <div>forgot-page</div>,
}));
vi.mock('@/pages/auth/ResetPasswordPage', () => ({
  ResetPasswordPage: () => <div>reset-page</div>,
}));
vi.mock('@/pages/candidate/CandidateOutreachPage', () => ({
  CandidateOutreachPage: () => <div>outreach-page</div>,
}));
vi.mock('@/pages/candidate/CandidateSchedulePage', () => ({
  CandidateSchedulePage: () => <div>schedule-page</div>,
}));

vi.mock('@/pages/super-admin/PreRegisteredPage', () => ({
  PreRegisteredPage: () => <div>pre-registered</div>,
}));
vi.mock('@/pages/super-admin/AllOrganizationsPage', () => ({
  AllOrganizationsPage: () => <div>all-orgs</div>,
}));
vi.mock('@/pages/super-admin/ManageOrganizationPage', () => ({
  ManageOrganizationPage: () => <div>manage-org</div>,
}));
vi.mock('@/pages/super-admin/SupportCategoriesPage', () => ({
  SupportCategoriesPage: () => <div>support-categories</div>,
}));
vi.mock('@/pages/admin/AdminDashboardPage', () => ({
  AdminDashboardPage: () => <div>admin-dashboard</div>,
}));
vi.mock('@/pages/admin/AdminRecruitersPage', () => ({
  AdminRecruitersPage: () => <div>admin-recruiters</div>,
}));
vi.mock('@/pages/admin/AdminSettingsPage', () => ({
  AdminSettingsPage: () => <div>admin-settings</div>,
}));
vi.mock('@/pages/admin/AdminBillingPage', () => ({
  AdminBillingPage: () => <div>admin-billing</div>,
}));
vi.mock('@/pages/admin/AdminAuditLogsPage', () => ({
  AdminAuditLogsPage: () => <div>admin-audit</div>,
}));
vi.mock('@/pages/recruiter/RecruiterDashboardPage', () => ({
  RecruiterDashboardPage: () => <div>recruiter-dashboard</div>,
}));
vi.mock('@/pages/recruiter/RecruiterJobsPage', () => ({
  RecruiterJobsPage: () => <div>recruiter-jobs</div>,
}));
vi.mock('@/pages/recruiter/RecruiterTemplatesPage', () => ({
  RecruiterTemplatesPage: () => <div>recruiter-templates</div>,
}));
vi.mock('@/pages/recruiter/JobFormPage', () => ({
  JobFormPage: () => <div>job-form</div>,
}));
vi.mock('@/pages/recruiter/JobDetailPage', () => ({
  JobDetailPage: () => <div>job-detail</div>,
}));
vi.mock('@/pages/support/SupportCenterPage', () => ({
  SupportCenterPage: () => <div>support-center</div>,
}));

import { AppRoutes } from '@/routes/AppRoutes';

const authState = (role) => ({
  auth: {
    account: role ? { accountId: '1', role } : null,
    token: role ? 't' : null,
    loading: false,
    error: null,
    initialized: true,
  },
});

async function renderRoute(route, role = Roles.ADMIN) {
  return renderWithProviders(<AppRoutes />, {
    route,
    preloadedState: authState(role),
  });
}

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['/login', 'login-page'],
    ['/signup/tok', 'signup-page'],
    ['/forgot-password', 'forgot-page'],
    ['/reset-password/tok', 'reset-page'],
    ['/candidate/outreach/tok', 'outreach-page'],
    ['/candidate/schedule/tok', 'schedule-page'],
  ])('renders %s', async (path, text) => {
    await renderRoute(path, null);
    await waitFor(() => expect(screen.getByText(text)).toBeInTheDocument());
  });

  it('redirects / and unknown paths to login', async () => {
    await renderRoute('/', null);
    await waitFor(() => expect(screen.getByText('login-page')).toBeInTheDocument());
  });

  it('renders dashboard redirect', async () => {
    await renderRoute('/dashboard', Roles.ADMIN);
    await waitFor(() => expect(screen.getByText('dashboard-redirect')).toBeInTheDocument());
  });

  it('redirects /super-admin to registrations', async () => {
    await renderRoute('/super-admin', Roles.SUPER_ADMIN);
    await waitFor(() => expect(screen.getByText('pre-registered')).toBeInTheDocument());
  });

  it.each([
    ['/super-admin/registrations', 'pre-registered', Roles.SUPER_ADMIN],
    ['/super-admin/organizations', 'all-orgs', Roles.SUPER_ADMIN],
    ['/super-admin/manage', 'manage-org', Roles.SUPER_ADMIN],
    ['/super-admin/support', 'support-categories', Roles.SUPER_ADMIN],
    ['/admin', 'admin-dashboard', Roles.ADMIN],
    ['/admin/recruiters', 'admin-recruiters', Roles.ADMIN],
    ['/admin/settings', 'admin-settings', Roles.ADMIN],
    ['/admin/billing', 'admin-billing', Roles.ADMIN],
    ['/admin/audit-logs', 'admin-audit', Roles.ADMIN],
    ['/admin/support', 'support-center', Roles.ADMIN],
    ['/recruiter', 'recruiter-dashboard', Roles.RECRUITER],
    ['/recruiter/jobs', 'recruiter-jobs', Roles.RECRUITER],
    ['/recruiter/jobs/new', 'job-form', Roles.RECRUITER],
    ['/recruiter/jobs/j1/edit', 'job-form', Roles.RECRUITER],
    ['/recruiter/jobs/j1', 'job-detail', Roles.RECRUITER],
    ['/recruiter/templates', 'recruiter-templates', Roles.RECRUITER],
    ['/recruiter/support', 'support-center', Roles.RECRUITER],
  ])('lazy route %s', async (path, text, role) => {
    await renderRoute(path, role);
    await waitFor(() => expect(screen.getByText(text)).toBeInTheDocument());
  });

  it('redirects /admin/templates to /admin', async () => {
    await renderRoute('/admin/templates', Roles.ADMIN);
    await waitFor(() => expect(screen.getByText('admin-dashboard')).toBeInTheDocument());
  });

  it('unknown path redirects to login', async () => {
    await renderRoute('/nope', null);
    await waitFor(() => expect(screen.getByText('login-page')).toBeInTheDocument());
  });
});
