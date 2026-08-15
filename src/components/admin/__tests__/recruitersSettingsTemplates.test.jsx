import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { InviteHrCta } from '@/components/admin/recruiters/InviteHrCta';
import { InviteRecruiterForm } from '@/components/admin/recruiters/InviteRecruiterForm';
import { InviteRecruiterModal } from '@/components/admin/recruiters/InviteRecruiterModal';
import { RecruiterInviteBanner } from '@/components/admin/recruiters/RecruiterInviteBanner';
import { RecruiterRowActions } from '@/components/admin/recruiters/RecruiterRowActions';
import { ViewRecruiterModal } from '@/components/admin/recruiters/ViewRecruiterModal';
import { TablePagination, buildPageList } from '@/components/admin/recruiters/TablePagination';
import { RecruiterTable } from '@/components/admin/recruiters/RecruiterTable';
import { OrgSettingsForm } from '@/components/admin/settings/OrgSettingsForm';
import { EmailTemplateCard } from '@/components/admin/templates/EmailTemplateCard';
import { WhatsAppTemplateCard } from '@/components/admin/templates/WhatsAppTemplateCard';
import { UserStatus } from '@/lib/userStatus';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/recruiterApi', () => ({
  listRecruitersRequest: vi.fn(),
  inviteRecruiterRequest: vi.fn(),
  disableRecruiterRequest: vi.fn(),
  enableRecruiterRequest: vi.fn(),
  deleteRecruiterRequest: vi.fn(),
  resetRecruiterPasswordRequest: vi.fn(),
  getRecruiterRequest: vi.fn(),
}));

vi.mock('@/api/adminOrgApi', () => ({
  getMyOrganizationRequest: vi.fn(),
  updateOrgSettingsRequest: vi.fn(),
  uploadOrgLogoRequest: vi.fn(),
  updateEmailTemplateRequest: vi.fn(),
  updateWhatsAppTemplateRequest: vi.fn(),
  getBillingRequest: vi.fn(),
  getAuditLogsRequest: vi.fn(),
  getAuditStatsRequest: vi.fn(),
}));

vi.mock('@/store/slices/recruitersSlice', async (importOriginal) => {
  const actual = await importOriginal();
  const wrap = (thunk) =>
    Object.assign(vi.fn((...args) => thunk(...args)), {
      fulfilled: thunk.fulfilled,
      rejected: thunk.rejected,
      pending: thunk.pending,
      typePrefix: thunk.typePrefix,
    });
  return {
    ...actual,
    inviteRecruiter: wrap(actual.inviteRecruiter),
    deleteRecruiter: wrap(actual.deleteRecruiter),
    disableRecruiter: wrap(actual.disableRecruiter),
    enableRecruiter: wrap(actual.enableRecruiter),
    resetRecruiterPassword: wrap(actual.resetRecruiterPassword),
  };
});

vi.mock('@/store/slices/adminOrgSlice', async (importOriginal) => {
  const actual = await importOriginal();
  const wrap = (thunk) =>
    Object.assign(vi.fn((...args) => thunk(...args)), {
      fulfilled: thunk.fulfilled,
      rejected: thunk.rejected,
      pending: thunk.pending,
      typePrefix: thunk.typePrefix,
    });
  return {
    ...actual,
    updateOrgSettings: wrap(actual.updateOrgSettings),
    uploadOrgLogo: wrap(actual.uploadOrgLogo),
    updateEmailTemplate: wrap(actual.updateEmailTemplate),
    updateWhatsAppTemplate: wrap(actual.updateWhatsAppTemplate),
  };
});

