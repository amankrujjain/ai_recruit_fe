import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { BrandLogo, AuthFooterLink } from '@/components/auth/AuthBranding';
import { AuthHeroPanel } from '@/components/auth/AuthHeroPanel';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { InviteWelcomeBanner } from '@/components/auth/InviteWelcomeBanner';
import { PasswordField } from '@/components/auth/PasswordField';
import { Roles } from '@/lib/roles';

describe('BrandLogo / AuthFooterLink', () => {
  it('renders logo with and without subtitle', () => {
    const { rerender } = renderWithProviders(<BrandLogo />);
    expect(screen.getByText('RecruitAI')).toBeInTheDocument();
    expect(screen.queryByText(/platform/i)).toBeNull();

    rerender(<BrandLogo subtitle="AI Recruitment Platform" />);
    expect(screen.getByText('AI Recruitment Platform')).toBeInTheDocument();
  });

  it('renders footer link to destination', () => {
    renderWithProviders(
      <AuthFooterLink text="Need an account?" linkText="Sign up" to="/signup" />
    );
    expect(screen.getByText(/need an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
  });
});

describe('AuthHeroPanel', () => {
  it('renders hero copy and stats', () => {
    renderWithProviders(<AuthHeroPanel />);
    expect(screen.getByText(/ai recruitment/i)).toBeInTheDocument();
    expect(screen.getByText(/hire smarter/i)).toBeInTheDocument();
    expect(screen.getByText('10x')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument();
  });
});

describe('AuthLayout', () => {
  it('renders nested outlet content', () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<AuthLayout />}>
          <Route index element={<div>Login page body</div>} />
        </Route>
      </Routes>
    );
    expect(screen.getByText('Login page body')).toBeInTheDocument();
    expect(screen.getByText('RecruitAI')).toBeInTheDocument();
  });
});

describe('InviteWelcomeBanner', () => {
  it('returns null without inviteInfo', () => {
    const { container } = renderWithProviders(<InviteWelcomeBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows admin onboarding message', () => {
    renderWithProviders(
      <InviteWelcomeBanner
        inviteInfo={{
          firstName: 'Ada',
          organizationName: 'Acme',
          role: Roles.ADMIN,
        }}
      />
    );
    expect(
      screen.getByText(/hi Ada, your organization Acme is onboarded/i)
    ).toBeInTheDocument();
  });

  it('shows recruiter invite message', () => {
    renderWithProviders(
      <InviteWelcomeBanner
        inviteInfo={{
          firstName: 'Ray',
          organizationName: 'Acme',
          role: Roles.RECRUITER,
        }}
      />
    );
    expect(
      screen.getByText(/hi Ray, you've been invited to join Acme as a recruiter/i)
    ).toBeInTheDocument();
  });
});

describe('PasswordField', () => {
  it('toggles visibility and shows error', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <PasswordField
        id="pw"
        label="Secret"
        value="hidden"
        onChange={onChange}
        error="Too weak"
        placeholder="Enter password"
      />
    );

    const input = screen.getByLabelText(/secret/i);
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByText('Too weak')).toBeInTheDocument();

    await user.click(input.parentElement.querySelector('button'));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(input.parentElement.querySelector('button'));
    expect(input).toHaveAttribute('type', 'password');
  });
});
