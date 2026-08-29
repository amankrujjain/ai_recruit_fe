import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { InterviewScorecardDrawer } from '@/components/recruiter/candidates/InterviewScorecardDrawer';
import { ResumeProcessingBanner } from '@/components/recruiter/candidates/ResumeProcessingBanner';
import { RecruiterOverview } from '@/components/recruiter/dashboard/RecruiterOverview';
import { JobDetailHeader } from '@/components/recruiter/jobs/JobDetailHeader';
import { JobTable } from '@/components/recruiter/jobs/JobTable';
import { JobForm } from '@/components/recruiter/jobs/JobForm';
import { CandidateTable } from '@/components/recruiter/candidates/CandidateTable';
import { FileUploadZone } from '@/components/recruiter/candidates/FileUploadZone';
import { CandidateStatus } from '@/lib/candidateStatus';
import { Recommendation } from '@/lib/recommendation';
import { Roles } from '@/lib/roles';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/recruitmentApi', () => ({
  getScorecardRequest: vi.fn(),
  getCallRecordsRequest: vi.fn(),
  getDashboardStatsRequest: vi.fn(),
  getDashboardOverviewRequest: vi.fn(),
  retryOutreachRequest: vi.fn(),
  updateCandidateStatusRequest: vi.fn(),
}));

import { toast } from 'sonner';
import {
  getScorecardRequest,
  getCallRecordsRequest,
  getDashboardOverviewRequest,
} from '@/api/recruitmentApi';

