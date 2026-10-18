import apiClient from './client';

export const resolveInterviewInviteRequest = (token) =>
  apiClient.get(`/interview-invites/public/${encodeURIComponent(token)}`);

export const startInterviewInviteRequest = (token, phoneE164) =>
  apiClient.post(`/interview-invites/public/${encodeURIComponent(token)}/start`, {
    phoneE164: phoneE164 || undefined,
  });
