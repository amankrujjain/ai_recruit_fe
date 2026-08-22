import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Roles } from '@/lib/roles';
import { UserStatus } from '@/lib/userStatus';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminBillingPage } from '@/pages/admin/AdminBillingPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminRecruitersPage } from '@/pages/admin/AdminRecruitersPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';

vi.mock('@/hooks/usePageBootstrap', async () => {
  const ReactMod = await import('react');
  return {
    usePageBootstrap: vi.fn((load, deps = []) => {
      const [booting, setBooting] = ReactMod.useState(true);
      ReactMod.useEffect(() => {
        let alive = true;
        setBooting(true);
        Promise.resolve()
          .then(() => load())
          .catch(() => {})
          .finally(() => {
            if (alive) setBooting(false);
          });
        return () => {
          alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, deps);
      return booting;
    }),
  };
});

vi.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value) => value,
}));

vi.mock('@/components/admin/dashboard/AdminOverview', () => ({
  AdminOverview: () => <div data-testid="admin-overview">AdminOverview</div>,
}));

vi.mock('@/components/admin/billing/BillingOverview', () => ({
  BillingOverview: ({ billing, loading }) => (
    <div data-testid="billing-overview">
      BillingOverview loading={String(loading)} plan={billing?.currentPlan?.planName ?? 'none'}
    </div>
  ),
}));

vi.mock('@/components/admin/settings/OrgSettingsForm', () => ({
  OrgSettingsForm: () => <div data-testid="org-settings-form">OrgSettingsForm</div>,
}));

vi.mock('@/components/admin/recruiters/RecruiterTable', () => ({
  RecruiterTable: ({ items, loading }) => (
    <div data-testid="recruiter-table">
      RecruiterTable count={items.length} loading={String(loading)}
    </div>
  ),
}));

vi.mock('@/components/admin/recruiters/TablePagination', () => ({
  TablePagination: ({ pagination, onPageChange }) =>
    pagination?.total > 0 ? (
      <div data-testid="table-pagination">
        <button type="button" onClick={() => onPageChange(2)}>
          Page 2
        </button>
      </div>
    ) : null,
}));

vi.mock('@/components/admin/recruiters/InviteRecruiterModal', () => ({
  InviteRecruiterModal: ({ open, onInvited }) =>
    open ? (
      <button type="button" data-testid="fire-invited" onClick={onInvited}>
        Fire invited
      </button>
    ) : null,
}));

vi.mock('@/components/admin/recruiters/InviteHrCta', () => ({
  InviteHrCta: ({ onInvite }) => (
    <button type="button" data-testid="invite-hr-cta" onClick={onInvite}>
      InviteHrCta
    </button>
  ),
}));

vi.mock('@/components/admin/audit/AuditLogTable', () => ({
  AuditLogTable: ({ items, loading }) => (
    <div data-testid="audit-log-table">
      AuditLogTable count={items.length} loading={String(loading)}
    </div>
  ),
}));

vi.mock('@/api/recruiterApi', () => ({
  listRecruitersRequest: vi.fn(),
  inviteRecruiterRequest: vi.fn(),
  disableRecruiterRequest: vi.fn(),
  enableRecruiterRequest: vi.fn(),
  deleteRecruiterRequest: vi.fn(),
  resetRecruiterPasswordRequest: vi.fn(),
}));

vi.mock('@/api/adminOrgApi', () => ({
  getMyOrganizationRequest: vi.fn(),
  updateOrgSettingsRequest: vi.fn(),
  uploadOrgLogoRequest: vi.fn(),
  updateEmailTemplateRequest: vi.fn(),
  updateWhatsAppTemplateRequest: vi.fn(),
  getBillingRequest: vi.fn(),
  getAuditLogsRequest: vi.fn(),
  getAuditStatsRequest: vi.fn(),
}));

vi.mock('@/api/countryApi', () => ({
  listCountriesRequest: vi.fn(() =>
    Promise.resolve({ data: { data: [{ code: 'US', name: 'United States' }] } })
  ),
}));

import { usePageBootstrap } from '@/hooks/usePageBootstrap';
import { listRecruitersRequest } from '@/api/recruiterApi';
import {
  getBillingRequest,
  getAuditLogsRequest,
  getAuditStatsRequest,
} from '@/api/adminOrgApi';
import { listCountriesRequest } from '@/api/countryApi';

const adminAuth = {
  auth: {
    token: 't',
    account: {
      accountId: 'admin-1',
      firstName: 'Org',
      lastName: 'Admin',
      email: 'admin@acme.com',
      role: Roles.ADMIN,
    },
    loading: false,
    error: null,
    initialized: true,
  },
};

