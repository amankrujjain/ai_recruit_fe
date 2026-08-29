import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { PageTitleProvider } from '@/context/PageTitleContext';
import { RecruiterDashboardPage } from '@/pages/recruiter/RecruiterDashboardPage';
import { RecruiterJobsPage } from '@/pages/recruiter/RecruiterJobsPage';
import { RecruiterTemplatesPage } from '@/pages/recruiter/RecruiterTemplatesPage';
import { JobFormPage } from '@/pages/recruiter/JobFormPage';
import { JobDetailPage } from '@/pages/recruiter/JobDetailPage';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock('@/api/jobApi', () => ({
  listJobsRequest: vi.fn(),
  getJobRequest: vi.fn(),
  createJobRequest: vi.fn(),
  updateJobRequest: vi.fn(),
  listCandidatesRequest: vi.fn(),
  getCandidateRequest: vi.fn(),
  uploadResumeRequest: vi.fn(),
  selectCandidatesRequest: vi.fn(),
  deleteCandidateRequest: vi.fn(),
  getResumeStatusRequest: vi.fn(),
}));

vi.mock('@/api/recruitmentApi', () => ({
  getDashboardStatsRequest: vi.fn(),
  getDashboardOverviewRequest: vi.fn(),
  retryOutreachRequest: vi.fn(),
  updateCandidateStatusRequest: vi.fn(),
}));

vi.mock('@/api/adminOrgApi', () => ({
  getMyOrganizationRequest: vi.fn(),
}));

const captured = {
  jobForm: null,
  jobDetailHeader: null,
  fileUploadZone: null,
  candidateTable: null,
  selectCandidatesBar: null,
  resumeProcessingBanner: null,
  interviewDrawer: null,
  confirmDialog: null,
  recruiterOverview: null,
};

vi.mock('@/components/recruiter/dashboard/RecruiterOverview', () => ({
  RecruiterOverview: (props) => {
    captured.recruiterOverview = props;
    return <div data-testid="recruiter-overview">Overview</div>;
  },
}));

