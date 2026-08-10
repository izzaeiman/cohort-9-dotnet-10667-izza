import { forwardRef, useState, useId, type InputHTMLAttributes, type ReactNode, type FocusEvent } from 'react';
import clsx from 'clsx';
import styles from './AppInput.module.css';

export interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  label: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  helperText?: string;
}

const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  (
    { id, label, error, leftIcon, rightSlot, helperText, className, onFocus, onBlur, ...rest },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className={clsx(styles.wrapper, className)}>
        <label htmlFor={inputId} className={styles.label}>
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
            id={inputId}
            className={styles.input}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            aria-invalid={!!error}
            {...rest}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {rightSlot && <span className={styles.rightSlot}>{rightSlot}</span>}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

AppInput.displayName = 'AppInput';

export default AppInput;
