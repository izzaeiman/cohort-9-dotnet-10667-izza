import { describe, it, expect, vi, beforeAll } from 'vitest';
import { authService } from './services/authService';

beforeAll(() => {
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  } as any;
});

describe('authService', () => {
  it('should not be authenticated initially', () => {
    expect(authService.isAuthenticated()).toBe(false);
  });
});
