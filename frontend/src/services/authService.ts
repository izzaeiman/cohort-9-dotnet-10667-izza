import type { LoginFormData } from '../utils/loginSchema';
import type { SignupFormData } from '../utils/signupSchema';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export type UserRole = 'Admin' | 'Member';

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
      email: 'izzaeiman@yahoo.com',
      role: 'Admin',
      avatar: 'https://i.pravatar.cc/150?img=68',
      department: 'Engineering Management',
    },
    passwordHash: 'Password123!',
  },
  {
    user: {
      id: 'usr-2',
      name: 'Regular User',
      email: 'member@workflow.local',
      role: 'Member',
      avatar: 'https://i.pravatar.cc/150?img=33',
      department: 'Frontend Development',
    },
    passwordHash: 'Password123!',
  },
  {
    user: {
      id: 'usr-3',
      name: 'Ali Khan',
      email: 'ali.khan@example.com',
      role: 'Member',
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

export const authService = {
  /**
   * Log in user — validates email and password against registered user store
   */
  async login(credentials: LoginFormData): Promise<AuthUser> {
    // TODO: ASP.NET Core API Integration -> POST /api/auth/login
    await delay();

    const accounts = getRegisteredAccounts();
    const inputEmail = credentials.email.trim().toLowerCase();

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
  },

  /**
   * Register new user — stores new credentials in registered accounts
   */
  async signup(data: SignupFormData): Promise<AuthUser> {
    // TODO: ASP.NET Core API Integration -> POST /api/auth/register
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
      data.role?.toLowerCase().includes('admin') ? 'Admin' : 'Member';

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
  },

  /**
   * Log out user — completely clears session tokens and user data
   */
  async logout(): Promise<void> {
    // TODO: ASP.NET Core API Integration -> POST /api/auth/logout
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
      return JSON.parse(stored);
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
    return !!localStorage.getItem('workflow_token') && !!localStorage.getItem('workflow_user');
  },
};

export default authService;
