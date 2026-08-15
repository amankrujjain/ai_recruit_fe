import { describe, it, expect } from 'vitest';
import { formatAuditIp } from '@/lib/formatAuditIp';

describe('formatAuditIp', () => {
  it('returns null for missing, non-string, or blank', () => {
    expect(formatAuditIp(null)).toBeNull();
    expect(formatAuditIp({})).toBeNull();
    expect(formatAuditIp({ ipAddress: 123 })).toBeNull();
    expect(formatAuditIp({ ipAddress: '   ' })).toBeNull();
  });

  it('reads ip_address fallback', () => {
    expect(formatAuditIp({ ip_address: '8.8.8.8' })).toBe('8.8.8.8');
  });

  it('maps loopback and ipv4-mapped addresses', () => {
    expect(formatAuditIp({ ipAddress: '::1' })).toBe('127.0.0.1');
    expect(formatAuditIp({ ipAddress: '::ffff:10.0.0.1' })).toBe('10.0.0.1');
    expect(formatAuditIp({ ipAddress: '  203.0.113.1  ' })).toBe('203.0.113.1');
  });
});