vi.mock('@/components/recruiter/jobs/JobForm', () => ({
  JobForm: (props) => {
    captured.jobForm = props;
    return (
      <div data-testid="job-form">
        <span data-testid="job-form-initial">{props.initial ? 'edit' : 'create'}</span>
        <button type="button" onClick={() => props.onSubmit({ jobTitle: 'Engineer' })}>
          Submit job
        </button>
        <button type="button" onClick={props.onCancel}>
          Cancel job
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/recruiter/jobs/JobDetailHeader', () => ({
  JobDetailHeader: (props) => {
    captured.jobDetailHeader = props;
    return (
      <div data-testid="job-detail-header">
        <span>{props.job?.jobTitle}</span>
        <button type="button" onClick={props.onDeactivate}>
          Deactivate job
        </button>
        <button type="button" onClick={props.onActivate}>
          Activate job
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/recruiter/candidates/FileUploadZone', () => ({
  FileUploadZone: (props) => {
    captured.fileUploadZone = props;
    return (
      <div data-testid="file-upload-zone">
        <button
          type="button"
          onClick={() => props.onUpload(new File(['resume'], 'resume.pdf', { type: 'application/pdf' }))}
        >
          Upload resume
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/recruiter/candidates/CandidateTable', () => ({
  CandidateTable: (props) => {
    captured.candidateTable = props;
    return (
      <div data-testid="candidate-table">
        <button type="button" onClick={() => props.onToggle('cand-1')}>
          Toggle one
        </button>
        <button type="button" onClick={() => props.onToggleAll(true)}>
          Toggle all
        </button>
        <button
          type="button"
          onClick={() =>
            props.onDelete({
              candidateJobId: 'cand-1',
              candidate: { name: 'Ada Lovelace' },
            })
          }
        >
          Delete candidate
        </button>
        <button
          type="button"
          onClick={() =>
            props.onViewInterview({
              candidateJobId: 'cand-1',
              candidate: { name: 'Ada Lovelace' },
            })
          }
        >
          View interview
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/recruiter/candidates/CandidatesToolbar', () => ({
  CandidatesToolbar: (props) => {
    captured.candidatesToolbar = props;
    return (
      <div data-testid="candidates-toolbar">
        <button type="button" onClick={() => props.onToggleSelectAllEligible?.(true)}>
          Select all eligible
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/recruiter/candidates/CandidatesSelectionBar', () => ({
  CandidatesSelectionBar: (props) => {
    captured.candidatesSelectionBar = props;
    if (!props.selectedCount) return null;
    return (
      <div data-testid="candidates-selection-bar">
        <span>Selected: {props.selectedCount}</span>
        <button type="button" onClick={props.onClear}>
          Cancel
        </button>
        <button type="button" onClick={props.onInvite}>
          Invite to AI interview
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/recruiter/candidates/CandidatesEligibilityBar', () => ({
  CandidatesEligibilityBar: (props) => (
    <div data-testid="eligibility-bar">
      {props.eligibleCount} of {props.totalCount} eligible · {props.threshold}%
    </div>
  ),
}));

vi.mock('@/components/recruiter/candidates/ResumeProcessingBanner', () => ({
  ResumeProcessingBanner: (props) => {
    captured.resumeProcessingBanner = props;
    return (
      <div data-testid="resume-processing-banner">
        {props.progress?.active ? 'Parsing active' : 'Parsing idle'}
      </div>
    );
  },
}));

vi.mock('@/components/recruiter/candidates/InterviewScorecardDrawer', () => ({
  InterviewScorecardDrawer: (props) => {
    captured.interviewDrawer = props;
    if (!props.open) return null;
    return (
      <div data-testid="interview-drawer">
        <span>{props.candidateName}</span>
        <button type="button" onClick={() => props.onOpenChange(false)}>
          Close drawer
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/ui/ConfirmDialog', () => ({
  ConfirmDialog: (props) => {
    captured.confirmDialog = props;
    if (!props.open) return null;
    return (
      <div data-testid="confirm-dialog" role="alertdialog">
        <h2>{props.title}</h2>
        <button type="button" onClick={() => props.onConfirm?.()}>
          {props.confirmLabel || 'Confirm'}
        </button>
        <button type="button" onClick={() => props.onOpenChange?.(false)}>
          Cancel dialog
        </button>
      </div>
    );
  },
}));

import { toast } from 'sonner';
import {
  listJobsRequest,
  getJobRequest,
  createJobRequest,
  updateJobRequest,
  listCandidatesRequest,
  uploadResumeRequest,
  selectCandidatesRequest,
  deleteCandidateRequest,
  getResumeStatusRequest,
} from '@/api/jobApi';
import { getDashboardStatsRequest } from '@/api/recruitmentApi';
import { getMyOrganizationRequest } from '@/api/adminOrgApi';

const jobFixture = {
  jobId: 'job-1',
  jobTitle: 'Backend Engineer',
  jobDescription: 'Build APIs',
  experienceMin: 2,
  experienceMax: 5,
  mandatorySkills: ['Node', 'SQL'],
  isActive: true,
};

const candidateFixture = {
  candidateJobId: 'cand-1',
  overallMatch: 92,
  candidate: { name: 'Ada Lovelace' },
};

function renderRecruiterPage(ui, { route = '/', path = route, ...options } = {}) {
  return renderWithProviders(
    <PageTitleProvider>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </PageTitleProvider>,
    { route, ...options }
  );
}

function renderJobRoutes(extraRoutes = null) {
  return renderWithProviders(
    <PageTitleProvider>
      <Routes>
        <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
        <Route path="/recruiter/jobs/:jobId/edit" element={<JobFormPage />} />
        <Route path="/recruiter/jobs/:jobId" element={<JobDetailPage />} />
        <Route path="/recruiter/jobs" element={<div>Jobs list</div>} />
        {extraRoutes}
      </Routes>
    </PageTitleProvider>,
    { route: '/recruiter/jobs/job-1' }
  );
}

describe('RecruiterDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(captured).forEach((key) => {
      captured[key] = null;
    });
  });

  it('renders RecruiterOverview', () => {
    renderRecruiterPage(<RecruiterDashboardPage />);
    expect(screen.getByTestId('recruiter-overview')).toBeInTheDocument();
  });
});

describe('RecruiterJobsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listJobsRequest.mockResolvedValue({
      data: {
        data: [{ jobId: 'j1', jobTitle: 'Role', location: ['Remote'], employmentType: 'FULL_TIME', isActive: true }],
        pagination: { page: 1, totalPages: 1, total: 1 },
        summary: { active: 3, inactive: 1, total: 4 },
      },
    });
  });

  it('shows skeleton then jobs list with search and status filters', async () => {
    const user = userEvent.setup();
    renderRecruiterPage(<RecruiterJobsPage />, { route: '/recruiter/jobs' });

    await waitFor(() => expect(screen.getByText('Job postings')).toBeInTheDocument());
    expect(screen.getByText('3 active · 4 total')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search jobs…'), 'eng');
    await waitFor(() => expect(listJobsRequest).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Active' }));
    await waitFor(() =>
      expect(listJobsRequest).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      )
    );

    await user.click(screen.getByRole('button', { name: 'Inactive' }));
    await waitFor(() =>
      expect(listJobsRequest).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      )
    );
  });
});

describe('RecruiterTemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyOrganizationRequest.mockResolvedValue({
      data: {
        data: {
          emailTemplates: [{ templateId: 'e1', name: 'Welcome' }],
          whatsappTemplates: [{ templateId: 'w1', name: 'Ping' }],
        },
      },
    });
  });

  it('loads templates and switches tabs including empty states', async () => {
    const user = userEvent.setup();
    renderRecruiterPage(<RecruiterTemplatesPage />);

    await waitFor(() => expect(screen.getByText('Welcome')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'WhatsApp' }));
    expect(screen.getByText('Ping')).toBeInTheDocument();

    getMyOrganizationRequest.mockResolvedValueOnce({
      data: { data: { emailTemplates: [], whatsappTemplates: [] } },
    });
    renderRecruiterPage(<RecruiterTemplatesPage />);
    await waitFor(() =>
      expect(screen.getByText(/no email templates found/i)).toBeInTheDocument()
    );
  });

  it('shows skeleton while organization is loading', () => {
    getMyOrganizationRequest.mockReturnValue(new Promise(() => {}));
    renderRecruiterPage(<RecruiterTemplatesPage />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });
  it('shows empty WhatsApp templates message', async () => {
    const user = userEvent.setup();
    getMyOrganizationRequest.mockResolvedValueOnce({
      data: {
        data: {
          emailTemplates: [{ templateId: 'e1', name: 'Welcome' }],
          whatsappTemplates: [],
        },
      },
    });
    renderRecruiterPage(<RecruiterTemplatesPage />);
    await waitFor(() => expect(screen.getByText('Welcome')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'WhatsApp' }));
    expect(screen.getByText(/no whatsapp templates found/i)).toBeInTheDocument();
  });
});

