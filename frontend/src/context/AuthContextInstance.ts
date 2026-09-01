import { createContext } from 'react';
import type { AuthUser, UserRole } from '../services/authService';
import type { LoginFormData } from '../utils/loginSchema';
import type { SignupFormData } from '../utils/signupSchema';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (data: LoginFormData) => Promise<AuthUser>;
  signup: (data: SignupFormData) => Promise<AuthUser>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isMember: () => boolean;
  updateUserAvatar: (avatarUrl: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
