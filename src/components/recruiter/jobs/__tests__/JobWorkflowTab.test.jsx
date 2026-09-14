import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { JobWorkflowTab } from '@/components/recruiter/jobs/JobWorkflowTab';
import {
  createDecisionRequest,
  getDecisionQueueRequest,
  getInterviewsRequest,
  getOutreachRequest,
} from '@/api/recruitmentApi';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/recruitmentApi', () => ({
  createDecisionRequest: vi.fn(),
  getDecisionQueueRequest: vi.fn(),
  getInterviewsRequest: vi.fn(),
  getOutreachRequest: vi.fn(),
  inviteNextRoundRequest: vi.fn(),
}));

function renderTab(type) {
  return render(
    <MemoryRouter>
      <JobWorkflowTab jobId="job-1" type={type} />
    </MemoryRouter>
  );
}

describe('JobWorkflowTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders outreach rows and delivery status', async () => {
    getOutreachRequest.mockResolvedValueOnce({
      data: {
        data: [{
          candidateJobId: 'cj-1',
          candidate: { name: 'Ada Lovelace' },
          outreachRecords: [{
            channel: 'EMAIL',
            pipelineStatus: 'EMAIL_SENT',
            emailSentAt: '2026-08-29T10:00:00.000Z',
          }],
        }],
      },
    });

    renderTab('outreach');

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Email sent')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh list' })).toBeDisabled();
    expect(getOutreachRequest).toHaveBeenCalledWith({ jobId: 'job-1' });
  });

  it('enables refresh list only after selecting more than one interview', async () => {
    const user = userEvent.setup();
    getInterviewsRequest.mockResolvedValue({
      data: {
        data: [
          {
            callScheduleId: 'cs-1',
            status: 'SCHEDULED',
            scheduledAt: '2026-09-14T10:42:00.000Z',
            jobRound: { name: 'Round 1' },
            candidateJob: {
              candidateJobId: 'cj-1',
              candidate: { name: 'Shantanu Kumar' },
            },
          },
          {
            callScheduleId: 'cs-2',
            status: 'COMPLETED',
            scheduledAt: '2026-09-13T10:42:00.000Z',
            jobRound: { name: 'Round 1' },
            candidateJob: {
              candidateJobId: 'cj-2',
              candidate: { name: 'Grace Hopper' },
              scorecards: [{ scorecardId: 'sc-1' }],
            },
          },
        ],
      },
    });

    renderTab('interviews');

    expect(await screen.findByText('Shantanu Kumar')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh Shantanu Kumar' })).toBeInTheDocument();

    const refreshList = screen.getByRole('button', { name: 'Refresh list' });
    expect(refreshList).toBeDisabled();

    await user.click(screen.getByLabelText('Select Shantanu Kumar'));
    expect(refreshList).toBeDisabled();

    await user.click(screen.getByLabelText('Select Grace Hopper'));
    expect(refreshList).toBeEnabled();

    const callsBefore = getInterviewsRequest.mock.calls.length;
    await user.click(refreshList);
    await waitFor(() => expect(getInterviewsRequest.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it('renders an empty interview state', async () => {
    getInterviewsRequest.mockResolvedValueOnce({ data: { data: [] } });

    renderTab('interviews');

    expect(await screen.findByText('No interviews found')).toBeInTheDocument();
  });

  it('saves a decision from the decision queue', async () => {
    const user = userEvent.setup();
    getDecisionQueueRequest
      .mockResolvedValueOnce({
        data: {
          data: [{
            candidateJobId: 'cj-1',
            candidate: { name: 'Grace Hopper' },
            overallMatch: 92,
            scorecards: [{
              summary: { aiRecommendation: 'STRONG_MATCH' },
              callRecord: { evaluation: { recommendation: 'STRONG_MATCH' } },
            }],
          }],
        },
      })
      .mockResolvedValueOnce({ data: { data: [] } });
    createDecisionRequest.mockResolvedValueOnce({ data: { data: { decisionId: 'd-1' } } });

    renderTab('decisions');

    await screen.findByText('Grace Hopper');
    await user.click(screen.getByRole('button', { name: /select/i }));

    await waitFor(() => expect(createDecisionRequest).toHaveBeenCalledWith(
      'cj-1',
      { decision: 'SELECTED' }
    ));
  });
});
