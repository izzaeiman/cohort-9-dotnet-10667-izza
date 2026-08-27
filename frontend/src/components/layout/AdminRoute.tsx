import React from 'react';
import ProtectedRoute from './ProtectedRoute';

export const isAdminUser = (user: { role?: string } | null): boolean => {
  if (!user || !user.role) return false;
  const role = user.role.trim().toLowerCase();
  return role === 'admin' || role === 'administrator';
};

export const AdminRoute: React.FC = () => {
  return <ProtectedRoute requiredRole="Admin" />;
};

export default AdminRoute;