describe('JobFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(captured).forEach((key) => {
      captured[key] = null;
    });
  });

  it('create route submits successfully and navigates to job detail', async () => {
    const user = userEvent.setup();
    createJobRequest.mockResolvedValueOnce({ data: { data: { jobId: 'new-job' } } });

    renderWithProviders(
      <PageTitleProvider>
        <Routes>
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
          <Route path="/recruiter/jobs/:jobId" element={<div>Created job new-job</div>} />
        </Routes>
      </PageTitleProvider>,
      { route: '/recruiter/jobs/new' }
    );

    await waitFor(() => expect(screen.getByTestId('job-form-initial')).toHaveTextContent('create'));
    await user.click(screen.getByRole('button', { name: 'Submit job' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Job created'));
    expect(await screen.findByText('Created job new-job')).toBeInTheDocument();
  });

  it('create route toasts on save failure', async () => {
    const user = userEvent.setup();
    createJobRequest.mockRejectedValueOnce({ response: { data: { message: 'Duplicate title' } } });

    renderWithProviders(
      <PageTitleProvider>
        <Routes>
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
        </Routes>
      </PageTitleProvider>,
      { route: '/recruiter/jobs/new' }
    );

    await user.click(await screen.findByRole('button', { name: 'Submit job' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Duplicate title'));
  });

  it('create route uses Save failed fallback when payload is empty', async () => {
    const user = userEvent.setup();
    createJobRequest.mockRejectedValueOnce({});

    renderWithProviders(
      <PageTitleProvider>
        <Routes>
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
        </Routes>
      </PageTitleProvider>,
      { route: '/recruiter/jobs/new' }
    );

    await user.click(await screen.findByRole('button', { name: 'Submit job' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to create job'));
  });

  it('create route cancel navigates back to jobs list', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PageTitleProvider>
        <Routes>
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
          <Route path="/recruiter/jobs" element={<div>Jobs list</div>} />
        </Routes>
      </PageTitleProvider>,
      { route: '/recruiter/jobs/new' }
    );

    await user.click(await screen.findByRole('button', { name: 'Cancel job' }));
    expect(await screen.findByText('Jobs list')).toBeInTheDocument();
  });

  it('edit route shows skeleton while loading then submits update', async () => {
    const user = userEvent.setup();
    let resolveJob;
    getJobRequest.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveJob = resolve;
      })
    );

    renderWithProviders(
      <PageTitleProvider>
        <Routes>
          <Route path="/recruiter/jobs/:jobId/edit" element={<JobFormPage />} />
          <Route path="/recruiter/jobs/:jobId" element={<div>Updated job job-1</div>} />
        </Routes>
      </PageTitleProvider>,
      { route: '/recruiter/jobs/job-1/edit' }
    );

    expect(document.querySelector('.animate-pulse')).toBeTruthy();

    await act(async () => {
      resolveJob({ data: { data: jobFixture } });
    });

    await waitFor(() => expect(screen.getByTestId('job-form-initial')).toHaveTextContent('edit'));
    updateJobRequest.mockResolvedValueOnce({ data: { data: { jobId: 'job-1' } } });
    await user.click(screen.getByRole('button', { name: 'Submit job' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Job updated'));
    expect(await screen.findByText('Updated job job-1')).toBeInTheDocument();
  });

  it('edit route cancel navigates to job detail', async () => {
    const user = userEvent.setup();
    getJobRequest.mockResolvedValueOnce({ data: { data: jobFixture } });

    renderWithProviders(
      <PageTitleProvider>
        <Routes>
          <Route path="/recruiter/jobs/:jobId/edit" element={<JobFormPage />} />
          <Route path="/recruiter/jobs/:jobId" element={<div>Job detail job-1</div>} />
        </Routes>
      </PageTitleProvider>,
      { route: '/recruiter/jobs/job-1/edit' }
    );

    await user.click(await screen.findByRole('button', { name: 'Cancel job' }));
    expect(await screen.findByText('Job detail job-1')).toBeInTheDocument();
  });

  it('edit route toasts on update failure', async () => {
    const user = userEvent.setup();
    getJobRequest.mockResolvedValueOnce({ data: { data: jobFixture } });
    updateJobRequest.mockRejectedValueOnce({ response: { data: { message: 'Forbidden' } } });

    renderWithProviders(
      <PageTitleProvider>
        <Routes>
          <Route path="/recruiter/jobs/:jobId/edit" element={<JobFormPage />} />
        </Routes>
      </PageTitleProvider>,
      { route: '/recruiter/jobs/job-1/edit' }
    );

    await user.click(await screen.findByRole('button', { name: 'Submit job' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Forbidden'));
  });
});

describe('JobDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Object.keys(captured).forEach((key) => {
      captured[key] = null;
    });
    getJobRequest.mockResolvedValue({ data: { data: jobFixture } });
    getDashboardStatsRequest.mockResolvedValue({
      data: {
        data: {
          totalCandidates: 24,
          candidatesUploaded: 20,
          eligibleMatch: 8,
          invitationsSent: 3,
          callsCompleted: 2,
          callsScheduled: 2,
          matchThreshold: 80,
        },
      },
    });
    listCandidatesRequest.mockResolvedValue({
      data: {
        data: [candidateFixture],
        pagination: { page: 1, totalPages: 1, total: 1 },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderDetail(route = '/recruiter/jobs/job-1') {
    return renderWithProviders(
      <PageTitleProvider>
        <Routes>
          <Route path="/recruiter/jobs/:jobId" element={<JobDetailPage />} />
          <Route
            path="/recruiter/jobs/:jobId/candidates/:candidateJobId"
            element={<div data-testid="candidate-profile-page">Candidate profile</div>}
          />
          <Route path="/recruiter/jobs" element={<div>Jobs list</div>} />
        </Routes>
      </PageTitleProvider>,
      { route }
    );
  }

  it('shows loading skeleton then overview tab content', async () => {
    let resolveJob;
    getJobRequest.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveJob = resolve;
      })
    );

    renderDetail();
    expect(document.querySelector('.animate-pulse')).toBeTruthy();

    await act(async () => {
      resolveJob({ data: { data: jobFixture } });
    });

    expect(await screen.findByText('Build APIs')).toBeInTheDocument();
    expect(screen.getByText('Job description')).toBeInTheDocument();
    expect(screen.getByText('Pipeline summary')).toBeInTheDocument();
  });

  it('shows not found when job is missing', async () => {
    getJobRequest.mockRejectedValueOnce({ response: { data: { message: 'Not found' } } });
    renderDetail();
    expect(await screen.findByText(/job not found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to jobs/i })).toHaveAttribute(
      'href',
      '/recruiter/jobs'
    );
  });

  it('switches from overview to candidates tab', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderDetail();

    await screen.findByText('Build APIs');
    await user.click(screen.getByRole('button', { name: 'Candidates' }));

    await waitFor(() => expect(screen.getByTestId('candidate-table')).toBeInTheDocument());
    expect(listCandidatesRequest).toHaveBeenCalled();
  });

  it('deactivate confirm success and failure', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderDetail('/recruiter/jobs/job-1?tab=overview');

    await screen.findByTestId('job-detail-header');
    await user.click(screen.getByRole('button', { name: 'Deactivate job' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    updateJobRequest.mockResolvedValueOnce({ data: { data: { ...jobFixture, isActive: false } } });
    await user.click(screen.getByRole('button', { name: 'Close job' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Job deactivated'));

    await user.click(screen.getByRole('button', { name: 'Activate job' }));
    updateJobRequest.mockRejectedValueOnce({ response: { data: { message: 'Activate failed' } } });
    await user.click(screen.getByRole('button', { name: 'Activate' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Activate failed'));
  });

  it('activate confirm success', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    getJobRequest.mockResolvedValueOnce({
      data: { data: { ...jobFixture, isActive: false } },
    });
    renderDetail('/recruiter/jobs/job-1?tab=overview');

    await screen.findByTestId('job-detail-header');
    await user.click(screen.getByRole('button', { name: 'Activate job' }));
    updateJobRequest.mockResolvedValueOnce({ data: { data: { ...jobFixture, isActive: true } } });
    await user.click(screen.getByRole('button', { name: 'Activate' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Job activated'));
  });

  it('deactivate confirm failure', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderDetail('/recruiter/jobs/job-1?tab=overview');

    await screen.findByTestId('job-detail-header');
    await user.click(screen.getByRole('button', { name: 'Deactivate job' }));
    updateJobRequest.mockRejectedValueOnce({ response: { data: { message: 'Cannot deactivate' } } });
    await user.click(screen.getByRole('button', { name: 'Close job' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Cannot deactivate'));
  });

  it('delete candidate success clears selection and failure toasts', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderDetail('/recruiter/jobs/job-1?tab=candidates');

    await screen.findByTestId('candidate-table');
    await user.click(screen.getByRole('button', { name: 'Toggle one' }));
    expect(screen.getByText('Selected: 1')).toBeInTheDocument();

    deleteCandidateRequest.mockResolvedValueOnce({
      data: { data: { candidateJobId: 'cand-1' } },
    });
    await user.click(screen.getByRole('button', { name: 'Delete candidate' }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Candidate removed'));
    await waitFor(() => expect(screen.queryByTestId('candidates-selection-bar')).toBeNull());

    listCandidatesRequest.mockResolvedValueOnce({
      data: { data: [candidateFixture], pagination: { page: 1, totalPages: 1 } },
    });
    await user.click(screen.getByRole('button', { name: 'Delete candidate' }));
    deleteCandidateRequest.mockRejectedValueOnce({ response: { data: { message: 'Delete failed' } } });
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Delete failed'));
  });

  it('toggle all and select for outreach success and failure', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderDetail('/recruiter/jobs/job-1?tab=candidates');

    await screen.findByTestId('candidate-table');
    await user.click(screen.getByRole('button', { name: 'Toggle one' }));
    expect(screen.getByText('Selected: 1')).toBeInTheDocument();

    selectCandidatesRequest.mockResolvedValueOnce({ data: { data: { selected: 1 } } });
    await user.click(screen.getByRole('button', { name: 'Invite to AI interview' }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('1 candidate(s) invited — outreach email queued')
    );

    await user.click(screen.getByRole('button', { name: 'Toggle one' }));
    selectCandidatesRequest.mockRejectedValueOnce({ response: { data: { message: 'Select failed' } } });
    await user.click(screen.getByRole('button', { name: 'Invite to AI interview' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Select failed'));
  });

  it('navigates to candidate profile from View', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderDetail('/recruiter/jobs/job-1?tab=candidates');

    await screen.findByTestId('candidate-table');
    await user.click(screen.getByRole('button', { name: 'View interview' }));
    expect(await screen.findByTestId('candidate-profile-page')).toBeInTheDocument();
  });

  it('upload resume failure', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    uploadResumeRequest.mockRejectedValueOnce({ response: { data: { message: 'Upload failed' } } });
    renderDetail('/recruiter/jobs/job-1?tab=candidates');

    await user.click(await screen.findByRole('button', { name: 'Upload resume' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Upload failed'));
  });

  it('upload resume reused links candidate without polling', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    uploadResumeRequest.mockResolvedValueOnce({ data: { data: { reused: true } } });
    renderDetail('/recruiter/jobs/job-1?tab=candidates');

    await user.click(await screen.findByRole('button', { name: 'Upload resume' }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('1 resume(s) already on file — linked to this job')
    );
    expect(getResumeStatusRequest).not.toHaveBeenCalled();
  });

  it('upload resume without resumeFileId refreshes candidates', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    uploadResumeRequest.mockResolvedValueOnce({ data: { data: {} } });
    renderDetail('/recruiter/jobs/job-1?tab=candidates');

    const callsBefore = listCandidatesRequest.mock.calls.length;
    await user.click(await screen.findByRole('button', { name: 'Upload resume' }));
    await waitFor(() => expect(listCandidatesRequest.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it('upload resume starts polling and completes successfully', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    uploadResumeRequest.mockResolvedValueOnce({
      data: { data: { resumeFileId: 'rf-1' } },
    });
    getResumeStatusRequest.mockResolvedValue({
      data: { data: { done: true, completed: 1, failed: 0, total: 1, percent: 100 } },
    });

    renderDetail('/recruiter/jobs/job-1?tab=candidates');
    await user.click(await screen.findByRole('button', { name: 'Upload resume' }));

    await waitFor(() =>
      expect(toast.message).toHaveBeenCalledWith('Upload complete — parsing started')
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Parsing complete — candidate list updated')
    );

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    await waitFor(() => expect(captured.resumeProcessingBanner?.progress).toBeNull());
  });

  it('watchResumeParse handles partial failure', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    uploadResumeRequest.mockResolvedValueOnce({
      data: { data: { resumeFileId: 'rf-2' } },
    });
    getResumeStatusRequest.mockResolvedValueOnce({
      data: { data: { done: true, completed: 1, failed: 1, total: 2, percent: 100 } },
    });

    renderDetail('/recruiter/jobs/job-1?tab=candidates');
    await user.click(await screen.findByRole('button', { name: 'Upload resume' }));

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith('Parsed 1, 1 failed')
    );
  });

  it('watchResumeParse handles all failed', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    uploadResumeRequest.mockResolvedValueOnce({
      data: { data: { resumeFileId: 'rf-3' } },
    });
    getResumeStatusRequest.mockResolvedValueOnce({
      data: { data: { done: true, completed: 0, failed: 1, total: 1, percent: 100 } },
    });

    renderDetail('/recruiter/jobs/job-1?tab=candidates');
    await user.click(await screen.findByRole('button', { name: 'Upload resume' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Resume parsing failed'));
  });

  it('watchResumeParse recovers from transient poll errors then succeeds', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    uploadResumeRequest.mockResolvedValueOnce({
      data: { data: { resumeFileId: 'rf-4' } },
    });
    getResumeStatusRequest
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        data: { data: { done: true, completed: 1, failed: 0, total: 1, percent: 100 } },
      });

    renderDetail('/recruiter/jobs/job-1?tab=candidates');
    await user.click(await screen.findByRole('button', { name: 'Upload resume' }));

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Parsing complete — candidate list updated')
    );
  });

  it('watchResumeParse times out after STATUS_POLL_MAX_MS', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    uploadResumeRequest.mockResolvedValueOnce({
      data: { data: { resumeFileId: 'rf-5' } },
    });
    getResumeStatusRequest.mockImplementation(() =>
      Promise.resolve({
        data: { data: { done: false, completed: 0, failed: 0, total: 1, percent: 20 } },
      })
    );

    renderDetail('/recruiter/jobs/job-1?tab=candidates');
    await user.click(await screen.findByRole('button', { name: 'Upload resume' }));

    await waitFor(() => expect(getResumeStatusRequest).toHaveBeenCalled());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120001);
    });

    await waitFor(() =>
      expect(toast.message).toHaveBeenCalledWith(
        'Parsing is taking longer than expected — list refreshed anyway'
      )
    );
  });

  it('refresh list button loads candidates', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderDetail('/recruiter/jobs/job-1?tab=candidates');

    const callsBefore = listCandidatesRequest.mock.calls.length;
    await user.click(await screen.findByRole('button', { name: 'Refresh list' }));
    await waitFor(() => expect(listCandidatesRequest.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it('switches tabs via tab buttons', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderDetail('/recruiter/jobs/job-1?tab=candidates');

    await screen.findByTestId('candidate-table');
    await user.click(screen.getByRole('button', { name: 'Overview' }));
    expect(await screen.findByText('Build APIs')).toBeInTheDocument();
  });

  it('closes confirm dialog via onOpenChange', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderDetail('/recruiter/jobs/job-1?tab=overview');

    await screen.findByTestId('job-detail-header');
    await user.click(screen.getByRole('button', { name: 'Deactivate job' }));
    await user.click(screen.getByRole('button', { name: 'Cancel dialog' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
