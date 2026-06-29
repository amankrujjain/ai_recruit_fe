import apiClient from './client';

export const listJobsRequest = (params) => apiClient.get('/jobs', { params });

export const getJobRequest = (jobId) => apiClient.get(`/jobs/${jobId}`);

export const createJobRequest = (payload) => apiClient.post('/jobs', payload);

export const updateJobRequest = (jobId, payload) => apiClient.patch(`/jobs/${jobId}`, payload);

export const listCandidatesRequest = (jobId, params) =>
  apiClient.get(`/jobs/${jobId}/candidates`, { params });

export const selectCandidatesRequest = (jobId, payload) =>
  apiClient.post(`/jobs/${jobId}/candidates/select`, payload);

export const uploadExcelRequest = (jobId, file) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post(`/jobs/${jobId}/candidates/upload/excel`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadResumeRequest = (jobId, file) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post(`/jobs/${jobId}/candidates/upload/resume`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
