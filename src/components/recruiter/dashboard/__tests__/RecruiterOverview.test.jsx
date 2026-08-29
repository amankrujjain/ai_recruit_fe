import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { PageTitleProvider } from '@/context/PageTitleContext';
import { RecruiterOverview } from '@/components/recruiter/dashboard/RecruiterOverview';
import { Roles } from '@/lib/roles';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/recruitmentApi', () => ({
  getDashboardOverviewRequest: vi.fn(),
  retryOutreachRequest: vi.fn(),
  updateCandidateStatusRequest: vi.fn(),
  getDashboardStatsRequest: vi.fn(),
  getScorecardRequest: vi.fn(),
  getCallRecordsRequest: vi.fn(),
}));

import { getDashboardOverviewRequest, retryOutreachRequest } from '@/api/recruitmentApi';
import { toast } from 'sonner';

const overviewPayload = {
  orgTimezone: 'UTC',
  matchThreshold: 80,
  funnel: {
    uploaded: 82,
    eligible: 34,
    outreachSent: 18,
    scheduled: 11,
    scored: 6,
    selected: 2,
  },
  jobs: { active: 3, inactive: 1 },
  invitedThisWeek: { count: 8, jobCount: 3 },
  todaysInterviews: [
    {
      callScheduleId: 'cs1',
      candidateJobId: 'cj1',
      jobId: 'j1',
      candidateName: 'Kofi Asante',
      jobTitle: 'Backend Node Engineer',
      round: 1,
      scheduledAt: '2026-08-24T11:00:00.000Z',
      status: 'SCHEDULED',
    },
  ],
  attention: {
    total: 2,
    scorecards: [
      {
        candidateJobId: 'cj2',
        jobId: 'j2',
        candidateName: 'Ada Lovelace',
        jobTitle: 'Senior React Engineer',
        overallMatch: 82,
        matchLabel: 'STRONG',
      },
    ],
    failedInvites: [
      {
        outreachRecordId: 'or1',
        candidateJobId: 'cj3',
        jobId: 'j3',
        candidateName: 'Sara Lindqvist',
        jobTitle: 'Product Designer',
        lastError: 'bounce',
      },
    ],
    noShows: [],
  },
};

describe('RecruiterOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDashboardOverviewRequest.mockResolvedValue({ data: { data: overviewPayload } });
  });

  it('renders Figma dashboard widgets from overview API', async () => {
    renderWithProviders(
      <PageTitleProvider>
        <RecruiterOverview />
      </PageTitleProvider>,
      {
        preloadedState: {
          auth: {
            account: { firstName: 'Priya', lastName: 'Sharma', role: Roles.RECRUITER },
            token: 't',
            loading: false,
            error: null,
            initialized: true,
          },
          adminOrg: {
            organization: { organizationName: 'Northwind Hiring' },
            billing: null,
            loading: false,
            billingLoading: false,
            error: null,
          },
        },
      }
    );

    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    expect(screen.getByText(/Northwind Hiring · all active jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/Needs your attention/i)).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText(/Pipeline funnel/i)).toBeInTheDocument();
    expect(screen.getByText('Kofi Asante')).toBeInTheDocument();
    expect(screen.getByText('Active jobs')).toBeInTheDocument();
    expect(screen.getByText('Invited this week')).toBeInTheDocument();
    expect(getDashboardOverviewRequest).toHaveBeenCalled();
  });

  it('retries failed invite from attention card', async () => {
    const user = userEvent.setup();
    retryOutreachRequest.mockResolvedValue({
      data: { data: { outreachRecordId: 'or1', pipelineStatus: 'EMAIL_QUEUED' } },
    });

    renderWithProviders(
      <PageTitleProvider>
        <RecruiterOverview />
      </PageTitleProvider>,
      {
        preloadedState: {
          auth: {
            account: { firstName: 'Priya', lastName: 'Sharma', role: Roles.RECRUITER },
            token: 't',
            loading: false,
            error: null,
            initialized: true,
          },
          adminOrg: {
            organization: { organizationName: 'Northwind Hiring' },
            billing: null,
            loading: false,
            billingLoading: false,
            error: null,
          },
        },
      }
    );

    await waitFor(() => expect(screen.getByText(/Sara Lindqvist/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /retry invite/i }));
    await waitFor(() => expect(retryOutreachRequest).toHaveBeenCalledWith('or1'));
    expect(toast.success).toHaveBeenCalledWith('Invite re-queued');
  });
});
