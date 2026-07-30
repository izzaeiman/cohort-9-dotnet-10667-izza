import { useState } from 'react';
import { type SubmitHandler } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { type ForgotPasswordFormData } from '../../utils/forgotPasswordSchema';
import ForgotPasswordForm from '../../components/forms/ForgotPasswordForm';
import WorkFlowLogo from '../../components/ui/WorkFlowLogo';
import LoginIllustration from '../../components/ui/LoginIllustration';
import SuccessCheckmark from '../../components/ui/SuccessCheckmark';
import AppButton from '../../components/ui/AppButton';
import styles from './ForgotPassword.module.css';

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSendResetLink: SubmitHandler<ForgotPasswordFormData> = async (data) => {
    setServerError('');
    setIsLoading(true);
    try {
      // TODO: Replace with real auth call → await authService.forgotPassword(data.email);
      console.log('[ForgotPasswordPage] email →', data.email);
      await new Promise((res) => setTimeout(res, 900));
      setSubmittedEmail(data.email);
    } catch {
      setServerError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page} aria-label="WorkFlow Reset Password">
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
              Reset your<br />
              <span className={styles.heroAccent}>password.</span>
            </h1>
            <p className={styles.heroDesc}>
              We'll help you get back into your account safely and quickly so you can return to managing your tasks.
            </p>
          </div>
        </div>
      </section>

      {/* ── Right panel: form card / success card ──────────────────────── */}
      <section className={styles.rightPanel}>
        <div className={styles.mobileLogo} aria-label="WorkFlow logo">
          <WorkFlowLogo size="sm" variant="default" />
        </div>

        <div className={styles.formCard}>
          {!submittedEmail ? (
            <>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Forgot Password? 🔑</h2>
              </div>

              <ForgotPasswordForm
                onSubmit={handleSendResetLink}
                isLoading={isLoading}
                serverError={serverError}
              />
            </>
          ) : (
            /* ── Success State Card ─────────────────────────────────────── */
            <div className={styles.successCard}>
              <div className={styles.successIconWrap}>
                <SuccessCheckmark size={64} />
              </div>

              <h2 className={styles.successTitle}>Check Your Inbox 📩</h2>

              <p className={styles.successMessage}>
                If an account exists for <span className={styles.successEmailBadge}>{submittedEmail}</span>, a password reset link has been sent.
              </p>

              <p className={styles.successSubtext}>
                Please check your spam or junk folder if you don't see the email within a few minutes.
              </p>

              <Link to="/login" style={{ width: '100%', textDecoration: 'none', marginTop: '12px' }}>
                <AppButton variant="primary" size="lg" fullWidth>
                  Back to Sign In
                </AppButton>
              </Link>

              <p className={styles.resendRow}>
                Didn't receive the email?{' '}
                <button
                  type="button"
                  className={styles.resendBtn}
                  onClick={() => setSubmittedEmail(null)}
                >
                  Try another email
                </button>
              </p>
            </div>
          )}
        </div>

        <footer className={styles.pageFooter}>
          <span>© {new Date().getFullYear()} WorkFlow. All rights reserved.</span>
        </footer>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
