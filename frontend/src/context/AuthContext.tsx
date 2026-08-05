import { useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContextInstance';
import { authService, type AuthUser } from '../services/authService';
import type { LoginFormData } from '../utils/loginSchema';
import type { SignupFormData } from '../utils/signupSchema';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

  const login = async (data: LoginFormData) => {
    const authenticatedUser = await authService.login(data);
    setUser(authenticatedUser);
    setIsAuthenticated(true);
  };

  const signup = async (data: SignupFormData) => {
    const registeredUser = await authService.signup(data);
    setUser(registeredUser);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
