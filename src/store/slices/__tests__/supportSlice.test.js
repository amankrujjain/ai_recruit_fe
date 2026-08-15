import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('@/api/supportApi', () => ({
  listAdminCategoriesRequest: vi.fn(),
  listSupportCategoriesRequest: vi.fn(),
  listSupportFaqsRequest: vi.fn(),
  createCategoryRequest: vi.fn(),
  updateCategoryRequest: vi.fn(),
  deleteCategoryRequest: vi.fn(),
  listAdminFaqsRequest: vi.fn(),
  createFaqRequest: vi.fn(),
  updateFaqRequest: vi.fn(),
  deleteFaqRequest: vi.fn(),
  listMyTicketsRequest: vi.fn(),
  createTicketRequest: vi.fn(),
  listAdminTicketsRequest: vi.fn(),
  updateTicketStatusRequest: vi.fn(),
}));

import {
  listAdminCategoriesRequest,
  listSupportCategoriesRequest,
  listSupportFaqsRequest,
  createCategoryRequest,
  updateCategoryRequest,
  deleteCategoryRequest,
  listAdminFaqsRequest,
  createFaqRequest,
  updateFaqRequest,
  deleteFaqRequest,
  listMyTicketsRequest,
  createTicketRequest,
  listAdminTicketsRequest,
  updateTicketStatusRequest,
} from '@/api/supportApi';
import supportReducer, {
  fetchAdminCategories,
  fetchOrgCategories,
  fetchOrgFaqs,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchAdminFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  fetchMyTickets,
  createTicket,
  fetchAdminTickets,
  updateTicketStatus,
  clearSupportError,
} from '@/store/slices/supportSlice';

describe('supportSlice', () => {
  beforeEach(() => vi.clearAllMocks());

  const makeStore = () =>
    configureStore({ reducer: { support: supportReducer } });

  it('admin and org categories share categories field', async () => {
    const store = makeStore();
    listAdminCategoriesRequest.mockResolvedValueOnce({
      data: { data: [{ categoryId: 'admin' }] },
    });
    await store.dispatch(fetchAdminCategories());
    expect(store.getState().support.categories[0].categoryId).toBe('admin');

    listSupportCategoriesRequest.mockResolvedValueOnce({
      data: { data: [{ categoryId: 'org' }] },
    });
    await store.dispatch(fetchOrgCategories());
    expect(store.getState().support.categories[0].categoryId).toBe('org');
  });

  it('category CRUD refetches and matchers clear saving flags', async () => {
    const store = makeStore();
    listAdminCategoriesRequest.mockResolvedValue({ data: { data: [] } });
    createCategoryRequest.mockResolvedValueOnce({ data: { data: { categoryId: 'c1' } } });
    await store.dispatch(createCategory({ name: 'A' }));
    expect(listAdminCategoriesRequest).toHaveBeenCalled();
    expect(store.getState().support.saving).toBe(false);

    updateCategoryRequest.mockResolvedValueOnce({ data: { data: { categoryId: 'c1' } } });
    await store.dispatch(updateCategory({ categoryId: 'c1', payload: {} }));
    expect(store.getState().support.actionId).toBeNull();

    deleteCategoryRequest.mockResolvedValueOnce({});
    await store.dispatch(deleteCategory('c1'));
    expect(store.getState().support.actionId).toBeNull();

    createCategoryRequest.mockRejectedValueOnce({
      response: { data: { message: 'dup' } },
    });
    await store.dispatch(createCategory({ name: 'A' }));
    expect(store.getState().support.error).toBe('dup');
    store.dispatch(clearSupportError());
    expect(store.getState().support.error).toBeNull();
  });

  it('FAQ CRUD and ticket flows with nested refetch', async () => {
    const store = makeStore();
    listAdminFaqsRequest.mockResolvedValue({ data: { data: [{ faqId: 'f1' }] } });
    createFaqRequest.mockResolvedValueOnce({ data: { data: { faqId: 'f1' } } });
    await store.dispatch(createFaq({ question: 'Q' }));
    expect(store.getState().support.faqSaving).toBe(false);

    updateFaqRequest.mockResolvedValueOnce({ data: { data: { faqId: 'f1' } } });
    await store.dispatch(updateFaq({ faqId: 'f1', payload: {} }));
    expect(store.getState().support.faqActionId).toBeNull();

    deleteFaqRequest.mockResolvedValueOnce({});
    await store.dispatch(deleteFaq('f1'));
    expect(store.getState().support.faqActionId).toBeNull();

    listSupportFaqsRequest.mockResolvedValueOnce({
      data: { data: [{ faqId: 'of1' }] },
    });
    await store.dispatch(fetchOrgFaqs());
    expect(store.getState().support.orgFaqs).toHaveLength(1);

    listMyTicketsRequest.mockResolvedValue({
      data: { data: [{ ticketId: 't1' }], pagination: { page: 1 } },
    });
    createTicketRequest.mockResolvedValueOnce({ data: { data: { ticketId: 't1' } } });
    await store.dispatch(createTicket({ subject: 'Help' }));
    expect(listMyTicketsRequest).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(store.getState().support.ticketSaving).toBe(false);

    listAdminTicketsRequest.mockResolvedValue({
      data: { data: [{ ticketId: 't1' }], pagination: { page: 1, total: 1 } },
    });
    await store.dispatch(fetchAdminTickets({ page: 1 }));
    expect(store.getState().support.adminTicketsPagination.total).toBe(1);

    updateTicketStatusRequest.mockResolvedValueOnce({
      data: { data: { ticketId: 't1', status: 'CLOSED' } },
    });
    await store.dispatch(
      updateTicketStatus({ ticketId: 't1', payload: { status: 'CLOSED' } })
    );
    expect(store.getState().support.ticketActionId).toBeNull();

    updateTicketStatusRequest.mockRejectedValueOnce({});
    await store.dispatch(
      updateTicketStatus({
        ticketId: 't1',
        payload: {},
        listParams: { page: 2, limit: 10 },
      })
    );
    expect(store.getState().support.error).toBe('Failed to update ticket');
  });
});
