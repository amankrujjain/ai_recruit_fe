import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('@/api/organizationApi', () => ({
  listOrganizationsRequest: vi.fn(),
  createOrganizationRequest: vi.fn(),
  getOrganizationRequest: vi.fn(),
  updateOrganizationRequest: vi.fn(),
  deleteOrganizationRequest: vi.fn(),
  sendAdminPasswordResetRequest: vi.fn(),
  listRegistrationsRequest: vi.fn(),
  createRegistrationRequest: vi.fn(),
  resendRegistrationRequest: vi.fn(),
}));

import {
  listOrganizationsRequest,
  createOrganizationRequest,
  getOrganizationRequest,
  updateOrganizationRequest,
  deleteOrganizationRequest,
  sendAdminPasswordResetRequest,
  listRegistrationsRequest,
  createRegistrationRequest,
  resendRegistrationRequest,
} from '@/api/organizationApi';
import organizationReducer, {
  fetchOrganizations,
  createOrganization,
  fetchOrganizationById,
  updateOrganization,
  deleteOrganization,
  sendAdminPasswordReset,
  clearSelectedOrg,
  clearOrgError,
} from '@/store/slices/organizationSlice';
import registrationReducer, {
  fetchRegistrations,
  createRegistration,
  resendVerification,
  clearLastRegistration,
} from '@/store/slices/registrationSlice';

describe('organizationSlice', () => {
  beforeEach(() => vi.clearAllMocks());

  const makeStore = (preloaded) =>
    configureStore({
      reducer: { organizations: organizationReducer },
      preloadedState: preloaded,
    });

  it('list/get/update/delete and password reset', async () => {
    const store = makeStore({
      organizations: {
        items: [{ organizationId: 'o1' }, { organizationId: 'o2' }],
        pagination: null,
        selected: { organizationId: 'o1' },
        loading: false,
        saving: false,
        deleting: false,
        creating: false,
        resettingAdminPassword: false,
        error: 'old',
      },
    });

    store.dispatch(clearOrgError());
    expect(store.getState().organizations.error).toBeNull();

    listOrganizationsRequest.mockResolvedValueOnce({
      data: { data: [{ organizationId: 'o3' }], pagination: { page: 1 } },
    });
    await store.dispatch(fetchOrganizations());
    expect(store.getState().organizations.items[0].organizationId).toBe('o3');

    getOrganizationRequest.mockResolvedValueOnce({
      data: { data: { organizationId: 'o3', name: 'Acme' } },
    });
    await store.dispatch(fetchOrganizationById('o3'));
    expect(store.getState().organizations.selected.name).toBe('Acme');

    updateOrganizationRequest.mockResolvedValueOnce({
      data: { data: { organizationId: 'o3', name: 'New' } },
    });
    await store.dispatch(updateOrganization({ organizationId: 'o3', payload: {} }));
    expect(store.getState().organizations.selected.name).toBe('New');

    deleteOrganizationRequest.mockResolvedValueOnce({});
    await store.dispatch(deleteOrganization('o3'));
    expect(store.getState().organizations.items.find((o) => o.organizationId === 'o3')).toBeUndefined();
    expect(store.getState().organizations.selected).toBeNull();

    sendAdminPasswordResetRequest.mockResolvedValueOnce({ data: { data: { ok: true } } });
    await store.dispatch(sendAdminPasswordReset('o1'));
    expect(store.getState().organizations.resettingAdminPassword).toBe(false);

    sendAdminPasswordResetRequest.mockRejectedValueOnce({});
    await store.dispatch(sendAdminPasswordReset('o1'));
    expect(store.getState().organizations.error).toBe('Failed to send reset email');

    createOrganizationRequest.mockResolvedValueOnce({ data: { data: { id: 'x' } } });
    await store.dispatch(createOrganization({}));
    // no extraReducers for create — creating stays false
    expect(store.getState().organizations.creating).toBe(false);

    store.dispatch(clearSelectedOrg());
    listOrganizationsRequest.mockRejectedValueOnce({
      response: { data: { message: 'boom' } },
    });
    await store.dispatch(fetchOrganizations());
    expect(store.getState().organizations.error).toBe('boom');
  });
});

describe('registrationSlice', () => {
  beforeEach(() => vi.clearAllMocks());

  const makeStore = () =>
    configureStore({ reducer: { registrations: registrationReducer } });

  it('fetch/create/resend lifecycles', async () => {
    const store = makeStore();
    listRegistrationsRequest.mockResolvedValueOnce({
      data: { data: [{ registrationId: 'r1' }], pagination: { page: 1 } },
    });
    await store.dispatch(fetchRegistrations());
    expect(store.getState().registrations.items).toHaveLength(1);

    createRegistrationRequest.mockResolvedValueOnce({
      data: { data: { registrationId: 'r2' } },
    });
    await store.dispatch(createRegistration({}));
    expect(store.getState().registrations.lastCreated.registrationId).toBe('r2');
    store.dispatch(clearLastRegistration());
    expect(store.getState().registrations.lastCreated).toBeNull();

    resendRegistrationRequest.mockResolvedValueOnce({ data: { data: {} } });
    await store.dispatch(resendVerification('r1'));
    expect(store.getState().registrations.resendingId).toBeNull();

    resendRegistrationRequest.mockRejectedValueOnce({});
    await store.dispatch(resendVerification('r1'));
    expect(store.getState().registrations.resendingId).toBeNull();
    // rejected does not set error by design
    expect(store.getState().registrations.error).toBeNull();

    createRegistrationRequest.mockRejectedValueOnce({});
    await store.dispatch(createRegistration({}));
    expect(store.getState().registrations.error).toBe('Failed to send verification');
  });
});
