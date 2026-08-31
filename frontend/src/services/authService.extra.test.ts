import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';
import apiClient from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { token: 'mock-csrf' } }),
    post: vi.fn(),
    put: vi.fn(),
    defaults: { headers: { common: {} } },
  },
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { token: 'mock-csrf' } }),
    post: vi.fn(),
    put: vi.fn(),
    defaults: { headers: { common: {} } },
  },
}));

describe('authService — remaining 5 uncovered lines', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { for (const k in store) delete store[k]; }),
    } as any;
    vi.clearAllMocks();
  });

  describe('changePassword', () => {
    it('calls PUT /auth/change-password with correct payload', async () => {
      (apiClient.put as any).mockResolvedValueOnce({});
      await authService.changePassword('old-pass', 'new-pass');
      expect(apiClient.put).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'old-pass',
        newPassword: 'new-pass',
      });
    });
  });

  describe('login — Network Error branch', () => {
    it('converts Network Error to friendly message', async () => {
      (apiClient.post as any).mockRejectedValueOnce(new Error('Network Error'));
      await expect(authService.login({ email: 'a@b.com', password: 'pass' }))
        .rejects.toThrow('Unable to connect to the server. Please try again.');
    });
  });

  describe('signup — Network Error branch', () => {
    it('converts Network Error to friendly message', async () => {
      (apiClient.post as any).mockRejectedValueOnce(new Error('Network Error'));
      await expect(
        authService.signup({ fullName: 'Bob', email: 'b@c.com', password: 'pw', confirmPassword: 'pw', agreeToTerms: true })
      ).rejects.toThrow('Unable to connect to the server. Please try again.');
    });
  });

  describe('logout — error swallowed', () => {
    it('clears local storage even if API call fails', async () => {
      (apiClient.post as any).mockRejectedValueOnce(new Error('Server down'));
      localStorage.setItem('workflow_user', 'some-user');
      await authService.logout(); // should NOT throw
      expect(localStorage.getItem('workflow_user')).toBeNull();
    });
  });
});