describe('AdminDashboardPage', () => {
  it('renders AdminOverview stub', () => {
    renderWithProviders(<AdminDashboardPage />, { preloadedState: adminAuth });
    expect(screen.getByTestId('admin-overview')).toBeInTheDocument();
  });
});

describe('AdminBillingPage', () => {
  beforeEach(() => {
    getBillingRequest.mockResolvedValue({
      data: {
        data: {
          currentPlan: { planName: 'Growth', renewalDate: new Date().toISOString() },
          usageSummary: {},
        },
      },
    });
  });

  it('shows skeleton while booting then billing overview', async () => {
    renderWithProviders(<AdminBillingPage />, { preloadedState: adminAuth });
    expect(screen.getByLabelText(/loading page/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('billing-overview')).toBeInTheDocument());
    expect(getBillingRequest).toHaveBeenCalled();
    expect(screen.getByTestId('billing-overview')).toHaveTextContent('Growth');
  });
});

describe('AdminSettingsPage', () => {
  it('renders org settings form and loads countries', async () => {
    renderWithProviders(<AdminSettingsPage />, { preloadedState: adminAuth });
    expect(screen.getByTestId('org-settings-form')).toBeInTheDocument();
    await waitFor(() => expect(listCountriesRequest).toHaveBeenCalled());
  });
});

describe('AdminRecruitersPage', () => {
  beforeEach(() => {
    listRecruitersRequest.mockResolvedValue({
      data: {
        data: [
          { accountId: '1', status: UserStatus.ACTIVE },
          { accountId: '2', status: UserStatus.PENDING },
        ],
        pagination: { page: 1, totalPages: 1, total: 2, limit: 10 },
      },
    });
  });

  it('bootstraps recruiters and renders page chrome', async () => {
    renderWithProviders(<AdminRecruitersPage />, { preloadedState: adminAuth });
    await waitFor(() => expect(screen.getByText('HR Team')).toBeInTheDocument());
    expect(listRecruitersRequest).toHaveBeenCalled();
    expect(screen.getByTestId('recruiter-table')).toHaveTextContent('count=2');
    expect(screen.queryByTestId('recruiter-banner')).toBeNull();
    expect(screen.getByTestId('invite-hr-cta')).toBeInTheDocument();
  });

  it('clears filters from the toolbar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminRecruitersPage />, { preloadedState: adminAuth });
    await waitFor(() => expect(screen.getByTestId('recruiter-table')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(screen.getByPlaceholderText(/search hr members/i)).toHaveValue('');
  });

  it('ignores loadStats failures and refreshes after invite', async () => {
    const user = userEvent.setup();
    listRecruitersRequest.mockImplementation((params) => {
      // loadStats uses { limit: 100 } only
      if (params?.limit === 100 && params.page == null) {
        return Promise.reject(new Error('stats fail'));
      }
      return Promise.resolve({
        data: {
          data: [{ accountId: '1', status: UserStatus.ACTIVE }],
          pagination: { page: 1, totalPages: 1, total: 1, limit: 10 },
        },
      });
    });

    renderWithProviders(<AdminRecruitersPage />, { preloadedState: adminAuth });
    await waitFor(() => expect(screen.getByText('HR Team')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /invite hr member/i }));
    const callsBefore = listRecruitersRequest.mock.calls.length;
    await user.click(screen.getByTestId('fire-invited'));
    await waitFor(() =>
      expect(listRecruitersRequest.mock.calls.length).toBeGreaterThan(callsBefore)
    );
  });
});

