import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppToaster } from '@/components/ui/Toaster';
import { UserStatusBadge } from '@/components/ui/UserStatusBadge';
import { UserStatus } from '@/lib/userStatus';

vi.mock('sonner', () => ({
  Toaster: (props) => (
    <div
      data-testid="toaster"
      data-position={props.position}
      data-rich={String(props.richColors)}
      data-close={String(props.closeButton)}
      data-class={props.toastOptions?.className}
    />
  ),
}));

describe('AppToaster', () => {
  it('renders sonner Toaster with app options', () => {
    render(<AppToaster />);
    const el = screen.getByTestId('toaster');
    expect(el).toHaveAttribute('data-position', 'top-right');
    expect(el).toHaveAttribute('data-rich', 'true');
    expect(el).toHaveAttribute('data-close', 'true');
    expect(el).toHaveAttribute('data-class', 'font-sans');
  });
});

describe('UserStatusBadge', () => {
  it('maps known statuses to labels', () => {
    const { rerender } = render(<UserStatusBadge status={UserStatus.ACTIVE} />);
    expect(screen.getByText('Active')).toBeInTheDocument();

    rerender(<UserStatusBadge status={UserStatus.PENDING} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();

    rerender(<UserStatusBadge status={UserStatus.DISABLED} />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('falls back to raw status when unknown', () => {
    render(<UserStatusBadge status="CUSTOM" />);
    expect(screen.getByText('CUSTOM')).toBeInTheDocument();
  });
});
