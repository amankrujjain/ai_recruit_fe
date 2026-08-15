import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { AdminInviteFields } from '@/components/super-admin/AdminInviteFields';
import { CreateOrgForm } from '@/components/super-admin/CreateOrgForm';
import { ListToolbar } from '@/components/super-admin/ListToolbar';
import { ManageOrgPanel } from '@/components/super-admin/ManageOrgPanel';
import { OrgDetailsFields } from '@/components/super-admin/OrgDetailsFields';
import { OrgListTable } from '@/components/super-admin/OrgListTable';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { RegistrationTable } from '@/components/super-admin/RegistrationTable';
import { VerificationSuccessBanner } from '@/components/super-admin/VerificationSuccessBanner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

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

vi.mock('@/api/countryApi', () => ({
  listCountriesRequest: vi.fn(),
}));

import { toast } from 'sonner';
import {
  getOrganizationRequest,
  updateOrganizationRequest,
  deleteOrganizationRequest,
  sendAdminPasswordResetRequest,
  createRegistrationRequest,
  resendRegistrationRequest,
} from '@/api/organizationApi';

const countries = [{ countryId: 'c1', name: 'United Kingdom' }];

describe('AdminInviteFields', () => {
  it('renders fields and forwards onChange handlers', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn((field) => vi.fn());
    const handlers = {
      adminFirstName: vi.fn(),
      adminLastName: vi.fn(),
      adminEmail: vi.fn(),
    };
    onChange.mockImplementation((field) => handlers[field]);

    renderWithProviders(
      <AdminInviteFields
        form={{ adminFirstName: '', adminLastName: '', adminEmail: '' }}
        onChange={onChange}
      />
    );

    expect(onChange).toHaveBeenCalledWith('adminFirstName');
    expect(onChange).toHaveBeenCalledWith('adminLastName');
    expect(onChange).toHaveBeenCalledWith('adminEmail');

    await user.type(screen.getByLabelText(/admin first name/i), 'Jane');
    await user.type(screen.getByLabelText(/admin last name/i), 'Smith');
    await user.type(screen.getByLabelText(/admin email/i), 'a@b.com');

    expect(handlers.adminFirstName).toHaveBeenCalled();
    expect(handlers.adminLastName).toHaveBeenCalled();
    expect(handlers.adminEmail).toHaveBeenCalled();
  });
});

describe('OrgDetailsFields', () => {
  it('renders org fields, country options, and disables select while loading', async () => {
    const user = userEvent.setup();
    const handlers = {
      organizationName: vi.fn(),
      countryId: vi.fn(),
      city: vi.fn(),
    };
    const onChange = (field) => handlers[field];

    const { rerender } = renderWithProviders(
      <OrgDetailsFields
        form={{ organizationName: '', countryId: '', city: '' }}
        onChange={onChange}
        countries={countries}
        countriesLoading={false}
      />
    );

    await user.type(screen.getByLabelText(/organization name/i), 'Acme');
    await user.selectOptions(screen.getByLabelText(/country/i), 'c1');
    await user.type(screen.getByLabelText(/^city$/i), 'London');

    expect(handlers.organizationName).toHaveBeenCalled();
    expect(handlers.countryId).toHaveBeenCalled();
    expect(handlers.city).toHaveBeenCalled();
    expect(screen.getByRole('option', { name: 'United Kingdom' })).toBeInTheDocument();

    rerender(
      <OrgDetailsFields
        form={{ organizationName: '', countryId: '', city: '' }}
        onChange={onChange}
        countries={countries}
        countriesLoading
      />
    );
    expect(screen.getByLabelText(/country/i)).toBeDisabled();
  });
});

