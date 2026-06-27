import apiClient from './client';

export const getMyOrganizationRequest = () =>
  apiClient.get('/organizations/me');

export const updateOrgSettingsRequest = (payload) =>
  apiClient.patch('/organizations/me/settings', payload);

export const updateEmailTemplateRequest = (templateId, payload) =>
  apiClient.patch(`/organizations/me/email-templates/${templateId}`, payload);

export const updateWhatsAppTemplateRequest = (templateId, payload) =>
  apiClient.patch(`/organizations/me/whatsapp-templates/${templateId}`, payload);

export const getBillingRequest = () =>
  apiClient.get('/organizations/me/billing');

export const getAuditLogsRequest = (params) =>
  apiClient.get('/organizations/me/audit-logs', { params });
