import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { PageTitleProvider } from '@/context/PageTitleContext';
import { AllOrganizationsPage } from '@/pages/super-admin/AllOrganizationsPage';
import { ManageOrganizationPage } from '@/pages/super-admin/ManageOrganizationPage';
import { PreRegisteredPage } from '@/pages/super-admin/PreRegisteredPage';
import { SupportCategoriesPage } from '@/pages/super-admin/SupportCategoriesPage';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/organizationApi', () => ({
  listOrganizationsRequest: vi.fn(),
  listRegistrationsRequest: vi.fn(),
  createOrganizationRequest: vi.fn(),
  getOrganizationRequest: vi.fn(),
  updateOrganizationRequest: vi.fn(),
  deleteOrganizationRequest: vi.fn(),
  sendAdminPasswordResetRequest: vi.fn(),
  createRegistrationRequest: vi.fn(),
  resendRegistrationRequest: vi.fn(),
}));

vi.mock('@/api/countryApi', () => ({
  listCountriesRequest: vi.fn(),
}));

vi.mock('@/api/supportApi', () => ({
  listAdminCategoriesRequest: vi.fn(),
  listAdminFaqsRequest: vi.fn(),
  listAdminTicketsRequest: vi.fn(),
  createCategoryRequest: vi.fn(),
  updateCategoryRequest: vi.fn(),
  deleteCategoryRequest: vi.fn(),
  createFaqRequest: vi.fn(),
  updateFaqRequest: vi.fn(),
  deleteFaqRequest: vi.fn(),
  updateTicketStatusRequest: vi.fn(),
}));

vi.mock('@/components/super-admin/ManageOrgPanel', () => ({
  ManageOrgPanel: ({ organizationId, onDeleted }) => (
    <div data-testid="manage-org-panel">
      <span>
        {organizationId
          ? `Managing ${organizationId}`
          : 'Select an organization from the list to manage it.'}
      </span>
      {organizationId ? (
        <button type="button" onClick={onDeleted}>
          Simulate delete
        </button>
      ) : null}
    </div>
  ),
}));

const captured = {
  ticketDetailModal: null,
};

vi.mock('@/components/support/TicketDetailModal', () => ({
  TicketDetailModal: (props) => {
    captured.ticketDetailModal = props;
    if (!props.open) return null;
    return (
      <div data-testid="ticket-detail-modal">
        <span>{props.ticket?.ticketNumber}</span>
        <button type="button" onClick={() => props.onOpenChange(false)}>
          Close ticket modal
        </button>
      </div>
    );
  },
}));

import { toast } from 'sonner';
import { listOrganizationsRequest, listRegistrationsRequest, getOrganizationRequest } from '@/api/organizationApi';
import { listCountriesRequest } from '@/api/countryApi';
import {
  listAdminCategoriesRequest,
  listAdminFaqsRequest,
  listAdminTicketsRequest,
  createCategoryRequest,
  updateCategoryRequest,
  deleteCategoryRequest,
  createFaqRequest,
  updateFaqRequest,
  deleteFaqRequest,
} from '@/api/supportApi';

