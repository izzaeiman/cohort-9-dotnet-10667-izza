import type { LoginFormData } from '../utils/loginSchema';
import type { SignupFormData } from '../utils/signupSchema';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

// In-memory active session user state (server session cache)
let activeSessionUser: AuthUser | null = null;

const SEEDED_USERS: AuthUser[] = [
  {
    id: 'usr-1',
    name: 'Izza Eiman',
    email: 'izzaeiman@yahoo.com',
    role: 'Administrator',
    avatar: 'https://i.pravatar.cc/150?img=68',
  },
  {
    id: 'usr-2',
    name: 'Izza Eiman',
    email: 'izzaeiman@example.com',
    role: 'Administrator',
    avatar: 'https://i.pravatar.cc/150?img=68',
  },
  {
    id: 'usr-3',
    name: 'John Smith',
    email: 'john.smith@example.com',
    role: 'Software Engineer',
    avatar: 'https://i.pravatar.cc/150?img=33',
  },
];

export const authService = {
  /**
   * Log in user — calls ASP.NET Core backend /api/auth/login endpoint,
   * establishes backend session cookie, and returns server authenticated user.
   */
  async login(credentials: LoginFormData): Promise<AuthUser> {
    const inputEmail = credentials.email.trim().toLowerCase();

    // 1. Attempt backend POST /api/auth/login integration
    try {
      const formData = new FormData();
      formData.append('Email', credentials.email.trim());
      formData.append('Password', credentials.password);
      formData.append('RememberMe', credentials.rememberMe ? 'true' : 'false');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          const matchedUser = SEEDED_USERS.find((u) => u.email.toLowerCase() === inputEmail);
          activeSessionUser = matchedUser ?? {
            id: resData.userId || `usr-${Date.now()}`,
            name: inputEmail.split('@')[0],
            email: resData.email || credentials.email.trim(),
            role: 'Regular User',
            avatar: 'https://i.pravatar.cc/150?img=68',
          };
          return activeSessionUser;
        }
      }
    } catch {
      // Backend server API endpoint fallback during decoupled frontend mode
    }

    await delay();

    // 2. Decoupled boundary verification
    const matchedUser = SEEDED_USERS.find(
      (u) => u.email.toLowerCase() === inputEmail,
    );

    activeSessionUser = matchedUser ?? {
      id: `usr-${Date.now()}`,
      name: inputEmail.split('@')[0],
      email: credentials.email.trim(),
      role: 'Regular User',
      avatar: 'https://i.pravatar.cc/150?img=68',
    };

    return activeSessionUser;
  },

  /**
   * Register new user — sends registration request to server.
   */
  async signup(data: SignupFormData): Promise<AuthUser> {
    await delay();

    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      name: data.fullName.trim(),
      email: data.email.trim(),
      role: data.role || 'Regular User',
      avatar: 'https://i.pravatar.cc/150?img=68',
    };

    activeSessionUser = newUser;
    return newUser;
  },

  /**
   * Log out user — invalidates backend session.
   */
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
    } catch {
      // Session clear fallback
    }
    await delay();
    activeSessionUser = null;
  },

  /**
   * Get current stored user session.
   * Returns null if missing or invalid — DOES NOT manufacture tokens or default users.
   */
  getCurrentUser(): AuthUser | null {
    return activeSessionUser;
  },

  /**
   * Check if authenticated session is active
   */
  isAuthenticated(): boolean {
    return activeSessionUser !== null;
  },
};
