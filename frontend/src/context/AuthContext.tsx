import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext } from './AuthContextInstance';
import { authService, type AuthUser } from '../services/authService';
import type { LoginFormData } from '../utils/loginSchema';
import type { SignupFormData } from '../utils/signupSchema';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    authService.hydrateSession().then((hydratedUser) => {
      if (isMounted) {
        setUser(hydratedUser);
        setIsAuthenticated(hydratedUser !== null);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
