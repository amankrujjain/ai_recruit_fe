import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/hooks/useAuth';
import { renderWithProviders } from '@/test/utils';

function DebounceProbe({ value, delay }) {
  const debounced = useDebouncedValue(value, delay);
  return <div data-testid="v">{debounced}</div>;
}

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value then updates after delay', () => {
    const { rerender } = render(<DebounceProbe value="a" delay={400} />);
    expect(screen.getByTestId('v')).toHaveTextContent('a');

    rerender(<DebounceProbe value="b" delay={400} />);
    expect(screen.getByTestId('v')).toHaveTextContent('a');

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.getByTestId('v')).toHaveTextContent('b');
  });

  it('uses default 400ms delay', () => {
    const { rerender } = render(<DebounceProbe value="x" />);
    rerender(<DebounceProbe value="y" />);
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(screen.getByTestId('v')).toHaveTextContent('x');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('v')).toHaveTextContent('y');
  });
});

function AuthProbe() {
  const auth = useAuth();
  return <div data-testid="token">{auth.token ?? 'none'}</div>;
}

describe('useAuth', () => {
  it('exposes auth slice via selector', () => {
    renderWithProviders(<AuthProbe />, {
      preloadedState: {
        auth: {
          account: null,
          token: 'abc',
          loading: false,
          error: null,
          initialized: true,
        },
      },
    });
    expect(screen.getByTestId('token')).toHaveTextContent('abc');
  });
});
