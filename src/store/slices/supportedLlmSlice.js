import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createSupportedLlmRequest,
  deleteSupportedLlmRequest,
  listActiveSupportedLlmsRequest,
  listAdminSupportedLlmsRequest,
  replaceSupportedLlmIconRequest,
  updateSupportedLlmRequest,
} from '@/api/supportedLlmApi';

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export const fetchAdminSupportedLlms = createAsyncThunk(
  'supportedLlms/fetchAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await listAdminSupportedLlmsRequest();
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load AI models'));
    }
  }
);

export const fetchActiveSupportedLlms = createAsyncThunk(
  'supportedLlms/fetchActive',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await listActiveSupportedLlmsRequest(params);
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load AI models'));
    }
  }
);

export const createSupportedLlm = createAsyncThunk(
  'supportedLlms/create',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await createSupportedLlmRequest(formData);
      await dispatch(fetchAdminSupportedLlms());
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create AI model'));
    }
  }
);

export const updateSupportedLlm = createAsyncThunk(
  'supportedLlms/update',
  async ({ supportedLlmId, payload }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await updateSupportedLlmRequest(supportedLlmId, payload);
      await dispatch(fetchAdminSupportedLlms());
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update AI model'));
    }
  }
);

export const replaceSupportedLlmIcon = createAsyncThunk(
  'supportedLlms/replaceIcon',
  async ({ supportedLlmId, file }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await replaceSupportedLlmIconRequest(supportedLlmId, file);
      await dispatch(fetchAdminSupportedLlms());
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update icon'));
    }
  }
);

export const deleteSupportedLlm = createAsyncThunk(
  'supportedLlms/delete',
  async (supportedLlmId, { dispatch, rejectWithValue }) => {
    try {
      await deleteSupportedLlmRequest(supportedLlmId);
      await dispatch(fetchAdminSupportedLlms());
      return supportedLlmId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete AI model'));
    }
  }
);

const supportedLlmSlice = createSlice({
  name: 'supportedLlms',
  initialState: {
    adminItems: [],
    activeItems: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearSupportedLlmError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminSupportedLlms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminSupportedLlms.fulfilled, (state, action) => {
        state.loading = false;
        state.adminItems = action.payload || [];
      })
      .addCase(fetchAdminSupportedLlms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchActiveSupportedLlms.fulfilled, (state, action) => {
        state.activeItems = action.payload || [];
      })
      .addCase(createSupportedLlm.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createSupportedLlm.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createSupportedLlm.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(updateSupportedLlm.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateSupportedLlm.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateSupportedLlm.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(replaceSupportedLlmIcon.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(replaceSupportedLlmIcon.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(replaceSupportedLlmIcon.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(deleteSupportedLlm.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteSupportedLlm.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(deleteSupportedLlm.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { clearSupportedLlmError } = supportedLlmSlice.actions;
export const selectSupportedLlms = (state) => state.supportedLlms;
export default supportedLlmSlice.reducer;
