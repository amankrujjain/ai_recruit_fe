import apiClient from './client';

export const loginRequest = (email, password) =>
  apiClient.post('/auth/login', { email, password });

export const getProfileRequest = () => apiClient.get('/auth/me');

export const refreshTokenRequest = () =>
  apiClient.post('/auth/refresh', {});

export const logoutRequest = () =>
  apiClient.post('/auth/logout', {});

export const validateSignupRequest = (token) =>
  apiClient.get(`/auth/signup/${token}`);

export const completeSignupRequest = (token, password) =>
  apiClient.post(`/auth/signup/${token}`, { password });

export const validateInviteRequest = (token) =>
  validateSignupRequest(token);

export const acceptInviteRequest = (token, password) =>
  completeSignupRequest(token, password);

export const forgotPasswordRequest = (email) =>
  apiClient.post('/auth/forgot-password', { email });

export const requestPasswordResetEmailRequest = () =>
  apiClient.post('/auth/request-password-reset');

export const validateResetTokenRequest = (token) =>
  apiClient.get(`/auth/reset-password/${token}`);

export const resetPasswordRequest = (token, password) =>
  apiClient.post('/auth/reset-password', { token, password });
