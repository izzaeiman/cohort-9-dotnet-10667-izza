import apiClient from './api';

export interface ProfileDto {
  id: string;
  name: string;
  email: string;
  role: string;
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
   * Change password (stub)
   */
  async changePassword(): Promise<never> {
    throw new Error('Backend integration pending — Password change endpoints require ASP.NET Core Identity integration.');
  },
};