const orgItems = [
  {
    organizationId: 'org-1',
    organizationName: 'Acme Corp',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const registrationItems = [
  {
    registrationId: 'reg-1',
    organizationName: 'Pending Co',
    adminEmail: 'admin@pending.com',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

const categoryItems = [
  {
    categoryId: 'cat-1',
    name: 'Billing',
    description: 'Payment help',
    audience: ['ADMIN', 'RECRUITER'],
    sortOrder: 1,
  },
  {
    categoryId: 'cat-2',
    name: 'Empty audience',
    description: '',
    audience: [],
    sortOrder: 2,
  },
];

const faqItems = [
  {
    faqId: 'faq-1',
    categoryId: 'cat-1',
    question: 'How do I pay?',
    answer: 'Use the portal.',
    shortDescription: 'Payments',
    category: { name: 'Billing' },
  },
];

const ticketItems = [
  {
    ticketId: 't-1',
    ticketNumber: 'TKT-001',
    subject: 'Login issue',
    status: 'OPEN',
    createdAt: '2026-01-03T00:00:00.000Z',
    organization: { organizationName: 'Acme Corp' },
    raisedBy: { firstName: 'Jane', lastName: 'Doe' },
    category: { name: 'Billing' },
  },
  {
    ticketId: 't-2',
    ticketNumber: 'TKT-002',
    subject: 'Billing question',
    status: 'IN_PROGRESS',
    createdAt: '2026-01-04T00:00:00.000Z',
    organization: null,
    raisedBy: null,
    category: null,
  },
  {
    ticketId: 't-3',
    ticketNumber: 'TKT-003',
    subject: 'Resolved ticket',
    status: 'RESOLVED',
    createdAt: '2026-01-05T00:00:00.000Z',
    organization: { organizationName: 'Acme Corp' },
    raisedBy: { firstName: 'John', lastName: '' },
    category: { name: 'Billing' },
  },
];

function renderPage(ui, options = {}) {
  return renderWithProviders(<PageTitleProvider>{ui}</PageTitleProvider>, options);
}

describe('AllOrganizationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listOrganizationsRequest.mockResolvedValue({
      data: { data: orgItems, pagination: { page: 1, totalPages: 1, total: 1 } },
    });
  });

  it('loads organizations and supports search/sort', async () => {
    const user = userEvent.setup();
    renderPage(<AllOrganizationsPage />);

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText('Search verified organizations...'), 'acme');
    await waitFor(() => expect(listOrganizationsRequest).toHaveBeenCalled());

    await user.selectOptions(screen.getByDisplayValue('Created date'), 'organizationName');
    await user.selectOptions(screen.getByDisplayValue('Newest'), 'asc');
    await waitFor(() => expect(listOrganizationsRequest.mock.calls.length).toBeGreaterThan(2));
  });

  it('shows skeleton on initial load', () => {
    listOrganizationsRequest.mockReturnValue(new Promise(() => {}));
    renderPage(<AllOrganizationsPage />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });
});

describe('ManageOrganizationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listOrganizationsRequest.mockResolvedValue({
      data: { data: orgItems, pagination: { page: 1, totalPages: 1, total: 1 } },
    });
    listCountriesRequest.mockResolvedValue({
      data: { data: [{ countryId: 'c1', name: 'India' }] },
    });
  });

  it('loads org list and countries with toolbar controls', async () => {
    const user = userEvent.setup();
    getOrganizationRequest.mockResolvedValue({
      data: { data: { organizationId: 'org-1', organizationName: 'Acme Corp' } },
    });

    renderPage(<ManageOrganizationPage />);

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    expect(screen.getByText(/select an organization from the list/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search organizations to manage...'), 'acme');
    await waitFor(() => expect(listOrganizationsRequest).toHaveBeenCalled());

    await user.click(screen.getByText('Acme Corp'));
    await waitFor(() => expect(screen.getByText('Managing org-1')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Simulate delete' }));
    await waitFor(() =>
      expect(screen.getByText(/select an organization from the list/i)).toBeInTheDocument()
    );
  });
});

describe('PreRegisteredPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listRegistrationsRequest.mockResolvedValue({
      data: { data: registrationItems, pagination: { page: 1, totalPages: 1, total: 1 } },
    });
    listCountriesRequest.mockResolvedValue({
      data: { data: [{ countryId: 'c1', name: 'India' }] },
    });
  });

  it('renders registration table with search and create form', async () => {
    const user = userEvent.setup();
    renderPage(<PreRegisteredPage />);

    await waitFor(() => expect(screen.getByText('Pending Co')).toBeInTheDocument());
    expect(screen.getByText('Register organization')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search pending organizations...'), 'pending');
    await waitFor(() => expect(listRegistrationsRequest).toHaveBeenCalled());
  });
});

