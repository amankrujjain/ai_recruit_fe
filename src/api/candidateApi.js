import apiClient from './client';

export const validateCandidateTokenRequest = (token) =>
  apiClient.get(`/candidate/action/${token}`);

export const submitCandidateActionRequest = (token, action) =>
  apiClient.post(`/candidate/action/${token}`, { action });

export const getScheduleSlotsRequest = (token) =>
  apiClient.get(`/candidate/schedule/${token}/slots`);

export const bookScheduleSlotRequest = (token, scheduledAt) =>
  apiClient.post(`/candidate/schedule/${token}`, { scheduledAt });
