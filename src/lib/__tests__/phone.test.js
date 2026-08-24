import { describe, it, expect } from 'vitest';
import { isValidPhone, sanitizePhoneInput } from '@/lib/phone';

describe('phone helpers', () => {
  it('sanitizePhoneInput keeps digits only and caps at 10', () => {
    expect(sanitizePhoneInput('abc12-34 5678901xyz')).toBe('1234567890');
    expect(sanitizePhoneInput('+91 98765 43210')).toBe('9198765432');
    expect(sanitizePhoneInput('')).toBe('');
    expect(sanitizePhoneInput(null)).toBe('');
  });

  it('isValidPhone requires exactly 10 digits', () => {
    expect(isValidPhone('9876543210')).toBe(true);
    expect(isValidPhone('987654321')).toBe(false);
    expect(isValidPhone('98765432101')).toBe(false);
    expect(isValidPhone('98765abc10')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});
