import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type SubmitHandler } from 'react-hook-form';
import { type LoginFormData } from '../../utils/loginSchema';
import LoginForm from '../../components/forms/LoginForm';
import WorkFlowLogo from '../../components/ui/WorkFlowLogo';
import LoginIllustration from '../../components/ui/LoginIllustration';
import { authService } from '../../services/authService';
import styles from './Login.module.css';

const FEATURES = [
  { icon: '🔒', text: 'Secure Login & Authentication' },
  { icon: '📋', text: 'Real-Time Task Tracking' },
  { icon: '👥', text: 'Seamless Team Collaboration' },
] as const;

export const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleLogin: SubmitHandler<LoginFormData> = async (data) => {
    setServerError('');
    setIsLoading(true);
    try {
      await authService.login(data);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Invalid email or password. Account not found — please sign up first.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page} aria-label="WorkFlow Login">
      {/* ── Left panel: branding + illustration ────────────────────────── */}
      <section className={styles.leftPanel} aria-hidden="true">
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />

        <div className={styles.leftContent}>
          <div className={styles.logoWrap}>
            <WorkFlowLogo size="md" variant="white" />
          </div>

          <div className={styles.illustrationWrap}>
            <LoginIllustration />
          </div>

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
        <div className={styles.mobileLogo} aria-label="WorkFlow logo">
          <WorkFlowLogo size="sm" variant="default" />
        </div>

        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Welcome 👋</h2>
            <p className={styles.cardSubtitle}>
              Sign in to continue managing your tasks.
            </p>
          </div>

          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            serverError={serverError}
          />
        </div>

        <footer className={styles.pageFooter}>
          <span>© {new Date().getFullYear()} WorkFlow. All rights reserved.</span>
        </footer>
      </section>
    </main>
  );
};

export default LoginPage;
