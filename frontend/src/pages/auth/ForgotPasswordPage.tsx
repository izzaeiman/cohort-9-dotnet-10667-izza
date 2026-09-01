import { useNavigate } from 'react-router-dom';
import WorkFlowLogo from '../../components/ui/WorkFlowLogo';
import LoginIllustration from '../../components/ui/LoginIllustration';
import AppButton from '../../components/ui/AppButton';
import styles from './ForgotPassword.module.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

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
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Contact Administrator 📞</h2>
          </div>
          
          <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Password recovery is currently handled by the administrator. Please contact the administrator for seamless authorization and account recovery.
            </p>
            
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Administrator Phone Number</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>+92 300 1234567</strong>
            </div>

            <AppButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate('/login')}
              style={{ marginTop: '12px' }}
            >
              Back to Sign In
            </AppButton>
          </div>
        </div>

        <footer className={styles.pageFooter}>
          <span>© {new Date().getFullYear()} WorkFlow. All rights reserved.</span>
        </footer>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
