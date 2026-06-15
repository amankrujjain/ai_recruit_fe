import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { listCountriesRequest } from '@/api/countryApi';

export const fetchCountries = createAsyncThunk(
  'countries/list',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await listCountriesRequest();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load countries');
    }
  }
);

const countrySlice = createSlice({
  name: 'countries',
  initialState: { items: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountries.pending, (s) => { s.loading = true; })
      .addCase(fetchCountries.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchCountries.rejected, (s) => { s.loading = false; });
  },
});

export const selectCountries = (state) => state.countries;
export default countrySlice.reducer;