import { toast } from 'sonner';
import {
  inviteRecruiterRequest,
  deleteRecruiterRequest,
  disableRecruiterRequest,
  enableRecruiterRequest,
  resetRecruiterPasswordRequest,
} from '@/api/recruiterApi';
import {
  getMyOrganizationRequest,
  updateOrgSettingsRequest,
  uploadOrgLogoRequest,
  updateEmailTemplateRequest,
  updateWhatsAppTemplateRequest,
} from '@/api/adminOrgApi';
import {
  inviteRecruiter,
  deleteRecruiter,
  disableRecruiter,
} from '@/store/slices/recruitersSlice';
import {
  updateOrgSettings,
  uploadOrgLogo,
  updateEmailTemplate,
  updateWhatsAppTemplate,
} from '@/store/slices/adminOrgSlice';

const recruiter = {
  accountId: 'acc-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@acme.com',
  status: UserStatus.ACTIVE,
  role: 'RECRUITER',
  lastLogin: new Date().toISOString(),
};

describe('InviteHrCta', () => {
  it('invokes onInvite', async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn();
    renderWithProviders(<InviteHrCta onInvite={onInvite} />);
    await user.click(screen.getByRole('button', { name: /invite hr member/i }));
    expect(onInvite).toHaveBeenCalled();
  });
});

