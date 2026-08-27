import { INITIAL_USERS, type UserItem } from '../data/users';
import { authService } from './authService';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let currentProfile: UserItem = { ...INITIAL_USERS[0] };

export const profileService = {
  /**
   * Fetch current user profile synced with active authenticated session
   */
  async getProfile(): Promise<UserItem> {
    // TODO: ASP.NET Core API Integration -> GET /api/profile
    await delay();
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      currentProfile = {
        ...currentProfile,
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: (currentUser.role as 'Regular User' | 'Administrator') || 'Regular User',
        avatar: currentUser.avatar,
      };
    }
    return { ...currentProfile };
  },

  /**
   * Update profile information
   */
  async updateProfile(data: Partial<UserItem>): Promise<UserItem> {
    // TODO: ASP.NET Core API Integration -> PUT /api/profile
    await delay();
    currentProfile = { ...currentProfile, ...data };
    
    // Sync with auth user session
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      currentUser.name = data.name || currentUser.name;
      currentUser.email = data.email || currentUser.email;
    }
    return { ...currentProfile };
  },

  /**
   * Change password (stub)
   */
  async changePassword(): Promise<never> {
    // TODO: ASP.NET Core API Integration -> POST /api/profile/change-password
    await delay();
    throw new Error('Backend integration pending — Password change endpoints require ASP.NET Core Identity integration.');
  },
};
