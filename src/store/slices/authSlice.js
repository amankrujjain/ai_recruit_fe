import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  loginRequest,
  getProfileRequest,
  logoutRequest,
} from '@/api/authApi';
import { storageKeys } from '@/lib/constants';

const clearStorage = () => {
  localStorage.removeItem(storageKeys.account);
  localStorage.removeItem(storageKeys.user);
  // Legacy token keys (pre-cookie auth) — wipe if still present
  localStorage.removeItem('recruit_access_token');
  localStorage.removeItem('recruit_refresh_token');
};

const loadSavedAccount = () => {
  const raw = localStorage.getItem(storageKeys.account)
    || localStorage.getItem(storageKeys.user);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.userId && !parsed.accountId) {
      parsed.accountId = parsed.userId;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await loginRequest(email, password);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/profile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getProfileRequest();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Session expired');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await logoutRequest(); } catch { /* ignore */ }
  clearStorage();
});

const initialState = {
  account: loadSavedAccount(),
  loading: false,
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => { state.error = null; },
    setInitialized: (state) => { state.initialized = true; },
    clearSession: (state) => {
      state.account = null;
      state.error = null;
      clearStorage();
    },
    setOnboardingCompleted: (state, action) => {
      if (!state.account) return;
      state.account = {
        ...state.account,
        onboardingCompleted: Boolean(action.payload),
      };
      localStorage.setItem(storageKeys.account, JSON.stringify(state.account));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false;
        s.account = a.payload.account;
        localStorage.setItem(storageKeys.account, JSON.stringify(a.payload.account));
        localStorage.removeItem(storageKeys.user);
      })
      .addCase(loginUser.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(fetchProfile.fulfilled, (s, a) => {
        s.account = a.payload;
        localStorage.setItem(storageKeys.account, JSON.stringify(a.payload));
        localStorage.removeItem(storageKeys.user);
      })
      .addCase(fetchProfile.rejected, (s) => {
        s.account = null;
        clearStorage();
      })
      .addCase(logoutUser.fulfilled, (s) => {
        s.account = null;
      });
  },
});

export const {
  clearAuthError,
  setInitialized,
  clearSession,
  setOnboardingCompleted,
} = authSlice.actions;
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => Boolean(state.auth.account);
export default authSlice.reducer;