describe('ListToolbar', () => {
  it('wires search and sort controls including default placeholder', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onSortByChange = vi.fn();
    const onSortOrderChange = vi.fn();

    renderWithProviders(
      <ListToolbar
        search=""
        onSearchChange={onSearchChange}
        sortBy="createdAt"
        onSortByChange={onSortByChange}
        sortOrder="desc"
        onSortOrderChange={onSortOrderChange}
        sortOptions={[
          { value: 'createdAt', label: 'Created' },
          { value: 'name', label: 'Name' },
        ]}
      />
    );

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Search...'), 'acme');
    expect(onSearchChange).toHaveBeenCalled();

    await user.selectOptions(screen.getByDisplayValue('Created'), 'name');
    expect(onSortByChange).toHaveBeenCalledWith('name');

    await user.selectOptions(screen.getByDisplayValue('Newest'), 'asc');
    expect(onSortOrderChange).toHaveBeenCalledWith('asc');
  });

  it('uses custom placeholder', () => {
    renderWithProviders(
      <ListToolbar
        search=""
        onSearchChange={vi.fn()}
        sortBy="createdAt"
        onSortByChange={vi.fn()}
        sortOrder="desc"
        onSortOrderChange={vi.fn()}
        sortOptions={[{ value: 'createdAt', label: 'Created' }]}
        placeholder="Find orgs..."
      />
    );
    expect(screen.getByPlaceholderText('Find orgs...')).toBeInTheDocument();
  });
});

