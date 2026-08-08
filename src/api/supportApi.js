import apiClient from './client';

// Super admin — categories
export const listAdminCategoriesRequest = () =>
  apiClient.get('/support/admin/categories');

export const createCategoryRequest = (payload) =>
  apiClient.post('/support/admin/categories', payload);

export const updateCategoryRequest = (categoryId, payload) =>
  apiClient.patch(`/support/admin/categories/${categoryId}`, payload);

export const deleteCategoryRequest = (categoryId) =>
  apiClient.delete(`/support/admin/categories/${categoryId}`);

// Super admin — FAQs
export const listAdminFaqsRequest = (params) =>
  apiClient.get('/support/admin/faqs', { params });

export const createFaqRequest = (payload) =>
  apiClient.post('/support/admin/faqs', payload);

export const updateFaqRequest = (faqId, payload) =>
  apiClient.patch(`/support/admin/faqs/${faqId}`, payload);

export const deleteFaqRequest = (faqId) =>
  apiClient.delete(`/support/admin/faqs/${faqId}`);

// Super admin — tickets
export const listAdminTicketsRequest = (params) =>
  apiClient.get('/support/admin/tickets', { params });

export const getAdminTicketRequest = (ticketId) =>
  apiClient.get(`/support/admin/tickets/${ticketId}`);

export const updateTicketStatusRequest = (ticketId, payload) =>
  apiClient.patch(`/support/admin/tickets/${ticketId}`, payload);

// Organization admin / recruiter
export const listSupportCategoriesRequest = () =>
  apiClient.get('/support/categories');

export const listSupportFaqsRequest = (params) =>
  apiClient.get('/support/faqs', { params });

export const createTicketRequest = (payload) =>
  apiClient.post('/support/tickets', payload);

export const listMyTicketsRequest = (params) =>
  apiClient.get('/support/tickets', { params });

export const getMyTicketRequest = (ticketId) =>
  apiClient.get(`/support/tickets/${ticketId}`);
