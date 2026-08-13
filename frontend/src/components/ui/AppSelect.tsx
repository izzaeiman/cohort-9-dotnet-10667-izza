import { forwardRef, useState, type SelectHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { MdExpandMore } from 'react-icons/md';
import styles from './AppSelect.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: SelectOption[];
  error?: string;
  leftIcon?: ReactNode;
  helperText?: string;
}

const AppSelect = forwardRef<HTMLSelectElement, AppSelectProps>(
  ({ id, label, options, error, leftIcon, helperText, className, ...rest }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      rest.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      rest.onBlur?.(e);
    };

    return (
      <div className={clsx(styles.wrapper, className)}>
        <label htmlFor={id} className={styles.label}>
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
            id={id}
            className={styles.select}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            aria-invalid={!!error}
            {...rest}
            onFocus={handleFocus}
            onBlur={handleBlur}
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

AppSelect.displayName = 'AppSelect';

export default AppSelect;
