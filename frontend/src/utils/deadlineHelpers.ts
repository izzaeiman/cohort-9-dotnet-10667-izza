import type { DetailedTaskItem } from '../data/tasks';

export type DeadlineState =
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE'
  | 'DUE_TODAY'
  | 'DUE_TOMORROW'
  | 'APPROACHING_DEADLINE'
  | 'FAR_FROM_DEADLINE';

export interface DeadlineInfo {
  state: DeadlineState;
  label: string;
  daysDiff: number;
  badgeVariant: 'success' | 'danger' | 'warning' | 'info' | 'secondary';
}

/**
 * Calculates deadline status dynamically based on current date/time.
 */
export const calculateTaskDeadlineStatus = (task: DetailedTaskItem): DeadlineInfo => {
  if (task.status === 'completed') {
    return {
      state: 'COMPLETED',
      label: 'Completed',
      daysDiff: 0,
      badgeVariant: 'success',
    };
  }

  if (task.status === 'cancelled') {
    return {
      state: 'CANCELLED',
      label: 'Cancelled',
      daysDiff: 0,
      badgeVariant: 'secondary',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!task.dueDate) {
    return {
      state: 'FAR_FROM_DEADLINE',
      label: 'Invalid date',
      daysDiff: NaN,
      badgeVariant: 'secondary',
    };
  }

  const due = new Date(task.dueDate);
  if (isNaN(due.getTime())) {
    return {
      state: 'FAR_FROM_DEADLINE',
      label: 'Invalid date',
      daysDiff: NaN,
      badgeVariant: 'secondary',
    };
  }
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (task.status === 'overdue' || daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff) || 1;
    return {
      state: 'OVERDUE',
      label: `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`,
      daysDiff,
      badgeVariant: 'danger',
    };
  }

  if (daysDiff === 0) {
    return {
      state: 'DUE_TODAY',
      label: 'Due today',
      daysDiff: 0,
      badgeVariant: 'warning',
    };
  }

  if (daysDiff === 1) {
    return {
      state: 'DUE_TOMORROW',
      label: 'Due tomorrow',
      daysDiff: 1,
      badgeVariant: 'warning',
    };
  }

  if (daysDiff <= 2) {
    return {
      state: 'APPROACHING_DEADLINE',
      label: `${daysDiff} days remaining`,
      daysDiff,
      badgeVariant: 'warning',
    };
  }

  return {
    state: 'FAR_FROM_DEADLINE',
    label: `${daysDiff} days remaining`,
    daysDiff,
    badgeVariant: 'info',
  };
};

/**
 * Formats date string to readable display (e.g., "10 Aug 2026")
 */
export const formatDateDisplay = (dateStr?: string, timeStr?: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      return dateStr;
    }
    const formatted = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return timeStr ? `${formatted}, ${timeStr}` : formatted;
  } catch {
    return dateStr;
  }
};