describe('AdminAuditLogsPage', () => {
  const auditStatsBase = {
    total: 42,
    success: 40,
    failed: 2,
    successRate: 95,
    failedRate: 5,
    activeUsers: 3,
    avgDaily: 6,
    totalTrendPct: null,
  };

  beforeEach(() => {
    listRecruitersRequest.mockResolvedValue({
      data: {
        data: [
          {
            accountId: 'rec-1',
            firstName: 'Ray',
            lastName: 'Recruiter',
            email: 'ray@acme.com',
          },
        ],
        pagination: { total: 1 },
      },
    });
    getAuditLogsRequest.mockResolvedValue({
      data: {
        data: [{ auditLogId: 'log-1', action: 'LOGIN_SUCCESS' }],
        pagination: { page: 1, totalPages: 2, total: 15, limit: 10 },
      },
    });
    getAuditStatsRequest.mockResolvedValue({
      data: { data: auditStatsBase },
    });
  });

  it('bootstraps audit logs and stats', async () => {
    renderWithProviders(<AdminAuditLogsPage />, { preloadedState: adminAuth });
    await waitFor(() => expect(screen.getByText('Audit Logs')).toBeInTheDocument());
    expect(getAuditLogsRequest).toHaveBeenCalled();
    expect(getAuditStatsRequest).toHaveBeenCalled();
    expect(screen.getByTestId('audit-log-table')).toHaveTextContent('count=1');
    expect(screen.getByText('In selected period')).toBeInTheDocument();
  });

  it('prepends current admin when missing from recruiters list', async () => {
    renderWithProviders(<AdminAuditLogsPage />, { preloadedState: adminAuth });
    await waitFor(() => expect(listRecruitersRequest).toHaveBeenCalled());
    expect(listRecruitersRequest).toHaveBeenCalledWith({ limit: 100 });
  });

  it('falls back to current account when recruiters list fails', async () => {
    listRecruitersRequest.mockRejectedValueOnce(new Error('network'));
    renderWithProviders(<AdminAuditLogsPage />, { preloadedState: adminAuth });
    await waitFor(() => expect(screen.getByText('Audit Logs')).toBeInTheDocument());
    expect(screen.getByTestId('audit-log-table')).toBeInTheDocument();
  });

  it('does not duplicate current admin when already in recruiters list', async () => {
    listRecruitersRequest.mockResolvedValueOnce({
      data: {
        data: [
          {
            accountId: 'admin-1',
            firstName: 'Org',
            lastName: 'Admin',
            email: 'admin@acme.com',
          },
        ],
        pagination: { total: 1 },
      },
    });
    renderWithProviders(<AdminAuditLogsPage />, { preloadedState: adminAuth });
    await waitFor(() => expect(screen.getByText('Audit Logs')).toBeInTheDocument());
  });

  it('shows positive trend text when totalTrendPct is set', async () => {
    getAuditStatsRequest.mockResolvedValueOnce({
      data: { data: { ...auditStatsBase, totalTrendPct: 12 } },
    });
    renderWithProviders(<AdminAuditLogsPage />, { preloadedState: adminAuth });
    await waitFor(() =>
      expect(screen.getByText('+12% vs prior period')).toBeInTheDocument()
    );
  });

  it('shows default period subtext when totalTrendPct is null', async () => {
    renderWithProviders(<AdminAuditLogsPage />, { preloadedState: adminAuth });
    await waitFor(() =>
      expect(screen.getByText('In selected period')).toBeInTheDocument()
    );
  });

  it('uses zeroed stats when auditStats fetch fails', async () => {
    getAuditStatsRequest.mockRejectedValueOnce(new Error('stats down'));
    renderWithProviders(<AdminAuditLogsPage />, { preloadedState: adminAuth });
    await waitFor(() => expect(screen.getByText('Audit Logs')).toBeInTheDocument());
    expect(screen.getByText('In selected period')).toBeInTheDocument();
  });

  it('cancels pending audit load on unmount', async () => {
    let resolveLogs;
    getAuditLogsRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLogs = resolve;
        })
    );
    const { unmount } = renderWithProviders(<AdminAuditLogsPage />, {
      preloadedState: adminAuth,
    });
    await waitFor(() => expect(getAuditLogsRequest).toHaveBeenCalled());
    unmount();
    await act(async () => {
      resolveLogs({
        data: { data: [], pagination: { page: 1, totalPages: 0, total: 0, limit: 10 } },
      });
    });
  });

  it('applies and resets filters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminAuditLogsPage />, { preloadedState: adminAuth });
    await waitFor(() => expect(screen.getByRole('button', { name: /^filter$/i })).toBeEnabled());

    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBeGreaterThanOrEqual(1);
    await user.clear(dateInputs[0]);
    await user.type(dateInputs[0], '2024-01-01');

    const callsBefore = getAuditLogsRequest.mock.calls.length;
    await user.click(screen.getByRole('button', { name: /^filter$/i }));
    await waitFor(() =>
      expect(getAuditLogsRequest.mock.calls.length).toBeGreaterThan(callsBefore)
    );

    await user.click(screen.getByRole('button', { name: /^reset$/i }));
    await waitFor(() => expect(getAuditLogsRequest.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it('shows rows-per-page control when pagination has results', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminAuditLogsPage />, { preloadedState: adminAuth });
    await waitFor(() => expect(screen.getByText('Rows')).toBeInTheDocument());

    const rowsSelect = screen.getAllByRole('combobox').find((el) =>
      el.textContent?.includes('/ page')
    );
    expect(rowsSelect).toBeTruthy();
    await user.click(rowsSelect);
    await user.click(await screen.findByRole('option', { name: '25 / page' }));
    await waitFor(() =>
      expect(getAuditLogsRequest).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 25, page: 1 })
      )
    );
  });
});