describe('InterviewScorecardDrawer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when closed', () => {
    render(
      <InterviewScorecardDrawer open={false} candidateJobId="c1" onOpenChange={vi.fn()} />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows loading then empty state', async () => {
    let resolveScore;
    getScorecardRequest.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveScore = resolve;
      })
    );
    getCallRecordsRequest.mockReturnValueOnce(
      Promise.resolve({ data: { data: [] } })
    );

    render(
      <InterviewScorecardDrawer
        open
        candidateJobId="c1"
        candidateName="Ada"
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText(/loading interview results/i)).toBeInTheDocument();

    await act(async () => {
      resolveScore({ data: { data: null } });
    });

    await waitFor(() =>
      expect(screen.getByText(/no interview results yet/i)).toBeInTheDocument()
    );
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  it('toasts on load error', async () => {
    getScorecardRequest.mockRejectedValueOnce({
      response: { data: { message: 'boom' } },
    });
    getCallRecordsRequest.mockResolvedValueOnce({ data: { data: [] } });

    render(
      <InterviewScorecardDrawer open candidateJobId="c1" onOpenChange={vi.fn()} />
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('boom'));
    expect(screen.getByText(/no interview results yet/i)).toBeInTheDocument();
  });

  it('renders content with known recommendation and closes', async () => {
    const onOpenChange = vi.fn();
    getScorecardRequest.mockResolvedValueOnce({
      data: {
        data: {
          summary: {
            matchScore: 88.4,
            strengths: ['Clear communicator'],
            concerns: ['Needs mentoring'],
            callSummary: 'Solid overall',
            aiRecommendation: Recommendation.STRONG_MATCH,
          },
          callRecord: {
            callRecordId: 'cr1',
            durationSeconds: 95,
            transcriptText: 'Hello world',
            recordingUrl: 'https://example.com/rec.mp3',
            createdAt: '2026-01-01T10:00:00.000Z',
            updatedAt: '2026-01-01T10:05:00.000Z',
            outcome: 'COMPLETED',
            evaluation: {
              recommendation: Recommendation.STRONG_MATCH,
              technicalAlignment: 90,
              communicationScore: 80,
              confidenceScore: 70,
              roleAlignment: 85,
              interestLevel: 75,
              noticePeriod: '30 days',
              salaryExpectations: '120k',
              strengths: ['Clear communicator'],
              concerns: ['Needs mentoring'],
              createdAt: '2026-01-01T10:06:00.000Z',
              rawAiResponse: { callSummary: 'Solid overall' },
            },
            callSchedule: {
              createdAt: '2026-01-01T09:00:00.000Z',
              scheduledAt: '2026-01-01T10:00:00.000Z',
              timezone: 'UTC',
              status: 'COMPLETED',
            },
          },
        },
      },
    });
    getCallRecordsRequest.mockResolvedValueOnce({
      data: {
        data: [
          {
            callRecordId: 'cr1',
            createdAt: '2026-01-01T10:00:00.000Z',
            updatedAt: '2026-01-01T10:05:00.000Z',
            durationSeconds: 95,
            outcome: 'COMPLETED',
            evaluation: {
              recommendation: Recommendation.STRONG_MATCH,
              createdAt: '2026-01-01T10:06:00.000Z',
            },
            callSchedule: {
              createdAt: '2026-01-01T09:00:00.000Z',
              scheduledAt: '2026-01-01T10:00:00.000Z',
              timezone: 'UTC',
              status: 'COMPLETED',
            },
          },
        ],
      },
    });

    const user = userEvent.setup();
    render(
      <InterviewScorecardDrawer
        open
        candidateJobId="c1"
        candidateName="Ada"
        onOpenChange={onOpenChange}
      />
    );

    await waitFor(() =>
      expect(screen.getAllByText(/strong match/i).length).toBeGreaterThan(0)
    );
    expect(screen.getByText(/clear communicator/i)).toBeInTheDocument();
    expect(screen.getByText(/needs mentoring/i)).toBeInTheDocument();
    expect(screen.getByText(/solid overall/i)).toBeInTheDocument();
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open recording/i })).toHaveAttribute(
      'href',
      'https://example.com/rec.mp3'
    );
    expect(screen.getByText(/call scheduled/i)).toBeInTheDocument();

    await user.click(screen.getByText('Close', { selector: 'button' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('falls back for unknown recommendation and empty lists', async () => {
    getScorecardRequest.mockResolvedValueOnce({
      data: {
        data: {
          summary: {},
          callRecord: {
            callRecordId: 'cr2',
            durationSeconds: 12,
            createdAt: '2026-01-02T10:00:00.000Z',
            evaluation: {
              recommendation: 'CUSTOM_REC',
              technicalAlignment: null,
              communicationScore: 'x',
              confidenceScore: -5,
              roleAlignment: 150,
              interestLevel: '',
            },
          },
        },
      },
    });
    getCallRecordsRequest.mockResolvedValueOnce({ data: { data: [] } });

    render(
      <InterviewScorecardDrawer open candidateJobId="c2" onOpenChange={vi.fn()} />
    );

    await waitFor(() => expect(screen.getByText('CUSTOM_REC')).toBeInTheDocument());
    expect(
      screen.getByText(/ai recommendation based on the screening call/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/no strengths listed/i)).toBeInTheDocument();
    expect(screen.getByText(/no concerns listed/i)).toBeInTheDocument();
    expect(screen.getByText(/transcript not available yet/i)).toBeInTheDocument();
  });

  it('shows scorecard-not-generated when no recommendation', async () => {
    getScorecardRequest.mockResolvedValueOnce({
      data: {
        data: {
          summary: { strengths: 'Only one', concerns: [''] },
          callRecord: {
            callRecordId: 'cr3',
            durationSeconds: null,
            createdAt: '2026-01-03T10:00:00.000Z',
            summary: 'From call record',
          },
        },
      },
    });
    getCallRecordsRequest.mockResolvedValueOnce({ data: { data: [] } });

    render(
      <InterviewScorecardDrawer open candidateJobId="c3" onOpenChange={vi.fn()} />
    );

    await waitFor(() =>
      expect(screen.getByText(/scorecard not generated yet/i)).toBeInTheDocument()
    );
    expect(screen.getByText('Only one')).toBeInTheDocument();
    expect(screen.getByText(/from call record/i)).toBeInTheDocument();
  });

  it('uses raw recommendation in timeline when label missing', async () => {
    getScorecardRequest.mockResolvedValueOnce({
      data: {
        data: {
          callRecord: {
            callRecordId: 'cr4',
            createdAt: '2026-01-04T10:00:00.000Z',
            evaluation: {
              createdAt: '2026-01-04T10:01:00.000Z',
              recommendation: 'CUSTOM_REC',
            },
          },
        },
      },
    });
    getCallRecordsRequest.mockResolvedValueOnce({
      data: {
        data: [
          {
            callRecordId: 'cr4',
            createdAt: '2026-01-04T10:00:00.000Z',
            evaluation: {
              createdAt: '2026-01-04T10:01:00.000Z',
              recommendation: 'CUSTOM_REC',
            },
          },
        ],
      },
    });

    render(
      <InterviewScorecardDrawer open candidateJobId="c4" onOpenChange={vi.fn()} />
    );

    await waitFor(() =>
      expect(screen.getAllByText(/CUSTOM_REC/).length).toBeGreaterThan(0)
    );
  });

  it('shows no audit events when timeline empty', async () => {
    getScorecardRequest.mockResolvedValueOnce({
      data: {
        data: {
          summary: { aiRecommendation: Recommendation.NOT_RECOMMENDED },
        },
      },
    });
    getCallRecordsRequest.mockResolvedValueOnce({ data: { data: [] } });

    render(
      <InterviewScorecardDrawer open candidateJobId="c5" onOpenChange={vi.fn()} />
    );

    await waitFor(() =>
      expect(screen.getByText(/no audit events yet/i)).toBeInTheDocument()
    );
  });

  it('closes via overlay and Escape', async () => {
    const onOpenChange = vi.fn();
    getScorecardRequest.mockResolvedValue({ data: { data: null } });
    getCallRecordsRequest.mockResolvedValue({ data: { data: [] } });

    const user = userEvent.setup();
    render(
      <InterviewScorecardDrawer open candidateJobId="c1" onOpenChange={onOpenChange} />
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/close scorecard overlay/i)).toBeInTheDocument()
    );
    await user.click(screen.getByLabelText(/close scorecard overlay/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('ResumeProcessingBanner', () => {
  it('returns null without progress', () => {
    const { container } = render(<ResumeProcessingBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders active, done, and failed phases', () => {
    const { rerender } = render(
      <ResumeProcessingBanner
        progress={{
          active: true,
          phase: 'parsing',
          fileName: 'cv.pdf',
          percent: 40,
          completed: 1,
          failed: 1,
          total: 3,
        }}
      />
    );
    expect(screen.getByText(/processing resumes/i)).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText(/cv\.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/1 failed/i)).toBeInTheDocument();

    rerender(
      <ResumeProcessingBanner
        progress={{
          active: false,
          phase: 'done',
          message: 'All done',
          completed: 3,
          total: 3,
        }}
      />
    );
    expect(screen.getByText('All done')).toBeInTheDocument();

    rerender(
      <ResumeProcessingBanner
        progress={{ active: false, phase: 'failed', message: 'Parse failed' }}
      />
    );
    expect(screen.getByText('Parse failed')).toBeInTheDocument();
  });
});

describe('RecruiterOverview', () => {
  const overviewFixture = {
    jobs: { active: 10, inactive: 2 },
    invitedThisWeek: { count: 4, jobCount: 2 },
    funnel: {
      uploaded: 10,
      eligible: 4,
      outreachSent: 3,
      scheduled: 2,
      scored: 1,
      selected: 1,
    },
    matchThreshold: 80,
    attention: { noShows: [], eligible: [], bounce: [], scorecardsPending: [] },
    todaysInterviews: [],
    orgTimezone: 'UTC',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getDashboardOverviewRequest.mockResolvedValue({
      data: { data: overviewFixture },
    });
  });

  it('shows skeleton then overview widgets', async () => {
    renderWithProviders(<RecruiterOverview />, {
      preloadedState: {
        auth: {
          account: { firstName: 'Rae', role: Roles.RECRUITER },
          token: 't',
          loading: false,
          error: null,
          initialized: true,
        },
      },
    });

    expect(screen.getByRole('status', { name: /loading page/i })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('recruiter-overview')).toBeInTheDocument());
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Active jobs')).toBeInTheDocument();
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getByText(/Eligible ≥80%/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create job/i })).toHaveAttribute(
      'href',
      '/recruiter/jobs/new'
    );
  });

  it('defaults missing overview fields to 0', async () => {
    getDashboardOverviewRequest.mockResolvedValueOnce({
      data: {
        data: {
          jobs: {},
          invitedThisWeek: {},
          funnel: {},
          attention: { noShows: [], eligible: [], bounce: [], scorecardsPending: [] },
          todaysInterviews: [],
        },
      },
    });
    renderWithProviders(<RecruiterOverview />, {
      preloadedState: {
        auth: {
          account: { firstName: 'Rae', role: Roles.RECRUITER },
          token: 't',
          loading: false,
          error: null,
          initialized: true,
        },
      },
    });

    await waitFor(() => expect(screen.getByTestId('recruiter-overview')).toBeInTheDocument());
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});

describe('JobDetailHeader / JobTable', () => {
  it('header activates/deactivates and handles missing job', async () => {
    const user = userEvent.setup();
    const onDeactivate = vi.fn();
    const onActivate = vi.fn();
    const { rerender, container } = renderWithProviders(
      <JobDetailHeader job={null} />
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <JobDetailHeader
        job={{
          jobId: 'j1',
          jobTitle: 'Engineer',
          isActive: true,
          location: 'Remote',
          employmentType: 'FULL_TIME',
        }}
        onDeactivate={onDeactivate}
        deactivating={false}
      />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close job/i }));
    expect(onDeactivate).toHaveBeenCalled();

    rerender(
      <JobDetailHeader
        job={{
          jobId: 'j1',
          jobTitle: 'Engineer',
          isActive: false,
          location: 'Remote',
          employmentType: 'CUSTOM',
        }}
        onActivate={onActivate}
        deactivating
      />
    );
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText(/custom/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activating/i })).toBeDisabled();

    rerender(
      <JobDetailHeader
        job={{
          jobId: 'j1',
          jobTitle: 'Engineer',
          isActive: true,
          location: 'Remote',
          employmentType: 'FULL_TIME',
        }}
        onDeactivate={onDeactivate}
        deactivating
      />
    );
    expect(screen.getByRole('button', { name: /closing/i })).toBeDisabled();
  });

  it('table loading / empty / populated', () => {
    const { rerender } = renderWithProviders(<JobTable items={[]} loading />);
    expect(screen.getByText(/loading jobs/i)).toBeInTheDocument();

    rerender(<JobTable items={[]} loading={false} />);
    expect(screen.getByText(/no jobs yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create your first job/i })).toBeInTheDocument();

    rerender(
      <JobTable
        items={[
          {
            jobId: 'j1',
            jobTitle: 'Dev',
            location: ['NY', 'Remote'],
            employmentType: 'FULL_TIME',
            isActive: true,
          },
          {
            jobId: 'j2',
            jobTitle: 'Ops',
            location: 'SF',
            employmentType: 'WEIRD',
            isActive: false,
          },
        ]}
        loading={false}
      />
    );
    expect(screen.getByText('Dev')).toBeInTheDocument();
    expect(screen.getByText('NY, Remote')).toBeInTheDocument();
    expect(screen.getByText('Full-time')).toBeInTheDocument();
    expect(screen.getAllByText('0 candidates').length).toBeGreaterThan(0);
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('WEIRD')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});

