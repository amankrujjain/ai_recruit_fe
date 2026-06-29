import apiClient from './client';

export const getDashboardStatsRequest = (params) =>
  apiClient.get('/recruitment/dashboard/stats', { params });
