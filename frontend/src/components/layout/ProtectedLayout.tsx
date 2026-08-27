import { Navigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { useAuth } from '../../hooks/useAuth';

/**
 * ProtectedLayout — Auth guard wrapper for protected application routes.
 * Hydrates AuthContext session state before evaluating authentication;
 * retains loading state until hydration completes, then redirects unauthenticated users.
 */
export const ProtectedLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8F9FA' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #E0E0E0', borderTopColor: '#FF7A1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
};

export default ProtectedLayout;
