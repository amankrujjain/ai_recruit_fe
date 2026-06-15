import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createOrganizationRequest,
  listOrganizationsRequest,
} from '@/api/organizationApi';

export const fetchOrganizations = createAsyncThunk(
  'organizations/list',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await listOrganizationsRequest(params);
      return { items: data.data, pagination: data.pagination };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load organizations');
    }
  }
);

export const createOrganization = createAsyncThunk(
  'organizations/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await createOrganizationRequest(payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create organization');
    }
  }
);

const organizationSlice = createSlice({
  name: 'organizations',
  initialState: {
    items: [],
    pagination: null,
    loading: false,
    creating: false,
    lastCreated: null,
    error: null,
  },
  reducers: {
    clearLastCreated: (state) => { state.lastCreated = null; },
    clearOrgError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizations.pending, (s) => { s.loading = true; })
      .addCase(fetchOrganizations.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.items;
        s.pagination = a.payload.pagination;
      })
      .addCase(fetchOrganizations.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(createOrganization.pending, (s) => { s.creating = true; })
      .addCase(createOrganization.fulfilled, (s, a) => {
        s.creating = false;
        s.lastCreated = a.payload;
      })
      .addCase(createOrganization.rejected, (s, a) => {
        s.creating = false;
        s.error = a.payload;
      });
  },
});

export const { clearLastCreated, clearOrgError } = organizationSlice.actions;
export const selectOrganizations = (state) => state.organizations;
export default organizationSlice.reducer;
