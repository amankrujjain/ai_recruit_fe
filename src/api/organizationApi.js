import apiClient from './client';

export const createOrganizationRequest = (payload) =>
  apiClient.post('/organizations', payload);

export const listOrganizationsRequest = (params) =>
  apiClient.get('/organizations', { params });
