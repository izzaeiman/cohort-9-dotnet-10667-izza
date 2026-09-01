import type { ReactNode } from 'react';
import AppButton from './AppButton';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => (
  <div className={styles.container}>
    <div className={styles.iconWrap}>
      {icon || <span className={styles.defaultEmoji}>📋</span>}
    </div>
    <h4 className={styles.title}>{title}</h4>
    <p className={styles.description}>{description}</p>
    {actionLabel && onAction && (
      <AppButton variant="primary" size="sm" onClick={onAction}>
        {actionLabel}
      </AppButton>
    )}
  </div>
);

export default EmptyState;
