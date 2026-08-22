import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  listRecruitersRequest,
  inviteRecruiterRequest,
  disableRecruiterRequest,
  enableRecruiterRequest,
  deleteRecruiterRequest,
  resetRecruiterPasswordRequest,
} from '@/api/recruiterApi';

export const fetchRecruiters = createAsyncThunk(
  'recruiters/list',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await listRecruitersRequest(params);
      return { items: data.data, pagination: data.pagination };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load recruiters');
    }
  }
);

export const inviteRecruiter = createAsyncThunk(
  'recruiters/invite',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await inviteRecruiterRequest(payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to invite recruiter');
    }
  }
);

export const disableRecruiter = createAsyncThunk(
  'recruiters/disable',
  async (accountId, { rejectWithValue }) => {
    try {
      const { data } = await disableRecruiterRequest(accountId);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to disable recruiter');
    }
  }
);

export const enableRecruiter = createAsyncThunk(
  'recruiters/enable',
  async (accountId, { rejectWithValue }) => {
    try {
      const { data } = await enableRecruiterRequest(accountId);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to enable recruiter');
    }
  }
);

export const deleteRecruiter = createAsyncThunk(
  'recruiters/delete',
  async (accountId, { rejectWithValue }) => {
    try {
      await deleteRecruiterRequest(accountId);
      return accountId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete recruiter');
    }
  }
);

export const resetRecruiterPassword = createAsyncThunk(
  'recruiters/resetPassword',
  async (accountId, { rejectWithValue }) => {
    try {
      const { data } = await resetRecruiterPasswordRequest(accountId);
      return { accountId, message: data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send reset email');
    }
  }
);

const recruitersSlice = createSlice({
  name: 'recruiters',
  initialState: {
    items: [],
    pagination: null,
    loading: false,
    inviting: false,
    actionId: null,
    lastInvited: null,
    error: null,
  },
  reducers: {
    clearLastInvited: (state) => { state.lastInvited = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecruiters.pending, (s) => { s.loading = true; })
      .addCase(fetchRecruiters.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.items;
        s.pagination = a.payload.pagination;
      })
      .addCase(fetchRecruiters.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(inviteRecruiter.pending, (s) => { s.inviting = true; })
      .addCase(inviteRecruiter.fulfilled, (s, a) => {
        s.inviting = false;
        // Do not keep invite URLs in client state (email-only delivery)
        const payload = a.payload || {};
        if (payload.invitation) {
          const { inviteUrl: _omit, ...safeInvitation } = payload.invitation;
          s.lastInvited = { ...payload, invitation: safeInvitation };
        } else {
          const { inviteUrl: _omitUrl, ...safe } = payload;
          s.lastInvited = safe;
        }
      })
      .addCase(inviteRecruiter.rejected, (s, a) => {
        s.inviting = false;
        s.error = a.payload;
      })
      .addCase(disableRecruiter.fulfilled, (s, a) => {
        s.items = s.items.map((r) => (r.accountId === a.payload.accountId ? a.payload : r));
      })
      .addCase(enableRecruiter.fulfilled, (s, a) => {
        s.items = s.items.map((r) => (r.accountId === a.payload.accountId ? a.payload : r));
      })
      .addCase(deleteRecruiter.fulfilled, (s, a) => {
        s.items = s.items.filter((r) => r.accountId !== a.payload);
      })
      .addCase(resetRecruiterPassword.pending, (s, a) => { s.actionId = a.meta.arg; })
      .addCase(resetRecruiterPassword.fulfilled, (s) => { s.actionId = null; })
      .addCase(resetRecruiterPassword.rejected, (s) => { s.actionId = null; });
  },
});

export const { clearLastInvited } = recruitersSlice.actions;
export const selectRecruiters = (state) => state.recruiters;
export default recruitersSlice.reducer;
