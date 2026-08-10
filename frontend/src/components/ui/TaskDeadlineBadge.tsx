import React from 'react';
import clsx from 'clsx';
import { MdOutlineTimer, MdCheckCircle, MdCancel, MdWarning, MdSchedule } from 'react-icons/md';
import type { DetailedTaskItem } from '../../data/tasks';
import { calculateTaskDeadlineStatus } from '../../utils/deadlineHelpers';
import styles from './TaskDeadlineBadge.module.css';

interface TaskDeadlineBadgeProps {
  task: DetailedTaskItem;
  className?: string;
  showIcon?: boolean;
}

export const TaskDeadlineBadge: React.FC<TaskDeadlineBadgeProps> = ({
  task,
  className,
  showIcon = true,
}) => {
  const deadlineInfo = calculateTaskDeadlineStatus(task);

  const getIcon = () => {
    switch (deadlineInfo.state) {
      case 'COMPLETED':
        return <MdCheckCircle size={14} />;
      case 'CANCELLED':
        return <MdCancel size={14} />;
      case 'OVERDUE':
        return <MdWarning size={14} />;
      case 'DUE_TODAY':
      case 'DUE_TOMORROW':
      case 'APPROACHING_DEADLINE':
        return <MdOutlineTimer size={14} />;
      default:
        return <MdSchedule size={14} />;
    }
  };

  return (
    <span
      className={clsx(
        styles.badge,
        styles[`badge--${deadlineInfo.badgeVariant}`],
        className,
      )}
      title={`Deadline: ${task.dueDate} ${task.dueTime || ''}`}
    >
      {showIcon && <span className={styles.icon}>{getIcon()}</span>}
      <span className={styles.label}>{deadlineInfo.label}</span>
    </span>
  );
};

export default TaskDeadlineBadge;
