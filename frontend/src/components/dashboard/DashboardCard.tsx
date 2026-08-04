import type { StatCardData } from '../../types/dashboard.types';
import {
  MdCheckCircle,
  MdHourglassTop,
  MdPendingActions,
  MdErrorOutline,
  MdTrendingUp,
  MdTrendingDown,
} from 'react-icons/md';
import styles from './DashboardCard.module.css';

interface DashboardCardProps {
  data: StatCardData;
}

const ICON_MAP = {
  completed: MdCheckCircle,
  in_progress: MdHourglassTop,
  pending: MdPendingActions,
  overdue: MdErrorOutline,
};

export const DashboardCard = ({ data }: DashboardCardProps) => {
  const Icon = ICON_MAP[data.iconType];

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <span className={styles.title}>{data.title}</span>
        <div className={`${styles.iconWrap} ${styles[`iconWrap--${data.iconType}`]}`}>
          <Icon />
        </div>
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value}>{data.value}</span>
        <span
          className={`${styles.trend} ${
            data.isPositive ? styles.trendPositive : styles.trendNegative
          }`}
        >
          {data.isPositive ? <MdTrendingUp size={14} /> : <MdTrendingDown size={14} />}
          {data.change}
        </span>
      </div>

      <div className={styles.period}>{data.period}</div>
    </div>
  );
};

export default DashboardCard;
