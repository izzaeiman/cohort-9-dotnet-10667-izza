import type { LoginFormData } from '../utils/loginSchema';
import type { SignupFormData } from '../utils/signupSchema';
import apiClient from './api';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export type UserRole = 'Administrator' | 'Regular User';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department?: string;
}

interface RegisteredAccount {
  user: AuthUser;
  passwordHash: string;
}

export const MOCK_DEVELOPMENT_ACCOUNTS: RegisteredAccount[] = [
  {
    user: {
      id: 'usr-1',
      name: 'Izza Eiman',
      email: 'admin@example.test',
      role: 'Administrator',
      avatar: 'https://i.pravatar.cc/150?img=68',
      department: 'Engineering Management',
    },
    passwordHash: 'Password123!',
  },
  {
    user: {
      id: 'usr-2',
      name: 'Regular User',
      email: 'member@example.test',
      role: 'Regular User',
      avatar: 'https://i.pravatar.cc/150?img=33',
      department: 'Frontend Development',
    },
    passwordHash: 'Password123!',
  },
  {
    user: {
      id: 'usr-3',
      name: 'Ali Khan',
      email: 'ali.khan@example.test',
      role: 'Regular User',
      avatar: 'https://i.pravatar.cc/150?img=12',
      department: 'Fullstack Development',
    },
    passwordHash: 'Password123!',
  },
];

const getRegisteredAccounts = (): RegisteredAccount[] => {
  const stored = localStorage.getItem('workflow_registered_accounts');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback
    }
  }
  localStorage.setItem('workflow_registered_accounts', JSON.stringify(MOCK_DEVELOPMENT_ACCOUNTS));
  return MOCK_DEVELOPMENT_ACCOUNTS;
};

const saveRegisteredAccounts = (accounts: RegisteredAccount[]) => {
  localStorage.setItem('workflow_registered_accounts', JSON.stringify(accounts));
};

const isMockAuthEnabled = () => {
  // Only enable mock auth in development and when explicitly requested via env variable
  return import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_AUTH === 'true';
};

export const authService = {
  /**
   * Log in user — validates email and password against backend or dev registered user store
   */
  async login(credentials: LoginFormData): Promise<AuthUser> {
    const inputEmail = credentials.email.trim().toLowerCase();

    if (isMockAuthEnabled()) {
      await delay();
      const accounts = getRegisteredAccounts();

      const foundAccount = accounts.find(
        (acc) => acc.user.email.toLowerCase() === inputEmail,
      );

      if (!foundAccount) {
        throw new Error(
          'Account not found. No account is registered with this email address. Please sign up or use demo credentials.',
        );
      }

      if (foundAccount.passwordHash !== credentials.password) {
        throw new Error('Incorrect password. Please verify your password and try again.');
      }

      // Authentication successful — store session
      localStorage.setItem('workflow_token', 'demo_jwt_bearer_token_' + Date.now());
      localStorage.setItem('workflow_user', JSON.stringify(foundAccount.user));
      return foundAccount.user;
    }

    // Production/Backend path:
    try {
      const response = await apiClient.post('/auth/login', {
        email: credentials.email.trim(),
        password: credentials.password
      });

      if (response.data?.token && response.data?.user) {
        const token = response.data.token;
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

        localStorage.setItem('workflow_token', token);
        localStorage.setItem('workflow_user', JSON.stringify(authUser));
        return authUser;
      } else {
        throw new Error('Invalid backend response structure.');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Authentication failed.';
      throw new Error(errorMsg);
    }
  },

  /**
   * Register new user — stores new credentials in backend or dev registered accounts
   */
  async signup(data: SignupFormData): Promise<AuthUser> {
    if (isMockAuthEnabled()) {
      await delay();
      const accounts = getRegisteredAccounts();
      const inputEmail = data.email.trim().toLowerCase();

      const existingAccount = accounts.find(
        (acc) => acc.user.email.toLowerCase() === inputEmail,
      );

      if (existingAccount) {
        throw new Error(
          'An account with this email address already exists. Please sign in instead.',
        );
      }

      const assignedRole: UserRole =
        data.role?.toLowerCase().includes('admin') ? 'Administrator' : 'Regular User';

      const newUser: AuthUser = {
        id: `usr-${Date.now()}`,
        name: data.fullName.trim(),
        email: data.email.trim(),
        role: assignedRole,
        avatar: 'https://i.pravatar.cc/150?img=68',
        department: 'Engineering',
      };

      const newAccount: RegisteredAccount = {
        user: newUser,
        passwordHash: data.password,
      };

      accounts.push(newAccount);
      saveRegisteredAccounts(accounts);

      // Automatically log in new user upon registration
      localStorage.setItem('workflow_token', 'demo_jwt_bearer_token_' + Date.now());
      localStorage.setItem('workflow_user', JSON.stringify(newUser));
      return newUser;
    }

    // Production/Backend path:
    try {
      const response = await apiClient.post('/auth/register', {
        name: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password
      });

      if (response.data?.token && response.data?.user) {
        const token = response.data.token;
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

        localStorage.setItem('workflow_token', token);
        localStorage.setItem('workflow_user', JSON.stringify(authUser));
        return authUser;
      } else {
        throw new Error('Invalid backend response structure.');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed.';
      throw new Error(errorMsg);
    }
  },

  /**
   * Log out user — completely clears session tokens and user data
   */
  async logout(): Promise<void> {
    await delay(100);
    localStorage.removeItem('workflow_token');
    localStorage.removeItem('workflow_user');
  },

  /**
   * Get current stored user (returns null if unauthenticated)
   */
  getCurrentUser(): AuthUser | null {
    const token = localStorage.getItem('workflow_token');
    const stored = localStorage.getItem('workflow_user');
    if (!token || !stored) {
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
      localStorage.removeItem('workflow_token');
      localStorage.removeItem('workflow_user');
      return null;
    }
  },

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};

export default authService;
