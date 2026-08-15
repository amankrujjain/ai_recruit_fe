import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { PageTitleProvider } from '@/context/PageTitleContext';
import { SupportCenterPage } from '@/pages/support/SupportCenterPage';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

vi.mock('@/api/supportApi', () => ({
  listSupportCategoriesRequest: vi.fn(),
  listSupportFaqsRequest: vi.fn(),
  listMyTicketsRequest: vi.fn(),
  createTicketRequest: vi.fn(),
}));

const captured = {
  categoryFaqModal: null,
  createTicketModal: null,
  myTicketDetailModal: null,
};

vi.mock('@/components/support/CategoryFaqModal', () => ({
  CategoryFaqModal: (props) => {
    captured.categoryFaqModal = props;
    if (!props.open) return null;
    return (
      <div data-testid="category-faq-modal">
        <span>{props.category?.name}</span>
        <span>FAQs: {props.faqs?.length ?? 0}</span>
        <button type="button" onClick={() => props.onOpenChange(false)}>
          Close category modal
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/support/CreateTicketModal', () => ({
  CreateTicketModal: (props) => {
    captured.createTicketModal = props;
    if (!props.open) return null;
    return (
      <div data-testid="create-ticket-modal">
        <button type="button" onClick={() => props.onOpenChange(false)}>
          Close create ticket
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/support/MyTicketDetailModal', () => ({
  MyTicketDetailModal: (props) => {
    captured.myTicketDetailModal = props;
    if (!props.open) return null;
    return (
      <div data-testid="my-ticket-detail-modal">
        <span>{props.ticket?.ticketNumber}</span>
        <button type="button" onClick={() => props.onOpenChange(false)}>
          Close my ticket
        </button>
      </div>
    );
  },
}));

import { toast } from 'sonner';
import {
  listSupportCategoriesRequest,
  listSupportFaqsRequest,
  listMyTicketsRequest,
} from '@/api/supportApi';

const categories = [
  {
    categoryId: 'cat-1',
    name: 'Getting Started',
    description: 'Onboarding help',
  },
];

const faqs = [
  {
    faqId: 'f1',
    categoryId: 'cat-1',
    question: 'How do I reset my password?',
    shortDescription: 'Password recovery steps',
    answer: 'Use the forgot password link.',
    category: { name: 'Getting Started' },
  },
  {
    faqId: 'f2',
    categoryId: 'cat-1',
    question: 'Billing cycles',
    shortDescription: 'Monthly billing info',
    answer: 'Invoices are sent monthly.',
    category: { name: 'Getting Started' },
  },
];

function makeTickets(now) {
  return [
    {
      ticketId: 't-open',
      ticketNumber: 'TKT-100',
      subject: 'Open ticket',
      status: 'OPEN',
      createdAt: new Date(now - 30 * 1000).toISOString(),
      updatedAt: new Date(now - 30 * 1000).toISOString(),
    },
    {
      ticketId: 't-progress',
      ticketNumber: 'TKT-101',
      subject: 'In progress ticket',
      status: 'IN_PROGRESS',
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      ticketId: 't-resolved',
      ticketNumber: 'TKT-105',
      subject: 'Resolved ticket',
      status: 'RESOLVED',
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: '2026-02-01T00:00:00.000Z',
    },
    {
      ticketId: 't-yesterday',
      ticketNumber: 'TKT-103',
      subject: 'Yesterday ticket',
      status: 'OPEN',
      createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
    },
    {
      ticketId: 't-hour',
      ticketNumber: 'TKT-106',
      subject: 'One hour ticket',
      status: 'OPEN',
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 60 * 60 * 1000).toISOString(),
    },
    {
      ticketId: 't-hours',
      ticketNumber: 'TKT-102',
      subject: 'Hours ticket',
      status: 'OPEN',
      createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function renderPage(preloadedState = {}) {
  return renderWithProviders(
    <PageTitleProvider>
      <SupportCenterPage />
    </PageTitleProvider>,
    { preloadedState }
  );
}

describe('SupportCenterPage', () => {
  const fixedNow = new Date('2026-02-10T12:00:00.000Z').getTime();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ now: fixedNow, shouldAdvanceTime: true });
    Object.keys(captured).forEach((key) => {
      captured[key] = null;
    });
    listSupportCategoriesRequest.mockResolvedValue({ data: { data: categories } });
    listSupportFaqsRequest.mockResolvedValue({ data: { data: faqs } });
    listMyTicketsRequest.mockResolvedValue({
      data: {
        data: makeTickets(fixedNow),
        pagination: { page: 1, totalPages: 1, total: 6 },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows loading then categories', async () => {
    listSupportCategoriesRequest.mockReturnValueOnce(new Promise(() => {}));
    renderPage({
      support: {
        categories: [],
        orgFaqs: [],
        myTickets: [],
        loading: true,
        orgFaqsLoading: false,
        myTicketsLoading: false,
        error: null,
      },
    });
    expect(screen.getByText(/loading help topics/i)).toBeInTheDocument();
  });

  it('shows empty categories message', async () => {
    listSupportCategoriesRequest.mockResolvedValueOnce({ data: { data: [] } });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no help topics available yet/i)).toBeInTheDocument()
    );
  });

  it('opens category modal with filtered faqs', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await waitFor(() => expect(screen.getByText('Getting Started')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /getting started/i }));

    expect(screen.getByTestId('category-faq-modal')).toBeInTheDocument();
    expect(screen.getByText('FAQs: 2')).toBeInTheDocument();
    expect(captured.categoryFaqModal.faqs).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Close category modal' }));
    expect(screen.queryByTestId('category-faq-modal')).toBeNull();
  });

  it('searches FAQs by question and shortDescription with expand/collapse', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await waitFor(() => expect(screen.getByText('Getting Started')).toBeInTheDocument());

    await user.type(
      screen.getByPlaceholderText('Search for articles, topics or keywords...'),
      'password'
    );
    expect(screen.getByText(/search results \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search for articles, topics or keywords...'));
    await user.type(
      screen.getByPlaceholderText('Search for articles, topics or keywords...'),
      'monthly billing'
    );
    expect(screen.getByText('Billing cycles')).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search for articles, topics or keywords...'));
    await user.type(
      screen.getByPlaceholderText('Search for articles, topics or keywords...'),
      'nomatch'
    );
    expect(screen.getByText(/no faqs match your search/i)).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search for articles, topics or keywords...'));
    await user.type(
      screen.getByPlaceholderText('Search for articles, topics or keywords...'),
      'password'
    );
    const faqButton = screen.getByRole('button', { name: /how do i reset my password/i });
    await user.click(faqButton);
    expect(screen.getByText('Use the forgot password link.')).toBeInTheDocument();
    await user.click(faqButton);
    expect(screen.queryByText('Use the forgot password link.')).toBeNull();
  });

  it('renders ticket statuses and relative time branches', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText('TKT-100')).toBeInTheDocument());
    expect(screen.getAllByText('Open').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();

    expect(screen.getByText('Just now')).toBeInTheDocument();
    expect(screen.getByText('Updated 45 min ago')).toBeInTheDocument();
    expect(screen.getByText('Updated 1 hour ago')).toBeInTheDocument();
    expect(screen.getByText('Updated yesterday')).toBeInTheDocument();
    expect(screen.getByText(/resolved on/i)).toBeInTheDocument();
  });

  it('formats multi-day relative ticket time', async () => {
    listMyTicketsRequest.mockResolvedValueOnce({
      data: {
        data: [
          {
            ticketId: 't-days',
            ticketNumber: 'TKT-104',
            subject: 'Older ticket',
            status: 'OPEN',
            createdAt: new Date(fixedNow - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(fixedNow - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        pagination: { page: 1, totalPages: 1, total: 1 },
      },
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('Updated 3 days ago')).toBeInTheDocument());
  });

  it('opens create ticket modal from both entry points and live chat toast', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await waitFor(() => expect(screen.getByText('Getting Started')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Start Live Chat' }));
    expect(toast.message).toHaveBeenCalledWith('Live chat is not available yet');

    await user.click(screen.getByRole('button', { name: 'Contact Support' }));
    expect(screen.getByTestId('create-ticket-modal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close create ticket' }));
    await user.click(screen.getByRole('button', { name: 'Create New Ticket' }));
    expect(screen.getByTestId('create-ticket-modal')).toBeInTheDocument();
    expect(captured.createTicketModal.categories).toEqual(categories);
  });

  it('opens my ticket detail modal', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await waitFor(() => expect(screen.getByText('TKT-100')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /open ticket/i }));
    expect(screen.getByTestId('my-ticket-detail-modal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close my ticket' }));
    expect(screen.queryByTestId('my-ticket-detail-modal')).toBeNull();
  });

  it('shows tickets loading and empty states', async () => {
    listMyTicketsRequest.mockResolvedValueOnce({
      data: { data: [], pagination: { page: 1, totalPages: 1, total: 0 } },
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no tickets yet. create one if you need help/i)).toBeInTheDocument()
    );

    renderPage({
      support: {
        categories,
        orgFaqs: faqs,
        myTickets: [],
        loading: false,
        orgFaqsLoading: false,
        myTicketsLoading: true,
        error: null,
      },
    });
    expect(screen.getByText(/loading tickets/i)).toBeInTheDocument();
  });

  it('displays support error', async () => {
    listSupportCategoriesRequest.mockRejectedValueOnce({
      response: { data: { message: 'Support unavailable' } },
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('Support unavailable')).toBeInTheDocument());
  });
});
