import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';
import { Roles } from '@/lib/roles';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/authApi', () => ({
  validateResetTokenRequest: vi.fn(),
  validateInviteRequest: vi.fn(),
}));

vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form">LoginForm</div>,
}));

vi.mock('@/components/auth/ForgotPasswordForm', () => ({
  ForgotPasswordForm: () => <div data-testid="forgot-form">ForgotPasswordForm</div>,
}));

vi.mock('@/components/auth/ResetPasswordForm', () => ({
  ResetPasswordForm: ({ token, resetInfo }) => (
    <div data-testid="reset-form">
      ResetPasswordForm token={token} email={resetInfo?.email}
    </div>
  ),
}));

vi.mock('@/components/auth/SignUpForm', () => ({
  SignUpForm: ({ token, inviteInfo }) => (
    <div data-testid="signup-form">
      SignUpForm token={token} role={inviteInfo?.role}
    </div>
  ),
}));

vi.mock('@/components/auth/AuthBranding', () => ({
  BrandLogo: ({ subtitle }) => <div data-testid="brand-logo">{subtitle}</div>,
  AuthFooterLink: ({ text, linkText }) => (
    <div data-testid="auth-footer">
      {text} {linkText}
    </div>
  ),
}));

import { toast } from 'sonner';
import { validateResetTokenRequest, validateInviteRequest } from '@/api/authApi';

describe('LoginPage', () => {
  it('renders heading and login form stub', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('brand-logo')).toHaveTextContent('Welcome back');
  });
});

describe('ForgotPasswordPage', () => {
  it('renders heading and forgot form stub', () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    expect(screen.getByTestId('forgot-form')).toBeInTheDocument();
    expect(screen.getByTestId('brand-logo')).toHaveTextContent('Account recovery');
    expect(screen.getByTestId('auth-footer')).toHaveTextContent('Sign in');
  });
});

describe('ResetPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  const renderReset = (token = 'reset-tok') =>
    renderWithProviders(
      <Routes>
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Routes>,
      { route: `/reset-password/${token}` }
    );

  it('shows loading spinner while validating token', () => {
    validateResetTokenRequest.mockReturnValue(new Promise(() => {}));
    renderReset();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows invalid state and toasts API message on rejected token', async () => {
    validateResetTokenRequest.mockRejectedValueOnce({
      response: { data: { message: 'Token expired' } },
    });
    renderReset();
    await waitFor(() =>
      expect(screen.getByText('Reset link expired or invalid')).toBeInTheDocument()
    );
    expect(toast.error).toHaveBeenCalledWith('Token expired');
    expect(screen.getByRole('link', { name: /request new link/i })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
  });

  it('toasts fallback message when API error has no message', async () => {
    validateResetTokenRequest.mockRejectedValueOnce({});
    renderReset();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Invalid or expired reset link')
    );
  });

  it('shows reset form on valid token', async () => {
    validateResetTokenRequest.mockResolvedValueOnce({
      data: { data: { email: 'a@b.com', firstName: 'Ada' } },
    });
    renderReset('good-tok');
    await waitFor(() =>
      expect(screen.getByText('Set a new password')).toBeInTheDocument()
    );
    expect(screen.getByTestId('reset-form')).toHaveTextContent('good-tok');
    expect(screen.getByTestId('reset-form')).toHaveTextContent('a@b.com');
  });
});

describe('SignUpPage', () => {
  beforeEach(() => vi.clearAllMocks());

  const renderSignUp = (token = 'invite-tok') =>
    renderWithProviders(
      <Routes>
        <Route path="/signup/:token" element={<SignUpPage />} />
      </Routes>,
      { route: `/signup/${token}` }
    );

  it('shows loading spinner while validating invite', () => {
    validateInviteRequest.mockReturnValue(new Promise(() => {}));
    renderSignUp();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows invalid state and toasts API message on rejected invite', async () => {
    validateInviteRequest.mockRejectedValueOnce({
      response: { data: { message: 'Invite revoked' } },
    });
    renderSignUp();
    await waitFor(() =>
      expect(screen.getByText('Invitation expired or invalid')).toBeInTheDocument()
    );
    expect(toast.error).toHaveBeenCalledWith('Invite revoked');
    expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('toasts fallback message when API error has no message', async () => {
    validateInviteRequest.mockRejectedValueOnce({});
    renderSignUp();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Invalid invitation link')
    );
  });

  it('shows admin copy for ADMIN role invite', async () => {
    validateInviteRequest.mockResolvedValueOnce({
      data: {
        data: {
          email: 'admin@acme.com',
          role: Roles.ADMIN,
          organizationName: 'Acme',
        },
      },
    });
    renderSignUp();
    await waitFor(() =>
      expect(screen.getByText('Activate your organization')).toBeInTheDocument()
    );
    expect(
      screen.getByText('Create a secure password to access your admin dashboard.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('signup-form')).toHaveTextContent(Roles.ADMIN);
  });

  it('shows default copy for non-admin invite', async () => {
    validateInviteRequest.mockResolvedValueOnce({
      data: {
        data: {
          email: 'hr@acme.com',
          role: Roles.RECRUITER,
          organizationName: 'Acme',
        },
      },
    });
    renderSignUp();
    await waitFor(() =>
      expect(screen.getByText('Create your password')).toBeInTheDocument()
    );
    expect(
      screen.getByText('Set a secure password to activate your account.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('signup-form')).toHaveTextContent(Roles.RECRUITER);
  });
});
