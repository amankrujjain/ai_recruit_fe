import apiClient from './client';

export const loginRequest = (email, password) =>
  apiClient.post('/auth/login', { email, password });

export const getProfileRequest = () => apiClient.get('/auth/me');

export const logoutRequest = () => {
  const refreshToken = localStorage.getItem('recruit_refresh_token');
  return apiClient.post('/auth/logout', { refreshToken });
};

export const validateInviteRequest = (token) =>
  apiClient.get(`/auth/accept-invite/${token}`);

export const acceptInviteRequest = (token, password) =>
  apiClient.post(`/auth/accept-invite/${token}`, { password });
