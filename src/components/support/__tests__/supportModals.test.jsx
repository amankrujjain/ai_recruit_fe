import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { CategoryFaqModal } from '@/components/support/CategoryFaqModal';
import { CreateTicketModal } from '@/components/support/CreateTicketModal';
import { MyTicketDetailModal } from '@/components/support/MyTicketDetailModal';
import { TicketDetailModal } from '@/components/support/TicketDetailModal';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

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
  getAdminTicketRequest: vi.fn(),
  getMyTicketRequest: vi.fn(),
}));

import { toast } from 'sonner';
import {
  createTicketRequest,
  listMyTicketsRequest,
  updateTicketStatusRequest,
  listAdminTicketsRequest,
} from '@/api/supportApi';

const supportState = (overrides = {}) => ({
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
  ...overrides,
});

const categories = [
  { categoryId: 'cat1', name: 'Billing', description: 'Payment questions' },
];

const faqs = [
  {
    faqId: 'f1',
    question: 'How do I pay?',
    shortDescription: 'Invoices',
    answer: 'Use the billing portal.',
  },
  {
    faqId: 'f2',
    question: 'Refunds?',
    answer: 'Contact support.',
  },
];

describe('CategoryFaqModal', () => {
  it('returns null when closed or category missing', () => {
    const { container, rerender } = renderWithProviders(
      <CategoryFaqModal open={false} onOpenChange={vi.fn()} category={categories[0]} faqs={faqs} />
    );
    expect(container).toBeEmptyDOMElement();

    rerender(
      <CategoryFaqModal open onOpenChange={vi.fn()} category={null} faqs={faqs} />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders empty FAQs, toggles accordion, and closes via overlay/X/Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = renderWithProviders(
      <CategoryFaqModal
        open
        onOpenChange={onOpenChange}
        category={{ name: 'Empty', description: null }}
        faqs={[]}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/no faqs are available/i)).toBeInTheDocument();
    expect(screen.queryByText(/payment questions/i)).toBeNull();

    rerender(
      <CategoryFaqModal
        open
        onOpenChange={onOpenChange}
        category={categories[0]}
        faqs={faqs}
      />
    );

    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Payment questions')).toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /how do i pay/i }));
    expect(screen.getByText('Use the billing portal.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /how do i pay/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await user.click(screen.getByRole('button', { name: /how do i pay/i }));
    expect(screen.queryByText('Use the billing portal.')).toBeNull();

    await user.click(screen.getByRole('button', { name: /refunds/i }));
    expect(screen.getByText('Contact support.')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/close dialog overlay/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.click(screen.getByLabelText(/^close$/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('resets open FAQ when closed', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <CategoryFaqModal open onOpenChange={vi.fn()} category={categories[0]} faqs={faqs} />
    );
    await user.click(screen.getByRole('button', { name: /how do i pay/i }));
    expect(screen.getByText('Use the billing portal.')).toBeInTheDocument();

    rerender(
      <CategoryFaqModal open={false} onOpenChange={vi.fn()} category={categories[0]} faqs={faqs} />
    );
    rerender(
      <CategoryFaqModal open onOpenChange={vi.fn()} category={categories[0]} faqs={faqs} />
    );
    expect(screen.queryByText('Use the billing portal.')).toBeNull();
  });
});

describe('CreateTicketModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMyTicketsRequest.mockResolvedValue({
      data: { data: [], pagination: { page: 1 } },
    });
  });

  it('returns null when closed', () => {
    const { container } = renderWithProviders(
      <CreateTicketModal open={false} onOpenChange={vi.fn()} categories={categories} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('submits ticket, toasts success, and closes', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    createTicketRequest.mockResolvedValueOnce({
      data: { data: { ticketId: 't1', ticketNumber: 'TKT-100' } },
    });

    renderWithProviders(
      <CreateTicketModal open onOpenChange={onOpenChange} categories={categories} />
    );

    await user.type(screen.getByPlaceholderText(/brief summary/i), 'Need help now');
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Billing' }));
    await user.type(
      screen.getByPlaceholderText(/provide as much detail/i),
      'Detailed issue description'
    );

    await user.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Ticket TKT-100 created')
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(createTicketRequest).toHaveBeenCalledWith({
      subject: 'Need help now',
      categoryId: 'cat1',
      description: 'Detailed issue description',
    });
  }, 15000);

  it('shows error, keeps submit gated without category, and closes via cancel/X/overlay/Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <CreateTicketModal open onOpenChange={onOpenChange} categories={categories} />,
      {
        preloadedState: {
          support: supportState({ error: 'Something went wrong' }),
        },
      }
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit ticket/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.click(screen.getByLabelText(/^close$/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.click(screen.getByLabelText(/close dialog overlay/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('blocks overlay/Escape close while saving and shows Submitting label', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <CreateTicketModal open onOpenChange={onOpenChange} categories={categories} />,
      {
        preloadedState: {
          support: supportState({ ticketSaving: true }),
        },
      }
    );

    expect(screen.getByRole('button', { name: /submitting\.\.\./i })).toBeDisabled();
    expect(screen.getByLabelText(/^close$/i)).toBeDisabled();

    await user.click(screen.getByLabelText(/close dialog overlay/i));
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe('MyTicketDetailModal', () => {
  const baseTicket = {
    ticketId: 't1',
    ticketNumber: 'TKT-1',
    subject: 'Login issue',
    description: 'Cannot sign in',
    status: 'OPEN',
    category: { name: 'Access' },
    createdAt: '2024-05-01T10:00:00.000Z',
  };

  it('returns null when closed or ticket missing', () => {
    const { container, rerender } = renderWithProviders(
      <MyTicketDetailModal open={false} onOpenChange={vi.fn()} ticket={baseTicket} />
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<MyTicketDetailModal open onOpenChange={vi.fn()} ticket={null} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders status variants, optional fields, and closes via controls/Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = renderWithProviders(
      <MyTicketDetailModal open onOpenChange={onOpenChange} ticket={baseTicket} />
    );

    expect(screen.getByText('TKT-1')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Access')).toBeInTheDocument();
    expect(screen.getByText('Cannot sign in')).toBeInTheDocument();
    expect(screen.queryByText(/resolution note/i)).toBeNull();
    expect(screen.queryByText(/^resolved$/i)).toBeNull();

    rerender(
      <MyTicketDetailModal
        open
        onOpenChange={onOpenChange}
        ticket={{
          ...baseTicket,
          status: 'IN_PROGRESS',
          category: null,
          createdAt: null,
          resolutionNote: null,
        }}
      />
    );
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    rerender(
      <MyTicketDetailModal
        open
        onOpenChange={onOpenChange}
        ticket={{
          ...baseTicket,
          status: 'RESOLVED',
          resolvedAt: '2024-05-02T10:00:00.000Z',
          resolutionNote: 'Fixed credentials',
        }}
      />
    );
    expect(screen.getAllByText('Resolved').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Fixed credentials')).toBeInTheDocument();

    rerender(
      <MyTicketDetailModal
        open
        onOpenChange={onOpenChange}
        ticket={{ ...baseTicket, status: 'CUSTOM_STATUS' }}
      />
    );
    expect(screen.getByText('CUSTOM_STATUS')).toBeInTheDocument();

    await user.click(screen.getByText(/^close$/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.click(screen.getByLabelText(/^close$/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.click(screen.getByLabelText(/close dialog overlay/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('TicketDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listAdminTicketsRequest.mockResolvedValue({
      data: { data: [], pagination: { page: 1, total: 0 } },
    });
  });

  const ticket = {
    ticketId: 't1',
    ticketNumber: 'TKT-9',
    subject: 'Billing bug',
    description: 'Invoice wrong',
    status: 'OPEN',
    resolutionNote: 'Looking into it',
    organization: { organizationName: 'Acme' },
    raisedBy: { firstName: 'Ada', lastName: 'Lovelace' },
    category: { name: 'Billing' },
    createdAt: '2024-05-01T10:00:00.000Z',
  };

  it('returns null when closed or ticket missing', () => {
    const { container, rerender } = renderWithProviders(
      <TicketDetailModal open={false} onOpenChange={vi.fn()} ticket={ticket} />
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<TicketDetailModal open onOpenChange={vi.fn()} ticket={null} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('updates status, toasts success, and closes', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    updateTicketStatusRequest.mockResolvedValueOnce({
      data: { data: { ...ticket, status: 'RESOLVED' } },
    });

    renderWithProviders(
      <TicketDetailModal
        open
        onOpenChange={onOpenChange}
        ticket={ticket}
        listParams={{ page: 2, limit: 10 }}
      />
    );

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Resolved' }));
    await user.clear(screen.getByPlaceholderText(/optional note/i));
    await user.type(screen.getByPlaceholderText(/optional note/i), 'All set');

    await user.click(screen.getByRole('button', { name: /update ticket/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Ticket updated'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(updateTicketStatusRequest).toHaveBeenCalledWith('t1', {
      status: 'RESOLVED',
      resolutionNote: 'All set',
    });
    expect(listAdminTicketsRequest).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });

  it('covers missing nested fields, error display, cancel/close/Escape, and saving guard', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const { rerender } = renderWithProviders(
      <TicketDetailModal
        open
        onOpenChange={onOpenChange}
        ticket={{
          ...ticket,
          status: 'IN_PROGRESS',
          organization: null,
          raisedBy: { firstName: '', lastName: '' },
          category: null,
          createdAt: null,
          resolutionNote: null,
        }}
      />,
      {
        preloadedState: {
          support: supportState({ error: 'Update failed' }),
        },
      }
    );

    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Update failed')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.click(screen.getByLabelText(/^close$/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.click(screen.getByLabelText(/close dialog overlay/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(
      <TicketDetailModal
        open
        onOpenChange={onOpenChange}
        ticket={{ ...ticket, status: 'WEIRD', raisedBy: null }}
      />
    );
    expect(screen.getByText('WEIRD')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);

    onOpenChange.mockClear();
    rerender(
      <TicketDetailModal open onOpenChange={onOpenChange} ticket={ticket} />
    );
  });

  it('blocks overlay/Escape while saving', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <TicketDetailModal open onOpenChange={onOpenChange} ticket={ticket} />,
      {
        preloadedState: {
          support: supportState({ ticketSaving: true }),
        },
      }
    );

    expect(screen.getByRole('button', { name: /saving\.\.\./i })).toBeDisabled();
    await user.click(screen.getByLabelText(/close dialog overlay/i));
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
