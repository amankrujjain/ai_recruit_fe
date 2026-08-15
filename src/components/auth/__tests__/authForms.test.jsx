import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { LoginForm } from '@/components/auth/LoginForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Roles } from '@/lib/roles';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/authApi', () => ({
  loginRequest: vi.fn(),
  getProfileRequest: vi.fn(),
  logoutRequest: vi.fn(),
  forgotPasswordRequest: vi.fn(),
  resetPasswordRequest: vi.fn(),
  acceptInviteRequest: vi.fn(),
}));

vi.mock('@/store/slices/authSlice', async (importOriginal) => {
  const actual = await importOriginal();
  const loginUser = Object.assign(
    vi.fn((...args) => actual.loginUser(...args)),
    actual.loginUser
  );
  return { ...actual, loginUser };
});

import { toast } from 'sonner';
import {
  loginRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
  acceptInviteRequest,
} from '@/api/authApi';
import { loginUser } from '@/store/slices/authSlice';

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('navigates to role dashboard on success and toasts', async () => {
    const user = userEvent.setup();
    loginRequest.mockResolvedValueOnce({
      data: {
        data: {
          account: { role: Roles.ADMIN, email: 'a@b.com' },
          accessToken: 'a',
          refreshToken: 'r',
        },
      },
    });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/admin" element={<div>Admin home</div>} />
      </Routes>,
      { route: '/login' }
    );

    await user.type(screen.getByLabelText(/work email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Abcdef1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Admin home')).toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith('Welcome back!');
  });

  it('toasts error on rejected login', async () => {
    const user = userEvent.setup();
    loginRequest.mockRejectedValueOnce({
      response: { data: { message: 'bad creds' } },
    });

    renderWithProviders(<LoginForm />, { route: '/login' });
    await user.type(screen.getByLabelText(/work email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('bad creds'));
  });

  it('toasts fallback Invalid credentials when payload is empty', async () => {
    const user = userEvent.setup();
    loginUser.mockImplementationOnce(() => async () => ({
      type: 'auth/login/rejected',
      payload: undefined,
    }));

    renderWithProviders(<LoginForm />, { route: '/login' });
    await user.type(screen.getByLabelText(/work email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
    );
  });
});

describe('ForgotPasswordForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('swaps to inbox UI on success', async () => {
    const user = userEvent.setup();
    forgotPasswordRequest.mockResolvedValueOnce({
      data: { data: { email: 'a@b.com' }, message: 'sent' },
    });

    renderWithProviders(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/work email/i), 'a@b.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => expect(screen.getByText(/check your inbox/i)).toBeInTheDocument());
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });

  it('falls back to typed email and default success toast', async () => {
    const user = userEvent.setup();
    forgotPasswordRequest.mockResolvedValueOnce({ data: {} });

    renderWithProviders(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/work email/i), 'fallback@b.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => expect(screen.getByText('fallback@b.com')).toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith('Password reset link sent');
  });

  it('uses nested data.message for success toast', async () => {
    const user = userEvent.setup();
    forgotPasswordRequest.mockResolvedValueOnce({
      data: { data: { email: 'n@b.com', message: 'nested ok' } },
    });

    renderWithProviders(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/work email/i), 'n@b.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('nested ok'));
  });

  it('toasts API error', async () => {
    const user = userEvent.setup();
    forgotPasswordRequest.mockRejectedValueOnce({
      response: { data: { message: 'not found' } },
    });
    renderWithProviders(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/work email/i), 'a@b.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('not found'));
  });

  it('toasts fallback error when API message missing', async () => {
    const user = userEvent.setup();
    forgotPasswordRequest.mockRejectedValueOnce({});
    renderWithProviders(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/work email/i), 'a@b.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to send reset link')
    );
  });
});

