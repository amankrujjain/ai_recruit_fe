import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('@/api/jobApi', () => ({
  listJobsRequest: vi.fn(),
  getJobRequest: vi.fn(),
  createJobRequest: vi.fn(),
  updateJobRequest: vi.fn(),
  listCandidatesRequest: vi.fn(),
  uploadResumeRequest: vi.fn(),
  selectCandidatesRequest: vi.fn(),
  deleteCandidateRequest: vi.fn(),
}));

import {
  listJobsRequest,
  getJobRequest,
  createJobRequest,
  updateJobRequest,
  listCandidatesRequest,
  uploadResumeRequest,
  selectCandidatesRequest,
  deleteCandidateRequest,
} from '@/api/jobApi';
import jobsReducer, {
  fetchJobs,
  fetchJob,
  createJob,
  updateJob,
  deactivateJob,
  activateJob,
  clearCurrentJob,
} from '@/store/slices/jobsSlice';
import candidatesReducer, {
  fetchCandidates,
  uploadResume,
  selectCandidates,
  deleteCandidate,
  clearCandidates,
} from '@/store/slices/candidatesSlice';

const makeJobsStore = (preloaded) =>
  configureStore({ reducer: { jobs: jobsReducer }, preloadedState: preloaded });
const makeCandStore = (preloaded) =>
  configureStore({ reducer: { candidates: candidatesReducer }, preloadedState: preloaded });

describe('jobsSlice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetchJobs lifecycle and fallback error', async () => {
    const store = makeJobsStore();
    listJobsRequest.mockResolvedValueOnce({
      data: { data: [{ jobId: '1' }], pagination: { page: 1 } },
    });
    await store.dispatch(fetchJobs());
    expect(store.getState().jobs.items).toHaveLength(1);

    listJobsRequest.mockRejectedValueOnce({});
    await store.dispatch(fetchJobs());
    expect(store.getState().jobs.error).toBe('Failed to load jobs');
  });

  it('fetchJob / createJob / updateJob / activate / deactivate', async () => {
    const store = makeJobsStore({
      jobs: {
        items: [{ jobId: '1', isActive: true }],
        pagination: null,
        current: null,
        loading: false,
        detailLoading: false,
        saving: false,
        error: null,
      },
    });

    getJobRequest.mockResolvedValueOnce({ data: { data: { jobId: '1', title: 'A' } } });
    await store.dispatch(fetchJob('1'));
    expect(store.getState().jobs.current.title).toBe('A');

    createJobRequest.mockResolvedValueOnce({ data: { data: { jobId: '2' } } });
    await store.dispatch(createJob({ jobTitle: 'B' }));
    expect(store.getState().jobs.current.jobId).toBe('2');

    updateJobRequest.mockResolvedValueOnce({
      data: { data: { jobId: '1', jobTitle: 'Updated' } },
    });
    await store.dispatch(updateJob({ jobId: '1', payload: { jobTitle: 'Updated' } }));
    expect(store.getState().jobs.items[0].jobTitle).toBe('Updated');

    updateJobRequest.mockResolvedValueOnce({
      data: { data: { jobId: '1', isActive: false } },
    });
    await store.dispatch(deactivateJob('1'));
    expect(store.getState().jobs.items[0].isActive).toBe(false);

    updateJobRequest.mockResolvedValueOnce({
      data: { data: { jobId: '1', isActive: true } },
    });
    await store.dispatch(activateJob('1'));
    expect(store.getState().jobs.items[0].isActive).toBe(true);

    store.dispatch(clearCurrentJob());
    expect(store.getState().jobs.current).toBeNull();

    getJobRequest.mockRejectedValueOnce({ response: { data: { message: 'gone' } } });
    await store.dispatch(fetchJob('x'));
    expect(store.getState().jobs.error).toBe('gone');
  });
});

describe('candidatesSlice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetch / upload / select / delete with floor-at-0 total', async () => {
    const store = makeCandStore({
      candidates: {
        items: [
          { candidateJobId: 'c1' },
          { candidateJobId: 'c2' },
        ],
        pagination: { total: 0 },
        loading: false,
        uploading: false,
        selecting: false,
        deletingId: null,
        error: null,
      },
    });

    listCandidatesRequest.mockResolvedValueOnce({
      data: { data: [{ candidateJobId: 'c1' }], pagination: { total: 1 } },
    });
    await store.dispatch(fetchCandidates({ jobId: 'j1' }));
    expect(store.getState().candidates.items).toHaveLength(1);

    const file = { name: 'cv.pdf' };
    uploadResumeRequest.mockResolvedValueOnce({ data: { data: { id: 'u1' } } });
    await store.dispatch(uploadResume({ jobId: 'j1', file }));
    expect(store.getState().candidates.uploading).toBe(false);

    selectCandidatesRequest.mockResolvedValueOnce({ data: { data: { ok: true } } });
    const before = store.getState().candidates.items;
    await store.dispatch(selectCandidates({ jobId: 'j1', payload: {} }));
    expect(store.getState().candidates.items).toEqual(before);
    expect(store.getState().candidates.selecting).toBe(false);

    deleteCandidateRequest.mockResolvedValueOnce({ data: { data: {} } });
    await store.dispatch(deleteCandidate({ jobId: 'j1', candidateJobId: 'c1' }));
    expect(store.getState().candidates.items).toEqual([]);
    expect(store.getState().candidates.pagination.total).toBe(0);

    deleteCandidateRequest.mockRejectedValueOnce({});
    await store.dispatch(deleteCandidate({ jobId: 'j1', candidateJobId: 'c2' }));
    expect(store.getState().candidates.error).toBe('Failed to remove candidate');

    store.dispatch(clearCandidates());
    expect(store.getState().candidates.items).toEqual([]);
  });

  it('uses API message on upload/select rejection', async () => {
    const store = makeCandStore();
    uploadResumeRequest.mockRejectedValueOnce({
      response: { data: { message: 'too large' } },
    });
    await store.dispatch(uploadResume({ jobId: 'j', file: { name: 'a.pdf' } }));
    expect(store.getState().candidates.error).toBe('too large');

    selectCandidatesRequest.mockRejectedValueOnce({});
    await store.dispatch(selectCandidates({ jobId: 'j', payload: {} }));
    expect(store.getState().candidates.error).toBe('Selection failed');
  });
});
