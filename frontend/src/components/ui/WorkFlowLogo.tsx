import styles from './WorkFlowLogo.module.css';

interface WorkFlowLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
}

const WorkFlowLogo = ({ size = 'md', variant = 'default' }: WorkFlowLogoProps) => {
  const isWhite = variant === 'white';

  return (
    <div className={`${styles.logo} ${styles[`logo--${size}`]}`}>
      {/* Icon mark */}
      <div className={`${styles.mark} ${isWhite ? styles['mark--white'] : ''}`}>
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.markSvg}
          aria-hidden="true"
        >
          <rect width="36" height="36" rx="10" fill={isWhite ? 'rgba(255,255,255,0.2)' : '#FF7A1A'} />
          {/* Checkmark lines */}
          <path
            d="M10 13h16M10 18h11M10 23h13"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Small check dot */}
          <circle cx="27" cy="13" r="2.5" fill="#ffffff" opacity="0.6" />
        </svg>
      </div>

      {/* Wordmark */}
      <span
        className={`${styles.wordmark} ${isWhite ? styles['wordmark--white'] : ''}`}
        aria-label="WorkFlow"
      >
        Work<span className={styles.accent}>Flow</span>
      </span>
    </div>
  );
};

export default WorkFlowLogo;