describe('JobForm TagInput and saving', () => {
  it('updates tags via TagInput and shows saving state', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <JobForm saving={false} onSubmit={onSubmit} onCancel={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/job title/i), 'Eng');
    const locationInput = screen.getByPlaceholderText(/add a location/i);
    await user.type(locationInput, 'Remote{Enter}');
    expect(screen.getByText(/remote ✕/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await user.type(screen.getByLabelText(/description/i), 'Build systems here');
    const skillInputs = screen.getAllByPlaceholderText(/type a skill and press enter/i);
    await user.type(skillInputs[0], 'React{Enter}');
    await user.type(skillInputs[1], 'TypeScript{Enter}');
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await user.click(screen.getByRole('button', { name: /publish/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        location: ['Remote'],
        mandatorySkills: ['React'],
        preferredSkills: ['TypeScript'],
      })
    );

    rerender(<JobForm saving onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: /publishing/i })).toBeDisabled();
  });

  it('fills sparse initial job via toForm defaults', () => {
    render(
      <JobForm
        initial={{}}
        saving={false}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/job title/i)).toHaveValue('');
    expect(screen.getByLabelText(/min experience/i)).toHaveValue(0);
    expect(screen.getByLabelText(/max experience/i)).toHaveValue(5);
  });
});

describe('CandidateTable unknown outreach', () => {
  it('maps unknown pipeline status to Selected badge', () => {
    render(
      <CandidateTable
        items={[
          {
            candidateJobId: 'c1',
            status: CandidateStatus.UPLOADED,
            overallMatch: null,
            candidate: { name: 'Ada', email: 'a@b.com' },
            outreachRecords: [{ pipelineStatus: 'CUSTOM_STATUS' }],
            manuallySelected: false,
          },
        ]}
        loading={false}
        selectedIds={new Set()}
        deletingId={null}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('handles missing candidate fields and action callbacks', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    render(
      <CandidateTable
        items={[
          {
            candidateJobId: 'c9',
            status: CandidateStatus.SHORTLISTED,
            overallMatch: 50,
            candidate: null,
            outreachRecords: null,
            manuallySelected: false,
          },
        ]}
        loading={false}
        selectedIds={new Set()}
        deletingId={null}
        threshold={80}
        onToggle={onToggle}
        onDelete={onDelete}
        onViewInterview={vi.fn()}
      />
    );

    expect(screen.getByText(/below 80%/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Select Unknown')).toBeDisabled();
    await user.click(screen.getByLabelText(/remove Unknown/i));
    expect(onDelete).toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe('FileUploadZone uploading and dragOver', () => {
  it('shows uploading label and dragOver class', async () => {
    const { container, rerender } = render(
      <FileUploadZone type="resume" onUpload={vi.fn()} uploading />
    );
    expect(screen.getByRole('button', { name: /uploading/i })).toBeDisabled();

    rerender(<FileUploadZone type="resume" onUpload={vi.fn()} />);
    const zone = container.firstChild;
    await act(async () => {
      zone.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
    });
    expect(zone.className).toMatch(/border-brand-500/);
  });

  it('ignores empty file lists when onUpload missing', async () => {
    const { container } = render(<FileUploadZone type="resume" />);
    const zone = container.firstChild;
    await act(async () => {
      const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [] },
      });
      zone.dispatchEvent(dropEvent);
    });
    expect(zone.className).not.toMatch(/border-brand-500/);
  });
});
