import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type SubmitHandler } from 'react-hook-form';
import { type SignupFormData } from '../../utils/signupSchema';
import SignupForm from '../../components/forms/SignupForm';
import WorkFlowLogo from '../../components/ui/WorkFlowLogo';
import LoginIllustration from '../../components/ui/LoginIllustration';
import useAuth from '../../hooks/useAuth';
import styles from './Signup.module.css';

const FEATURES = [
  { icon: '🚀', text: 'Instant Workspace Setup' },
  { icon: '⚡', text: 'High-Performance UI & Workflows' },
  { icon: '🛡️', text: 'Enterprise Role Authorization' },
] as const;

export const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSignup: SubmitHandler<SignupFormData> = async (data) => {
    setServerError('');
    setIsLoading(true);
    try {
      const registeredUser = await signup(data);
      if (registeredUser.role === 'Admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Could not complete registration. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page} aria-label="WorkFlow Sign Up">
      {/* ── Left panel: branding + illustration ────────────────────────── */}
      <section className={styles.leftPanel} aria-hidden="true">
        <div className={styles.orb1} />
        <div className={styles.orb2} />

        <div className={styles.leftContent}>
          <div className={styles.logoWrap}>
            <WorkFlowLogo size="md" variant="white" />
          </div>

          <div className={styles.illustrationWrap}>
            <LoginIllustration />
          </div>

          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Join WorkFlow today.<br />
              <span className={styles.heroAccent}>Streamline team tasks.</span>
            </h1>
            <p className={styles.heroDesc}>
              Create your account to unlock powerful task management, project dashboards, and real-time collaboration.
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

      {/* ── Right panel: signup form ────────────────────────────────────── */}
      <section className={styles.rightPanel}>
        <div className={styles.mobileLogo} aria-label="WorkFlow logo">
          <WorkFlowLogo size="sm" variant="default" />
        </div>

        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Create Account 🚀</h2>
            <p className={styles.cardSubtitle}>
              Get started with WorkFlow in less than a minute.
            </p>
          </div>

          <SignupForm
            onSubmit={handleSignup}
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

export default SignupPage;
