import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PageLoader from '../components/common/PageLoader';
import ProtectedLayout from '../components/layout/ProtectedLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import useAuth from '../hooks/useAuth';

// Lazy-loaded Admin and Core Auth/Dashboard Pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminTasksPage = lazy(() => import('../pages/admin/AdminTasksPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const TasksPage = lazy(() => import('../pages/tasks/TasksPage'));
const TaskDetailPage = lazy(() => import('../pages/tasks/TaskDetailPage'));
const NotFoundPage = lazy(() => import('../pages/notFound/NotFoundPage'));

const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #666)' }}>
    <h2>{title} Module</h2>
    <p>This module is available in full-stack mode.</p>
  </div>
);

const RootIndexRedirect = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={isAdmin() ? '/admin/dashboard' : '/dashboard'} replace />;
};

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Public Auth Routes ───────────────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<LoginPage />} />

      {/* ── Protected Application Shell Routes ─────────────────────────── */}
      <Route element={<ProtectedLayout />}>
        <Route index element={<RootIndexRedirect />} />

        {/* ── Admin Only Routes ────────────────────────────────────────── */}
        <Route element={<ProtectedRoute requiredRole="Admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/tasks" element={<AdminTasksPage />} />
          <Route path="/admin/projects" element={<PlaceholderPage title="Projects" />} />
          <Route path="/admin/users" element={<PlaceholderPage title="Users" />} />
          <Route path="/admin/calendar" element={<PlaceholderPage title="Calendar" />} />
          <Route path="/admin/profile" element={<PlaceholderPage title="Profile" />} />
          <Route path="/admin/settings" element={<PlaceholderPage title="Settings" />} />
        </Route>

        {/* ── Regular User / Member Routes ────────────────────────────── */}
        <Route element={<ProtectedRoute requiredRole="Member" />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/projects" element={<PlaceholderPage title="Projects" />} />
          <Route path="/calendar" element={<PlaceholderPage title="Calendar" />} />
          <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        </Route>
      </Route>

      {/* ── 404 Catch-All Route ────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
