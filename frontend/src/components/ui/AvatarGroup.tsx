import type { TaskAssignee } from '../../types/dashboard.types';
import styles from './AvatarGroup.module.css';

interface AvatarGroupProps {
  assignees: TaskAssignee[];
  max?: number;
  size?: number;
}

export const AvatarGroup = ({ assignees, max = 3, size = 28 }: AvatarGroupProps) => {
  const safeAssignees = assignees ?? [];
  const visible = safeAssignees.slice(0, max);
  const extra = safeAssignees.length - max;

  return (
    <div className={styles.group}>
      {visible.map((user) => (
        <img
          key={user.id}
          src={user.avatar}
          alt={user.name}
          title={user.name}
          className={styles.avatar}
          style={{ width: size, height: size }}
        />
      ))}
      {extra > 0 && (
        <div
          className={styles.moreAvatar}
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