describe('PaginationBar', () => {
  it('returns null when pagination missing or single page', () => {
    const { container, rerender } = renderWithProviders(
      <PaginationBar pagination={null} onPageChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<PaginationBar pagination={{ page: 1, totalPages: 1, total: 3 }} onPageChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /previous/i })).toBeNull();
  });

  it('paginates and disables edge buttons', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = renderWithProviders(
      <PaginationBar
        pagination={{ page: 1, totalPages: 3, total: 30 }}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText(/page 1 of 3 · 30 total/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    rerender(
      <PaginationBar
        pagination={{ page: 3, totalPages: 3, total: 30 }}
        onPageChange={onPageChange}
      />
    );
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe('OrgListTable', () => {
  it('covers loading, empty, and populated rows with location/status branches', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { rerender } = renderWithProviders(
      <OrgListTable items={[]} loading onSelect={onSelect} />
    );
    expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();

    rerender(<OrgListTable items={[]} loading={false} onSelect={onSelect} />);
    expect(screen.getByText(/no organizations found/i)).toBeInTheDocument();

    const items = [
      {
        organizationId: 'o1',
        organizationName: 'Acme',
        city: 'London',
        country: { name: 'UK' },
        _count: { accounts: 4 },
        isActive: true,
        createdAt: '2024-01-15T00:00:00.000Z',
      },
      {
        organizationId: 'o2',
        organizationName: 'Beta',
        city: '',
        country: null,
        isActive: false,
        createdAt: null,
      },
    ];

    rerender(<OrgListTable items={items} loading={false} onSelect={onSelect} />);
    expect(screen.getByText('London, UK')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    await user.click(screen.getByText('Acme'));
    expect(onSelect).toHaveBeenCalledWith('o1');
  });
});

describe('CreateOrgForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits successfully, toasts, resets, and calls onCreated', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    createRegistrationRequest.mockResolvedValueOnce({
      data: { data: { registrationId: 'r1' } },
    });

    renderWithProviders(<CreateOrgForm onCreated={onCreated} />, {
      preloadedState: {
        countries: { items: countries, loading: false },
      },
    });

    await user.type(screen.getByLabelText(/organization name/i), 'Acme');
    await user.selectOptions(screen.getByLabelText(/country/i), 'c1');
    await user.type(screen.getByLabelText(/^city$/i), 'London');
    await user.type(screen.getByLabelText(/admin first name/i), 'Jane');
    await user.type(screen.getByLabelText(/admin last name/i), 'Smith');
    await user.type(screen.getByLabelText(/admin email/i), 'admin@acme.com');
    await user.click(screen.getByRole('button', { name: /send verification link/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Verification link sent — organization will be created after admin confirms'
      )
    );
    expect(onCreated).toHaveBeenCalled();
    expect(screen.getByLabelText(/organization name/i)).toHaveValue('');
  });

  it('toasts error payload on failure', async () => {
    const user = userEvent.setup();
    createRegistrationRequest.mockRejectedValueOnce({
      response: { data: { message: 'email taken' } },
    });

    renderWithProviders(<CreateOrgForm />, {
      preloadedState: {
        countries: { items: countries, loading: false },
      },
    });

    await user.type(screen.getByLabelText(/organization name/i), 'Acme');
    await user.selectOptions(screen.getByLabelText(/country/i), 'c1');
    await user.type(screen.getByLabelText(/^city$/i), 'London');
    await user.type(screen.getByLabelText(/admin first name/i), 'Jane');
    await user.type(screen.getByLabelText(/admin last name/i), 'Smith');
    await user.type(screen.getByLabelText(/admin email/i), 'admin@acme.com');
    await user.click(screen.getByRole('button', { name: /send verification link/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('email taken'));
  });

  it('shows Sending label while creating', () => {
    renderWithProviders(<CreateOrgForm />, {
      preloadedState: {
        countries: { items: countries, loading: false },
        registrations: {
          items: [],
          pagination: null,
          loading: false,
          creating: true,
          resendingId: null,
          lastCreated: null,
          error: null,
        },
      },
    });
    expect(screen.getByRole('button', { name: /sending\.\.\./i })).toBeDisabled();
  });
});

describe('ManageOrgPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  const org = {
    organizationId: 'o1',
    organizationName: 'Acme',
    city: 'London',
    countryId: 'c1',
    isActive: true,
  };

  it('prompts to select when organizationId is missing', () => {
    renderWithProviders(<ManageOrgPanel organizationId={null} />);
    expect(screen.getByText(/select an organization from the list/i)).toBeInTheDocument();
  });

  it('shows loading while fetching or form unset', () => {
    getOrganizationRequest.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ManageOrgPanel organizationId="o1" />, {
      preloadedState: {
        organizations: {
          items: [],
          pagination: null,
          selected: null,
          loading: true,
          saving: false,
          deleting: false,
          creating: false,
          resettingAdminPassword: false,
          error: null,
        },
      },
    });
    expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it('loads org, updates fields, saves, resets password, and deletes', async () => {
    const user = userEvent.setup();
    getOrganizationRequest.mockResolvedValue({ data: { data: org } });
    updateOrganizationRequest.mockResolvedValueOnce({
      data: { data: { ...org, city: 'Manchester', isActive: false } },
    });
    sendAdminPasswordResetRequest.mockResolvedValueOnce({
      data: { data: { email: 'admin@acme.com' } },
    });
    deleteOrganizationRequest.mockResolvedValueOnce({});

    function Harness() {
      const [organizationId, setOrganizationId] = React.useState('o1');
      return (
        <ManageOrgPanel
          organizationId={organizationId}
          onDeleted={() => setOrganizationId(null)}
        />
      );
    }

    renderWithProviders(<Harness />, {
      preloadedState: {
        countries: { items: countries, loading: false },
      },
    });

    await waitFor(() => expect(screen.getByLabelText(/organization name/i)).toHaveValue('Acme'));

    await user.clear(screen.getByLabelText(/^city$/i));
    await user.type(screen.getByLabelText(/^city$/i), 'Manchester');
    await user.selectOptions(screen.getByLabelText(/status/i), 'false');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Organization updated'));
    expect(updateOrganizationRequest).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ city: 'Manchester', isActive: false })
    );

    await user.click(screen.getByRole('button', { name: /send admin reset link/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Reset link sent to admin@acme.com')
    );

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Organization deleted'));
    expect(screen.getByText(/select an organization from the list/i)).toBeInTheDocument();
  });

  it('toasts fallback messages on update/delete/reset failures and reset without email', async () => {
    const user = userEvent.setup();
    getOrganizationRequest.mockResolvedValue({
      data: {
        data: {
          organizationId: 'o1',
          organizationName: 'Acme',
          city: null,
          countryId: null,
          isActive: undefined,
        },
      },
    });
    updateOrganizationRequest.mockRejectedValueOnce({});
    sendAdminPasswordResetRequest
      .mockResolvedValueOnce({ data: { data: {} } })
      .mockRejectedValueOnce({ response: { data: { message: 'reset blocked' } } });
    deleteOrganizationRequest.mockRejectedValueOnce({
      response: { data: { message: 'cannot delete' } },
    });

    renderWithProviders(<ManageOrgPanel organizationId="o1" />, {
      preloadedState: {
        countries: { items: countries, loading: false },
      },
    });

    await waitFor(() => expect(screen.getByLabelText(/organization name/i)).toHaveValue('Acme'));

    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to update organization'));

    await user.click(screen.getByRole('button', { name: /send admin reset link/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Password reset email sent to admin')
    );

    await user.click(screen.getByRole('button', { name: /send admin reset link/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('reset blocked'));

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('cannot delete'));
  });

  it('shows saving and resetting button labels from store flags', async () => {
    getOrganizationRequest.mockResolvedValue({ data: { data: org } });

    renderWithProviders(<ManageOrgPanel organizationId="o1" />, {
      preloadedState: {
        countries: { items: countries, loading: false },
        organizations: {
          items: [],
          pagination: null,
          selected: org,
          loading: false,
          saving: true,
          deleting: false,
          creating: false,
          resettingAdminPassword: true,
          error: null,
        },
      },
    });

    await waitFor(() => expect(screen.getByRole('button', { name: /saving\.\.\./i })).toBeDisabled());
    expect(screen.getByRole('button', { name: /sending…/i })).toBeDisabled();
  });
});

describe('RegistrationTable', () => {
  beforeEach(() => vi.clearAllMocks());

  it('covers loading, empty, and resend success/error', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <RegistrationTable items={[]} loading />
    );
    expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();

    rerender(<RegistrationTable items={[]} loading={false} />);
    expect(screen.getByText(/no pending registrations/i)).toBeInTheDocument();

    const items = [
      {
        registrationId: 'r1',
        organizationName: 'Acme',
        adminFirstName: 'Jane',
        adminLastName: 'Smith',
        adminEmail: 'j@acme.com',
        city: 'London',
        country: { name: 'UK' },
        tokenExpiresAt: '2024-06-01T12:00:00.000Z',
      },
      {
        registrationId: 'r2',
        organizationName: 'Beta',
        adminFirstName: 'Bob',
        adminLastName: 'Lee',
        adminEmail: 'b@beta.com',
        city: '',
        country: null,
        tokenExpiresAt: null,
      },
    ];

    resendRegistrationRequest
      .mockResolvedValueOnce({ data: { data: {} } })
      .mockRejectedValueOnce({ response: { data: { message: 'rate limited' } } });

    renderWithProviders(<RegistrationTable items={items} loading={false} />);

    expect(screen.getByText('London, UK')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    const resendButtons = screen.getAllByRole('button', { name: /resend link/i });
    await user.click(resendButtons[0]);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('New verification link sent.')
    );

    await user.click(resendButtons[1]);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('rate limited'));
  });

  it('shows Sending label for the active resend id', () => {
    renderWithProviders(
      <RegistrationTable
        items={[
          {
            registrationId: 'r1',
            organizationName: 'Acme',
            adminFirstName: 'Jane',
            adminLastName: 'Smith',
            adminEmail: 'j@acme.com',
            city: 'London',
            country: { name: 'UK' },
            tokenExpiresAt: '2024-06-01T12:00:00.000Z',
          },
        ]}
        loading={false}
      />,
      {
        preloadedState: {
          registrations: {
            items: [],
            pagination: null,
            loading: false,
            creating: false,
            resendingId: 'r1',
            lastCreated: null,
            error: null,
          },
        },
      }
    );
    expect(screen.getByRole('button', { name: /sending\.\.\./i })).toBeDisabled();
  });
});

describe('VerificationSuccessBanner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null without invitation', () => {
    const { container } = renderWithProviders(<VerificationSuccessBanner />, {
      preloadedState: {
        registrations: {
          items: [],
          pagination: null,
          loading: false,
          creating: false,
          resendingId: null,
          lastCreated: { registration: { organizationName: 'Acme' } },
          error: null,
        },
      },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('copies link and clears banner', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { store } = renderWithProviders(<VerificationSuccessBanner />, {
      preloadedState: {
        registrations: {
          items: [],
          pagination: null,
          loading: false,
          creating: false,
          resendingId: null,
          lastCreated: {
            registration: { organizationName: 'Acme' },
            invitation: {
              email: 'admin@acme.com',
              inviteUrl: 'https://app.test/verify/abc',
            },
          },
          error: null,
        },
      },
    });

    expect(screen.getByText(/acme — pending verification/i)).toBeInTheDocument();
    expect(screen.getByText(/link sent to admin@acme.com/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith('https://app.test/verify/abc');
    expect(toast.success).toHaveBeenCalledWith('Verification link copied');

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);
    expect(store.getState().registrations.lastCreated).toBeNull();
  });

  it('handles missing inviteUrl', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderWithProviders(<VerificationSuccessBanner />, {
      preloadedState: {
        registrations: {
          items: [],
          pagination: null,
          loading: false,
          creating: false,
          resendingId: null,
          lastCreated: {
            registration: { organizationName: 'Acme' },
            invitation: { email: 'a@b.com' },
          },
          error: null,
        },
      },
    });

    await user.click(screen.getByRole('button', { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith('');
  });
});
