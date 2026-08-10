import React from 'react';
import ProtectedRoute from './ProtectedRoute';

export const isAdminUser = (user: { role?: string } | null): boolean => {
  if (!user || !user.role) return false;
  const r = user.role.toLowerCase();
  return r.includes('admin') || r === 'administrator';
};

export const AdminRoute: React.FC = () => {
  return <ProtectedRoute requiredRole="Admin" />;
};

export default AdminRoute;
