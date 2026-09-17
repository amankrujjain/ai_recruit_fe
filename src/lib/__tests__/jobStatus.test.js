import { describe, it, expect } from 'vitest';
import {
  filterJobsByStatusFilter,
  getJobsListEmptyState,
  isJobActive,
} from '@/lib/jobStatus';

describe('jobStatus', () => {
  const activeJob = { jobId: '1', isActive: true };
  const inactiveJob = { jobId: '2', isActive: false };

  it('detects active/inactive including string booleans', () => {
    expect(isJobActive(activeJob)).toBe(true);
    expect(isJobActive(inactiveJob)).toBe(false);
    expect(isJobActive({ isActive: 'false' })).toBe(false);
  });

  it('filters jobs by status tab', () => {
    const items = [activeJob, inactiveJob];
    expect(filterJobsByStatusFilter(items, 'active')).toEqual([activeJob]);
    expect(filterJobsByStatusFilter(items, 'inactive')).toEqual([inactiveJob]);
    expect(filterJobsByStatusFilter(items, 'all')).toEqual(items);
  });

  it('returns tab-specific empty copy', () => {
    expect(getJobsListEmptyState('inactive').message).toBe('No inactive jobs.');
    expect(getJobsListEmptyState('inactive').showCreateCta).toBe(false);
    expect(getJobsListEmptyState('all').showCreateCta).toBe(true);
    expect(getJobsListEmptyState('all', true).message).toMatch(/search/i);
  });
});
