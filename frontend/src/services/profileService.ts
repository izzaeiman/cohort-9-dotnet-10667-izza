import apiClient from './api';

export interface ProfileDto {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export const profileService = {
  /**
   * Fetch current user profile from backend
   */
  async getProfile(): Promise<ProfileDto> {
    const response = await apiClient.get<ProfileDto>('/auth/me');
    return response.data;
  },

  /**
   * Update profile information
   */
  async updateProfile(data: Partial<ProfileDto>): Promise<ProfileDto> {
    throw new Error('Backend integration pending — Update profile endpoints require ASP.NET Core API implementation.');
  },

  /**
   * Change password
   */
  async changePassword(data: any): Promise<void> {
    await apiClient.put('/auth/change-password', data);
  },
};
