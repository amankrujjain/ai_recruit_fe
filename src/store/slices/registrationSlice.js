import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createRegistrationRequest,
  listRegistrationsRequest,
  resendRegistrationRequest,
} from '@/api/organizationApi';

export const fetchRegistrations = createAsyncThunk(
  'registrations/list',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await listRegistrationsRequest(params);
      return { items: data.data, pagination: data.pagination };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load registrations');
    }
  }
);

export const createRegistration = createAsyncThunk(
  'registrations/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await createRegistrationRequest(payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send verification');
    }
  }
);

export const resendVerification = createAsyncThunk(
  'registrations/resend',
  async (registrationId, { rejectWithValue }) => {
    try {
      const { data } = await resendRegistrationRequest(registrationId);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to resend link');
    }
  }
);

const registrationSlice = createSlice({
  name: 'registrations',
  initialState: {
    items: [],
    pagination: null,
    loading: false,
    creating: false,
    resendingId: null,
    lastCreated: null,
    error: null,
  },
  reducers: {
    clearLastRegistration: (state) => { state.lastCreated = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRegistrations.pending, (s) => { s.loading = true; })
      .addCase(fetchRegistrations.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.items;
        s.pagination = a.payload.pagination;
      })
      .addCase(fetchRegistrations.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(createRegistration.pending, (s) => { s.creating = true; })
      .addCase(createRegistration.fulfilled, (s, a) => {
        s.creating = false;
        s.lastCreated = a.payload;
      })
      .addCase(createRegistration.rejected, (s, a) => {
        s.creating = false;
        s.error = a.payload;
      })
      .addCase(resendVerification.pending, (s, a) => {
        s.resendingId = a.meta.arg;
      })
      .addCase(resendVerification.fulfilled, (s) => {
        s.resendingId = null;
      })
      .addCase(resendVerification.rejected, (s) => {
        s.resendingId = null;
      });
  },
});

export const { clearLastRegistration } = registrationSlice.actions;
export const selectRegistrations = (state) => state.registrations;
export default registrationSlice.reducer;
