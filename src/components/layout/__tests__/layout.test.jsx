import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { TopBar } from '@/components/layout/TopBar';
import { Roles } from '@/lib/roles';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/authApi', () => ({
  loginRequest: vi.fn(),
  getProfileRequest: vi.fn(),
  logoutRequest: vi.fn().mockResolvedValue({}),
  requestPasswordResetEmailRequest: vi.fn(),
  forgotPasswordRequest: vi.fn(),
  resetPasswordRequest: vi.fn(),
  acceptInviteRequest: vi.fn(),
}));

vi.mock('@/api/adminOrgApi', () => ({
  getMyOrganizationRequest: vi.fn().mockResolvedValue({
    data: { data: { organizationName: 'Acme Corp', logoUrl: null } },
  }),
  getBillingRequest: vi.fn().mockResolvedValue({
    data: {
      data: {
        currentPlan: { planName: 'Growth', renewalDate: '2026-12-01T00:00:00.000Z' },
      },
    },
  }),
  updateOrgSettingsRequest: vi.fn(),
  uploadOrgLogoRequest: vi.fn(),
  updateEmailTemplateRequest: vi.fn(),
  updateWhatsAppTemplateRequest: vi.fn(),
  getAuditLogsRequest: vi.fn(),
  getAuditStatsRequest: vi.fn(),
}));

import { toast } from 'sonner';
import {
  logoutRequest,
  requestPasswordResetEmailRequest,
} from '@/api/authApi';

describe('PageContentSkeleton', () => {
  it('exposes loading status', () => {
    renderWithProviders(<PageContentSkeleton />);
    expect(screen.getByRole('status', { name: /loading page/i })).toBeInTheDocument();
    expect(screen.getByText(/loading…/i)).toBeInTheDocument();
  });
});

describe('PageHeader', () => {
  it('renders title, subtitle, link action, and button action', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { rerender } = renderWithProviders(
      <PageHeader title="Jobs" subtitle="Manage openings" actionLabel="New" actionTo="/new" />
    );
    expect(screen.getByRole('heading', { name: 'Jobs' })).toBeInTheDocument();
    expect(screen.getByText(/manage openings/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New' })).toHaveAttribute('href', '/new');

    rerender(<PageHeader title="Only" actionLabel="Do it" onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Do it' }));
    expect(onAction).toHaveBeenCalled();
  });
});

describe('SidebarNav', () => {
  it('renders nav for each role and empty for unknown', () => {
    const { rerender } = renderWithProviders(<SidebarNav role={Roles.SUPER_ADMIN} />);
    expect(screen.getByRole('link', { name: /pre-registered/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /all organizations/i })).toBeInTheDocument();

    rerender(<SidebarNav role={Roles.ADMIN} />);
    expect(screen.getByRole('link', { name: /^dashboard$/i })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: /hr team/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /billing/i })).toBeInTheDocument();

    rerender(<SidebarNav role={Roles.RECRUITER} />);
    expect(screen.getByRole('link', { name: /^dashboard$/i })).toHaveAttribute(
      'href',
      '/recruiter'
    );
    expect(screen.getByRole('link', { name: /^jobs$/i })).toBeInTheDocument();

    rerender(<SidebarNav role="UNKNOWN" />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('applies active styles when route matches', () => {
    renderWithProviders(<SidebarNav role={Roles.RECRUITER} />, {
      route: '/recruiter/jobs',
    });
    const jobs = screen.getByRole('link', { name: /^jobs$/i });
    expect(jobs.className).toMatch(/bg-brand-600/);
  });
});

describe('TopBar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows initials when no logo and opens menu for logout', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopBar />, {
      route: '/recruiter',
      preloadedState: {
        auth: {
          account: {
            firstName: 'Ada',
            lastName: 'Lovelace',
            role: Roles.RECRUITER,
            email: 'a@b.com',
          },
          token: 't',
          loading: false,
          error: null,
          initialized: true,
        },
        adminOrg: {
          organization: null,
          billing: null,
          loading: false,
          billingLoading: false,
          error: null,
        },
      },
    });

    expect(screen.getByText(/welcome back, Ada Lovelace/i)).toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();

    await user.click(screen.getByText('Ada Lovelace').closest('button'));
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /sign out/i }));
    await waitFor(() => expect(logoutRequest).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Signed out successfully');
  });

  it('shows org logo and handles password reset success/error', async () => {
    const user = userEvent.setup();
    requestPasswordResetEmailRequest.mockResolvedValueOnce({
      data: { message: 'Reset sent' },
    });

    renderWithProviders(<TopBar />, {
      preloadedState: {
        auth: {
          account: {
            firstName: 'Bob',
            lastName: 'Admin',
            role: Roles.ADMIN,
          },
          token: 't',
          loading: false,
          error: null,
          initialized: true,
        },
        adminOrg: {
          organization: { logoUrl: 'https://cdn.example.com/logo.png' },
          billing: null,
          loading: false,
          billingLoading: false,
          error: null,
        },
      },
    });

    expect(screen.getByAltText(/organization logo/i)).toHaveAttribute(
      'src',
      'https://cdn.example.com/logo.png'
    );

    await user.click(screen.getByText('Bob Admin').closest('button'));
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Reset sent'));

    requestPasswordResetEmailRequest.mockRejectedValueOnce({});
    await user.click(screen.getByText('Bob Admin').closest('button'));
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to send reset email')
    );
  });

  it('hides reset link for super admin and falls back initials to U', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopBar />, {
      preloadedState: {
        auth: {
          account: { role: Roles.SUPER_ADMIN },
          token: 't',
          loading: false,
          error: null,
          initialized: true,
        },
      },
    });

    expect(screen.getByText('U')).toBeInTheDocument();
    await user.click(screen.getByText('U').closest('button'));
    expect(screen.queryByRole('button', { name: /reset password/i })).toBeNull();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('closes menu on outside click and uses reset toast fallbacks', async () => {
    const user = userEvent.setup();
    requestPasswordResetEmailRequest.mockResolvedValueOnce({ data: { data: { message: 'nested' } } });

    renderWithProviders(<TopBar />, {
      preloadedState: {
        auth: {
          account: { firstName: 'Ann', lastName: 'A', role: Roles.ADMIN },
          token: 't',
          loading: false,
          error: null,
          initialized: true,
        },
      },
    });

    await user.click(screen.getByText('Ann A').closest('button'));
    const resetBtn = screen.getByRole('button', { name: /reset password/i });
    expect(resetBtn.parentElement.className).toMatch(/\bblock\b/);

    await act(async () => {
      fireEvent.mouseDown(document.body);
    });
    await waitFor(() =>
      expect(resetBtn.parentElement.className).toMatch(/\bhidden\b/)
    );

    await user.click(screen.getByText('Ann A').closest('button'));
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('nested'));

    requestPasswordResetEmailRequest.mockResolvedValueOnce({ data: {} });
    await user.click(screen.getByText('Ann A').closest('button'));
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Password reset email sent')
    );

    requestPasswordResetEmailRequest.mockRejectedValueOnce({
      response: { data: { message: 'rate limited' } },
    });
    await user.click(screen.getByText('Ann A').closest('button'));
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('rate limited'));
  });
});

