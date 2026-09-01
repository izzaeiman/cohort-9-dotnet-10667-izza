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

  it('updates profile information via /auth/profile endpoint', async () => {
    const updatedData = { id: 'u1', name: 'Updated Name', email: 'prof@test.com', role: 'Regular User' };
    (apiClient.put as any).mockResolvedValue({ data: updatedData });

    const result = await profileService.updateProfile({ name: 'Updated Name' });
    expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', { name: 'Updated Name' });
    expect(result).toEqual(updatedData);
  });
});