describe('ResetPasswordForm / SignUpForm canSubmit gating', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps reset submit disabled until password valid and matching', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ResetPasswordForm token="t" resetInfo={{ email: 'a@b.com', firstName: 'Ada' }} />
    );
    const submit = screen.getByRole('button', { name: /reset password/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/new password/i), 'Abcdef1!');
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/confirm password/i), 'Abcdef1!');
    expect(submit).toBeEnabled();

    resetPasswordRequest.mockResolvedValueOnce({ data: { message: 'ok' } });
    await user.click(submit);
    await waitFor(() => expect(resetPasswordRequest).toHaveBeenCalledWith('t', 'Abcdef1!'));
  });

  it('reset early-returns on validation via form submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ResetPasswordForm token="t" resetInfo={{ email: 'a@b.com' }} />
    );
    await user.type(screen.getByLabelText(/new password/i), 'weak');
    await user.type(screen.getByLabelText(/confirm password/i), 'other');
    fireEvent.submit(screen.getByLabelText(/new password/i).closest('form'));

    expect(screen.getByText(/password must meet all requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(resetPasswordRequest).not.toHaveBeenCalled();
  });

  it('reset toasts API error fallback', async () => {
    const user = userEvent.setup();
    resetPasswordRequest.mockRejectedValueOnce({});
    renderWithProviders(
      <ResetPasswordForm token="t" resetInfo={{ email: 'a@b.com', firstName: 'Ada' }} />
    );
    await user.type(screen.getByLabelText(/new password/i), 'Abcdef1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Abcdef1!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to reset password')
    );
  });

  it('reset success without message and clears field errors on change', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route
          path="/"
          element={<ResetPasswordForm token="t" resetInfo={{ email: 'a@b.com' }} />}
        />
        <Route path="/login" element={<div>Login landing</div>} />
      </Routes>
    );

    await user.type(screen.getByLabelText(/new password/i), 'weak');
    await user.type(screen.getByLabelText(/confirm password/i), 'other');
    fireEvent.submit(screen.getByLabelText(/new password/i).closest('form'));
    expect(screen.getByText(/password must meet all requirements/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/new password/i));
    await user.type(screen.getByLabelText(/new password/i), 'Abcdef1!');
    await user.clear(screen.getByLabelText(/confirm password/i));
    await user.type(screen.getByLabelText(/confirm password/i), 'Abcdef1!');

    resetPasswordRequest.mockResolvedValueOnce({ data: {} });
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Password reset successfully')
    );
    expect(screen.getByText('Login landing')).toBeInTheDocument();
  });

  it('reset toasts API error message when present', async () => {
    const user = userEvent.setup();
    resetPasswordRequest.mockRejectedValueOnce({
      response: { data: { message: 'token expired' } },
    });
    renderWithProviders(
      <ResetPasswordForm token="t" resetInfo={{ email: 'a@b.com', firstName: 'Ada' }} />
    );
    await user.type(screen.getByLabelText(/new password/i), 'Abcdef1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Abcdef1!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('token expired'));
  });

  it('keeps signup submit disabled until valid match', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignUpForm
        token="inv"
        inviteInfo={{ email: 'r@x.com', firstName: 'Ray', organizationName: 'Acme' }}
      />
    );
    const submit = screen.getByRole('button', { name: /activate account/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/create password/i), 'Abcdef1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Abcdef1!');
    expect(submit).toBeEnabled();

    acceptInviteRequest.mockResolvedValueOnce({ data: { message: 'ok' } });
    await user.click(submit);
    await waitFor(() => expect(acceptInviteRequest).toHaveBeenCalled());
  });

  it('signup early-returns on validation via form submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignUpForm
        token="inv"
        inviteInfo={{ email: 'r@x.com', firstName: 'Ray', organizationName: 'Acme' }}
      />
    );
    await user.type(screen.getByLabelText(/create password/i), 'weak');
    await user.type(screen.getByLabelText(/confirm password/i), 'other');
    fireEvent.submit(screen.getByLabelText(/create password/i).closest('form'));

    expect(screen.getByText(/password must meet all requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(acceptInviteRequest).not.toHaveBeenCalled();
  });

  it('signup toasts API error fallback', async () => {
    const user = userEvent.setup();
    acceptInviteRequest.mockRejectedValueOnce({});
    renderWithProviders(
      <SignUpForm
        token="inv"
        inviteInfo={{ email: 'r@x.com', firstName: 'Ray', organizationName: 'Acme' }}
      />
    );
    await user.type(screen.getByLabelText(/create password/i), 'Abcdef1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Abcdef1!');
    await user.click(screen.getByRole('button', { name: /activate account/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to activate account')
    );
  });

  it('signup success without message and clears field errors on change', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route
          path="/"
          element={
            <SignUpForm
              token="inv"
              inviteInfo={{ email: 'r@x.com', firstName: 'Ray', organizationName: 'Acme' }}
            />
          }
        />
        <Route path="/login" element={<div>Login landing</div>} />
      </Routes>
    );

    await user.type(screen.getByLabelText(/create password/i), 'weak');
    await user.type(screen.getByLabelText(/confirm password/i), 'other');
    fireEvent.submit(screen.getByLabelText(/create password/i).closest('form'));
    expect(screen.getByText(/password must meet all requirements/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/create password/i));
    await user.type(screen.getByLabelText(/create password/i), 'Abcdef1!');
    await user.clear(screen.getByLabelText(/confirm password/i));
    await user.type(screen.getByLabelText(/confirm password/i), 'Abcdef1!');

    acceptInviteRequest.mockResolvedValueOnce({ data: {} });
    await user.click(screen.getByRole('button', { name: /activate account/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Account activated! You can now sign in.'
      )
    );
    expect(screen.getByText('Login landing')).toBeInTheDocument();
  });

  it('signup toasts API error message when present', async () => {
    const user = userEvent.setup();
    acceptInviteRequest.mockRejectedValueOnce({
      response: { data: { message: 'invite used' } },
    });
    renderWithProviders(
      <SignUpForm
        token="inv"
        inviteInfo={{ email: 'r@x.com', firstName: 'Ray', organizationName: 'Acme' }}
      />
    );
    await user.type(screen.getByLabelText(/create password/i), 'Abcdef1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Abcdef1!');
    await user.click(screen.getByRole('button', { name: /activate account/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('invite used'));
  });
});