describe('DashboardShell', () => {
  it('renders children and admin plan card', async () => {
    renderWithProviders(
      <DashboardShell>
        <div>Page body</div>
      </DashboardShell>,
      {
        preloadedState: {
          auth: {
            account: {
              firstName: 'Ann',
              lastName: 'Admin',
              role: Roles.ADMIN,
            },
            token: 't',
            loading: false,
            error: null,
            initialized: true,
          },
          adminOrg: {
            organization: { organizationName: 'Acme Corp' },
            billing: {
              currentPlan: {
                planName: 'Growth',
                renewalDate: '2026-12-01T00:00:00.000Z',
              },
            },
            loading: false,
            billingLoading: false,
            error: null,
          },
        },
      }
    );

    expect(screen.getByText('Page body')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view plan details/i })).toHaveAttribute(
      'href',
      '/admin/billing'
    );
    expect(screen.getByText(/hr team/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Growth')).toBeInTheDocument());
  });

  it('falls back to Free Plan and Your organization', async () => {
    renderWithProviders(
      <DashboardShell>
        <div>Admin empty org</div>
      </DashboardShell>,
      {
        preloadedState: {
          auth: {
            account: { firstName: 'Ann', lastName: 'Admin', role: Roles.ADMIN },
            token: 't',
            loading: false,
            error: null,
            initialized: true,
          },
          adminOrg: {
            organization: null,
            billing: { currentPlan: {} },
            loading: false,
            billingLoading: false,
            error: null,
          },
        },
      }
    );

    expect(screen.getByText('Your organization')).toBeInTheDocument();
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Free Plan')).toBeInTheDocument());
  });

  it('skips admin chrome for recruiter', () => {
    renderWithProviders(
      <DashboardShell>
        <div>Recruiter page</div>
      </DashboardShell>,
      {
        preloadedState: {
          auth: {
            account: {
              firstName: 'Rae',
              lastName: 'Rec',
              role: Roles.RECRUITER,
            },
            token: 't',
            loading: false,
            error: null,
            initialized: true,
          },
        },
      }
    );

    expect(screen.getByText('Recruiter page')).toBeInTheDocument();
    expect(screen.queryByText(/view plan details/i)).toBeNull();
    expect(screen.getByRole('link', { name: /^jobs$/i })).toBeInTheDocument();
  });
});
