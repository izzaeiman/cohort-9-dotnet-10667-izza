import styles from './SuccessCheckmark.module.css';

interface SuccessCheckmarkProps {
  size?: number;
}

const SuccessCheckmark = ({ size = 64 }: SuccessCheckmarkProps) => (
  <div className={styles.wrapper} style={{ width: size, height: size }}>
    <svg
      className={styles.checkmark}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
      aria-hidden="true"
    >
      <circle className={styles.checkmarkCircle} cx="26" cy="26" r="23" fill="none" />
      <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
    </svg>
  </div>
);

export default SuccessCheckmark;
