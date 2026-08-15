import { describe, it, expect } from 'vitest';
import {
  getPasswordChecks,
  isPasswordValid,
  validatePassword,
  validatePasswordMatch,
  PASSWORD_CHECKS,
} from '@/lib/passwordRules';

describe('passwordRules', () => {
  it('exposes five checks', () => {
    expect(PASSWORD_CHECKS).toHaveLength(5);
    expect(PASSWORD_CHECKS.map((c) => c.id)).toEqual([
      'length',
      'uppercase',
      'lowercase',
      'number',
      'special',
    ]);
  });

  it('defaults empty password to all failed', () => {
    const checks = getPasswordChecks();
    expect(checks.every((c) => c.passed === false)).toBe(true);
  });

  it('passes length at exactly 8 characters', () => {
    const checks = getPasswordChecks('Abcdef1!');
    expect(checks.find((c) => c.id === 'length').passed).toBe(true);
  });

  it('fails length under 8', () => {
    const checks = getPasswordChecks('Ab1!xyz');
    expect(checks.find((c) => c.id === 'length').passed).toBe(false);
  });

  it('evaluates each rule independently', () => {
    expect(getPasswordChecks('abcdefgh').find((c) => c.id === 'uppercase').passed).toBe(false);
    expect(getPasswordChecks('ABCDEFGH').find((c) => c.id === 'lowercase').passed).toBe(false);
    expect(getPasswordChecks('Abcdefgh').find((c) => c.id === 'number').passed).toBe(false);
    expect(getPasswordChecks('Abcdefg1').find((c) => c.id === 'special').passed).toBe(false);
    expect(getPasswordChecks('Abcdef1!').find((c) => c.id === 'special').passed).toBe(true);
  });

  it('isPasswordValid requires all rules', () => {
    expect(isPasswordValid('Abcdef1!')).toBe(true);
    expect(isPasswordValid('abcdef1!')).toBe(false);
  });

  it('validatePassword returns null or fixed message', () => {
    expect(validatePassword('Abcdef1!')).toBeNull();
    expect(validatePassword('weak')).toBe('Password must meet all requirements below');
  });

  it('validatePasswordMatch compares values', () => {
    expect(validatePasswordMatch('a', 'b')).toBe('Passwords do not match');
    expect(validatePasswordMatch('a', 'a')).toBeNull();
  });
});
