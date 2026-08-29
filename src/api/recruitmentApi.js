import apiClient from './client';

export const getDashboardStatsRequest = (params) =>
  apiClient.get('/recruitment/dashboard/stats', { params });

export const getDashboardOverviewRequest = () =>
  apiClient.get('/recruitment/dashboard/overview');

export const getScorecardRequest = (candidateJobId) =>
  apiClient.get(`/recruitment/${candidateJobId}/scorecard`);

export const getCallRecordsRequest = (candidateJobId) =>
  apiClient.get(`/recruitment/${candidateJobId}/calls`);

export const updateCandidateStatusRequest = (candidateJobId, status) =>
  apiClient.patch(`/recruitment/${candidateJobId}/status`, { status });

export const retryOutreachRequest = (outreachRecordId) =>
  apiClient.post(`/recruitment/outreach/${outreachRecordId}/retry`);
