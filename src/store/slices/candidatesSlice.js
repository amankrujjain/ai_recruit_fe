import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  listCandidatesRequest,
  uploadExcelRequest,
  uploadResumeRequest,
  selectCandidatesRequest,
  deleteCandidateRequest,
} from '@/api/jobApi';

export const fetchCandidates = createAsyncThunk(
  'candidates/list',
  async ({ jobId, ...params }, { rejectWithValue }) => {
    try {
      const { data } = await listCandidatesRequest(jobId, params);
      return { items: data.data, pagination: data.pagination };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load candidates');
    }
  }
);

export const uploadExcel = createAsyncThunk(
  'candidates/uploadExcel',
  async ({ jobId, file }, { rejectWithValue }) => {
    try {
      const { data } = await uploadExcelRequest(jobId, file);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Excel upload failed');
    }
  }
);

export const uploadResume = createAsyncThunk(
  'candidates/uploadResume',
  async ({ jobId, file }, { rejectWithValue }) => {
    try {
      const { data } = await uploadResumeRequest(jobId, file);
      return { ...data.data, fileName: file.name };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Resume upload failed');
    }
  }
);

export const selectCandidates = createAsyncThunk(
  'candidates/select',
  async ({ jobId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await selectCandidatesRequest(jobId, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Selection failed');
    }
  }
);

export const deleteCandidate = createAsyncThunk(
  'candidates/delete',
  async ({ jobId, candidateJobId }, { rejectWithValue }) => {
    try {
      const { data } = await deleteCandidateRequest(jobId, candidateJobId);
      return { ...data.data, candidateJobId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove candidate');
    }
  }
);

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState: {
    items: [],
    pagination: null,
    loading: false,
    uploading: false,
    selecting: false,
    deletingId: null,
    error: null,
  },
  reducers: {
    clearCandidates: (state) => {
      state.items = [];
      state.pagination = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCandidates.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.items;
        s.pagination = a.payload.pagination;
      })
      .addCase(fetchCandidates.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(uploadExcel.pending, (s) => { s.uploading = true; })
      .addCase(uploadExcel.fulfilled, (s) => { s.uploading = false; })
      .addCase(uploadExcel.rejected, (s, a) => { s.uploading = false; s.error = a.payload; })
      .addCase(uploadResume.pending, (s) => { s.uploading = true; s.error = null; })
      .addCase(uploadResume.fulfilled, (s) => { s.uploading = false; })
      .addCase(uploadResume.rejected, (s, a) => { s.uploading = false; s.error = a.payload; })
      .addCase(selectCandidates.pending, (s) => { s.selecting = true; })
      .addCase(selectCandidates.fulfilled, (s) => { s.selecting = false; })
      .addCase(selectCandidates.rejected, (s, a) => { s.selecting = false; s.error = a.payload; })
      .addCase(deleteCandidate.pending, (s, a) => {
        s.deletingId = a.meta.arg.candidateJobId;
      })
      .addCase(deleteCandidate.fulfilled, (s, a) => {
        s.deletingId = null;
        s.items = s.items.filter((row) => row.candidateJobId !== a.payload.candidateJobId);
        if (s.pagination) {
          s.pagination = {
            ...s.pagination,
            total: Math.max(0, (s.pagination.total || 0) - 1),
          };
        }
      })
      .addCase(deleteCandidate.rejected, (s, a) => {
        s.deletingId = null;
        s.error = a.payload;
      });
  },
});

export const { clearCandidates } = candidatesSlice.actions;
export const selectCandidatesState = (state) => state.candidates;
export default candidatesSlice.reducer;
