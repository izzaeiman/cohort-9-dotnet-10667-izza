import { useNavigate } from 'react-router-dom';
import AppButton from '../../components/ui/AppButton';
import styles from './NotFoundPage.module.css';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.badge}>404</div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.description}>
          The page you are looking for does not exist, has been moved, or is temporarily unavailable.
        </p>
        <div style={{ width: '100%', marginTop: '12px' }}>
          <AppButton variant="primary" size="lg" fullWidth onClick={() => navigate('/')}>
            Back to Dashboard
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
