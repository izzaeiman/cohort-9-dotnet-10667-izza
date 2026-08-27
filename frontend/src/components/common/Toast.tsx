import { useEffect } from 'react';
import { MdCheckCircle, MdError, MdInfo } from 'react-icons/md';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, type = 'success', onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const Icon = type === 'success' ? MdCheckCircle : type === 'error' ? MdError : MdInfo;
  const role = type === 'error' ? 'alert' : 'status';

  return (
    <div
      className={`${styles.toast} ${styles[`toast--${type}`]}`}
      role={role}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <span className={styles.icon} aria-hidden="true">
        <Icon color={type === 'success' ? '#4CAF50' : type === 'error' ? '#FF5A5A' : '#FF7A1A'} />
      </span>
      <span>{message}</span>
    </div>
  );
};

export default Toast;
