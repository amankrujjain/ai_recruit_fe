import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getActionLabel,
  getModuleMeta,
  deriveStatus,
  formatAuditTime,
  composeAuditDetails,
  toDateInputValue,
  defaultDateRange,
} from '@/lib/auditLog';

describe('auditLog', () => {
  describe('getActionLabel', () => {
    it('returns em dash for falsy', () => {
      expect(getActionLabel()).toBe('—');
      expect(getActionLabel('')).toBe('—');
    });

    it('returns known labels and formats unknown', () => {
      expect(getActionLabel('LOGIN_SUCCESS')).toBe('Login Success');
      expect(getActionLabel('CUSTOM_EVENT')).toBe('CUSTOM EVENT');
    });
  });

  describe('getModuleMeta', () => {
    it('returns known meta and falls back to other', () => {
      expect(getModuleMeta('billing').label).toBe('Billing');
      expect(getModuleMeta('unknown').label).toBe('Other');
    });
  });

  describe('deriveStatus', () => {
    it('prefers explicit status', () => {
      expect(deriveStatus({ status: 'failed', action: 'LOGIN_SUCCESS' })).toBe('failed');
    });

    it('infers failed from _FAILED action', () => {
      expect(deriveStatus({ action: 'LOGIN_FAILED' })).toBe('failed');
      expect(deriveStatus({ action: 'LOGIN_SUCCESS' })).toBe('success');
      expect(deriveStatus(null)).toBe('success');
    });
  });

  describe('formatAuditTime', () => {
    it('handles falsy and invalid', () => {
      expect(formatAuditTime()).toBe('—');
      expect(formatAuditTime('nope')).toBe('—');
    });

    it('formats valid dates', () => {
      const result = formatAuditTime('2026-03-15T10:30:00.000Z');
      expect(result).not.toBe('—');
      expect(result.length).toBeGreaterThan(5);
    });
  });

  describe('composeAuditDetails', () => {
    it('covers invitation and user lifecycle branches', () => {
      expect(
        composeAuditDetails({
          action: 'INVITATION_SENT',
          metadata: { email: 'a@b.com', role: 'RECRUITER' },
        })
      ).toBe('Invited a@b.com as RECRUITER');
      expect(
        composeAuditDetails({ action: 'USER_CREATED', metadata: { email: 'a@b.com' } })
      ).toBe('Invited a@b.com');
      expect(composeAuditDetails({ action: 'INVITATION_SENT', metadata: {} })).toBe('—');
      expect(
        composeAuditDetails({ action: 'INVITATION_ACCEPTED', metadata: { email: 'a@b.com' } })
      ).toBe('a@b.com accepted invitation');
      expect(composeAuditDetails({ action: 'INVITATION_ACCEPTED', metadata: {} })).toBe(
        'Invitation accepted'
      );
      expect(composeAuditDetails({ action: 'USER_DISABLED', metadata: { email: 'a@b.com' } })).toBe(
        'Disabled a@b.com'
      );
      expect(composeAuditDetails({ action: 'USER_DISABLED', metadata: {} })).toBe('User disabled');
      expect(composeAuditDetails({ action: 'USER_ENABLED', metadata: { email: 'a@b.com' } })).toBe(
        'Enabled a@b.com'
      );
      expect(composeAuditDetails({ action: 'USER_ENABLED', metadata: {} })).toBe('User enabled');
      expect(composeAuditDetails({ action: 'USER_DELETED', metadata: { email: 'a@b.com' } })).toBe(
        'Deleted a@b.com'
      );
      expect(composeAuditDetails({ action: 'USER_DELETED', metadata: {} })).toBe('User deleted');
    });

    it('covers settings, auth, password, and org branches', () => {
      expect(
        composeAuditDetails({
          action: 'SETTINGS_UPDATED',
          metadata: { updatedFields: ['timezone', 'logo'] },
        })
      ).toBe('Organization settings updated');
      expect(composeAuditDetails({ action: 'SETTINGS_UPDATED', metadata: {} })).toBe(
        'Organization settings updated'
      );
      expect(
        composeAuditDetails({
          action: 'ONBOARDING_COMPLETED',
          metadata: { updatedFields: ['phone', 'timezone'] },
        })
      ).toBe('Onboarding completed');
      expect(composeAuditDetails({ action: 'LOGIN_SUCCESS' })).toBe('Signed in successfully');
      expect(
        composeAuditDetails({ action: 'LOGIN_FAILED', metadata: { reason: 'BAD_PASSWORD' } })
      ).toBe('Login failed (BAD PASSWORD)');
      expect(composeAuditDetails({ action: 'LOGIN_FAILED', metadata: {} })).toBe('Login failed');
      expect(composeAuditDetails({ action: 'LOGOUT' })).toBe('Signed out');
      expect(composeAuditDetails({ action: 'PASSWORD_RESET' })).toBe('Password reset requested');
      expect(composeAuditDetails({ action: 'PASSWORD_CHANGED' })).toBe('Password changed');
      expect(
        composeAuditDetails({
          action: 'ORGANIZATION_CREATED',
          metadata: { organizationName: 'Acme' },
        })
      ).toBe('Created organization Acme');
      expect(composeAuditDetails({ action: 'ORGANIZATION_CREATED', metadata: {} })).toBe(
        'Organization created'
      );
      expect(composeAuditDetails({ action: 'ORGANIZATION_UPDATED' })).toBe('Organization updated');
      expect(composeAuditDetails({ action: 'ORGANIZATION_DELETED' })).toBe('Organization deleted');
    });

    it('uses default meta fallback with object stringify and max 3 keys', () => {
      expect(composeAuditDetails({ action: 'CUSTOM', metadata: 'not-object' })).toBe('—');
      expect(
        composeAuditDetails({
          action: 'CUSTOM',
          metadata: { updatedFields: ['a'], a: 1, b: null, c: '', d: { nested: true }, e: 'keep', f: 'drop' },
        })
      ).toBe('a: 1 · d: {"nested":true} · e: keep');
      expect(
        composeAuditDetails({
          action: 'CUSTOM',
          metadata: { updatedFields: ['phone', 'timezone'] },
        })
      ).toBe('—');
    });
  });

  describe('toDateInputValue / defaultDateRange', () => {
    it('handles falsy, invalid, Date, and string', () => {
      expect(toDateInputValue()).toBe('');
      expect(toDateInputValue('bad')).toBe('');
      expect(toDateInputValue(new Date('2026-03-05T12:00:00'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(toDateInputValue('2026-03-05T12:00:00')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('defaultDateRange is a 7-day inclusive window', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-15T12:00:00'));
      const range = defaultDateRange();
      expect(range.endDate).toBe(toDateInputValue(new Date('2026-03-15T12:00:00')));
      expect(range.startDate).toBe(toDateInputValue(new Date('2026-03-09T12:00:00')));
      vi.useRealTimers();
    });
  });
});
