import { describe, it, expect, vi } from 'vitest';

describe('resolveAssetUrl', () => {
  it('returns null for falsy', async () => {
    vi.resetModules();
    vi.doMock('@/lib/constants', () => ({ API_BASE: '/api/v1' }));
    const { resolveAssetUrl } = await import('@/lib/assetUrl');
    expect(resolveAssetUrl()).toBeNull();
    expect(resolveAssetUrl('')).toBeNull();
  });

  it('passes absolute http(s) URLs through', async () => {
    vi.resetModules();
    vi.doMock('@/lib/constants', () => ({ API_BASE: '/api/v1' }));
    const { resolveAssetUrl } = await import('@/lib/assetUrl');
    expect(resolveAssetUrl('https://cdn.example/a.png')).toBe('https://cdn.example/a.png');
    expect(resolveAssetUrl('http://cdn.example/a.png')).toBe('http://cdn.example/a.png');
  });

  it('uses localhost when API_BASE is relative', async () => {
    vi.resetModules();
    vi.doMock('@/lib/constants', () => ({ API_BASE: '/api/v1' }));
    const { resolveAssetUrl } = await import('@/lib/assetUrl');
    expect(resolveAssetUrl('uploads/a.png')).toBe('http://localhost:3000/uploads/a.png');
    expect(resolveAssetUrl('/uploads/a.png')).toBe('http://localhost:3000/uploads/a.png');
  });

  it('strips trailing /api/v1 from absolute API_BASE', async () => {
    vi.resetModules();
    vi.doMock('@/lib/constants', () => ({ API_BASE: 'https://api.example.com/api/v1' }));
    const { resolveAssetUrl } = await import('@/lib/assetUrl');
    expect(resolveAssetUrl('/uploads/a.png')).toBe('https://api.example.com/uploads/a.png');
  });
});
