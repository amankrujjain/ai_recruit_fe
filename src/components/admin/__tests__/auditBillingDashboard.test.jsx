import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Users } from 'lucide-react';
import { renderWithProviders } from '@/test/utils';
import { AuditLogDetailModal } from '@/components/admin/audit/AuditLogDetailModal';
import { AuditLogTable, compareLogs } from '@/components/admin/audit/AuditLogTable';
import { BillingOverview } from '@/components/admin/billing/BillingOverview';
import { CircularProgress } from '@/components/admin/dashboard/CircularProgress';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { NotificationsCard } from '@/components/admin/dashboard/NotificationsCard';
import {
  OrganizationSetupCard,
  buildSetupChecklist,
} from '@/components/admin/dashboard/OrganizationSetupCard';
import { QuickActionsCard } from '@/components/admin/dashboard/QuickActionsCard';
import { RecentActivityCard, iconForAction } from '@/components/admin/dashboard/RecentActivityCard';
import { UpcomingRenewalsCard } from '@/components/admin/dashboard/UpcomingRenewalsCard';
import { AdminOverview } from '@/components/admin/dashboard/AdminOverview';
import { UserStatus } from '@/lib/userStatus';

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

vi.mock('@/api/recruiterApi', () => ({
  listRecruitersRequest: vi.fn(() =>
    Promise.resolve({ data: { data: [], pagination: null } })
  ),
  inviteRecruiterRequest: vi.fn(),
  disableRecruiterRequest: vi.fn(),
  enableRecruiterRequest: vi.fn(),
  deleteRecruiterRequest: vi.fn(),
  resetRecruiterPasswordRequest: vi.fn(),
  getRecruiterRequest: vi.fn(),
}));

vi.mock('@/api/adminOrgApi', () => ({
  getMyOrganizationRequest: vi.fn(() =>
    Promise.resolve({ data: { data: { organizationName: 'Acme' } } })
  ),
  updateOrgSettingsRequest: vi.fn(),
  uploadOrgLogoRequest: vi.fn(),
  updateEmailTemplateRequest: vi.fn(),
  updateWhatsAppTemplateRequest: vi.fn(),
  getBillingRequest: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          currentPlan: { planName: 'Pro', renewalDate: new Date(Date.now() + 86400000).toISOString() },
          usageSummary: {},
        },
      },
    })
  ),
  getAuditLogsRequest: vi.fn(() =>
    Promise.resolve({ data: { data: [], pagination: null } })
  ),
  getAuditStatsRequest: vi.fn(),
}));

import { usePageBootstrap } from '@/hooks/usePageBootstrap';

const baseLog = {
  auditLogId: 'log-1',
  createdAt: '2024-06-15T10:30:00.000Z',
  action: 'LOGIN_SUCCESS',
  module: 'authentication',
  resource: 'session',
  resourceId: 'sess-1',
  userAgent: 'Mozilla/5.0',
  metadata: { ok: true },
  account: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
  },
  ipAddress: '203.0.113.10',
};

