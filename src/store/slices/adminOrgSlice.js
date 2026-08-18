import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getMyOrganizationRequest,
  updateOrgSettingsRequest,
  updateAiPreferencesRequest,
  uploadOrgLogoRequest,
  updateEmailTemplateRequest,
  updateWhatsAppTemplateRequest,
  getBillingRequest,
  getAuditLogsRequest,
  getAuditStatsRequest,
  getVoicesRequest,
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

export const updateAiPreferences = createAsyncThunk(
  'adminOrg/updateAiPreferences',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await updateAiPreferencesRequest(payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update AI preferences');
    }
  }
);

export const fetchVoices = createAsyncThunk(
  'adminOrg/fetchVoices',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getVoicesRequest();
      return data?.data?.voices ?? [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load voices');
    }
  }
);

export const uploadOrgLogo = createAsyncThunk(
  'adminOrg/uploadLogo',
  async (file, { rejectWithValue }) => {
    try {
      const { data } = await uploadOrgLogoRequest(file);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to upload logo');
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

export const fetchAuditStats = createAsyncThunk(
  'adminOrg/auditStats',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await getAuditStatsRequest(params);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load audit stats');
    }
  }
);

const adminOrgSlice = createSlice({
  name: 'adminOrg',
  initialState: {
    organization: null,
    voices: [],
    billing: null,
    auditLogs: [],
    auditPagination: null,
    auditStats: null,
    loading: false,
    saving: false,
    logoUploading: false,
    voicesLoading: false,
    billingLoading: false,
    auditLoading: false,
    auditStatsLoading: false,
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
      .addCase(updateAiPreferences.pending, (s) => { s.saving = true; })
      .addCase(updateAiPreferences.fulfilled, (s, a) => {
        s.saving = false;
        s.organization = a.payload;
      })
      .addCase(updateAiPreferences.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload;
      })
      .addCase(fetchVoices.pending, (s) => { s.voicesLoading = true; })
      .addCase(fetchVoices.fulfilled, (s, a) => {
        s.voicesLoading = false;
        s.voices = a.payload;
      })
      .addCase(fetchVoices.rejected, (s, a) => {
        s.voicesLoading = false;
        s.error = a.payload;
      })
      .addCase(uploadOrgLogo.pending, (s) => { s.logoUploading = true; })
      .addCase(uploadOrgLogo.fulfilled, (s, a) => {
        s.logoUploading = false;
        s.organization = a.payload;
      })
      .addCase(uploadOrgLogo.rejected, (s, a) => {
        s.logoUploading = false;
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
      .addCase(fetchAuditLogs.rejected, (s) => { s.auditLoading = false; })
      .addCase(fetchAuditStats.pending, (s) => { s.auditStatsLoading = true; })
      .addCase(fetchAuditStats.fulfilled, (s, a) => {
        s.auditStatsLoading = false;
        s.auditStats = a.payload;
      })
      .addCase(fetchAuditStats.rejected, (s) => { s.auditStatsLoading = false; });
  },
});

export const selectAdminOrg = (state) => state.adminOrg;
export default adminOrgSlice.reducer;
