import { useState, useRef, useEffect } from 'react';
import type { TaskItem } from '../../types/dashboard.types';
import StatusBadge from '../ui/StatusBadge';
import AvatarGroup from '../ui/AvatarGroup';
import SectionTitle from '../ui/SectionTitle';
import AppButton from '../ui/AppButton';
import { MdMoreVert } from 'react-icons/md';
import styles from './TaskTable.module.css';

interface TaskTableProps {
  tasks: TaskItem[];
  onViewAll?: () => void;
}

export const TaskTable = ({ tasks, onViewAll }: TaskTableProps) => {
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveMenuTaskId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (actionName: string, taskId: string) => {
    setActiveMenuTaskId(null);
    
    alert(`${actionName} action triggered for task ${taskId}`);
  };

  return (
    <div className={styles.card} ref={containerRef}>
      <SectionTitle
        title="Recent Tasks"
        subtitle="Overview of latest active tasks across your team"
        action={
          onViewAll && (
            <AppButton variant="outlined" size="sm" onClick={onViewAll}>
              View All Tasks
            </AppButton>
          )
        }
      />

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Task</th>
            <th className={styles.th}>Priority</th>
            <th className={styles.th}>Category</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Due Date</th>
            <th className={styles.th}>Assignees</th>
            <th className={styles.th} style={{ textAlign: 'right' }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className={styles.tr}>
              <td className={styles.td}>
                <div className={styles.taskTitle}>
                  <span>{task.title}</span>
                  <span className={styles.taskId}>{task.id}</span>
                </div>
              </td>
              <td className={styles.td}>
                <StatusBadge priority={task.priority} size="sm" />
              </td>
              <td className={styles.td}>
                <span className={styles.categoryTag}>{task.category}</span>
              </td>
              <td className={styles.td}>
                <StatusBadge status={task.status} size="sm" />
              </td>
              <td className={styles.td}>
                <span className={styles.dueDate}>{task.dueDate}</span>
              </td>
              <td className={styles.td}>
                <AvatarGroup assignees={task.assignees} size={28} />
              </td>
              <td className={`${styles.td} ${styles.actionCell}`}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  title="Task options"
                  aria-label={`Task options for ${task.title}`}
                  aria-expanded={activeMenuTaskId === task.id}
                  onClick={() =>
                    setActiveMenuTaskId((prev) => (prev === task.id ? null : task.id))
                  }
                >
                  <MdMoreVert size={18} />
                </button>

                {activeMenuTaskId === task.id && (
                  <div className={styles.menuDropdown} role="menu">
                    <button
                      type="button"
                      className={styles.menuItem}
                      role="menuitem"
                      onClick={() => handleAction('View Details', task.id)}
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      className={styles.menuItem}
                      role="menuitem"
                      onClick={() => handleAction('Edit Task', task.id)}
                    >
                      Edit Task
                    </button>
                    <button
                      type="button"
                      className={`${styles.menuItem} ${styles.menuItemDanger}`}
                      role="menuitem"
                      onClick={() => handleAction('Delete Task', task.id)}
                    >
                      Delete Task
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;
