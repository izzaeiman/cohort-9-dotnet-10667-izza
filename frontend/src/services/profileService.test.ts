import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileService } from './profileService';
import apiClient from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches profile data from /auth/me endpoint', async () => {
    const mockData = { id: 'u1', name: 'Profile User', email: 'prof@test.com', role: 'Regular User' };
    (apiClient.get as any).mockResolvedValue({ data: mockData });

    const result = await profileService.getProfile();
    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(mockData);
  });

  it('calls changePassword endpoint with payload', async () => {
    (apiClient.put as any).mockResolvedValue({ data: {} });
    const payload = { currentPassword: 'Old', newPassword: 'New' };

    await profileService.changePassword(payload);
    expect(apiClient.put).toHaveBeenCalledWith('/auth/change-password', payload);
  });

  it('throws pending error when updateProfile is called', async () => {
    await expect(profileService.updateProfile({})).rejects.toThrow(/Backend integration pending/i);
  });
});
