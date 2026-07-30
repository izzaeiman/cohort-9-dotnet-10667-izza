import { useState } from 'react';
import { type SubmitHandler } from 'react-hook-form';
import { type SignupFormData } from '../../utils/signupSchema';
import SignupForm from '../../components/forms/SignupForm';
import WorkFlowLogo from '../../components/ui/WorkFlowLogo';
import LoginIllustration from '../../components/ui/LoginIllustration';
import styles from './Signup.module.css';

const FEATURES = [
  { icon: '🔒', text: 'Secure Account Setup' },
  { icon: '📋', text: 'Task & Project Organization' },
  { icon: '👥', text: 'Role-Based Collaboration' },
] as const;

const SignupPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Form submit handler — placeholder until the ASP.NET Core API is connected.
   */
  const handleSignup: SubmitHandler<SignupFormData> = async (data) => {
    setServerError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      // TODO: Replace with real auth call → await authService.signup(data);
      console.log('[SignupPage] credentials →', data);
      await new Promise((res) => setTimeout(res, 900));
      setSuccessMessage(`Account created successfully for ${data.fullName}! (${data.role})`);
    } catch {
      setServerError('Could not create account. Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setServerError('');
    setSuccessMessage('Google Sign-Up initiated (UI Demo mode).');
  };

  return (
    <main className={styles.page} aria-label="WorkFlow Sign Up">
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
              Join WorkFlow<br />
              <span className={styles.heroAccent}>today.</span>
            </h1>
            <p className={styles.heroDesc}>
              Create your account to organize tasks, assign team members, and keep your projects on schedule.
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
              Sign up to start organizing and tracking your team's tasks.
            </p>
          </div>

          <SignupForm
            onSubmit={handleSignup}
            isLoading={isLoading}
            serverError={serverError}
            successMessage={successMessage}
            onGoogleSignUp={handleGoogleSignUp}
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
