import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiClient from './api';

describe('apiClient', () => {
  const originalWindowLocation = window.location;

  beforeEach(() => {
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { for (const key in store) delete store[key]; }),
    } as any;
    localStorage.clear();
    // @ts-ignore
    // delete window.location;
    Object.defineProperty(window, 'location', { value: { ...originalWindowLocation, pathname: '/dashboard', href: '' }, writable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalWindowLocation, writable: true });
    vi.restoreAllMocks();
  });

  it('handles response interceptor success', () => {
    const responseInterceptor = (apiClient.interceptors.response as any).handlers[0].fulfilled;
    const res = { data: 'ok' };
    expect(responseInterceptor(res)).toBe(res);
  });

  it('handles 401 response and redirects on refresh failure', async () => {
    const responseInterceptorError = (apiClient.interceptors.response as any).handlers[0].rejected;
    localStorage.setItem('workflow_user', 'user_data');
    
    await expect(responseInterceptorError({ response: { status: 401 }, config: { url: '/auth/refresh' } })).rejects.toBeDefined();
    
    expect(localStorage.getItem('workflow_user')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('handles 401 response and does not redirect if on login', async () => {
    const responseInterceptorError = (apiClient.interceptors.response as any).handlers[0].rejected;
    window.location.pathname = '/login' as any;
    await expect(responseInterceptorError({ response: { status: 401 }, config: { url: '/auth/login' } })).rejects.toBeDefined();
    expect(window.location.href).not.toBe('/login');
  });

  it('handles non-401 error', async () => {
    const responseInterceptorError = (apiClient.interceptors.response as any).handlers[0].rejected;
    localStorage.setItem('workflow_user', 'user_data');
    await expect(responseInterceptorError({ response: { status: 500 }, config: { url: '/tasks' } })).rejects.toBeDefined();
    expect(localStorage.getItem('workflow_user')).toBe('user_data');
  });

  it('runs request interceptor to skip token fetching on non-mutating get method', async () => {
    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const config = { method: 'get', url: '/tasks', headers: {} };
    const res = await requestInterceptor(config);
    expect(res.headers['X-XSRF-TOKEN']).toBeUndefined();
  });
});
