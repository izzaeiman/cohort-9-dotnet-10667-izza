import { useState } from 'react';
import { type SubmitHandler } from 'react-hook-form';
import { type LoginFormData } from '../../utils/loginSchema';
import LoginForm from '../../components/forms/LoginForm';
import WorkFlowLogo from '../../components/ui/WorkFlowLogo';
import LoginIllustration from '../../components/ui/LoginIllustration';
import styles from './Login.module.css';

// ─── Feature list items ──────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🔒', text: 'Secure Login & Authentication' },
  { icon: '📋', text: 'Real-Time Task Tracking' },
  { icon: '👥', text: 'Seamless Team Collaboration' },
] as const;

// ─── LoginPage ───────────────────────────────────────────────────────────────
const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  /**
   * Form submit handler — placeholder until the ASP.NET Core API is connected.
   * Replace the body of this function with your auth service call.
   */
  const handleLogin: SubmitHandler<LoginFormData> = async (data) => {
    setServerError('');
    setIsLoading(true);
    try {
      // TODO: Replace with real auth call → await authService.login(data);
      console.log('[LoginPage] credentials →', data);
      // Simulate network delay for demo
      await new Promise((res) => setTimeout(res, 1200));
    } catch {
      setServerError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page} aria-label="WorkFlow Login">
      {/* ── Left panel: branding + illustration ────────────────────────── */}
      <section className={styles.leftPanel} aria-hidden="true">
        {/* Gradient orbs */}
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />

        <div className={styles.leftContent}>
          {/* Logo */}
          <div className={styles.logoWrap}>
            <WorkFlowLogo size="md" variant="white" />
          </div>

          {/* Illustration */}
          <div className={styles.illustrationWrap}>
            <LoginIllustration />
          </div>

          {/* Headline */}
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Manage your tasks<br />
              <span className={styles.heroAccent}>effortlessly.</span>
            </h1>
            <p className={styles.heroDesc}>
              Organize projects, collaborate with your team and stay
              productive with one modern workspace.
            </p>
          </div>

          {/* Feature list */}
          <ul className={styles.featureList} aria-label="Key features">
            {FEATURES.map(({ icon, text }) => (
              <li key={text} className={styles.featureItem}>
                <span className={styles.featureIcon}>{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Right panel: login form ────────────────────────────────────── */}
      <section className={styles.rightPanel}>
        {/* Mobile-only logo */}
        <div className={styles.mobileLogo} aria-label="WorkFlow logo">
          <WorkFlowLogo size="sm" variant="default" />
        </div>

        <div className={styles.formCard}>
          {/* Card header */}
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Welcome 👋</h2>
            <p className={styles.cardSubtitle}>
              Sign in to continue managing your tasks.
            </p>
          </div>

          {/* Form */}
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            serverError={serverError}
          />
        </div>

        {/* Footer */}
        <footer className={styles.pageFooter}>
          <span>© {new Date().getFullYear()} WorkFlow. All rights reserved.</span>
        </footer>
      </section>
    </main>
  );
};

export default LoginPage;
