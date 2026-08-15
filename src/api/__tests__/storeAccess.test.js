import { describe, it, expect, vi } from 'vitest';

describe('storeAccess', () => {
  it('throws before inject and returns store after', async () => {
    vi.resetModules();
    const mod = await import('@/api/storeAccess');
    expect(() => mod.getStore()).toThrow(/has not been injected/);
    const fake = { dispatch: vi.fn() };
    mod.injectStore(fake);
    expect(mod.getStore()).toBe(fake);
  });
});
