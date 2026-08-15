import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { CandidateOutreachPage } from '@/pages/candidate/CandidateOutreachPage';
import { CandidateSchedulePage } from '@/pages/candidate/CandidateSchedulePage';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/candidateApi', () => ({
  validateCandidateTokenRequest: vi.fn(),
  submitCandidateActionRequest: vi.fn(),
  getScheduleSlotsRequest: vi.fn(),
  bookScheduleSlotRequest: vi.fn(),
}));

import { toast } from 'sonner';
import {
  validateCandidateTokenRequest,
  submitCandidateActionRequest,
  getScheduleSlotsRequest,
  bookScheduleSlotRequest,
} from '@/api/candidateApi';

const candidateInfo = {
  candidateName: 'Jane Doe',
  organizationName: 'Acme Corp',
  jobTitle: 'Software Engineer',
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  timezone: 'UTC',
  maxScheduleDays: 7,
};

describe('CandidateOutreachPage', () => {
  beforeEach(() => vi.clearAllMocks());

  const renderOutreach = (token = 'outreach-tok') =>
    renderWithProviders(
      <Routes>
        <Route path="/candidate/outreach/:token" element={<CandidateOutreachPage />} />
        <Route path="/candidate/schedule/:token" element={<div>Schedule page</div>} />
      </Routes>,
      { route: `/candidate/outreach/${token}` }
    );

  it('shows loading state while validating token', () => {
    validateCandidateTokenRequest.mockReturnValue(new Promise(() => {}));
    renderOutreach();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows invalid link UI and toasts API message on validation failure', async () => {
    validateCandidateTokenRequest.mockRejectedValueOnce({
      response: { data: { message: 'Link expired' } },
    });
    renderOutreach();
    await waitFor(() =>
      expect(screen.getByText('This link is invalid or expired.')).toBeInTheDocument()
    );
    expect(toast.error).toHaveBeenCalledWith('Link expired');
  });

  it('toasts fallback message when validation error has no message', async () => {
    validateCandidateTokenRequest.mockRejectedValueOnce({});
    renderOutreach();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Invalid or expired link')
    );
  });

  it('renders outreach content on successful validation', async () => {
    validateCandidateTokenRequest.mockResolvedValueOnce({
      data: { data: candidateInfo },
    });
    renderOutreach();
    await waitFor(() =>
      expect(screen.getByText('Hello Jane Doe')).toBeInTheDocument()
    );
    expect(screen.getByText(/Acme Corp · Software Engineer/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /i'm interested — schedule call/i })
    ).toBeInTheDocument();
  });

  it('navigates to schedule on INTERESTED with success toast', async () => {
    const user = userEvent.setup();
    validateCandidateTokenRequest.mockResolvedValueOnce({
      data: { data: candidateInfo },
    });
    submitCandidateActionRequest.mockResolvedValueOnce({ data: { data: {} } });
    renderOutreach();
    await waitFor(() => expect(screen.getByText('Hello Jane Doe')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /i'm interested — schedule call/i }));
    await waitFor(() => expect(screen.getByText('Schedule page')).toBeInTheDocument());
    expect(submitCandidateActionRequest).toHaveBeenCalledWith('outreach-tok', 'INTERESTED');
    expect(toast.success).toHaveBeenCalledWith(
      'Thanks! Choose a time for your screening call.'
    );
  });

  it('shows thank-you state on NOT_INTERESTED with API message', async () => {
    const user = userEvent.setup();
    validateCandidateTokenRequest.mockResolvedValueOnce({
      data: { data: candidateInfo },
    });
    submitCandidateActionRequest.mockResolvedValueOnce({
      data: { data: { message: 'We noted your response.' } },
    });
    renderOutreach();
    await waitFor(() => expect(screen.getByText('Hello Jane Doe')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /not interested/i }));
    await waitFor(() => expect(screen.getByText('Thank you')).toBeInTheDocument());
    expect(screen.getByText('We noted your response.')).toBeInTheDocument();
  });

  it('uses fallback done message when NOT_INTERESTED response has no message', async () => {
    const user = userEvent.setup();
    validateCandidateTokenRequest.mockResolvedValueOnce({
      data: { data: candidateInfo },
    });
    submitCandidateActionRequest.mockResolvedValueOnce({ data: { data: {} } });
    renderOutreach();
    await waitFor(() => expect(screen.getByText('Hello Jane Doe')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /not interested/i }));
    await waitFor(() => expect(screen.getByText('Response recorded')).toBeInTheDocument());
  });

  it('toasts API error on submit failure', async () => {
    const user = userEvent.setup();
    validateCandidateTokenRequest.mockResolvedValueOnce({
      data: { data: candidateInfo },
    });
    submitCandidateActionRequest.mockRejectedValueOnce({
      response: { data: { message: 'Already responded' } },
    });
    renderOutreach();
    await waitFor(() => expect(screen.getByText('Hello Jane Doe')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /not interested/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Already responded'));
  });

  it('toasts fallback error when submit failure has no message', async () => {
    const user = userEvent.setup();
    validateCandidateTokenRequest.mockResolvedValueOnce({
      data: { data: candidateInfo },
    });
    submitCandidateActionRequest.mockRejectedValueOnce({});
    renderOutreach();
    await waitFor(() => expect(screen.getByText('Hello Jane Doe')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /not interested/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not submit response')
    );
  });
});

describe('CandidateSchedulePage', () => {
  beforeEach(() => vi.clearAllMocks());

  const renderSchedule = (token = 'sched-tok') =>
    renderWithProviders(
      <Routes>
        <Route path="/candidate/schedule/:token" element={<CandidateSchedulePage />} />
      </Routes>,
      { route: `/candidate/schedule/${token}` }
    );

  const slotPayload = {
    jobTitle: 'Software Engineer',
    organizationName: 'Acme Corp',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    maxScheduleDays: 7,
    slots: [
      { scheduledAt: '2026-08-20T10:00:00.000Z', label: 'Aug 20, 10:00 AM' },
      { scheduledAt: '2026-08-20T14:00:00.000Z', label: 'Aug 20, 2:00 PM' },
    ],
  };

  it('shows loading state while fetching slots', () => {
    getScheduleSlotsRequest.mockReturnValue(new Promise(() => {}));
    renderSchedule();
    expect(screen.getByText('Loading slots…')).toBeInTheDocument();
  });

  it('toasts API message when slot load fails', async () => {
    getScheduleSlotsRequest.mockRejectedValueOnce({
      response: { data: { message: 'Schedule unavailable' } },
    });
    renderSchedule();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Schedule unavailable')
    );
  });

  it('toasts fallback when slot load fails without message', async () => {
    getScheduleSlotsRequest.mockRejectedValueOnce({});
    renderSchedule();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not load schedule')
    );
  });

  it('renders slots from object.slots payload', async () => {
    getScheduleSlotsRequest.mockResolvedValueOnce({
      data: { data: slotPayload },
    });
    renderSchedule();
    await waitFor(() =>
      expect(screen.getByText('Schedule your screening call')).toBeInTheDocument()
    );
    expect(screen.getByText(/Software Engineer · Acme Corp/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aug 20, 10:00 AM' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aug 20, 2:00 PM' })).toBeInTheDocument();
  });

  it('renders slots when payload is a bare array', async () => {
    getScheduleSlotsRequest.mockResolvedValueOnce({
      data: {
        data: [{ scheduledAt: '2026-08-21T09:00:00.000Z', label: 'Aug 21, 9:00 AM' }],
      },
    });
    renderSchedule();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Aug 21, 9:00 AM' })).toBeInTheDocument()
    );
  });

  it('shows empty slots message', async () => {
    getScheduleSlotsRequest.mockResolvedValueOnce({
      data: { data: { ...slotPayload, slots: [] } },
    });
    renderSchedule();
    await waitFor(() =>
      expect(
        screen.getByText('No slots available right now. Please try again later.')
      ).toBeInTheDocument()
    );
  });

  it('books slot successfully and shows confirmation', async () => {
    const user = userEvent.setup();
    getScheduleSlotsRequest.mockResolvedValueOnce({
      data: { data: slotPayload },
    });
    bookScheduleSlotRequest.mockResolvedValueOnce({
      data: {
        data: {
          message: 'You are booked.',
          scheduledAt: '2026-08-20T10:00:00.000Z',
        },
      },
    });
    renderSchedule();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Aug 20, 10:00 AM' })).toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', { name: 'Aug 20, 10:00 AM' }));
    await waitFor(() => expect(screen.getByText('Call confirmed')).toBeInTheDocument());
    expect(bookScheduleSlotRequest).toHaveBeenCalledWith(
      'sched-tok',
      '2026-08-20T10:00:00.000Z'
    );
    expect(toast.success).toHaveBeenCalledWith('Call scheduled');
    expect(screen.getByText('You are booked.')).toBeInTheDocument();
  });

  it('toasts API error when booking fails', async () => {
    const user = userEvent.setup();
    getScheduleSlotsRequest.mockResolvedValueOnce({
      data: { data: slotPayload },
    });
    bookScheduleSlotRequest.mockRejectedValueOnce({
      response: { data: { message: 'Slot taken' } },
    });
    renderSchedule();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Aug 20, 10:00 AM' })).toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', { name: 'Aug 20, 10:00 AM' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Slot taken'));
    expect(screen.queryByText('Call confirmed')).toBeNull();
  });

  it('toasts fallback error when booking fails without message', async () => {
    const user = userEvent.setup();
    getScheduleSlotsRequest.mockResolvedValueOnce({
      data: { data: slotPayload },
    });
    bookScheduleSlotRequest.mockRejectedValueOnce({});
    renderSchedule();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Aug 20, 10:00 AM' })).toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', { name: 'Aug 20, 10:00 AM' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not book slot'));
  });
});
