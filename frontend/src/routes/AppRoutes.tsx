import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';

/**
 * AppRoutes — Login-only phase.
 *
 * /         → redirect to /login
 * /login    → LoginPage (self-contained split-screen layout)
 * /signup   → placeholder (will be built later)
 * /forgot-password → placeholder (will be built later)
 * *         → redirect to /login
 */
const AppRoutes = () => (
  <Routes>
    {/* Root redirect */}
    <Route index element={<Navigate to="/login" replace />} />

    {/* ── Login — standalone full-page layout ──────────────────────────── */}
    <Route path="/login" element={<LoginPage />} />

    {/* ── Placeholder routes (UI built later) ─────────────────────────── */}
    <Route path="/signup" element={<Navigate to="/login" replace />} />
    <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default AppRoutes;
