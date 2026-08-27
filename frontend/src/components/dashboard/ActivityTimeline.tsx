import type { ActivityItemData } from '../../types/dashboard.types';
import SectionTitle from '../ui/SectionTitle';
import styles from './ActivityTimeline.module.css';

interface ActivityTimelineProps {
  activities: ActivityItemData[];
}

export const ActivityTimeline = ({ activities }: ActivityTimelineProps) => {
  const safeActivities = activities ?? [];

  return (
    <div className={styles.card}>
      <SectionTitle
        title="Recent Activity"
        subtitle="Real-time timeline of project events"
      />

      <div className={styles.timeline}>
        {safeActivities.map((item) => (
          <div key={item.id} className={styles.item}>
            <span className={`${styles.dot} ${styles[`dot--${item.type}`]}`} />
            <img src={item.avatar} alt={item.user} className={styles.avatar} />
            <div className={styles.content}>
              <div>
                <span className={styles.user}>{item.user}</span>{' '}
                <span>{item.action}</span>{' '}
                <span className={styles.target}>{item.target}</span>
              </div>
              <span className={styles.timestamp}>{item.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;
