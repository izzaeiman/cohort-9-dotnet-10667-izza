import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from './authService';
import apiClient from './api';

// Mock the API client
vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn().mockResolvedValue({ data: { token: 'mock-csrf' } }),
    defaults: { headers: { common: {} } },
  },
  apiClient: {
    post: vi.fn(),
    get: vi.fn().mockResolvedValue({ data: { token: 'mock-csrf' } }),
    defaults: { headers: { common: {} } },
  }
}));

describe('authService', () => {
  beforeEach(() => {
    // Setup clean localStorage mock
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { for (const key in store) delete store[key]; }),
    } as any;
    
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('isAuthenticated', () => {
    it('should return false when no user exists', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when user exists', () => {
      localStorage.setItem('workflow_user', JSON.stringify({ id: '1', name: 'User', email: 'user@example.com', role: 'Regular User' }));
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user exists', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should return parsed user when valid', () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', role: 'Regular User' };
      localStorage.setItem('workflow_user', JSON.stringify(mockUser));
      expect(authService.getCurrentUser()).toEqual(mockUser);
    });

    it('should remove user if structure is invalid', () => {
      localStorage.setItem('workflow_user', JSON.stringify({ invalid: true }));
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should remove user if json is malformed', () => {
      localStorage.setItem('workflow_user', '{malformed');
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear localStorage', async () => {
      localStorage.setItem('workflow_user', 'fake-user');
      
      await authService.logout();
      
      expect(localStorage.getItem('workflow_user')).toBeNull();
    });
  });

  describe('login', () => {
    it('should call apiClient and store auth data on success', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', name: 'User', email: 'user@example.com', role: 'Administrator' }
        }
      };
      (apiClient.post as any).mockResolvedValueOnce(mockResponse);
      
      const user = await authService.login({ email: 'user@example.com', password: 'Password123!' });
      
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'user@example.com', password: 'Password123!' });
      expect(user.id).toEqual(mockResponse.data.user.id);
      expect(user.email).toEqual(mockResponse.data.user.email);
      expect(user.role).toEqual('Administrator');
    });

    it('should throw error on failure', async () => {
      const errorMsg = 'Invalid credentials';
      (apiClient.post as any).mockRejectedValueOnce({ response: { data: { message: errorMsg } } });
      
      await expect(authService.login({ email: 'user@example.com', password: 'WrongPassword!' }))
        .rejects.toThrow(errorMsg);
    });

    it('should throw error if backend structure is invalid', async () => {
      (apiClient.post as any).mockResolvedValueOnce({ data: { user: null } });
      await expect(authService.login({ email: 'user@example.com', password: 'Password123!' }))
        .rejects.toThrow('Invalid backend response structure.');
    });

    it('should handle error without response payload', async () => {
      (apiClient.post as any).mockRejectedValueOnce(new Error('Network error'));
      await expect(authService.login({ email: 'user@example.com', password: 'Password123!' }))
        .rejects.toThrow('Network error');
    });
  });

  describe('signup', () => {
    it('should call apiClient and store auth data on success', async () => {
      const mockResponse = {
        data: {
          user: { id: '2', name: 'User 2', email: 'user2@example.com', role: 'Regular User' }
        }
      };
      (apiClient.post as any).mockResolvedValueOnce(mockResponse);
      
      const user = await authService.signup({ fullName: 'User 2', email: 'user2@example.com', password: 'Password123!', confirmPassword: 'Password123!', agreeToTerms: true });
      
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', { name: 'User 2', email: 'user2@example.com', password: 'Password123!' });
      expect(user.id).toEqual('2');
      expect(user.role).toEqual('Regular User');
    });

    it('should throw error if backend structure is invalid', async () => {
      (apiClient.post as any).mockResolvedValueOnce({ data: {} });
      await expect(authService.signup({ fullName: 'User 2', email: 'user2@example.com', password: 'Password123!', confirmPassword: 'Password123!', agreeToTerms: true }))
        .rejects.toThrow('Invalid backend response structure.');
    });

    it('should throw error on failure', async () => {
      const errorMsg = 'Email exists';
      (apiClient.post as any).mockRejectedValueOnce({ response: { data: { message: errorMsg } } });
      await expect(authService.signup({ fullName: 'User 2', email: 'user2@example.com', password: 'Password123!', confirmPassword: 'Password123!', agreeToTerms: true }))
        .rejects.toThrow(errorMsg);
    });
  });
});
