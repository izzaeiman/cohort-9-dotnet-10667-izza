import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './AppButton.module.css';

export type AppButtonVariant = 'primary' | 'secondary' | 'google' | 'outlined' | 'ghost';
export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
}

const Spinner = () => (
  <span className={styles.spinner} aria-hidden="true" />
);

export const AppButton = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  icon,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: AppButtonProps) => {
  const effectiveLeftIcon = leftIcon || icon;

  return (
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
        effectiveLeftIcon && <span className={styles.iconSlot}>{effectiveLeftIcon}</span>
      )}
      {children && <span className={styles.label}>{children}</span>}
      {!isLoading && rightIcon && <span className={styles.iconSlot}>{rightIcon}</span>}
    </button>
  );
};

export default AppButton;
