import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  loginRequest,
  getProfileRequest,
  logoutRequest,
} from '@/api/authApi';
import { storageKeys } from '@/lib/constants';

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
  localStorage.removeItem(storageKeys.accessToken);
  localStorage.removeItem(storageKeys.refreshToken);
  localStorage.removeItem(storageKeys.user);
});

const savedUser = localStorage.getItem(storageKeys.user);
const initialState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: localStorage.getItem(storageKeys.accessToken),
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload.user;
        s.token = a.payload.accessToken;
        localStorage.setItem(storageKeys.accessToken, a.payload.accessToken);
        localStorage.setItem(storageKeys.refreshToken, a.payload.refreshToken);
        localStorage.setItem(storageKeys.user, JSON.stringify(a.payload.user));
      })
      .addCase(loginUser.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(fetchProfile.fulfilled, (s, a) => {
        s.user = a.payload;
        localStorage.setItem(storageKeys.user, JSON.stringify(a.payload));
      })
      .addCase(fetchProfile.rejected, (s) => {
        s.user = null;
        s.token = null;
      })
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null;
        s.token = null;
      });
  },
});

export const { clearAuthError, setInitialized } = authSlice.actions;
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export default authSlice.reducer;
