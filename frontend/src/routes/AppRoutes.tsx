import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PageLoader from '../components/common/PageLoader';
import ProtectedLayout from '../components/layout/ProtectedLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import useAuth from '../hooks/useAuth';

// Lazy-loaded Pages for Route Code-Splitting & Optimal Performance
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));

const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminTasksPage = lazy(() => import('../pages/admin/AdminTasksPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const TasksPage = lazy(() => import('../pages/tasks/TasksPage'));
const TaskDetailPage = lazy(() => import('../pages/tasks/TaskDetailPage'));
const ProjectsPage = lazy(() => import('../pages/projects/ProjectsPage'));
const CalendarPage = lazy(() => import('../pages/calendar/CalendarPage'));
const UsersPage = lazy(() => import('../pages/users/UsersPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('../pages/notFound/NotFoundPage'));

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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* ── Protected Application Shell Routes ─────────────────────────── */}
      <Route element={<ProtectedLayout />}>
        <Route index element={<RootIndexRedirect />} />

        {/* ── Admin Only Routes ────────────────────────────────────────── */}
        <Route element={<ProtectedRoute requiredRole="Admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/tasks" element={<AdminTasksPage />} />
          <Route path="/admin/projects" element={<ProjectsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/calendar" element={<CalendarPage />} />
          <Route path="/admin/profile" element={<ProfilePage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>

        {/* ── Regular User / Member Routes ────────────────────────────── */}
        <Route element={<ProtectedRoute requiredRole="Member" />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* ── 404 Catch-All Route ────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
