import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DecisionsTab } from '@/components/recruiter/jobs/DecisionsTab';
import { InterviewsTab } from '@/components/recruiter/jobs/InterviewsTab';
import { JobWorkflowTab } from '@/components/recruiter/jobs/JobWorkflowTab';
import { OutreachTab } from '@/components/recruiter/jobs/OutreachTab';
import {
  createDecisionRequest,
  getDecisionQueueRequest,
  getInterviewsRequest,
  getOutreachRequest,
} from '@/api/recruitmentApi';
import { CandidateStatus } from '@/lib/candidateStatus';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/recruitmentApi', () => ({
  createDecisionRequest: vi.fn(),
  getDecisionQueueRequest: vi.fn(),
  getInterviewsRequest: vi.fn(),
  getOutreachRequest: vi.fn(),
  inviteNextRoundRequest: vi.fn(),
  redialCallRequest: vi.fn(),
}));

function renderTab(type) {
  return render(
    <MemoryRouter>
      <JobWorkflowTab jobId="job-1" type={type} />
    </MemoryRouter>
  );
}

describe('JobWorkflowTab / split tabs', () => {
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

  it('saves a hired decision from the decision queue', async () => {
    const user = userEvent.setup();
    getDecisionQueueRequest
      .mockResolvedValueOnce({
        data: {
          data: [{
            candidateJobId: 'cj-1',
            candidate: { name: 'Grace Hopper' },
            overallMatch: 92,
            status: CandidateStatus.CALL_COMPLETED,
            job: {
              rounds: [
                { jobRoundId: 'jr1', name: 'AI screening', roundOrder: 1, roundType: 'AI' },
              ],
            },
            rounds: [
              {
                jobRoundId: 'jr1',
                status: 'COMPLETED',
                jobRound: { jobRoundId: 'jr1', name: 'AI screening', roundOrder: 1, roundType: 'AI' },
              },
            ],
            scorecards: [{
              jobRoundId: 'jr1',
              summary: { aiRecommendation: 'STRONG_MATCH', scoringStatus: 'SCORED' },
              callRecord: { evaluation: { recommendation: 'STRONG_MATCH' } },
            }],
          }],
        },
      })
      .mockResolvedValueOnce({ data: { data: [] } });
    createDecisionRequest.mockResolvedValueOnce({ data: { data: { decisionId: 'd-1' } } });

    renderTab('decisions');

    await screen.findByText('Grace Hopper');
    expect(screen.getByText('Proceed to human interview')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select/i })).toBeNull();
    await user.click(screen.getByRole('button', { name: /hired/i }));

    await waitFor(() => expect(createDecisionRequest).toHaveBeenCalledWith(
      'cj-1',
      { decision: 'HIRED' }
    ));
  });

  it('C9: next step is Invite to Round 2 when AI rounds remain', async () => {
    getDecisionQueueRequest.mockResolvedValueOnce({
      data: {
        data: [{
          candidateJobId: 'cj-1',
          candidate: { name: 'Ada Lovelace' },
          overallMatch: 88,
          status: CandidateStatus.CALL_COMPLETED,
          job: {
            rounds: [
              { jobRoundId: 'jr-1', name: 'AI screening', roundOrder: 1, roundType: 'AI' },
              { jobRoundId: 'jr-2', name: 'Round 2', roundOrder: 2, roundType: 'AI' },
            ],
          },
          rounds: [
            {
              jobRoundId: 'jr-1',
              status: 'COMPLETED',
              jobRound: { jobRoundId: 'jr-1', name: 'AI screening', roundOrder: 1, roundType: 'AI' },
            },
          ],
          scorecards: [{
            jobRoundId: 'jr-1',
            summary: { aiRecommendation: 'PROCEED_TO_HUMAN_INTERVIEW', scoringStatus: 'SCORED' },
            callRecord: { evaluation: { recommendation: 'PROCEED_TO_HUMAN_INTERVIEW' } },
          }],
        }],
      },
    });

    render(
      <MemoryRouter>
        <DecisionsTab jobId="job-1" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getAllByText('Invite to Round 2').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Proceed to human interview')).toBeNull();
  });

  it('C3: Decision Status uses candidate_jobs.status, not outreach Scheduled', async () => {
    getDecisionQueueRequest.mockResolvedValueOnce({
      data: {
        data: [{
          candidateJobId: 'cj-1',
          candidate: { name: 'Ada Lovelace' },
          overallMatch: 88,
          status: CandidateStatus.CALL_COMPLETED,
          outreachRecords: [{ pipelineStatus: 'SCHEDULED' }],
          scorecards: [{
            summary: { aiRecommendation: 'STRONG_MATCH' },
            callRecord: { evaluation: { recommendation: 'STRONG_MATCH' } },
          }],
        }],
      },
    });

    render(
      <MemoryRouter>
        <DecisionsTab jobId="job-1" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByText('Call completed')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Outreach' })).toBeNull();
    // Must not present outreach Scheduled as the journey badge
    const statusCell = screen.getByText('Call completed').closest('td');
    expect(statusCell?.textContent).not.toMatch(/scheduled/i);
  });

  it('C4: Decision round dropdown scopes scorecard; shows Round N — Failed', async () => {
    const user = userEvent.setup();
    getDecisionQueueRequest.mockResolvedValueOnce({
      data: {
        data: [{
          candidateJobId: 'cj-1',
          candidate: { name: 'Ada Lovelace' },
          overallMatch: 88,
          status: CandidateStatus.CALL_COMPLETED,
          rounds: [
            {
              jobRoundId: 'jr-1',
              status: 'FAILED',
              jobRound: { jobRoundId: 'jr-1', name: 'AI screening', roundOrder: 1 },
            },
            {
              jobRoundId: 'jr-2',
              status: 'COMPLETED',
              jobRound: { jobRoundId: 'jr-2', name: 'Round 2', roundOrder: 2 },
            },
          ],
          scorecards: [
            {
              jobRoundId: 'jr-1',
              summary: { aiRecommendation: 'HOLD' },
              callRecord: { evaluation: { recommendation: 'HOLD' } },
            },
            {
              jobRoundId: 'jr-2',
              summary: { aiRecommendation: 'STRONG_MATCH' },
              callRecord: { evaluation: { recommendation: 'STRONG_MATCH' } },
            },
          ],
        }],
      },
    });

    render(
      <MemoryRouter>
        <DecisionsTab jobId="job-1" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Round' })).toBeInTheDocument();
    const select = screen.getByLabelText('Round for Ada Lovelace');
    expect(select).toBeInTheDocument();
    // Default is latest meaningful (COMPLETED round 2) → code next-step Proceed
    expect(screen.getByText('Proceed to human interview')).toBeInTheDocument();
    expect(screen.getByText(/Fit: Strong match/i)).toBeInTheDocument();

    await user.selectOptions(select, 'jr-1');
    expect(screen.getByText(/Fit: Hold/i)).toBeInTheDocument();
    expect(screen.queryByText(/Fit: Strong match/i)).toBeNull();
  });

  it('C5: late interviews response does not paint Unknown on Decisions', async () => {
    let resolveInterviews;
    getInterviewsRequest.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveInterviews = resolve;
      })
    );
    getDecisionQueueRequest.mockResolvedValue({
      data: {
        data: [{
          candidateJobId: 'cj-dec',
          candidate: { name: 'Decision Candidate' },
          status: CandidateStatus.CALL_COMPLETED,
          overallMatch: 90,
          scorecards: [{ summary: { aiRecommendation: 'STRONG_MATCH' } }],
        }],
      },
    });

    const { rerender } = render(
      <MemoryRouter>
        <InterviewsTab jobId="job-1" />
      </MemoryRouter>
    );

    // Switch to Decisions before interviews resolve (separate mounts — no shared rows)
    rerender(
      <MemoryRouter>
        <DecisionsTab jobId="job-1" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Decision Candidate')).toBeInTheDocument();
    expect(screen.queryByText('Unknown candidate')).toBeNull();

    await act(async () => {
      resolveInterviews({
        data: {
          data: [{
            callScheduleId: 'cs-late',
            status: 'COMPLETED',
            candidateJob: {
              candidateJobId: 'cj-late',
              candidate: { name: 'Late Interview Row' },
            },
          }],
        },
      });
    });

    // Decisions tab must stay on its own data
    expect(screen.getByText('Decision Candidate')).toBeInTheDocument();
    expect(screen.queryByText('Late Interview Row')).toBeNull();
    expect(screen.queryByText('Unknown candidate')).toBeNull();
  });

  it('exports dedicated tab components', () => {
    expect(OutreachTab).toBeTypeOf('function');
    expect(InterviewsTab).toBeTypeOf('function');
    expect(DecisionsTab).toBeTypeOf('function');
  });
});
