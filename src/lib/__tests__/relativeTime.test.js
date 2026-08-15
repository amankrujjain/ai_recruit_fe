import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { relativeTime } from '@/lib/relativeTime';

describe('relativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Never for falsy input', () => {
    expect(relativeTime()).toBe('Never');
    expect(relativeTime(null)).toBe('Never');
    expect(relativeTime('')).toBe('Never');
  });

  it('returns em dash for invalid dates', () => {
    expect(relativeTime('not-a-date')).toBe('—');
  });

  it('clamps future dates to just now', () => {
    expect(relativeTime('2026-03-15T13:00:00.000Z')).toBe('just now');
  });

  it('returns just now under 1 minute', () => {
    expect(relativeTime('2026-03-15T11:59:30.000Z')).toBe('just now');
  });

  it('returns minutes under 60', () => {
    expect(relativeTime('2026-03-15T11:01:00.000Z')).toBe('59 min ago');
  });

  it('returns hours with singular/plural', () => {
    expect(relativeTime(new Date(Date.now() - 60 * 60 * 1000).toISOString())).toBe('1 hr ago');
    expect(relativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())).toBe('2 hrs ago');
    expect(relativeTime(new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString())).toBe(
      '23 hrs ago'
    );
  });

  it('returns days with singular/plural', () => {
    expect(relativeTime(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())).toBe(
      '1 day ago'
    );
    expect(relativeTime(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString())).toBe(
      '29 days ago'
    );
  });

  it('falls back to locale date string at 30+ days', () => {
    const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(old)).toBe(new Date(old).toLocaleDateString());
  });
});
