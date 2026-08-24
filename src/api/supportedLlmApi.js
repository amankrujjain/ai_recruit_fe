import apiClient from './client';

export const listAdminSupportedLlmsRequest = () =>
  apiClient.get('/supported-llms/admin');

export const createSupportedLlmRequest = (formData) =>
  apiClient.post('/supported-llms/admin', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateSupportedLlmRequest = (supportedLlmId, payload) =>
  apiClient.patch(`/supported-llms/admin/${supportedLlmId}`, payload);

export const replaceSupportedLlmIconRequest = (supportedLlmId, file) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post(`/supported-llms/admin/${supportedLlmId}/icon`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteSupportedLlmRequest = (supportedLlmId) =>
  apiClient.delete(`/supported-llms/admin/${supportedLlmId}`);

export const listActiveSupportedLlmsRequest = (params) =>
  apiClient.get('/supported-llms', { params });
