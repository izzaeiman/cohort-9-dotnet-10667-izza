import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

const AppRoutes = () => (
  <Routes>
    {/* Root redirect */}
    <Route index element={<Navigate to="/login" replace />} />

    {/* ── Auth routes ─────────────────────────────────────────────────── */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

    {/* Catch-all redirect */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default AppRoutes;
