import type { DeadlineItem } from '../../types/dashboard.types';
import SectionTitle from '../ui/SectionTitle';
import { MdAccessTime } from 'react-icons/md';
import styles from './UpcomingDeadlines.module.css';

interface UpcomingDeadlinesProps {
  items: DeadlineItem[];
}

export const UpcomingDeadlines = ({ items }: UpcomingDeadlinesProps) => {
  const safeItems = items ?? [];

  return (
    <div className={styles.card}>
      <SectionTitle
        title="Upcoming Deadlines"
        subtitle="Tasks due soon that require attention"
      />

      <div className={styles.list}>
        {safeItems.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.info}>
              <span className={styles.title} title={item.title}>
                {item.title}
              </span>
              <span className={styles.dueDate}>
                <MdAccessTime size={14} color="#888" />
                {item.dueDate}
              </span>
            </div>
            <span className={`${styles.tag} ${styles[`tag--${item.dueTag}`]}`}>
              {item.dueTag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingDeadlines;
