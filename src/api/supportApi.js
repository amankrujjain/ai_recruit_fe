import apiClient from './client';

// Super admin
export const listAdminCategoriesRequest = () =>
  apiClient.get('/support/admin/categories');

export const createCategoryRequest = (payload) =>
  apiClient.post('/support/admin/categories', payload);

export const updateCategoryRequest = (categoryId, payload) =>
  apiClient.patch(`/support/admin/categories/${categoryId}`, payload);

export const deleteCategoryRequest = (categoryId) =>
  apiClient.delete(`/support/admin/categories/${categoryId}`);

// Organization admin / recruiter
export const listSupportCategoriesRequest = () =>
  apiClient.get('/support/categories');