describe('AuditLogDetailModal', () => {
  it('returns null when closed or missing log', () => {
    const { rerender } = renderWithProviders(
      <AuditLogDetailModal open={false} onOpenChange={vi.fn()} log={baseLog} />
    );
    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(<AuditLogDetailModal open onOpenChange={vi.fn()} log={null} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders details and closes via overlay, X, and Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <AuditLogDetailModal open onOpenChange={onOpenChange} log={baseLog} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/close dialog overlay/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.click(screen.getByLabelText(/^close$/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('covers failed status, unknown account branches, and circular metadata', () => {
    const circular = {};
    circular.self = circular;

    renderWithProviders(
      <AuditLogDetailModal
        open
        onOpenChange={vi.fn()}
        log={{
          ...baseLog,
          status: 'failed',
          action: 'LOGIN_FAILED',
          account: { firstName: '', lastName: '', email: '' },
          resource: null,
          resourceId: null,
          userAgent: null,
          metadata: circular,
          ipAddress: null,
        }}
      />
    );

    expect(screen.getByText('Unknown user')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('{}')).toBeInTheDocument();
  });

  it('shows system label when account is missing', () => {
    renderWithProviders(
      <AuditLogDetailModal
        open
        onOpenChange={vi.fn()}
        log={{ ...baseLog, account: null, metadata: undefined }}
      />
    );
    expect(screen.getByText('System / unknown')).toBeInTheDocument();
  });
});

describe('AuditLogTable', () => {
  it('compareLogs default column returns 0', () => {
    expect(compareLogs({}, {}, 'unknown')).toBe(0);
    expect(compareLogs({ module: 'billing' }, { module: 'auth' }, 'module')).not.toBe(0);
    expect(compareLogs({ module: null }, { module: 'auth' }, 'module')).not.toBe(0);
    expect(compareLogs({ action: 'LOGIN' }, { action: 'LOGOUT' }, 'action')).not.toBe(0);
    expect(compareLogs({ action: null }, { action: 'LOGOUT' }, 'action')).not.toBe(0);
    expect(compareLogs({ action: undefined }, { action: undefined }, 'action')).toBe(0);
    expect(compareLogs({ module: undefined }, { module: undefined }, 'module')).toBe(0);
  });

  const items = [
    {
      ...baseLog,
      auditLogId: 'a',
      createdAt: '2024-01-01T00:00:00.000Z',
      action: 'LOGIN_SUCCESS',
      module: 'billing',
      account: { firstName: 'Zoe', lastName: 'Zed', email: 'z@x.com' },
    },
    {
      ...baseLog,
      auditLogId: 'b',
      createdAt: '2024-06-01T00:00:00.000Z',
      action: 'LOGIN_FAILED',
      module: 'authentication',
      status: 'failed',
      account: null,
    },
    {
      ...baseLog,
      auditLogId: 'c',
      createdAt: '2024-03-01T00:00:00.000Z',
      action: 'SETTINGS_UPDATED',
      module: 'organization_settings',
      account: { firstName: '', lastName: '', email: 'empty@x.com' },
    },
    {
      ...baseLog,
      auditLogId: 'd',
      createdAt: '2024-04-01T00:00:00.000Z',
      action: null,
      module: null,
      account: { firstName: 'Ann', lastName: null, email: 'a@x.com' },
      ipAddress: null,
    },
  ];

  it('shows loading and empty states', () => {
    const { rerender } = renderWithProviders(<AuditLogTable items={[]} loading />);
    expect(screen.getByText(/loading audit logs/i)).toBeInTheDocument();

    rerender(<AuditLogTable items={null} loading={false} />);
    expect(screen.getByText(/no audit logs found/i)).toBeInTheDocument();
  });

  it('sorts columns and opens detail modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditLogTable items={items} loading={false} />);

    expect(screen.getByText('Zoe Zed')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^time/i }));
    await user.click(screen.getByRole('button', { name: /^user/i }));
    await user.click(screen.getByRole('button', { name: /^user/i }));
    await user.click(screen.getByRole('button', { name: /^module/i }));
    await user.click(screen.getByRole('button', { name: /^action/i }));
    await user.click(screen.getByRole('button', { name: /^status/i }));
    await user.click(screen.getByRole('button', { name: /^time/i }));

    await user.click(screen.getAllByLabelText(/view activity details/i)[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/close dialog overlay/i));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('BillingOverview', () => {
  it('covers loading, missing, and populated billing', () => {
    const { rerender } = renderWithProviders(<BillingOverview loading />);
    expect(screen.getByText(/loading billing/i)).toBeInTheDocument();

    rerender(<BillingOverview loading={false} billing={null} />);
    expect(screen.getByText(/billing information unavailable/i)).toBeInTheDocument();

    rerender(
      <BillingOverview
        loading={false}
        billing={{
          currentPlan: { planName: 'Pro', renewalDate: '2026-12-01T00:00:00.000Z' },
          usageSummary: { seats: 5 },
          invoiceHistory: [
            {
              invoiceId: 'inv-1',
              issuedAt: '2026-01-01T00:00:00.000Z',
              amount: 99,
              currency: 'USD',
              status: 'paid',
            },
          ],
        }}
      />
    );
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText(/seats: 5/i)).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();

    rerender(
      <BillingOverview
        loading={false}
        billing={{
          currentPlan: { planName: 'Basic', renewalDate: '2026-06-01T00:00:00.000Z' },
          usageSummary: null,
          invoiceHistory: [
            {
              invoiceId: 'inv-2',
              issuedAt: '2026-02-01T00:00:00.000Z',
              amount: 10,
              status: 'open',
            },
          ],
        }}
      />
    );
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('open')).toBeInTheDocument();

    rerender(
      <BillingOverview
        loading={false}
        billing={{
          currentPlan: { planName: 'Empty', renewalDate: '2026-06-01T00:00:00.000Z' },
          usageSummary: {},
          invoiceHistory: null,
        }}
      />
    );
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });
});

describe('CircularProgress / StatCard', () => {
  it('clamps progress values', () => {
    const { rerender } = renderWithProviders(<CircularProgress value={-10} />);
    expect(screen.getByText('0%')).toBeInTheDocument();

    rerender(<CircularProgress value={150} label="Done" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders trend or subtext and optional icon tones', () => {
    const { rerender } = renderWithProviders(
      <StatCard icon={Users} label="Members" value={3} trend="+2" tone="success" />
    );
    expect(screen.getByText('+2 this month')).toBeInTheDocument();

    rerender(
      <StatCard label="Pending" value={0} subtext="No change" tone="warning" />
    );
    expect(screen.getByText('No change')).toBeInTheDocument();

    rerender(<StatCard label="Danger" value={1} subtext="x" tone="danger" />);
    rerender(<StatCard label="Accent" value={1} subtext="x" tone="accent" />);
    expect(screen.getByText('Accent')).toBeInTheDocument();
  });
});

describe('NotificationsCard', () => {
  it('pluralizes pending invites and optional renewal', () => {
    const { rerender } = renderWithProviders(
      <NotificationsCard pendingCount={0} />
    );
    expect(screen.queryByText(/hr invitation/i)).toBeNull();
    expect(screen.getByText(/google calendar/i)).toBeInTheDocument();

    rerender(<NotificationsCard pendingCount={1} daysLeft={12} />);
    expect(screen.getByText(/1 hr invitation is pending/i)).toBeInTheDocument();
    expect(screen.getByText(/renew in 12 days/i)).toBeInTheDocument();

    rerender(<NotificationsCard pendingCount={3} daysLeft={2} />);
    expect(screen.getByText(/3 hr invitations are pending/i)).toBeInTheDocument();
  });
});

describe('OrganizationSetupCard / buildSetupChecklist', () => {
  it('marks checklist items done and incomplete', () => {
    expect(
      buildSetupChecklist({ organization: null, recruiters: [] }).every((i) => !i.done || i.label === 'Calendar Connected' ? true : !i.done)
    ).toBe(true);

    const completeOrg = {
      organizationName: 'Acme',
      logoUrl: 'https://cdn.example/logo.png',
      emailTemplates: [{ id: 1 }],
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
    };
    const items = buildSetupChecklist({
      organization: completeOrg,
      recruiters: [{ accountId: '1' }],
    });
    expect(items.filter((i) => i.done)).toHaveLength(5);
    expect(items.find((i) => i.label === 'Calendar Connected').done).toBe(false);

    renderWithProviders(
      <OrganizationSetupCard organization={completeOrg} recruiters={[{ accountId: '1' }]} />
    );
    expect(screen.getByText('Organization Setup')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /complete setup/i })).toHaveAttribute(
      'href',
      '/admin/settings'
    );
  });
});

describe('QuickActionsCard / RecentActivityCard / UpcomingRenewalsCard', () => {
  it('renders quick action links', () => {
    renderWithProviders(<QuickActionsCard />);
    expect(screen.getByRole('link', { name: /invite hr member/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view audit logs/i })).toBeInTheDocument();
  });

  it('covers recent activity loading, empty, and icon branches', () => {
    expect(iconForAction()).toBeTruthy();
    expect(iconForAction('invite')).toBeTruthy();
    expect(iconForAction('join')).toBeTruthy();
    expect(iconForAction('email')).toBeTruthy();
    expect(iconForAction('calendar')).toBeTruthy();
    expect(iconForAction('setting')).toBeTruthy();
    expect(iconForAction('other')).toBeTruthy();
    expect(iconForAction('')).toBeTruthy();

    const { rerender } = renderWithProviders(
      <RecentActivityCard auditLogs={[]} loading />
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    rerender(<RecentActivityCard auditLogs={[]} loading={false} />);
    expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();

    rerender(
      <RecentActivityCard
        loading={false}
        auditLogs={[
          { auditLogId: '1', action: 'INVITATION_SENT', createdAt: new Date().toISOString() },
          { auditLogId: '2', action: 'USER_JOINED', createdAt: new Date().toISOString() },
          { auditLogId: '3', action: 'EMAIL_TEMPLATE', createdAt: new Date().toISOString() },
          { auditLogId: '4', action: 'CALENDAR_SCHEDULE', createdAt: new Date().toISOString() },
          { auditLogId: '5', action: 'ORG_SETTINGS', createdAt: new Date().toISOString() },
          { auditLogId: '6', action: 'OTHER_THING', createdAt: new Date().toISOString() },
          { auditLogId: '7', action: undefined, createdAt: new Date().toISOString() },
          { auditLogId: '8', action: '', createdAt: new Date().toISOString() },
        ]}
      />
    );
    expect(screen.getByText(/invitation sent/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view all activity/i })).toBeInTheDocument();
  });

  it('covers renewals with and without plan/usage keys and invalid dates', () => {
    const future = new Date(Date.now() + 10 * 86400000).toISOString();
    const { rerender } = renderWithProviders(
      <UpcomingRenewalsCard billing={null} recruiters={[]} />
    );
    expect(screen.getByText(/no active plan/i)).toBeInTheDocument();

    rerender(
      <UpcomingRenewalsCard
        billing={{
          currentPlan: { planName: 'Growth', renewalDate: 'not-a-date' },
          usageSummary: {},
        }}
        recruiters={[{}, {}]}
      />
    );
    expect(screen.getByText('Growth')).toBeInTheDocument();

    rerender(
      <UpcomingRenewalsCard
        billing={{
          currentPlan: { planName: 'Enterprise', renewalDate: future },
          usageSummary: {
            hrMembersLimit: 40,
            aiCredits: 100,
            voiceMinutes: 50,
            storageUsedGb: 3,
            storageLimitGb: 50,
          },
        }}
        recruiters={[{ accountId: '1' }]}
      />
    );
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
    expect(screen.getByText(/days left/i)).toBeInTheDocument();
    expect(screen.getByText('1 / 40')).toBeInTheDocument();

    rerender(
      <UpcomingRenewalsCard
        billing={{
          currentPlan: { planName: 'Seats', renewalDate: future },
          usageSummary: { seats: 8 },
        }}
        recruiters={[]}
      />
    );
    expect(screen.getByText('0 / 8')).toBeInTheDocument();
  });
});

describe('AdminOverview', () => {
  beforeEach(() => {
    usePageBootstrap.mockReturnValue(false);
  });

  it('shows skeleton while booting', () => {
    usePageBootstrap.mockReturnValue(true);
    renderWithProviders(<AdminOverview />);
    expect(screen.getByLabelText(/loading page/i)).toBeInTheDocument();
  });

  it('bootstraps organization, recruiters, billing, and audit logs', async () => {
    usePageBootstrap.mockImplementation((load, deps = []) => {
      const [booting, setBooting] = React.useState(true);
      React.useEffect(() => {
        let alive = true;
        Promise.resolve()
          .then(() => load())
          .catch(() => {})
          .finally(() => {
            if (alive) setBooting(false);
          });
        return () => {
          alive = false;
        };
      }, deps);
      return booting;
    });

    const { listRecruitersRequest } = await import('@/api/recruiterApi');
    const {
      getMyOrganizationRequest,
      getBillingRequest,
      getAuditLogsRequest,
    } = await import('@/api/adminOrgApi');

    renderWithProviders(<AdminOverview />);

    await waitFor(() => {
      expect(getMyOrganizationRequest).toHaveBeenCalled();
      expect(listRecruitersRequest).toHaveBeenCalled();
      expect(getBillingRequest).toHaveBeenCalled();
      expect(getAuditLogsRequest).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText('Total HR Members')).toBeInTheDocument();
    });
  });

  it('renders stats and cards from store state', async () => {
    const renewal = new Date(Date.now() + 20 * 86400000).toISOString();
    renderWithProviders(<AdminOverview />, {
      preloadedState: {
        recruiters: {
          items: [
            { accountId: '1', status: UserStatus.ACTIVE },
            { accountId: '2', status: UserStatus.PENDING },
            { accountId: '3', status: UserStatus.DISABLED },
          ],
          pagination: null,
          loading: false,
          inviting: false,
          actionId: null,
          lastInvited: null,
          error: null,
        },
        adminOrg: {
          organization: {
            organizationName: 'Acme',
            logoUrl: null,
            emailTemplates: [],
            workingHoursStart: null,
            workingHoursEnd: null,
          },
          billing: {
            currentPlan: { planName: 'Pro', renewalDate: renewal },
            usageSummary: {},
          },
          auditLogs: [
            {
              auditLogId: 'a1',
              action: 'LOGIN_SUCCESS',
              createdAt: new Date().toISOString(),
            },
          ],
          auditPagination: null,
          auditStats: null,
          loading: false,
          saving: false,
          logoUploading: false,
          billingLoading: false,
          auditLoading: false,
          error: null,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Total HR Members')).toBeInTheDocument();
    });
    expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
    expect(screen.getByText('Awaiting response')).toBeInTheDocument();
    expect(screen.getByText('Organization Setup')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Renewals')).toBeInTheDocument();
  });

  it('uses no-change subtext and invalid renewal daysLeft path', async () => {
    renderWithProviders(<AdminOverview />, {
      preloadedState: {
        recruiters: {
          items: [],
          pagination: null,
          loading: false,
          inviting: false,
          actionId: null,
          lastInvited: null,
          error: null,
        },
        adminOrg: {
          organization: null,
          billing: {
            currentPlan: { planName: 'Pro', renewalDate: 'bad' },
            usageSummary: {},
          },
          auditLogs: [],
          auditPagination: null,
          auditStats: null,
          loading: false,
          saving: false,
          logoUploading: false,
          billingLoading: false,
          auditLoading: false,
          error: null,
        },
      },
    });

    await waitFor(() => expect(screen.getByText('No change')).toBeInTheDocument());
  });
});
