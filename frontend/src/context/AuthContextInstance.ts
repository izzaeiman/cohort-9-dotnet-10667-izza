import { createContext } from 'react';
import type { AuthUser } from '../services/authService';
import type { LoginFormData } from '../utils/loginSchema';
import type { SignupFormData } from '../utils/signupSchema';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
