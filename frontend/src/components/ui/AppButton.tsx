import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './AppButton.module.css';

type AppButtonVariant = 'primary' | 'google' | 'outlined' | 'ghost';
type AppButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const Spinner = () => (
  <span className={styles.spinner} aria-hidden="true" />
);

const AppButton = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: AppButtonProps) => (
  <button
    type={type}
    className={clsx(
      styles.btn,
      styles[`btn--${variant}`],
      styles[`btn--${size}`],
      fullWidth && styles['btn--full'],
      isLoading && styles['btn--loading'],
      className,
    )}
    disabled={disabled || isLoading}
    aria-busy={isLoading}
    {...rest}
  >
    {isLoading ? (
      <Spinner />
    ) : (
      leftIcon && <span className={styles.iconSlot}>{leftIcon}</span>
    )}
    <span className={styles.label}>{children}</span>
    {!isLoading && rightIcon && <span className={styles.iconSlot}>{rightIcon}</span>}
  </button>
);

export default AppButton;
