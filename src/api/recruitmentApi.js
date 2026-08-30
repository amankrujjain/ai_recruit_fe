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

export const getInterviewsRequest = (params) =>
  apiClient.get('/recruitment/interviews', { params });

export const getOutreachRequest = (params) =>
  apiClient.get('/recruitment/outreach', { params });

export const getDecisionQueueRequest = (params) =>
  apiClient.get('/recruitment/decisions', { params });

export const getCandidateDecisionsRequest = (candidateJobId) =>
  apiClient.get(`/recruitment/${candidateJobId}/decisions`);

export const createDecisionRequest = (candidateJobId, payload) =>
  apiClient.post(`/recruitment/${candidateJobId}/decisions`, payload);

export const inviteNextRoundRequest = (candidateJobId, roundId) =>
  apiClient.post(`/recruitment/${candidateJobId}/rounds/${roundId}/invite`);

export const getCandidateActivityRequest = (candidateJobId, params) =>
  apiClient.get(`/recruitment/${candidateJobId}/activity`, { params });

export const rescheduleCallRequest = (callScheduleId, payload) =>
  apiClient.patch(`/recruitment/calls/${callScheduleId}/reschedule`, payload);

export const cancelCallRequest = (callScheduleId) =>
  apiClient.delete(`/recruitment/calls/${callScheduleId}`);
