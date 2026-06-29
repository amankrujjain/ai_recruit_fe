import apiClient from './client';

export const createRegistrationRequest = (payload) =>
  apiClient.post('/organizations/registrations', payload);

export const listRegistrationsRequest = (params) =>
  apiClient.get('/organizations/registrations', { params });

export const resendRegistrationRequest = (registrationId) =>
  apiClient.post(`/organizations/registrations/${registrationId}/resend-verification`);

export const createOrganizationRequest = (payload) =>
  apiClient.post('/organizations', payload);

export const listOrganizationsRequest = (params) =>
  apiClient.get('/organizations', { params });

export const getOrganizationRequest = (organizationId) =>
  apiClient.get(`/organizations/${organizationId}`);

export const updateOrganizationRequest = (organizationId, payload) =>
  apiClient.patch(`/organizations/${organizationId}`, payload);

export const deleteOrganizationRequest = (organizationId) =>
  apiClient.delete(`/organizations/${organizationId}`);
