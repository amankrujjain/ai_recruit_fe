import apiClient from './client';

export const getMyOrganizationRequest = () =>
  apiClient.get('/organizations/me');

export const completeOnboardingRequest = (payload) =>
  apiClient.post('/organizations/me/onboarding', payload);

export const updateOrgSettingsRequest = (payload) =>
  apiClient.patch('/organizations/me/settings', payload);

export const updateAiPreferencesRequest = (payload) =>
  apiClient.patch('/organizations/me/ai-preferences', payload);

export const getVoicesRequest = () =>
  apiClient.get('/organizations/me/resources/voices');

export const uploadOrgLogoRequest = (file) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post('/organizations/me/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateEmailTemplateRequest = (templateId, payload) =>
  apiClient.patch(`/organizations/me/email-templates/${templateId}`, payload);

export const updateWhatsAppTemplateRequest = (templateId, payload) =>
  apiClient.patch(`/organizations/me/whatsapp-templates/${templateId}`, payload);

export const getBillingRequest = () =>
  apiClient.get('/organizations/me/billing');

export const getAuditLogsRequest = (params) =>
  apiClient.get('/organizations/me/audit-logs', { params });

export const getAuditStatsRequest = (params) =>
  apiClient.get('/organizations/me/audit-logs/stats', { params });
