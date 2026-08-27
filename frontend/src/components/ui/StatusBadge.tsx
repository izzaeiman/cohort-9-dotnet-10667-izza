import type { TaskStatus, TaskPriority } from '../../types/dashboard.types';
import clsx from 'clsx';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status?: TaskStatus;
  priority?: TaskPriority;
  size?: 'sm' | 'md';
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending',
  overdue: 'Overdue',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const StatusBadge = ({ status, priority, size = 'md' }: StatusBadgeProps) => {
  if (status) {
    return (
      <span
        className={clsx(
          styles.badge,
          styles[`badge--${status}`],
          styles[`badge--${size}`],
        )}
      >
        <span className={styles.dot} />
        {STATUS_LABELS[status]}
      </span>
    );
  }

  if (priority) {
    return (
      <span
        className={clsx(
          styles.badge,
          styles[`badge--priority-${priority}`],
          styles[`badge--${size}`],
        )}
      >
        {PRIORITY_LABELS[priority]}
      </span>
    );
  }

  return null;
};

export default StatusBadge;
