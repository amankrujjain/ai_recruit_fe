import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getMyOrganizationRequest,
  updateOrgSettingsRequest,
  updateEmailTemplateRequest,
  updateWhatsAppTemplateRequest,
  getBillingRequest,
  getAuditLogsRequest,
} from '@/api/adminOrgApi';

export const fetchMyOrganization = createAsyncThunk(
  'adminOrg/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getMyOrganizationRequest();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load organization');
    }
  }
);

export const updateOrgSettings = createAsyncThunk(
  'adminOrg/updateSettings',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await updateOrgSettingsRequest(payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update settings');
    }
  }
);

export const updateEmailTemplate = createAsyncThunk(
  'adminOrg/updateEmailTemplate',
  async ({ templateId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await updateEmailTemplateRequest(templateId, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update template');
    }
  }
);

export const updateWhatsAppTemplate = createAsyncThunk(
  'adminOrg/updateWhatsAppTemplate',
  async ({ templateId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await updateWhatsAppTemplateRequest(templateId, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update template');
    }
  }
);

export const fetchBilling = createAsyncThunk(
  'adminOrg/billing',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getBillingRequest();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load billing');
    }
  }
);

export const fetchAuditLogs = createAsyncThunk(
  'adminOrg/auditLogs',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await getAuditLogsRequest(params);
      return { items: data.data, pagination: data.pagination };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load audit logs');
    }
  }
);

const adminOrgSlice = createSlice({
  name: 'adminOrg',
  initialState: {
    organization: null,
    billing: null,
    auditLogs: [],
    auditPagination: null,
    loading: false,
    saving: false,
    billingLoading: false,
    auditLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrganization.pending, (s) => { s.loading = true; })
      .addCase(fetchMyOrganization.fulfilled, (s, a) => {
        s.loading = false;
        s.organization = a.payload;
      })
      .addCase(fetchMyOrganization.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(updateOrgSettings.pending, (s) => { s.saving = true; })
      .addCase(updateOrgSettings.fulfilled, (s, a) => {
        s.saving = false;
        s.organization = a.payload;
      })
      .addCase(updateOrgSettings.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload;
      })
      .addCase(updateEmailTemplate.fulfilled, (s, a) => {
        if (!s.organization) return;
        s.organization.emailTemplates = s.organization.emailTemplates.map((t) =>
          t.templateId === a.payload.templateId ? a.payload : t
        );
      })
      .addCase(updateWhatsAppTemplate.fulfilled, (s, a) => {
        if (!s.organization) return;
        s.organization.whatsappTemplates = s.organization.whatsappTemplates.map((t) =>
          t.templateId === a.payload.templateId ? a.payload : t
        );
      })
      .addCase(fetchBilling.pending, (s) => { s.billingLoading = true; })
      .addCase(fetchBilling.fulfilled, (s, a) => {
        s.billingLoading = false;
        s.billing = a.payload;
      })
      .addCase(fetchBilling.rejected, (s) => { s.billingLoading = false; })
      .addCase(fetchAuditLogs.pending, (s) => { s.auditLoading = true; })
      .addCase(fetchAuditLogs.fulfilled, (s, a) => {
        s.auditLoading = false;
        s.auditLogs = a.payload.items;
        s.auditPagination = a.payload.pagination;
      })
      .addCase(fetchAuditLogs.rejected, (s) => { s.auditLoading = false; });
  },
});

export const selectAdminOrg = (state) => state.adminOrg;
export default adminOrgSlice.reducer;
