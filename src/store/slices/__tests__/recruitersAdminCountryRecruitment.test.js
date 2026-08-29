import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

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
  listCountriesRequest: vi.fn(),
}));

vi.mock('@/api/recruitmentApi', () => ({
  getDashboardStatsRequest: vi.fn(),
  getDashboardOverviewRequest: vi.fn(),
  retryOutreachRequest: vi.fn(),
  updateCandidateStatusRequest: vi.fn(),
}));

import {
  listRecruitersRequest,
  inviteRecruiterRequest,
  disableRecruiterRequest,
  enableRecruiterRequest,
  deleteRecruiterRequest,
  resetRecruiterPasswordRequest,
} from '@/api/recruiterApi';
import {
  getMyOrganizationRequest,
  updateOrgSettingsRequest,
  uploadOrgLogoRequest,
  updateEmailTemplateRequest,
  updateWhatsAppTemplateRequest,
  getBillingRequest,
  getAuditLogsRequest,
  getAuditStatsRequest,
} from '@/api/adminOrgApi';
import { listCountriesRequest } from '@/api/countryApi';
import { getDashboardStatsRequest, getDashboardOverviewRequest } from '@/api/recruitmentApi';


import recruitersReducer, {
  fetchRecruiters,
  inviteRecruiter,
  disableRecruiter,
  enableRecruiter,
  deleteRecruiter,
  resetRecruiterPassword,
  clearLastInvited,
} from '@/store/slices/recruitersSlice';
import adminOrgReducer, {
  fetchMyOrganization,
  updateOrgSettings,
  uploadOrgLogo,
  updateEmailTemplate,
  updateWhatsAppTemplate,
  fetchBilling,
  fetchAuditLogs,
  fetchAuditStats,
} from '@/store/slices/adminOrgSlice';
import countryReducer, { fetchCountries } from '@/store/slices/countrySlice';
import recruitmentReducer, {
  fetchDashboardStats,
  fetchDashboardOverview,
} from '@/store/slices/recruitmentSlice';

describe('recruitersSlice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list/invite/disable/enable/delete/resetPassword', async () => {
    const store = configureStore({
      reducer: { recruiters: recruitersReducer },
      preloadedState: {
        recruiters: {
          items: [
            { accountId: 'a1', status: 'ACTIVE' },
            { accountId: 'a2', status: 'ACTIVE' },
          ],
          pagination: null,
          loading: false,
          inviting: false,
          actionId: null,
          lastInvited: null,
          error: null,
        },
      },
    });

    listRecruitersRequest.mockResolvedValueOnce({
      data: { data: [{ accountId: 'a1' }], pagination: { page: 1 } },
    });
    await store.dispatch(fetchRecruiters());
    expect(store.getState().recruiters.items).toHaveLength(1);

    inviteRecruiterRequest.mockResolvedValueOnce({
      data: { data: { accountId: 'a3', email: 'n@x.com' } },
    });
    await store.dispatch(inviteRecruiter({ email: 'n@x.com' }));
    expect(store.getState().recruiters.lastInvited.email).toBe('n@x.com');
    store.dispatch(clearLastInvited());

    disableRecruiterRequest.mockResolvedValueOnce({
      data: { data: { accountId: 'a1', status: 'DISABLED' } },
    });
    store.dispatch({
      type: 'recruiters/list/fulfilled',
      payload: {
        items: [
          { accountId: 'a1', status: 'ACTIVE' },
          { accountId: 'a2', status: 'ACTIVE' },
        ],
        pagination: null,
      },
    });
    await store.dispatch(disableRecruiter('a1'));
    expect(store.getState().recruiters.items.find((r) => r.accountId === 'a1').status).toBe(
      'DISABLED'
    );

    enableRecruiterRequest.mockResolvedValueOnce({
      data: { data: { accountId: 'a1', status: 'ACTIVE' } },
    });
    await store.dispatch(enableRecruiter('a1'));
    expect(store.getState().recruiters.items.find((r) => r.accountId === 'a1').status).toBe(
      'ACTIVE'
    );

    deleteRecruiterRequest.mockResolvedValueOnce({});
    await store.dispatch(deleteRecruiter('a2'));
    expect(store.getState().recruiters.items.find((r) => r.accountId === 'a2')).toBeUndefined();

    resetRecruiterPasswordRequest.mockResolvedValueOnce({ data: { message: 'sent' } });
    await store.dispatch(resetRecruiterPassword('a1'));
    expect(store.getState().recruiters.actionId).toBeNull();

    resetRecruiterPasswordRequest.mockRejectedValueOnce({});
    await store.dispatch(resetRecruiterPassword('a1'));
    expect(store.getState().recruiters.actionId).toBeNull();

    inviteRecruiterRequest.mockRejectedValueOnce({});
    await store.dispatch(inviteRecruiter({}));
    expect(store.getState().recruiters.error).toBe('Failed to invite recruiter');
  });
});

