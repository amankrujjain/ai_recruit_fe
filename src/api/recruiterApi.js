import apiClient from './client';

export const inviteRecruiterRequest = (payload) =>
  apiClient.post('/users/recruiters', payload);

export const listRecruitersRequest = (params) =>
  apiClient.get('/users/recruiters', { params });

export const getRecruiterRequest = (accountId) =>
  apiClient.get(`/users/recruiters/${accountId}`);

export const disableRecruiterRequest = (accountId) =>
  apiClient.patch(`/users/recruiters/${accountId}/disable`);

export const enableRecruiterRequest = (accountId) =>
  apiClient.patch(`/users/recruiters/${accountId}/enable`);

export const deleteRecruiterRequest = (accountId) =>
  apiClient.delete(`/users/recruiters/${accountId}`);

export const resetRecruiterPasswordRequest = (accountId) =>
  apiClient.post(`/users/recruiters/${accountId}/reset-password`);
