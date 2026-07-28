import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createOrganizationRequest,
  listOrganizationsRequest,
  getOrganizationRequest,
  updateOrganizationRequest,
  deleteOrganizationRequest,
  sendAdminPasswordResetRequest,
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
      return rejectWithValue(err.response?.data?.message || 'Failed to send verification');
    }
  }
);

export const fetchOrganizationById = createAsyncThunk(
  'organizations/get',
  async (organizationId, { rejectWithValue }) => {
    try {
      const { data } = await getOrganizationRequest(organizationId);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load organization');
    }
  }
);

export const updateOrganization = createAsyncThunk(
  'organizations/update',
  async ({ organizationId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await updateOrganizationRequest(organizationId, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update organization');
    }
  }
);

export const deleteOrganization = createAsyncThunk(
  'organizations/delete',
  async (organizationId, { rejectWithValue }) => {
    try {
      await deleteOrganizationRequest(organizationId);
      return organizationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete organization');
    }
  }
);

export const sendAdminPasswordReset = createAsyncThunk(
  'organizations/sendAdminPasswordReset',
  async (organizationId, { rejectWithValue }) => {
    try {
      const { data } = await sendAdminPasswordResetRequest(organizationId);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send reset email');
    }
  }
);

const organizationSlice = createSlice({
  name: 'organizations',
  initialState: {
    items: [],
    pagination: null,
    selected: null,
    loading: false,
    saving: false,
    deleting: false,
    creating: false,
    resettingAdminPassword: false,
    error: null,
  },
  reducers: {
    clearSelectedOrg: (state) => { state.selected = null; },
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
      .addCase(fetchOrganizationById.pending, (s) => { s.loading = true; })
      .addCase(fetchOrganizationById.fulfilled, (s, a) => {
        s.loading = false;
        s.selected = a.payload;
      })
      .addCase(fetchOrganizationById.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(updateOrganization.pending, (s) => { s.saving = true; })
      .addCase(updateOrganization.fulfilled, (s, a) => {
        s.saving = false;
        s.selected = a.payload;
      })
      .addCase(updateOrganization.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload;
      })
      .addCase(deleteOrganization.pending, (s) => { s.deleting = true; })
      .addCase(deleteOrganization.fulfilled, (s, a) => {
        s.deleting = false;
        s.items = s.items.filter((o) => o.organizationId !== a.payload);
        s.selected = null;
      })
      .addCase(deleteOrganization.rejected, (s, a) => {
        s.deleting = false;
        s.error = a.payload;
      })
      .addCase(sendAdminPasswordReset.pending, (s) => { s.resettingAdminPassword = true; })
      .addCase(sendAdminPasswordReset.fulfilled, (s) => { s.resettingAdminPassword = false; })
      .addCase(sendAdminPasswordReset.rejected, (s, a) => {
        s.resettingAdminPassword = false;
        s.error = a.payload;
      });
  },
});

export const { clearSelectedOrg, clearOrgError } = organizationSlice.actions;
export const selectOrganizations = (state) => state.organizations;
export default organizationSlice.reducer;
