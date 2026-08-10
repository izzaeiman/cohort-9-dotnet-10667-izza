import { forwardRef, useState, useId, type SelectHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { MdExpandMore } from 'react-icons/md';
import styles from './AppSelect.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id?: string;
  label: string;
  options: SelectOption[];
  error?: string;
  leftIcon?: ReactNode;
  helperText?: string;
}

const AppSelect = forwardRef<HTMLSelectElement, AppSelectProps>(
  ({ id, label, options, error, leftIcon, helperText, className, onFocus, onBlur, ...rest }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className={clsx(styles.wrapper, className)}>
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
        <div
          className={clsx(
            styles.selectWrap,
            isFocused && styles.focused,
            error && styles.hasError,
          )}
        >
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
          <select
            ref={ref}
            id={selectId}
            className={styles.select}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            aria-invalid={!!error}
            {...rest}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className={styles.arrowIcon}>
            <MdExpandMore size={20} />
          </span>
        </div>
        {error ? (
          <p id={`${selectId}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${selectId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

AppSelect.displayName = 'AppSelect';

export default AppSelect;
