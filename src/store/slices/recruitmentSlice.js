import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDashboardStatsRequest } from '@/api/recruitmentApi';

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

const recruitmentSlice = createSlice({
  name: 'recruitment',
  initialState: {
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (s, a) => { s.loading = false; s.stats = a.payload; })
      .addCase(fetchDashboardStats.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const selectRecruitment = (state) => state.recruitment;
export default recruitmentSlice.reducer;
