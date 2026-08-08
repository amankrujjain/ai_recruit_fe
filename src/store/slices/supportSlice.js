import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createCategoryRequest,
  createFaqRequest,
  createTicketRequest,
  deleteCategoryRequest,
  deleteFaqRequest,
  listAdminCategoriesRequest,
  listAdminFaqsRequest,
  listAdminTicketsRequest,
  listMyTicketsRequest,
  listSupportCategoriesRequest,
  listSupportFaqsRequest,
  updateCategoryRequest,
  updateFaqRequest,
  updateTicketStatusRequest,
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

export const fetchOrgFaqs = createAsyncThunk(
  'support/fetchOrgFaqs',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await listSupportFaqsRequest(params);
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load FAQs'));
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

export const fetchAdminFaqs = createAsyncThunk(
  'support/fetchAdminFaqs',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await listAdminFaqsRequest(params);
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load FAQs'));
    }
  }
);

export const createFaq = createAsyncThunk(
  'support/createFaq',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await createFaqRequest(payload);
      await dispatch(fetchAdminFaqs());
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create FAQ'));
    }
  }
);

export const updateFaq = createAsyncThunk(
  'support/updateFaq',
  async ({ faqId, payload }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await updateFaqRequest(faqId, payload);
      await dispatch(fetchAdminFaqs());
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update FAQ'));
    }
  }
);

export const deleteFaq = createAsyncThunk(
  'support/deleteFaq',
  async (faqId, { dispatch, rejectWithValue }) => {
    try {
      await deleteFaqRequest(faqId);
      await dispatch(fetchAdminFaqs());
      return faqId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete FAQ'));
    }
  }
);

export const fetchMyTickets = createAsyncThunk(
  'support/fetchMyTickets',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await listMyTicketsRequest(params);
      return { items: data.data, pagination: data.pagination };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load tickets'));
    }
  }
);

export const createTicket = createAsyncThunk(
  'support/createTicket',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await createTicketRequest(payload);
      await dispatch(fetchMyTickets({ page: 1, limit: 20 }));
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create ticket'));
    }
  }
);

export const fetchAdminTickets = createAsyncThunk(
  'support/fetchAdminTickets',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await listAdminTicketsRequest(params);
      return { items: data.data, pagination: data.pagination };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load tickets'));
    }
  }
);

export const updateTicketStatus = createAsyncThunk(
  'support/updateTicketStatus',
  async ({ ticketId, payload, listParams }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await updateTicketStatusRequest(ticketId, payload);
      await dispatch(fetchAdminTickets(listParams || { page: 1, limit: 20 }));
      return data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update ticket'));
    }
  }
);

const supportSlice = createSlice({
  name: 'support',
  initialState: {
    categories: [],
    faqs: [],
    orgFaqs: [],
    myTickets: [],
    adminTickets: [],
    adminTicketsPagination: null,
    loading: false,
    faqsLoading: false,
    orgFaqsLoading: false,
    myTicketsLoading: false,
    adminTicketsLoading: false,
    saving: false,
    faqSaving: false,
    ticketSaving: false,
    actionId: null,
    faqActionId: null,
    ticketActionId: null,
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
      .addCase(fetchOrgFaqs.pending, (state) => {
        state.orgFaqsLoading = true;
        state.error = null;
      })
      .addCase(fetchOrgFaqs.fulfilled, (state, action) => {
        state.orgFaqsLoading = false;
        state.orgFaqs = action.payload;
      })
      .addCase(fetchOrgFaqs.rejected, (state, action) => {
        state.orgFaqsLoading = false;
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
      .addCase(fetchAdminFaqs.pending, (state) => {
        state.faqsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminFaqs.fulfilled, (state, action) => {
        state.faqsLoading = false;
        state.faqs = action.payload;
      })
      .addCase(fetchAdminFaqs.rejected, (state, action) => {
        state.faqsLoading = false;
        state.error = action.payload;
      })
      .addCase(createFaq.pending, (state) => {
        state.faqSaving = true;
        state.error = null;
      })
      .addCase(updateFaq.pending, (state, action) => {
        state.faqSaving = true;
        state.faqActionId = action.meta.arg.faqId;
        state.error = null;
      })
      .addCase(deleteFaq.pending, (state, action) => {
        state.faqActionId = action.meta.arg;
        state.error = null;
      })
      .addCase(fetchMyTickets.pending, (state) => {
        state.myTicketsLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTickets.fulfilled, (state, action) => {
        state.myTicketsLoading = false;
        state.myTickets = action.payload.items;
      })
      .addCase(fetchMyTickets.rejected, (state, action) => {
        state.myTicketsLoading = false;
        state.error = action.payload;
      })
      .addCase(createTicket.pending, (state) => {
        state.ticketSaving = true;
        state.error = null;
      })
      .addCase(fetchAdminTickets.pending, (state) => {
        state.adminTicketsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminTickets.fulfilled, (state, action) => {
        state.adminTicketsLoading = false;
        state.adminTickets = action.payload.items;
        state.adminTicketsPagination = action.payload.pagination;
      })
      .addCase(fetchAdminTickets.rejected, (state, action) => {
        state.adminTicketsLoading = false;
        state.error = action.payload;
      })
      .addCase(updateTicketStatus.pending, (state, action) => {
        state.ticketSaving = true;
        state.ticketActionId = action.meta.arg.ticketId;
        state.error = null;
      })
      .addMatcher(
        (action) => [
          createCategory.fulfilled.type,
          createCategory.rejected.type,
          updateCategory.fulfilled.type,
          updateCategory.rejected.type,
        ].includes(action.type),
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
      )
      .addMatcher(
        (action) => [
          createFaq.fulfilled.type,
          createFaq.rejected.type,
          updateFaq.fulfilled.type,
          updateFaq.rejected.type,
        ].includes(action.type),
        (state, action) => {
          state.faqSaving = false;
          state.faqActionId = null;
          if (action.type.endsWith('/rejected')) state.error = action.payload;
        }
      )
      .addMatcher(
        (action) => [deleteFaq.fulfilled.type, deleteFaq.rejected.type].includes(action.type),
        (state, action) => {
          state.faqActionId = null;
          if (action.type.endsWith('/rejected')) state.error = action.payload;
        }
      )
      .addMatcher(
        (action) => [
          createTicket.fulfilled.type,
          createTicket.rejected.type,
          updateTicketStatus.fulfilled.type,
          updateTicketStatus.rejected.type,
        ].includes(action.type),
        (state, action) => {
          state.ticketSaving = false;
          state.ticketActionId = null;
          if (action.type.endsWith('/rejected')) state.error = action.payload;
        }
      );
  },
});

export const { clearSupportError } = supportSlice.actions;
export const selectSupport = (state) => state.support;
export default supportSlice.reducer;
