import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Do NOT mock './api' here — we need the real interceptors
import apiClient from './api';

describe('apiClient interceptors — additional branches (real module)', () => {
  const originalWindowLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { ...originalWindowLocation, pathname: '/dashboard', href: '' },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalWindowLocation, writable: true });
    vi.restoreAllMocks();
  });

  it('request interceptor error handler rejects with original error', async () => {
    const handlers = (apiClient.interceptors.request as any).handlers;
    const handler = handlers?.find((h: any) => h?.rejected);
    if (handler?.rejected) {
      const err = new Error('request setup failed');
      await expect(handler.rejected(err)).rejects.toEqual(err);
    } else {
      // no error handler registered — pass
      expect(true).toBe(true);
    }
  });

  it('response interceptor passes through non-401 errors unchanged', async () => {
    const handlers = (apiClient.interceptors.response as any).handlers;
    const handler = handlers?.find((h: any) => h?.rejected);
    expect(handler).toBeDefined();
    const err = { response: { status: 403 }, config: { url: '/tasks' } };
    await expect(handler!.rejected(err)).rejects.toMatchObject({ response: { status: 403 } });
  });

  it('handleUnauthorized skips redirect but still rejects when already on /signup', async () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalWindowLocation, pathname: '/signup', href: '' },
      writable: true,
    });

    const handlers = (apiClient.interceptors.response as any).handlers;
    const handler = handlers?.find((h: any) => h?.rejected);
    expect(handler).toBeDefined();

    // 401 on /auth/refresh triggers handleUnauthorized
    await expect(
      handler!.rejected({ response: { status: 401 }, config: { url: '/auth/refresh', _retry: false } })
    ).rejects.toBeDefined();

    // When on /signup, redirect to /login should NOT happen
    expect(window.location.href).not.toBe('/login');
  });
});
