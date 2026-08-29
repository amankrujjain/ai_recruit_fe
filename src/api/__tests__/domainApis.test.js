import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/api/client', () => ({
  default: apiClient,
}));

describe('api domain modules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('authApi covers all endpoints and invite aliases', async () => {
    const auth = await import('@/api/authApi');
    const { storageKeys } = await import('@/lib/constants');

    auth.loginRequest('a@b.com', 'x');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.com',
      password: 'x',
    });

    auth.getProfileRequest();
    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');

    auth.refreshTokenRequest('rt');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'rt' });

    localStorage.setItem(storageKeys.refreshToken, 'stored-rt');
    auth.logoutRequest();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', {
      refreshToken: 'stored-rt',
    });

    auth.validateSignupRequest('tok');
    expect(apiClient.get).toHaveBeenCalledWith('/auth/signup/tok');

    auth.completeSignupRequest('tok', 'pw');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/signup/tok', { password: 'pw' });

    auth.validateInviteRequest('inv');
    expect(apiClient.get).toHaveBeenCalledWith('/auth/signup/inv');

    auth.acceptInviteRequest('inv', 'pw');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/signup/inv', { password: 'pw' });

    auth.forgotPasswordRequest('a@b.com');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'a@b.com',
    });

    auth.requestPasswordResetEmailRequest();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/request-password-reset');

    auth.validateResetTokenRequest('rst');
    expect(apiClient.get).toHaveBeenCalledWith('/auth/reset-password/rst');

    auth.resetPasswordRequest('rst', 'pw');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'rst',
      password: 'pw',
    });
  });

  it('jobApi covers CRUD, candidates, resume upload, and status poll', async () => {
    const job = await import('@/api/jobApi');

    job.listJobsRequest({ page: 1 });
    expect(apiClient.get).toHaveBeenCalledWith('/jobs', { params: { page: 1 } });

    job.getJobRequest('j1');
    expect(apiClient.get).toHaveBeenCalledWith('/jobs/j1');

    job.createJobRequest({ jobTitle: 'A' });
    expect(apiClient.post).toHaveBeenCalledWith('/jobs', { jobTitle: 'A' });

    job.updateJobRequest('j1', { isActive: false });
    expect(apiClient.patch).toHaveBeenCalledWith('/jobs/j1', { isActive: false });

    job.listCandidatesRequest('j1', { page: 2 });
    expect(apiClient.get).toHaveBeenCalledWith('/jobs/j1/candidates', {
      params: { page: 2 },
    });

    job.selectCandidatesRequest('j1', { mode: 'MANUAL' });
    expect(apiClient.post).toHaveBeenCalledWith('/jobs/j1/candidates/select', {
      mode: 'MANUAL',
    });

    job.deleteCandidateRequest('j1', 'c1');
    expect(apiClient.delete).toHaveBeenCalledWith('/jobs/j1/candidates/c1');

    const file = new File(['x'], 'cv.pdf');
    job.uploadResumeRequest('j1', file);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/jobs/j1/candidates/upload/resume',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    const form = apiClient.post.mock.calls.at(-1)[1];
    expect(form.get('file')).toBe(file);

    job.getResumeStatusRequest('j1', ['a', 'b']);
    expect(apiClient.get).toHaveBeenCalledWith('/jobs/j1/resumes/status', {
      params: { ids: 'a,b' },
    });

    job.getResumeStatusRequest('j1');
    expect(apiClient.get).toHaveBeenCalledWith('/jobs/j1/resumes/status', {
      params: { ids: '' },
    });
  });

  it('candidateApi covers action and schedule endpoints', async () => {
    const candidate = await import('@/api/candidateApi');

    candidate.validateCandidateTokenRequest('t');
    expect(apiClient.get).toHaveBeenCalledWith('/candidate/action/t');

    candidate.submitCandidateActionRequest('t', 'INTERESTED');
    expect(apiClient.post).toHaveBeenCalledWith('/candidate/action/t', {
      action: 'INTERESTED',
    });

    candidate.getScheduleSlotsRequest('t');
    expect(apiClient.get).toHaveBeenCalledWith('/candidate/schedule/t/slots');

    candidate.bookScheduleSlotRequest('t', '2026-01-01T10:00:00Z');
    expect(apiClient.post).toHaveBeenCalledWith('/candidate/schedule/t', {
      scheduledAt: '2026-01-01T10:00:00Z',
    });
  });

  it('recruiterApi covers list/invite/lifecycle endpoints', async () => {
    const recruiter = await import('@/api/recruiterApi');

    recruiter.inviteRecruiterRequest({ email: 'r@x.com' });
    expect(apiClient.post).toHaveBeenCalledWith('/users/recruiters', {
      email: 'r@x.com',
    });

    recruiter.listRecruitersRequest({ page: 1 });
    expect(apiClient.get).toHaveBeenCalledWith('/users/recruiters', {
      params: { page: 1 },
    });

    recruiter.getRecruiterRequest('a1');
    expect(apiClient.get).toHaveBeenCalledWith('/users/recruiters/a1');

    recruiter.disableRecruiterRequest('a1');
    expect(apiClient.patch).toHaveBeenCalledWith('/users/recruiters/a1/disable');

    recruiter.enableRecruiterRequest('a1');
    expect(apiClient.patch).toHaveBeenCalledWith('/users/recruiters/a1/enable');

    recruiter.deleteRecruiterRequest('a1');
    expect(apiClient.delete).toHaveBeenCalledWith('/users/recruiters/a1');

    recruiter.resetRecruiterPasswordRequest('a1');
    expect(apiClient.post).toHaveBeenCalledWith('/users/recruiters/a1/reset-password');
  });

  it('organizationApi covers registrations and organizations', async () => {
    const org = await import('@/api/organizationApi');

    org.createRegistrationRequest({ adminEmail: 'a@b.com' });
    expect(apiClient.post).toHaveBeenCalledWith('/organizations/registrations', {
      adminEmail: 'a@b.com',
    });

    org.listRegistrationsRequest({ page: 1 });
    expect(apiClient.get).toHaveBeenCalledWith('/organizations/registrations', {
      params: { page: 1 },
    });

    org.resendRegistrationRequest('r1');
    expect(apiClient.post).toHaveBeenCalledWith(
      '/organizations/registrations/r1/resend-verification'
    );

    org.createOrganizationRequest({ name: 'Acme' });
    expect(apiClient.post).toHaveBeenCalledWith('/organizations', { name: 'Acme' });

    org.listOrganizationsRequest({ search: 'a' });
    expect(apiClient.get).toHaveBeenCalledWith('/organizations', {
      params: { search: 'a' },
    });

    org.getOrganizationRequest('o1');
    expect(apiClient.get).toHaveBeenCalledWith('/organizations/o1');

    org.updateOrganizationRequest('o1', { city: 'X' });
    expect(apiClient.patch).toHaveBeenCalledWith('/organizations/o1', { city: 'X' });

    org.deleteOrganizationRequest('o1');
    expect(apiClient.delete).toHaveBeenCalledWith('/organizations/o1');

    org.sendAdminPasswordResetRequest('o1');
    expect(apiClient.post).toHaveBeenCalledWith('/organizations/o1/admin/reset-password');
  });

  it('adminOrgApi covers settings, logo, templates, billing, audit', async () => {
    const admin = await import('@/api/adminOrgApi');

    admin.getMyOrganizationRequest();
    expect(apiClient.get).toHaveBeenCalledWith('/organizations/me');

    admin.updateOrgSettingsRequest({ timezone: 'UTC' });
    expect(apiClient.patch).toHaveBeenCalledWith('/organizations/me/settings', {
      timezone: 'UTC',
    });

    const file = new File(['logo'], 'logo.png');
    admin.uploadOrgLogoRequest(file);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/organizations/me/logo',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    admin.updateEmailTemplateRequest('e1', { subject: 'Hi' });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/organizations/me/email-templates/e1',
      { subject: 'Hi' }
    );

    admin.updateWhatsAppTemplateRequest('w1', { body: 'Hi' });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/organizations/me/whatsapp-templates/w1',
      { body: 'Hi' }
    );

    admin.getBillingRequest();
    expect(apiClient.get).toHaveBeenCalledWith('/organizations/me/billing');

    admin.getAuditLogsRequest({ page: 1 });
    expect(apiClient.get).toHaveBeenCalledWith('/organizations/me/audit-logs', {
      params: { page: 1 },
    });

    admin.getAuditStatsRequest({ days: 7 });
    expect(apiClient.get).toHaveBeenCalledWith('/organizations/me/audit-logs/stats', {
      params: { days: 7 },
    });
  });

  it('recruitmentApi and countryApi cover their endpoints', async () => {
    const recruitment = await import('@/api/recruitmentApi');
    const country = await import('@/api/countryApi');

    recruitment.getDashboardStatsRequest({ range: '7d' });
    expect(apiClient.get).toHaveBeenCalledWith('/recruitment/dashboard/stats', {
      params: { range: '7d' },
    });

    recruitment.getDashboardOverviewRequest();
    expect(apiClient.get).toHaveBeenCalledWith('/recruitment/dashboard/overview');

    recruitment.getScorecardRequest('cj1');
    expect(apiClient.get).toHaveBeenCalledWith('/recruitment/cj1/scorecard');

    recruitment.getCallRecordsRequest('cj1');
    expect(apiClient.get).toHaveBeenCalledWith('/recruitment/cj1/calls');

    recruitment.updateCandidateStatusRequest('cj1', 'REJECTED_MANUALLY');
    expect(apiClient.patch).toHaveBeenCalledWith('/recruitment/cj1/status', {
      status: 'REJECTED_MANUALLY',
    });

    recruitment.retryOutreachRequest('or1');
    expect(apiClient.post).toHaveBeenCalledWith('/recruitment/outreach/or1/retry');

    country.listCountriesRequest('ind');
    expect(apiClient.get).toHaveBeenCalledWith('/countries', {
      params: { search: 'ind' },
    });
  });

  it('supportApi covers admin and org support endpoints', async () => {
    const support = await import('@/api/supportApi');

    support.listAdminCategoriesRequest();
    expect(apiClient.get).toHaveBeenCalledWith('/support/admin/categories');

    support.createCategoryRequest({ name: 'Billing' });
    expect(apiClient.post).toHaveBeenCalledWith('/support/admin/categories', {
      name: 'Billing',
    });

    support.updateCategoryRequest('c1', { name: 'X' });
    expect(apiClient.patch).toHaveBeenCalledWith('/support/admin/categories/c1', {
      name: 'X',
    });

    support.deleteCategoryRequest('c1');
    expect(apiClient.delete).toHaveBeenCalledWith('/support/admin/categories/c1');

    support.listAdminFaqsRequest({ page: 1 });
    expect(apiClient.get).toHaveBeenCalledWith('/support/admin/faqs', {
      params: { page: 1 },
    });

    support.createFaqRequest({ question: 'Q' });
    expect(apiClient.post).toHaveBeenCalledWith('/support/admin/faqs', {
      question: 'Q',
    });

    support.updateFaqRequest('f1', { answer: 'A' });
    expect(apiClient.patch).toHaveBeenCalledWith('/support/admin/faqs/f1', {
      answer: 'A',
    });

    support.deleteFaqRequest('f1');
    expect(apiClient.delete).toHaveBeenCalledWith('/support/admin/faqs/f1');

    support.listAdminTicketsRequest({ page: 1 });
    expect(apiClient.get).toHaveBeenCalledWith('/support/admin/tickets', {
      params: { page: 1 },
    });

    support.getAdminTicketRequest('t1');
    expect(apiClient.get).toHaveBeenCalledWith('/support/admin/tickets/t1');

    support.updateTicketStatusRequest('t1', { status: 'CLOSED' });
    expect(apiClient.patch).toHaveBeenCalledWith('/support/admin/tickets/t1', {
      status: 'CLOSED',
    });

    support.listSupportCategoriesRequest();
    expect(apiClient.get).toHaveBeenCalledWith('/support/categories');

    support.listSupportFaqsRequest({ categoryId: 'c1' });
    expect(apiClient.get).toHaveBeenCalledWith('/support/faqs', {
      params: { categoryId: 'c1' },
    });

    support.createTicketRequest({ subject: 'Help' });
    expect(apiClient.post).toHaveBeenCalledWith('/support/tickets', {
      subject: 'Help',
    });

    support.listMyTicketsRequest({ page: 1 });
    expect(apiClient.get).toHaveBeenCalledWith('/support/tickets', {
      params: { page: 1 },
    });

    support.getMyTicketRequest('t1');
    expect(apiClient.get).toHaveBeenCalledWith('/support/tickets/t1');
  });
});
