import type { LoginFormData } from '../utils/loginSchema';
import type { SignupFormData } from '../utils/signupSchema';
import apiClient from './api';

export type UserRole = 'Administrator' | 'Regular User';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department?: string;
}

export const authService = {
  /**
   * Helper to ensure CSRF token is fetched
   */
  async ensureCsrfToken() {
    try {
      const csrfRes = await apiClient.get('/auth/antiforgery-token');
      if (apiClient.defaults?.headers?.common && csrfRes?.data?.token) {
        apiClient.defaults.headers.common['X-XSRF-TOKEN'] = csrfRes.data.token;
      }
    } catch {
      // Safe fallback if mocked in tests
    }
  },

  /**
   * Log in user — validates email and password against backend
   */
  async login(credentials: LoginFormData): Promise<AuthUser> {
    try {
      await this.ensureCsrfToken();
      const response = await apiClient.post('/auth/login', {
        email: credentials.email.trim(),
        password: credentials.password
      });

      if (response.data?.user) {
        const userDto = response.data.user;

        const mappedRole: UserRole = userDto.role === 'Administrator' ? 'Administrator' : 'Regular User';

        const authUser: AuthUser = {
          id: userDto.id,
          name: userDto.name,
          email: userDto.email,
          role: mappedRole,
          avatar: userDto.role === 'Administrator' ? 'https://i.pravatar.cc/150?img=68' : 'https://i.pravatar.cc/150?img=33',
          department: userDto.role === 'Administrator' ? 'Engineering Management' : 'Frontend Development'
        };

        localStorage.setItem('workflow_user', JSON.stringify(authUser));

        // Force-refresh the CSRF token now that the user is authenticated
        if (apiClient.defaults?.headers?.common) {
          delete apiClient.defaults.headers.common['X-XSRF-TOKEN'];
        }
        await this.ensureCsrfToken();

        return authUser;
      } else {
        throw new Error('Invalid backend response structure.');
      }
    } catch (err: unknown) {
      if ((err as any).message === 'Network Error') {
        throw new Error('Unable to connect to the server. Please try again.');
      }
      const errorMsg = (err as any).response?.data?.message || (err as any).message || 'Authentication failed.';
      throw new Error(errorMsg);
    }
  },

  /**
   * Register new user — stores new credentials in backend
   */
  async signup(data: SignupFormData): Promise<AuthUser> {
    try {
      await this.ensureCsrfToken();
      const response = await apiClient.post('/auth/register', {
        name: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password
      });

      if (response.data?.user) {
        const userDto = response.data.user;

        const mappedRole: UserRole = userDto.role === 'Administrator' ? 'Administrator' : 'Regular User';

        const authUser: AuthUser = {
          id: userDto.id,
          name: userDto.name,
          email: userDto.email,
          role: mappedRole,
          avatar: userDto.role === 'Administrator' ? 'https://i.pravatar.cc/150?img=68' : 'https://i.pravatar.cc/150?img=33',
          department: 'Engineering'
        };

        localStorage.setItem('workflow_user', JSON.stringify(authUser));
        await this.ensureCsrfToken();
        return authUser;
      } else {
        throw new Error('Invalid backend response structure.');
      }
    } catch (err: unknown) {
      if ((err as any).message === 'Network Error') {
        throw new Error('Unable to connect to the server. Please try again.');
      }
      const errorMsg = (err as any).response?.data?.message || (err as any).message || 'Registration failed.';
      throw new Error(errorMsg);
    }
  },

  /**
   * Log out user — completely clears session tokens and user data
   */
  async logout(): Promise<void> {
    try {
      await this.ensureCsrfToken();
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore errors on logout
    }
    localStorage.removeItem('workflow_user');
    if (apiClient.defaults?.headers?.common) {
      delete apiClient.defaults.headers.common['X-XSRF-TOKEN'];
    }
  },

  /**
   * Get current stored user (returns null if unauthenticated)
   */
  getCurrentUser(): AuthUser | null {
    const stored = localStorage.getItem('workflow_user');
    if (!stored) {
      return null;
    }
    try {
      const parsed = JSON.parse(stored);
      // Validate stored session structure: must be an object with non-empty id, email, and role
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.id === 'string' &&
        parsed.id.trim() !== '' &&
        typeof parsed.email === 'string' &&
        parsed.email.trim() !== '' &&
        (parsed.role === 'Administrator' || parsed.role === 'Regular User')
      ) {
        return parsed;
      }
      throw new Error('Invalid session structure detected.');
    } catch {
      localStorage.removeItem('workflow_user');
      return null;
    }
  },

  /**
   * Change Password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.ensureCsrfToken();
    await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
  },

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};

export default authService;
