import { useState, useCallback, type ReactNode } from 'react';
import { AuthContext } from './AuthContextInstance';
import { authService, type AuthUser, type UserRole } from '../services/authService';
import type { LoginFormData } from '../utils/loginSchema';
import type { SignupFormData } from '../utils/signupSchema';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

  const login = async (data: LoginFormData): Promise<AuthUser> => {
    const authenticatedUser = await authService.login(data);
    setUser(authenticatedUser);
    setIsAuthenticated(true);
    return authenticatedUser;
  };

  const signup = async (data: SignupFormData): Promise<AuthUser> => {
    const registeredUser = await authService.signup(data);
    setUser(registeredUser);
    setIsAuthenticated(true);
    return registeredUser;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      if (!user || !user.role) return false;
      return user.role.toLowerCase() === role.toLowerCase();
    },
    [user],
  );

  const isAdmin = useCallback((): boolean => {
    return hasRole('Administrator');
  }, [hasRole]);

  const isMember = useCallback((): boolean => {
    return hasRole('Regular User');
  }, [hasRole]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup,
        logout,
        hasRole,
        isAdmin,
        isMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
