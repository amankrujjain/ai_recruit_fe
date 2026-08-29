import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getDashboardStatsRequest,
  getDashboardOverviewRequest,
  retryOutreachRequest,
  updateCandidateStatusRequest,
} from '@/api/recruitmentApi';

export const fetchDashboardStats = createAsyncThunk(
  'recruitment/dashboardStats',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await getDashboardStatsRequest(params);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load dashboard stats');
    }
  }
);

export const fetchDashboardOverview = createAsyncThunk(
  'recruitment/dashboardOverview',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getDashboardOverviewRequest();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load dashboard');
    }
  }
);

export const retryFailedInvite = createAsyncThunk(
  'recruitment/retryFailedInvite',
  async (outreachRecordId, { rejectWithValue }) => {
    try {
      const { data } = await retryOutreachRequest(outreachRecordId);
      return { outreachRecordId, ...(data.data || {}) };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to retry invite');
    }
  }
);

export const rejectCandidateFromDashboard = createAsyncThunk(
  'recruitment/rejectCandidate',
  async (candidateJobId, { rejectWithValue }) => {
    try {
      const { data } = await updateCandidateStatusRequest(candidateJobId, 'REJECTED_MANUALLY');
      return { candidateJobId, ...(data.data || {}) };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reject candidate');
    }
  }
);

const recruitmentSlice = createSlice({
  name: 'recruitment',
  initialState: {
    stats: null,
    overview: null,
    loading: false,
    overviewLoading: false,
    actionLoading: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (s, a) => { s.loading = false; s.stats = a.payload; })
      .addCase(fetchDashboardStats.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchDashboardOverview.pending, (s) => {
        s.overviewLoading = true;
        s.error = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (s, a) => {
        s.overviewLoading = false;
        s.overview = a.payload;
      })
      .addCase(fetchDashboardOverview.rejected, (s, a) => {
        s.overviewLoading = false;
        s.error = a.payload;
      })
      .addCase(retryFailedInvite.pending, (s, a) => {
        s.actionLoading = a.meta.arg;
      })
      .addCase(retryFailedInvite.fulfilled, (s, a) => {
        s.actionLoading = null;
        if (!s.overview?.attention) return;
        s.overview.attention.failedInvites = s.overview.attention.failedInvites.filter(
          (item) => item.outreachRecordId !== a.payload.outreachRecordId
        );
        s.overview.attention.total = Math.max(
          0,
          (s.overview.attention.scorecards?.length || 0)
            + (s.overview.attention.failedInvites?.length || 0)
            + (s.overview.attention.noShows?.length || 0)
        );
      })
      .addCase(retryFailedInvite.rejected, (s) => { s.actionLoading = null; })
      .addCase(rejectCandidateFromDashboard.pending, (s, a) => {
        s.actionLoading = a.meta.arg;
      })
      .addCase(rejectCandidateFromDashboard.fulfilled, (s, a) => {
        s.actionLoading = null;
        if (!s.overview?.attention) return;
        s.overview.attention.noShows = s.overview.attention.noShows.filter(
          (item) => item.candidateJobId !== a.payload.candidateJobId
        );
        s.overview.attention.total = Math.max(
          0,
          (s.overview.attention.scorecards?.length || 0)
            + (s.overview.attention.failedInvites?.length || 0)
            + (s.overview.attention.noShows?.length || 0)
        );
      })
      .addCase(rejectCandidateFromDashboard.rejected, (s) => { s.actionLoading = null; });
  },
});

export const selectRecruitment = (state) => state.recruitment;
export default recruitmentSlice.reducer;