describe('SupportCategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.ticketDetailModal = null;
    listAdminCategoriesRequest.mockResolvedValue({ data: { data: categoryItems } });
    listAdminFaqsRequest.mockResolvedValue({ data: { data: faqItems } });
    listAdminTicketsRequest.mockResolvedValue({
      data: {
        data: ticketItems,
        pagination: { page: 1, totalPages: 1, total: 3 },
      },
    });
    createCategoryRequest.mockResolvedValue({ data: { data: { categoryId: 'cat-new' } } });
    updateCategoryRequest.mockResolvedValue({ data: { data: { categoryId: 'cat-1' } } });
    deleteCategoryRequest.mockResolvedValue({});
    createFaqRequest.mockResolvedValue({ data: { data: { faqId: 'faq-new' } } });
    updateFaqRequest.mockResolvedValue({ data: { data: { faqId: 'faq-1' } } });
    deleteFaqRequest.mockResolvedValue({});
    window.confirm = vi.fn(() => true);
  });

  it('renders categories tab with list and empty-audience formatting', async () => {
    renderPage(<SupportCategoriesPage />);

    await waitFor(() => expect(screen.getByText('Billing')).toBeInTheDocument());
    expect(screen.getByText('Admin, Recruiter')).toBeInTheDocument();

    const emptyAudienceRow = screen.getByText('Empty audience').closest('tr');
    expect(within(emptyAudienceRow).getAllByText('—')).toHaveLength(2);
  });

  it('creates category after audience validation', async () => {
    const user = userEvent.setup();
    renderPage(<SupportCategoriesPage />);
    await waitFor(() => expect(screen.getByText('Billing')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Add category' }));
    const form = screen.getByRole('heading', { name: 'Add category' }).closest('form');

    await user.clear(within(form).getByRole('textbox', { name: 'Name' }));
    await user.type(within(form).getByRole('textbox', { name: 'Name' }), 'Support');
    await user.click(within(form).getByRole('checkbox', { name: 'Admin' }));
    await user.click(within(form).getByRole('checkbox', { name: 'Recruiter' }));
    await user.click(within(form).getByRole('button', { name: 'Save category' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
      'Select at least one audience (Admin or Recruiter)'
    ));

    await user.click(within(form).getByRole('checkbox', { name: 'Admin' }));
    await user.click(within(form).getByRole('button', { name: 'Save category' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Support category created'));
  });

  it('edits and deletes category with confirm', async () => {
    const user = userEvent.setup();
    renderPage(<SupportCategoriesPage />);
    await waitFor(() => expect(screen.getByText('Billing')).toBeInTheDocument());

    const row = screen.getByText('Billing').closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('heading', { name: 'Edit category' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('heading', { name: 'Edit category' })).toBeNull();

    await user.click(within(row).getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save category' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Support category updated'));

    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Support category deleted'));
  });

  it('shows categories loading and error states', async () => {
    listAdminCategoriesRequest.mockRejectedValueOnce({
      response: { data: { message: 'Categories failed' } },
    });
    renderPage(<SupportCategoriesPage />);
    await waitFor(() => expect(screen.getByText('Categories failed')).toBeInTheDocument());
  });

  it('faqs tab prompts to create category first when none exist', async () => {
    const user = userEvent.setup();
    listAdminCategoriesRequest.mockResolvedValue({ data: { data: [] } });
    listAdminFaqsRequest.mockResolvedValue({ data: { data: [] } });
    renderPage(<SupportCategoriesPage />);

    await user.click(await screen.findByRole('button', { name: 'FAQs' }));
    await waitFor(() =>
      expect(screen.getByText(/create a category first, then add faqs/i)).toBeInTheDocument()
    );
  });

  it('toasts when FAQ submitted without category', async () => {
    const user = userEvent.setup();
    listAdminCategoriesRequest.mockResolvedValue({ data: { data: [] } });
    listAdminFaqsRequest.mockResolvedValue({ data: { data: [] } });
    renderPage(<SupportCategoriesPage />);

    await user.click(await screen.findByRole('button', { name: 'FAQs' }));
    await user.click(screen.getByRole('button', { name: 'Add FAQ' }));

    const faqForm = (await screen.findByRole('heading', { name: 'Add FAQ' })).closest('form');
    fireEvent.submit(faqForm);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Select a category'));
  });

  it('faqs tab create/edit/delete lifecycle', async () => {
    const user = userEvent.setup();
    renderPage(<SupportCategoriesPage />);
    await waitFor(() => expect(screen.getByText('Billing')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'FAQs' }));
    await waitFor(() => expect(screen.getByText('How do I pay?')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Add FAQ' }));
    const faqForm = screen.getByRole('heading', { name: 'Add FAQ' }).closest('form');
    await user.type(within(faqForm).getByLabelText('Question'), 'What is billing?');
    await user.type(within(faqForm).getByLabelText('Answer'), 'Billing is monthly.');
    await user.click(within(faqForm).getByRole('button', { name: 'Save FAQ' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Support FAQ created'));

    const faqRow = screen.getByText('How do I pay?').closest('tr');
    await user.click(within(faqRow).getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save FAQ' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Support FAQ updated'));

    await user.click(within(faqRow).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Support FAQ deleted'));
  }, 15000);

  it('faqs tab shows no faqs when categories exist but faqs empty', async () => {
    const user = userEvent.setup();
    listAdminCategoriesRequest.mockResolvedValueOnce({
      data: { data: [{ categoryId: 'c1', name: 'General', audience: ['ADMIN'], sortOrder: 0 }] },
    });
    listAdminFaqsRequest.mockResolvedValueOnce({ data: { data: [] } });
    renderPage(<SupportCategoriesPage />);

    await waitFor(() => expect(screen.getByText('General')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'FAQs' }));
    await waitFor(() => expect(screen.getByText('No FAQs found.')).toBeInTheDocument());
  });

  it('tickets tab filters, lists statuses, and opens ticket modal', async () => {
    const user = userEvent.setup();
    renderPage(<SupportCategoriesPage />);
    await waitFor(() => expect(screen.getByText('Billing')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Tickets' }));
    await waitFor(() => expect(screen.getByText('TKT-001')).toBeInTheDocument());
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Ticket number or subject...'), 'login');
    await waitFor(() => expect(listAdminTicketsRequest).toHaveBeenCalled());

    const ticketRow = screen.getByText('TKT-001').closest('tr');
    await user.click(within(ticketRow).getByRole('button', { name: 'View' }));
    expect(screen.getByTestId('ticket-detail-modal')).toBeInTheDocument();
    expect(captured.ticketDetailModal.listParams).toMatchObject({ page: 1, limit: 20 });

    await user.click(screen.getByRole('button', { name: 'Close ticket modal' }));
    expect(screen.queryByTestId('ticket-detail-modal')).toBeNull();
  });

  it('tickets tab loading and empty states', async () => {
    const user = userEvent.setup();
    listAdminTicketsRequest.mockReturnValue(new Promise(() => {}));
    renderPage(<SupportCategoriesPage />);
    await waitFor(() => expect(screen.getByText('Billing')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Tickets' }));
    expect(screen.getByText(/loading tickets/i)).toBeInTheDocument();

    listAdminTicketsRequest.mockResolvedValueOnce({
      data: { data: [], pagination: { page: 1, totalPages: 1, total: 0 } },
    });
    renderPage(<SupportCategoriesPage />);
    await user.click(screen.getAllByRole('button', { name: 'Tickets' })[1]);
    await waitFor(() => expect(screen.getByText(/no support tickets found/i)).toBeInTheDocument());
  });

  it('shows tickets tab error and missing ticket metadata fallbacks', async () => {
    const user = userEvent.setup();
    listAdminTicketsRequest.mockResolvedValueOnce({
      data: {
        data: [
          {
            ticketId: 't-empty',
            ticketNumber: 'TKT-000',
            subject: 'No metadata',
            status: 'OPEN',
            createdAt: null,
            organization: null,
            raisedBy: { firstName: '', lastName: '' },
            category: null,
          },
        ],
        pagination: { page: 1, totalPages: 1, total: 1 },
      },
    });
    renderPage(<SupportCategoriesPage />);
    await waitFor(() => expect(screen.getByText('Billing')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Tickets' }));
    await waitFor(() => expect(screen.getByText('TKT-000')).toBeInTheDocument());
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    listAdminTicketsRequest.mockRejectedValueOnce({
      response: { data: { message: 'Tickets failed' } },
    });
    renderPage(<SupportCategoriesPage />);
    await user.click(screen.getAllByRole('button', { name: 'Tickets' }).at(-1));
    await waitFor(() => expect(screen.getByText('Tickets failed')).toBeInTheDocument());
  });

  it('shows faqs tab delete error', async () => {
    const user = userEvent.setup();
    renderPage(<SupportCategoriesPage />);
    await waitFor(() => expect(screen.getByText('Billing')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'FAQs' }));
    await waitFor(() => expect(screen.getByText('How do I pay?')).toBeInTheDocument());

    deleteFaqRequest.mockRejectedValueOnce({
      response: { data: { message: 'FAQs failed' } },
    });
    const faqRow = screen.getByText('How do I pay?').closest('tr');
    await user.click(within(faqRow).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.getByText('FAQs failed')).toBeInTheDocument());
  });

  it('clears error when switching tabs', async () => {
    const user = userEvent.setup();
    listAdminCategoriesRequest.mockRejectedValueOnce({
      response: { data: { message: 'Load error' } },
    });
    renderPage(<SupportCategoriesPage />);
    await waitFor(() => expect(screen.getByText('Load error')).toBeInTheDocument());

    listAdminFaqsRequest.mockResolvedValueOnce({ data: { data: faqItems } });
    await user.click(screen.getByRole('button', { name: 'FAQs' }));
    await waitFor(() => expect(screen.getByText('How do I pay?')).toBeInTheDocument());
  });
});
