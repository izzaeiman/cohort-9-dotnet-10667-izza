import loginIllustration from '../../assets/login-illustration.png';
import styles from './LoginIllustration.module.css';

const LoginIllustration = () => (
  <div className={styles.container} role="img" aria-label="Professional workspace illustration">
    {/* Floating decorative cards */}
    <div className={`${styles.floatingCard} ${styles.card1}`} aria-hidden="true">
      <span className={styles.cardIcon}>✅</span>
      <div className={styles.cardContent}>
        <span className={styles.cardTitle}>Task Completed</span>
        <span className={styles.cardSub}>Design system updated</span>
      </div>
    </div>

    <div className={`${styles.floatingCard} ${styles.card2}`} aria-hidden="true">
      <span className={styles.cardIcon}>📊</span>
      <div className={styles.cardContent}>
        <span className={styles.cardTitle}>Progress</span>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: '72%' }} />
        </div>
        <span className={styles.cardSub}>72% complete</span>
      </div>
    </div>

    <div className={`${styles.floatingCard} ${styles.card3}`} aria-hidden="true">
      <span className={styles.cardIcon}>👥</span>
      <div className={styles.cardContent}>
        <span className={styles.cardTitle}>Team Active</span>
        <span className={styles.cardSub}>5 members online</span>
      </div>
    </div>

    {/* Main illustration */}
    <img
      src={loginIllustration}
      alt="Productivity workspace"
      className={styles.image}
      loading="eager"
      draggable={false}
    />
  </div>
);

export default LoginIllustration;