describe('adminOrgSlice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('org settings, templates, billing, audit', async () => {
    const store = configureStore({
      reducer: { adminOrg: adminOrgReducer },
      preloadedState: {
        adminOrg: {
          organization: {
            organizationId: 'o1',
            emailTemplates: [{ templateId: 'e1', subject: 'old' }],
            whatsappTemplates: [{ templateId: 'w1', body: 'old' }],
          },
          billing: null,
          auditLogs: [],
          auditPagination: null,
          auditStats: null,
          loading: false,
          saving: false,
          logoUploading: false,
          billingLoading: false,
          auditLoading: false,
          auditStatsLoading: false,
          error: null,
        },
      },
    });

    getMyOrganizationRequest.mockResolvedValueOnce({
      data: { data: { organizationId: 'o1', name: 'Acme' } },
    });
    await store.dispatch(fetchMyOrganization());
    expect(store.getState().adminOrg.organization.name).toBe('Acme');

    // restore templates for map tests
    store.dispatch({
      type: fetchMyOrganization.fulfilled.type,
      payload: {
        organizationId: 'o1',
        emailTemplates: [{ templateId: 'e1', subject: 'old' }],
        whatsappTemplates: [{ templateId: 'w1', body: 'old' }],
      },
    });

    updateOrgSettingsRequest.mockResolvedValueOnce({
      data: { data: { organizationId: 'o1', timezone: 'UTC' } },
    });
    await store.dispatch(updateOrgSettings({ timezone: 'UTC' }));
    expect(store.getState().adminOrg.organization.timezone).toBe('UTC');

    uploadOrgLogoRequest.mockResolvedValueOnce({
      data: { data: { organizationId: 'o1', logoUrl: 'x' } },
    });
    await store.dispatch(uploadOrgLogo(new Blob()));
    expect(store.getState().adminOrg.organization.logoUrl).toBe('x');

    store.dispatch({
      type: fetchMyOrganization.fulfilled.type,
      payload: {
        organizationId: 'o1',
        emailTemplates: [{ templateId: 'e1', subject: 'old' }],
        whatsappTemplates: [{ templateId: 'w1', body: 'old' }],
      },
    });

    updateEmailTemplateRequest.mockResolvedValueOnce({
      data: { data: { templateId: 'e1', subject: 'new' } },
    });
    await store.dispatch(updateEmailTemplate({ templateId: 'e1', payload: {} }));
    expect(store.getState().adminOrg.organization.emailTemplates[0].subject).toBe('new');

    updateWhatsAppTemplateRequest.mockResolvedValueOnce({
      data: { data: { templateId: 'w1', body: 'new' } },
    });
    await store.dispatch(updateWhatsAppTemplate({ templateId: 'w1', payload: {} }));
    expect(store.getState().adminOrg.organization.whatsappTemplates[0].body).toBe('new');

    getBillingRequest.mockResolvedValueOnce({ data: { data: { plan: 'trial' } } });
    await store.dispatch(fetchBilling());
    expect(store.getState().adminOrg.billing.plan).toBe('trial');

    getBillingRequest.mockRejectedValueOnce({});
    await store.dispatch(fetchBilling());
    expect(store.getState().adminOrg.billingLoading).toBe(false);
    // rejected clears loading only — no error field set
    expect(store.getState().adminOrg.error).toBeNull();

    getAuditLogsRequest.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], pagination: { page: 1 } },
    });
    await store.dispatch(fetchAuditLogs());
    expect(store.getState().adminOrg.auditLogs).toHaveLength(1);

    getAuditLogsRequest.mockRejectedValueOnce({});
    await store.dispatch(fetchAuditLogs());
    expect(store.getState().adminOrg.auditLoading).toBe(false);

    getAuditStatsRequest.mockResolvedValueOnce({ data: { data: { total: 5 } } });
    await store.dispatch(fetchAuditStats());
    expect(store.getState().adminOrg.auditStats.total).toBe(5);

    getAuditStatsRequest.mockRejectedValueOnce({});
    await store.dispatch(fetchAuditStats());
    expect(store.getState().adminOrg.auditStatsLoading).toBe(false);

    updateEmailTemplateRequest.mockResolvedValueOnce({
      data: { data: { templateId: 'e1' } },
    });
    // no organization → early return
    store.dispatch({ type: fetchMyOrganization.fulfilled.type, payload: null });
    await store.dispatch(updateEmailTemplate({ templateId: 'e1', payload: {} }));
  });
});

describe('countrySlice + recruitmentSlice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetchCountries pending/fulfilled/rejected', async () => {
    const store = configureStore({ reducer: { countries: countryReducer } });
    listCountriesRequest.mockResolvedValueOnce({
      data: { data: [{ countryId: 'in' }] },
    });
    await store.dispatch(fetchCountries());
    expect(store.getState().countries.items).toHaveLength(1);

    listCountriesRequest.mockRejectedValueOnce({});
    await store.dispatch(fetchCountries());
    expect(store.getState().countries.loading).toBe(false);
  });

  it('fetchDashboardStats lifecycle', async () => {
    const store = configureStore({ reducer: { recruitment: recruitmentReducer } });
    getDashboardStatsRequest.mockResolvedValueOnce({
      data: { data: { jobs: 3 } },
    });
    await store.dispatch(fetchDashboardStats());
    expect(store.getState().recruitment.stats.jobs).toBe(3);

    getDashboardStatsRequest.mockRejectedValueOnce({});
    await store.dispatch(fetchDashboardStats());
    expect(store.getState().recruitment.error).toBe('Failed to load dashboard stats');
  });

  it('fetchDashboardOverview lifecycle', async () => {
    const store = configureStore({ reducer: { recruitment: recruitmentReducer } });
    getDashboardOverviewRequest.mockResolvedValueOnce({
      data: { data: { funnel: { uploaded: 1 }, attention: { total: 0 } } },
    });
    await store.dispatch(fetchDashboardOverview());
    expect(store.getState().recruitment.overview.funnel.uploaded).toBe(1);

    getDashboardOverviewRequest.mockRejectedValueOnce({});
    await store.dispatch(fetchDashboardOverview());
    expect(store.getState().recruitment.error).toBe('Failed to load dashboard');
  });
});
