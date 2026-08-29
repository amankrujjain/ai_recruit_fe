import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  listJobsRequest,
  getJobRequest,
  createJobRequest,
  updateJobRequest,
} from '@/api/jobApi';
import { getApiErrorMessage } from '@/lib/apiError';

export const fetchJobs = createAsyncThunk(
  'jobs/list',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await listJobsRequest(params);
      return {
        items: data.data,
        pagination: data.pagination,
        summary: data.summary ?? null,
      };
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Failed to load jobs'));
    }
  }
);

export const fetchJob = createAsyncThunk(
  'jobs/get',
  async (jobId, { rejectWithValue }) => {
    try {
      const { data } = await getJobRequest(jobId);
      return data.data;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Failed to load job'));
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await createJobRequest(payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Failed to create job'));
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/update',
  async ({ jobId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await updateJobRequest(jobId, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Failed to update job'));
    }
  }
);

export const deactivateJob = createAsyncThunk(
  'jobs/deactivate',
  async (jobId, { rejectWithValue }) => {
    try {
      const { data } = await updateJobRequest(jobId, { isActive: false });
      return data.data;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Failed to deactivate job'));
    }
  }
);

export const activateJob = createAsyncThunk(
  'jobs/activate',
  async (jobId, { rejectWithValue }) => {
    try {
      const { data } = await updateJobRequest(jobId, { isActive: true });
      return data.data;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Failed to activate job'));
    }
  }
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: {
    items: [],
    pagination: null,
    summary: null,
    current: null,
    loading: false,
    detailLoading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearCurrentJob: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchJobs.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.items;
        s.pagination = a.payload.pagination;
        s.summary = a.payload.summary;
      })
      .addCase(fetchJobs.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchJob.pending, (s) => { s.detailLoading = true; s.error = null; })
      .addCase(fetchJob.fulfilled, (s, a) => { s.detailLoading = false; s.current = a.payload; })
      .addCase(fetchJob.rejected, (s, a) => { s.detailLoading = false; s.error = a.payload; })
      .addCase(createJob.pending, (s) => { s.saving = true; })
      .addCase(createJob.fulfilled, (s, a) => { s.saving = false; s.current = a.payload; })
      .addCase(createJob.rejected, (s, a) => { s.saving = false; s.error = a.payload; })
      .addCase(updateJob.pending, (s) => { s.saving = true; })
      .addCase(updateJob.fulfilled, (s, a) => {
        s.saving = false;
        s.current = a.payload;
        s.items = s.items.map((j) => (j.jobId === a.payload.jobId ? a.payload : j));
      })
      .addCase(updateJob.rejected, (s, a) => { s.saving = false; s.error = a.payload; })
      .addCase(deactivateJob.fulfilled, (s, a) => {
        s.current = a.payload;
        s.items = s.items.map((j) => (j.jobId === a.payload.jobId ? a.payload : j));
      })
      .addCase(activateJob.fulfilled, (s, a) => {
        s.current = a.payload;
        s.items = s.items.map((j) =>
          (j.jobId === a.payload.jobId ? a.payload : j)
        );
      });
  },
});

export const { clearCurrentJob } = jobsSlice.actions;
export const selectJobs = (state) => state.jobs;
export default jobsSlice.reducer;
