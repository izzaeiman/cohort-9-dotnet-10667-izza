import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './AppInput.module.css';

interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  helperText?: string;
}

const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  ({ id, label, error, leftIcon, rightSlot, helperText, className, ...rest }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className={clsx(styles.wrapper, className)}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <div
          className={clsx(
            styles.inputWrap,
            isFocused && styles.focused,
            error && styles.hasError,
          )}
        >
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
          <input
            ref={ref}
            id={id}
            className={styles.input}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            aria-invalid={!!error}
            {...rest}
          />
          {rightSlot && <span className={styles.rightSlot}>{rightSlot}</span>}
        </div>
        {error ? (
          <p id={`${id}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${id}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

AppInput.displayName = 'AppInput';

export default AppInput;
