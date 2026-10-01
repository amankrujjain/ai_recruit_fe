import apiClient from './client';

export const listJobsRequest = (params = {}) => {
  const { page, limit, search, isActive } = params;
  const query = {};
  if (page !== undefined) query.page = page;
  if (limit !== undefined) query.limit = limit;
  if (search) query.search = search;
  if (isActive === true) query.isActive = true;
  if (isActive === false) query.isActive = false;
  return apiClient.get('/jobs', { params: query });
};

export const getJobRequest = (jobId) => apiClient.get(`/jobs/${jobId}`);

export const createJobRequest = (payload) => apiClient.post('/jobs', payload);

export const updateJobRequest = (jobId, payload) => {
  if (payload?.closeJob) {
    return closeJobRequest(jobId, { reason: payload.reason });
  }
  return apiClient.patch(`/jobs/${jobId}`, payload);
};

export const closeJobRequest = (jobId, payload = {}) =>
  apiClient.post(`/jobs/${jobId}/close`, payload);

export const deleteJobRequest = (jobId) => apiClient.delete(`/jobs/${jobId}`);

export const listCandidatesRequest = (jobId, params) =>
  apiClient.get(`/jobs/${jobId}/candidates`, { params });

export const getCandidateRequest = (jobId, candidateJobId) =>
  apiClient.get(`/jobs/${jobId}/candidates/${candidateJobId}`);

export const selectCandidatesRequest = (jobId, payload) =>
  apiClient.post(`/jobs/${jobId}/candidates/select`, payload);

export const deleteCandidateRequest = (jobId, candidateJobId) =>
  apiClient.delete(`/jobs/${jobId}/candidates/${candidateJobId}`);

// export const uploadExcelRequest = (jobId, file) => {
//   const form = new FormData();
//   form.append('file', file);
//   return apiClient.post(`/jobs/${jobId}/candidates/upload/excel`, form, {
//     headers: { 'Content-Type': 'multipart/form-data' },
//   });
// };

export const uploadResumeRequest = (jobId, file) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post(`/jobs/${jobId}/candidates/upload/resume`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** Lightweight poll for resume parse progress (not the full candidate list). */
export const getResumeStatusRequest = (jobId, resumeFileIds = []) =>
  apiClient.get(`/jobs/${jobId}/resumes/status`, {
    params: { ids: resumeFileIds.join(',') },
  });

/** Re-enqueue deterministic (or openai) match for one candidate. */
export const rescoreCandidateRequest = (jobId, candidateJobId, { force = true } = {}) =>
  apiClient.post(`/jobs/${jobId}/candidates/${candidateJobId}/rescore`, { force });

/** Bulk rescore for a job: scope = failed | unscored | all */
export const rescoreJobCandidatesRequest = (jobId, { scope = 'failed', force = false } = {}) =>
  apiClient.post(`/jobs/${jobId}/candidates/rescore`, { scope, force });

