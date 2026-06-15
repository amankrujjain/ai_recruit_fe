import apiClient from './client';

export const loginRequest = (email, password) =>
  apiClient.post('/auth/login', { email, password });

export const getProfileRequest = () => apiClient.get('/auth/me');

export const logoutRequest = () => {
  const refreshToken = localStorage.getItem('recruit_refresh_token');
  return apiClient.post('/auth/logout', { refreshToken });
};

export const validateSignupRequest = (token) =>
  apiClient.get(`/auth/signup/${token}`);

export const completeSignupRequest = (token, password) =>
  apiClient.post(`/auth/signup/${token}`, { password });

export const validateInviteRequest = (token) =>
  validateSignupRequest(token);

export const acceptInviteRequest = (token, password) =>
  completeSignupRequest(token, password);
