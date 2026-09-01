import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import type { UserRole } from '../../services/authService';

interface ProtectedRouteProps {
  requiredRole?: UserRole;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'Administrator' && !isAdmin()) {
    // Regular Member attempting to access Admin routes -> redirect to Member Dashboard
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'Regular User' && isAdmin()) {
    // Admin attempting to access Member Dashboard -> redirect to Admin Dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
