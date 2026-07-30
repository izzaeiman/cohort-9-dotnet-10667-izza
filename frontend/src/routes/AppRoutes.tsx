import { Routes, Route, Navigate, Link } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import AppButton from '../components/ui/AppButton';

const PlaceholderPage = ({ title, description }: { title: string; description: string }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    padding: '20px',
    fontFamily: 'Inter, sans-serif'
  }}>
    <div style={{
      backgroundColor: '#ffffff',
      padding: '40px',
      borderRadius: '20px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
      textAlign: 'center',
      maxWidth: '420px',
      width: '100%'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F1F1F', marginBottom: '10px' }}>{title}</h2>
      <p style={{ color: '#666666', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>{description}</p>
      <Link to="/login" style={{ textDecoration: 'none' }}>
        <AppButton variant="primary" fullWidth size="md">Back to Login</AppButton>
      </Link>
    </div>
  </div>
);

const AppRoutes = () => (
  <Routes>
    {/* Root redirect */}
    <Route index element={<Navigate to="/login" replace />} />

    {/* ── Login — standalone full-page layout ──────────────────────────── */}
    <Route path="/login" element={<LoginPage />} />

    {/* ── Placeholder routes (UI built later) ─────────────────────────── */}
    <Route
      path="/signup"
      element={
        <PlaceholderPage
          title="Sign Up Page 🚀"
          description="As requested, only the Login page UI is active for today. Signup will be built in the next module!"
        />
      }
    />
    <Route
      path="/forgot-password"
      element={
        <PlaceholderPage
          title="Forgot Password 🔑"
          description="Password reset module will be connected once the ASP.NET Core auth endpoints are active."
        />
      }
    />

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default AppRoutes;
