import { describe, it, expect } from 'vitest';
import { Roles, getRoleLabel, getDashboardPath, isRole } from '@/lib/roles';

describe('roles', () => {
  it('getRoleLabel accepts string or object and formats unknown', () => {
    expect(getRoleLabel(null)).toBeNull();
    expect(getRoleLabel({})).toBeNull();
    expect(getRoleLabel(Roles.ADMIN)).toBe('Organization Admin');
    expect(getRoleLabel({ name: Roles.RECRUITER })).toBe('Recruiter');
    expect(getRoleLabel('CUSTOM_ROLE')).toBe('CUSTOM ROLE');
  });

  it('getDashboardPath maps known roles and falls back to login', () => {
    expect(getDashboardPath(Roles.SUPER_ADMIN)).toBe('/super-admin/registrations');
    expect(getDashboardPath(Roles.ADMIN)).toBe('/admin');
    expect(getDashboardPath(Roles.RECRUITER)).toBe('/recruiter');
    expect(getDashboardPath('NOPE')).toBe('/login');
  });

  it('getDashboardPath routes incomplete onboarding', () => {
    expect(
      getDashboardPath(Roles.ADMIN, { organizationId: 'o1', onboardingCompleted: false })
    ).toBe('/admin/onboarding');
    expect(
      getDashboardPath(Roles.RECRUITER, { organizationId: 'o1', onboardingCompleted: false })
    ).toBe('/setup-pending');
    expect(
      getDashboardPath(Roles.ADMIN, { organizationId: 'o1', onboardingCompleted: true })
    ).toBe('/admin');
  });

  it('isRole compares account.role', () => {
    expect(isRole({ role: Roles.ADMIN }, Roles.ADMIN)).toBe(true);
    expect(isRole(null, Roles.ADMIN)).toBe(false);
  });
});
