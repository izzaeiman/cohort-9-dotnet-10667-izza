import { INITIAL_USERS, type UserItem } from '../data/users';
import { authService } from './authService';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const profileService = {
  /**
   * Fetch current user profile synced with active authenticated session
   */
  async getProfile(): Promise<UserItem> {
    await delay();
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated');
    }

    // Try to load from user-specific local storage first
    const storageKey = `workflow_profile_${currentUser.id}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.id === currentUser.id) {
          return parsed;
        }
      } catch {
        // Ignore and fallback
      }
    }

    // Fallback to seeded user if matches ID
    const seeded = INITIAL_USERS.find(u => u.id === currentUser.id);
    if (seeded) {
      const profile = {
        ...seeded,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        avatar: currentUser.avatar
      };
      localStorage.setItem(storageKey, JSON.stringify(profile));
      return profile;
    }

    // Construct fresh default profile for newly registered users
    const defaultProfile: UserItem = {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      department: currentUser.department || 'Engineering',
      phone: '',
      status: 'active',
      lastActive: 'Just now',
      avatar: currentUser.avatar,
      bio: ''
    };
    localStorage.setItem(storageKey, JSON.stringify(defaultProfile));
    return defaultProfile;
  },

  /**
   * Update profile information
   */
  async updateProfile(data: Partial<UserItem>): Promise<UserItem> {
    await delay();
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated');
    }

    const current = await this.getProfile();
    const updated = {
      ...current,
      ...data,
      id: currentUser.id // Ensure ID cannot be spoofed
    };

    localStorage.setItem(`workflow_profile_${currentUser.id}`, JSON.stringify(updated));

    // Sync back to auth user session
    const updatedAuthUser = {
      ...currentUser,
      name: updated.name,
      email: updated.email
    };
    localStorage.setItem('workflow_user', JSON.stringify(updatedAuthUser));

    return updated;
  },

  /**
   * Change password (stub)
   */
  async changePassword(): Promise<never> {
    await delay();
    throw new Error('Backend integration pending — Password change endpoints require ASP.NET Core Identity integration.');
  },
};
