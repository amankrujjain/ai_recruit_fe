import apiClient from './client';

export const listCountriesRequest = (search) =>
  apiClient.get('/countries', { params: { search } });
