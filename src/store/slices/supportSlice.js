import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createCategoryRequest,
  deleteCategoryRequest,
  listAdminCategoriesRequest,
  listSupportCategoriesRequest,
  updateCategoryRequest,
} from '@/api/supportApi';

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export const fetchAdminCategories = createAsyncThunk(
  'support/fetchAdminCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await listAdminCategoriesRequest();
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load categories'));
    }
  }
);

export const fetchOrgCategories = createAsyncThunk(
  'support/fetchOrgCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await listSupportCategoriesRequest();
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load categories'));
    }
  }
);

export const createCategory = createAsyncThunk(
  'support/createCategory',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await createCategoryRequest(payload);
      await dispatch(fetchAdminCategories());
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create category'));
    }
  }
);

export const updateCategory = createAsyncThunk(
  'support/updateCategory',
  async ({ categoryId, payload }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await updateCategoryRequest(categoryId, payload);
      await dispatch(fetchAdminCategories());
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update category'));
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'support/deleteCategory',
  async (categoryId, { dispatch, rejectWithValue }) => {
    try {
      await deleteCategoryRequest(categoryId);
      await dispatch(fetchAdminCategories());
      return categoryId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete category'));
    }
  }
);

const supportSlice = createSlice({
  name: 'support',
  initialState: {
    categories: [],
    loading: false,
    saving: false,
    actionId: null,
    error: null,
  },
  reducers: {
    clearSupportError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrgCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchOrgCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchAdminCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrgCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCategory.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateCategory.pending, (state, action) => {
        state.saving = true;
        state.actionId = action.meta.arg.categoryId;
        state.error = null;
      })
      .addCase(deleteCategory.pending, (state, action) => {
        state.actionId = action.meta.arg;
        state.error = null;
      })
      .addMatcher(
        (action) => [createCategory.fulfilled.type, createCategory.rejected.type, updateCategory.fulfilled.type, updateCategory.rejected.type].includes(action.type),
        (state, action) => {
          state.saving = false;
          state.actionId = null;
          if (action.type.endsWith('/rejected')) state.error = action.payload;
        }
      )
      .addMatcher(
        (action) => [deleteCategory.fulfilled.type, deleteCategory.rejected.type].includes(action.type),
        (state, action) => {
          state.actionId = null;
          if (action.type.endsWith('/rejected')) state.error = action.payload;
        }
      );
  },
});

export const { clearSupportError } = supportSlice.actions;
export const selectSupport = (state) => state.support;
export default supportSlice.reducer;