describe('InviteRecruiterForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits success and error paths', async () => {
    const user = userEvent.setup();
    const onInvited = vi.fn();
    inviteRecruiterRequest.mockResolvedValueOnce({
      data: { data: { invitation: { email: 'r@x.com', inviteUrl: 'https://invite' } } },
    });

    renderWithProviders(<InviteRecruiterForm onInvited={onInvited} />);
    await user.type(screen.getByLabelText(/first name/i), 'Ray');
    await user.type(screen.getByLabelText(/last name/i), 'Lee');
    await user.type(screen.getByLabelText(/email/i), 'ray@x.com');
    await user.click(screen.getByRole('button', { name: /send invitation/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Invitation sent to recruiter')
    );
    expect(onInvited).toHaveBeenCalled();

    inviteRecruiterRequest.mockRejectedValueOnce({
      response: { data: { message: 'invite failed' } },
    });
    await user.type(screen.getByLabelText(/first name/i), 'Ray');
    await user.type(screen.getByLabelText(/last name/i), 'Lee');
    await user.type(screen.getByLabelText(/email/i), 'ray@x.com');
    await user.click(screen.getByRole('button', { name: /send invitation/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('invite failed'));
  });

  it('toasts default message when invite payload is empty', async () => {
    const user = userEvent.setup();
    inviteRecruiter.mockImplementationOnce(() => async () => ({
      type: inviteRecruiter.rejected.type,
      payload: undefined,
      meta: { requestStatus: 'rejected' },
      error: { message: 'Rejected' },
    }));

    renderWithProviders(<InviteRecruiterForm />);
    await user.type(screen.getByLabelText(/first name/i), 'Ray');
    await user.type(screen.getByLabelText(/last name/i), 'Lee');
    await user.type(screen.getByLabelText(/email/i), 'ray@x.com');
    await user.click(screen.getByRole('button', { name: /send invitation/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to invite recruiter')
    );
  });
});

describe('InviteRecruiterModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when closed', () => {
    renderWithProviders(
      <InviteRecruiterModal open={false} onOpenChange={vi.fn()} />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('invites successfully and closes', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onInvited = vi.fn();
    inviteRecruiterRequest.mockResolvedValueOnce({
      data: { data: { invitation: { email: 'hr@x.com', inviteUrl: 'u' } } },
    });

    renderWithProviders(
      <InviteRecruiterModal open onOpenChange={onOpenChange} onInvited={onInvited} />
    );

    await user.type(screen.getByLabelText(/first name/i), 'Pat');
    await user.type(screen.getByLabelText(/last name/i), 'Kim');
    await user.type(screen.getByLabelText(/^email$/i), 'pat@x.com');
    await user.type(screen.getByLabelText(/department/i), 'People');
    await user.type(screen.getByLabelText(/designation/i), 'HR');
    await user.click(screen.getByRole('button', { name: /send invitation/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Invitation sent to HR member')
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onInvited).toHaveBeenCalled();
  });

  it('toasts error and supports cancel / escape / overlay close', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    inviteRecruiterRequest.mockRejectedValueOnce({
      response: { data: { message: 'nope' } },
    });

    const { rerender } = renderWithProviders(
      <InviteRecruiterModal open onOpenChange={onOpenChange} />
    );

    await user.type(screen.getByLabelText(/first name/i), 'Pat');
    await user.type(screen.getByLabelText(/last name/i), 'Kim');
    await user.type(screen.getByLabelText(/^email$/i), 'pat@x.com');
    await user.click(screen.getByRole('button', { name: /send invitation/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('nope'));

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    rerender(<InviteRecruiterModal open onOpenChange={onOpenChange} />);
    await user.click(screen.getByLabelText(/^close$/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    rerender(<InviteRecruiterModal open onOpenChange={onOpenChange} />);
    await user.click(screen.getByLabelText(/close dialog overlay/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    rerender(<InviteRecruiterModal open onOpenChange={onOpenChange} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('blocks close while inviting', async () => {
    const onOpenChange = vi.fn();
    let resolveInvite;
    inviteRecruiterRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveInvite = resolve;
        })
    );

    const user = userEvent.setup();
    renderWithProviders(
      <InviteRecruiterModal open onOpenChange={onOpenChange} />,
      {
        preloadedState: {
          recruiters: {
            items: [],
            pagination: null,
            loading: false,
            inviting: false,
            actionId: null,
            lastInvited: null,
            error: null,
          },
        },
      }
    );

    await user.type(screen.getByLabelText(/first name/i), 'Pat');
    await user.type(screen.getByLabelText(/last name/i), 'Kim');
    await user.type(screen.getByLabelText(/^email$/i), 'pat@x.com');
    await user.click(screen.getByRole('button', { name: /send invitation/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled());

    onOpenChange.mockClear();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.click(screen.getByLabelText(/close dialog overlay/i));
    expect(onOpenChange).not.toHaveBeenCalled();

    resolveInvite({ data: { data: { invitation: { email: 'x', inviteUrl: 'y' } } } });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('toasts default HR invite failure when payload empty', async () => {
    const user = userEvent.setup();
    inviteRecruiter.mockImplementationOnce(() => async () => ({
      type: inviteRecruiter.rejected.type,
      payload: undefined,
      meta: { requestStatus: 'rejected' },
      error: { message: 'Rejected' },
    }));

    renderWithProviders(<InviteRecruiterModal open onOpenChange={vi.fn()} />);
    await user.type(screen.getByLabelText(/first name/i), 'Pat');
    await user.type(screen.getByLabelText(/last name/i), 'Kim');
    await user.type(screen.getByLabelText(/^email$/i), 'pat@x.com');
    await user.click(screen.getByRole('button', { name: /send invitation/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to invite HR member')
    );
  });
});

describe('RecruiterInviteBanner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null without invitation', () => {
    renderWithProviders(<RecruiterInviteBanner />);
    expect(screen.queryByText(/recruiter invited/i)).toBeNull();
  });

  it('copies invite link and clears banner', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { store } = renderWithProviders(<RecruiterInviteBanner />, {
      preloadedState: {
        recruiters: {
          items: [],
          pagination: null,
          loading: false,
          inviting: false,
          actionId: null,
          lastInvited: {
            invitation: {
              email: 'new@x.com',
              inviteUrl: 'https://app/invite/abc',
            },
          },
          error: null,
        },
      },
    });

    expect(screen.getByText(/link sent to new@x.com/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith('https://app/invite/abc');
    expect(toast.success).toHaveBeenCalledWith('Invite link copied');

    const dismiss = screen
      .getAllByRole('button')
      .find((btn) => !/copy link/i.test(btn.textContent || ''));
    await user.click(dismiss);
    await waitFor(() => expect(store.getState().recruiters.lastInvited).toBeNull());
  });
});

describe('ViewRecruiterModal / RecruiterRowActions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when closed or missing recruiter', () => {
    const { rerender } = renderWithProviders(
      <ViewRecruiterModal open={false} onOpenChange={vi.fn()} recruiter={recruiter} />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<ViewRecruiterModal open onOpenChange={vi.fn()} recruiter={null} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('disables and resets password for active recruiters', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    disableRecruiterRequest.mockResolvedValueOnce({
      data: { data: { ...recruiter, status: UserStatus.DISABLED } },
    });
    resetRecruiterPasswordRequest.mockResolvedValueOnce({
      data: { message: 'sent' },
    });

    renderWithProviders(
      <ViewRecruiterModal open onOpenChange={onOpenChange} recruiter={recruiter} />
    );

    await user.click(screen.getByRole('button', { name: /^disable$/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('HR member disabled')
    );

    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Password reset email sent')
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('surfaces disable failure without API message', async () => {
    const user = userEvent.setup();
    disableRecruiterRequest.mockRejectedValueOnce({});

    renderWithProviders(
      <ViewRecruiterModal open onOpenChange={vi.fn()} recruiter={recruiter} />
    );

    await user.click(screen.getByRole('button', { name: /^disable$/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to disable recruiter')
    );

    await user.click(screen.getByLabelText(/close dialog overlay/i));
  });

  it('toasts Action failed when disable payload is empty', async () => {
    const user = userEvent.setup();
    disableRecruiter.mockImplementationOnce(() => async () => ({
      type: disableRecruiter.rejected.type,
      payload: undefined,
      meta: { requestStatus: 'rejected' },
      error: { message: 'Rejected' },
    }));

    renderWithProviders(
      <ViewRecruiterModal open onOpenChange={vi.fn()} recruiter={recruiter} />
    );
    await user.click(screen.getByRole('button', { name: /^disable$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Action failed'));
    await user.click(screen.getByText('Jane Doe'));
  });

  it('enables disabled recruiters and surfaces action errors', async () => {
    const user = userEvent.setup();
    enableRecruiterRequest.mockRejectedValueOnce({
      response: { data: { message: 'enable failed' } },
    });

    renderWithProviders(
      <ViewRecruiterModal
        open
        onOpenChange={vi.fn()}
        recruiter={{ ...recruiter, status: UserStatus.DISABLED, role: null }}
      />
    );

    expect(screen.getByText('Recruiter')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^enable$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('enable failed'));

    await user.click(screen.getByText(/^close$/i));
  });

  it('opens view modal and confirms delete success/error', async () => {
    const user = userEvent.setup();
    deleteRecruiterRequest.mockResolvedValueOnce({});

    const { rerender } = renderWithProviders(
      <RecruiterRowActions recruiter={recruiter} />
    );

    await user.click(screen.getByLabelText(/view hr member/i));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByLabelText(/close dialog overlay/i));

    await user.click(screen.getByLabelText(/delete hr member/i));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('HR member deleted')
    );

    deleteRecruiterRequest.mockRejectedValueOnce({
      response: { data: { message: 'cannot delete' } },
    });
    rerender(<RecruiterRowActions recruiter={recruiter} />);
    await user.click(screen.getByLabelText(/delete hr member/i));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('cannot delete'));
  });

  it('toasts default delete failure when payload empty', async () => {
    const user = userEvent.setup();
    deleteRecruiter.mockImplementationOnce(() => async () => ({
      type: deleteRecruiter.rejected.type,
      payload: undefined,
      meta: { requestStatus: 'rejected' },
      error: { message: 'Rejected' },
    }));

    renderWithProviders(<RecruiterRowActions recruiter={recruiter} />);
    await user.click(screen.getByLabelText(/delete hr member/i));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to delete'));
  });
});

describe('TablePagination edge branches', () => {
  it('buildPageList covers middle, low, and high windows', () => {
    expect(buildPageList(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPageList(2, 12)).toContain(1);
    expect(buildPageList(5, 12)).toContain('ellipsis');
    expect(buildPageList(11, 12)).toContain(12);
  });

  it('hits page<=3 and page>=totalPages-2 lists plus pageSize fallback', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(
      <TablePagination
        pagination={{ page: 2, totalPages: 12, total: 120, limit: 10 }}
        onPageChange={onPageChange}
      />
    );
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);

    rerender(
      <TablePagination
        pagination={{ page: 11, totalPages: 12, total: 120, pageSize: 10 }}
        onPageChange={onPageChange}
      />
    );
    expect(screen.getByText('11')).toBeInTheDocument();

    rerender(
      <TablePagination
        pagination={{ page: 1, totalPages: 0, total: 0, limit: 10 }}
        onPageChange={onPageChange}
      />
    );
    expect(screen.queryByText(/showing/i)).toBeNull();

    rerender(
      <TablePagination
        pagination={{ page: 1, totalPages: 2, total: 15 }}
        onPageChange={onPageChange}
      />
    );
    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText(/next page/i));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe('RecruiterTable getRoleLabel fallback', () => {
  it('covers loading, empty, and role fallback', () => {
    const { rerender } = renderWithProviders(<RecruiterTable items={[]} loading />);
    expect(screen.getByText(/loading hr members/i)).toBeInTheDocument();

    rerender(<RecruiterTable items={[]} loading={false} />);
    expect(screen.getByText(/no hr members yet/i)).toBeInTheDocument();

    rerender(
      <RecruiterTable
        items={[
          {
            accountId: 'a1',
            firstName: 'No',
            lastName: 'Role',
            email: 'n@x.com',
            status: UserStatus.PENDING,
            role: null,
            lastLogin: null,
          },
        ]}
        loading={false}
      />
    );
    expect(screen.getAllByText('Recruiter').length).toBeGreaterThan(0);
  });
});

describe('OrgSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyOrganizationRequest.mockResolvedValue({
      data: {
        data: {
          organizationName: 'Acme Corp',
          city: 'Austin',
          timezone: 'America/Chicago',
          workingHoursStart: '09:00',
          workingHoursEnd: '18:00',
          defaultCallDuration: 30,
          maxReschedules: 3,
          logoUrl: 'https://cdn.example/logo.png',
          country: { name: 'United States' },
        },
      },
    });
  });

  it('loads, saves, uploads logo, and handles errors', async () => {
    const user = userEvent.setup();
    updateOrgSettingsRequest.mockResolvedValueOnce({
      data: {
        data: {
          organizationName: 'Acme Corp',
          city: 'Dallas',
          timezone: 'UTC',
          workingHoursStart: '10:00',
          workingHoursEnd: '19:00',
          defaultCallDuration: 45,
          maxReschedules: 2,
          logoUrl: 'https://cdn.example/logo.png',
          country: { name: 'United States' },
        },
      },
    });
    uploadOrgLogoRequest.mockResolvedValueOnce({
      data: { data: { logoUrl: 'https://cdn.example/new.png' } },
    });

    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /change logo/i }));

    const cityInput = screen.getByDisplayValue('Austin');
    await user.clear(cityInput);
    await user.type(cityInput, 'Dallas');
    await user.click(screen.getByRole('button', { name: /save settings/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Settings saved'));

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['img'], 'logo.png', { type: 'image/png' });
    await user.upload(fileInput, file);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Logo uploaded'));

    updateOrgSettingsRequest.mockRejectedValueOnce({});
    await user.click(screen.getByRole('button', { name: /save settings/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to update settings'));

    uploadOrgLogoRequest.mockRejectedValueOnce({});
    await user.upload(fileInput, file);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to upload logo'));

    updateOrgSettings.mockImplementationOnce(() => async () => ({
      type: updateOrgSettings.rejected.type,
      payload: undefined,
      meta: { requestStatus: 'rejected' },
      error: { message: 'Rejected' },
    }));
    await user.click(screen.getByRole('button', { name: /save settings/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to save'));

    uploadOrgLogo.mockImplementationOnce(() => async () => ({
      type: uploadOrgLogo.rejected.type,
      payload: undefined,
      meta: { requestStatus: 'rejected' },
      error: { message: 'Rejected' },
    }));
    await user.upload(fileInput, file);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Logo upload failed'));
  });

  it('shows loading, logo placeholder, broken logo, and empty city null', async () => {
    const user = userEvent.setup();
    getMyOrganizationRequest.mockResolvedValueOnce({
      data: {
        data: {
          organizationName: 'Bare',
          city: '',
          timezone: null,
          workingHoursStart: null,
          workingHoursEnd: null,
          defaultCallDuration: null,
          maxReschedules: null,
          logoUrl: '/uploads/broken.png',
          country: null,
        },
      },
    });
    updateOrgSettingsRequest.mockResolvedValueOnce({
      data: {
        data: {
          organizationName: 'Bare',
          city: null,
          timezone: 'UTC',
          workingHoursStart: '09:00',
          workingHoursEnd: '18:00',
          defaultCallDuration: 30,
          maxReschedules: 3,
          logoUrl: null,
          country: null,
        },
      },
    });

    renderWithProviders(<OrgSettingsForm />);
    expect(screen.getByText(/loading settings/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByDisplayValue('Bare')).toBeInTheDocument());
    expect(screen.getByDisplayValue('—')).toBeInTheDocument();

    const img = screen.getByAltText(/organization logo/i);
    fireEvent.error(img);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /upload logo/i })).toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', { name: /save settings/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Settings saved'));
    expect(updateOrgSettingsRequest).toHaveBeenCalledWith(
      expect.objectContaining({ city: null })
    );

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [] } });
  });
});

describe('EmailTemplateCard / WhatsAppTemplateCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves email template success and error', async () => {
    const user = userEvent.setup();
    updateEmailTemplateRequest.mockResolvedValueOnce({
      data: { data: { templateId: 'e1', subject: 'Hi', body: 'Body' } },
    });

    renderWithProviders(
      <EmailTemplateCard
        template={{ templateId: 'e1', name: 'interview_invite', subject: 'Hi', body: 'Body' }}
      />
    );

    expect(screen.getByText(/interview invite/i)).toBeInTheDocument();
    const subject = screen.getByDisplayValue('Hi');
    await user.clear(subject);
    await user.type(subject, 'Hello');
    const body = screen.getByDisplayValue('Body');
    await user.clear(body);
    await user.type(body, 'New body');
    await user.click(screen.getByRole('button', { name: /save template/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Template saved'));

    updateEmailTemplateRequest.mockRejectedValueOnce({});
    await user.click(screen.getByRole('button', { name: /save template/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to update template'));

    updateEmailTemplate.mockImplementationOnce(() => async () => ({
      type: updateEmailTemplate.rejected.type,
      payload: undefined,
      meta: { requestStatus: 'rejected' },
      error: { message: 'Rejected' },
    }));
    await user.click(screen.getByRole('button', { name: /save template/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to save'));
  });

  it('saves whatsapp template success and error', async () => {
    const user = userEvent.setup();
    updateWhatsAppTemplateRequest.mockResolvedValueOnce({
      data: { data: { templateId: 'w1', body: 'Ping' } },
    });

    renderWithProviders(
      <WhatsAppTemplateCard
        template={{ templateId: 'w1', name: 'follow_up', body: 'Ping' }}
      />
    );

    const body = screen.getByDisplayValue('Ping');
    await user.clear(body);
    await user.type(body, 'Hello WA');
    await user.click(screen.getByRole('button', { name: /save template/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Template saved'));

    updateWhatsAppTemplateRequest.mockRejectedValueOnce({});
    await user.click(screen.getByRole('button', { name: /save template/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to update template'));

    updateWhatsAppTemplate.mockImplementationOnce(() => async () => ({
      type: updateWhatsAppTemplate.rejected.type,
      payload: undefined,
      meta: { requestStatus: 'rejected' },
      error: { message: 'Rejected' },
    }));
    await user.click(screen.getByRole('button', { name: /save template/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to save'));
  });
});
