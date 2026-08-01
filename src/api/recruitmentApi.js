import apiClient from './client';

export const getDashboardStatsRequest = (params) =>
  apiClient.get('/recruitment/dashboard/stats', { params });

export const getScorecardRequest = (candidateJobId) =>
  apiClient.get(`/recruitment/${candidateJobId}/scorecard`);

export const getCallRecordsRequest = (candidateJobId) =>
  apiClient.get(`/recruitment/${candidateJobId}/calls`);
