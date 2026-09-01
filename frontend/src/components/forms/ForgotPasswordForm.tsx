import { Link } from 'react-router-dom';
import { MdArrowBack, MdAdminPanelSettings } from 'react-icons/md';
import styles from './ForgotPasswordForm.module.css';

const ForgotPasswordForm = () => {
  return (
    <div className={styles.form}>
      <div style={{ padding: '18px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary, #f9fafb)', border: '1px solid var(--border, #e5e7eb)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#FF7A1A' }}>
          <MdAdminPanelSettings size={22} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text, #111)' }}>
            Administrator-Managed Password Recovery
          </h3>
        </div>

        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary, #555)', lineHeight: 1.5 }}>
          Password resets are managed directly by the System Administrator to ensure account security. Please contact the administrator below to request credential assistance.
        </p>

        <div style={{ marginTop: '14px', padding: '10px 14px', backgroundColor: 'var(--card-bg, #ffffff)', borderRadius: '6px', border: '1px solid var(--border, #e5e7eb)', fontSize: '0.875rem' }}>
          <span style={{ color: '#666' }}>Administrator Contact: </span>
          <strong style={{ color: '#FF7A1A' }}>admin@workflow.local</strong>
        </div>
      </div>

      <p className={styles.backText}>
        <Link to="/login" className={styles.backLink} id="forgot-back-link">
          <MdArrowBack size={16} /> Back to Sign In
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordForm;
