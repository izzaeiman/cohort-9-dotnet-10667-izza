import { Navigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { useAuth } from '../../hooks/useAuth';

/**
 * ProtectedLayout — Auth guard wrapper for protected application routes.
 * Checks local auth state and redirects unauthenticated users to /login.
 */
export const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
};

export default ProtectedLayout;
