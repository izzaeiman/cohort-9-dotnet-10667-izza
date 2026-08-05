import { type ReactNode } from 'react';
import styles from './ChartCard.module.css';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showTimeFilter?: boolean;
  timeframe?: string;
  onTimeframeChange?: (value: string) => void;
}

export const ChartCard = ({
  title,
  subtitle,
  children,
  showTimeFilter = true,
  timeframe = 'this_week',
  onTimeframeChange,
}: ChartCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        {showTimeFilter && (
          <select
            className={styles.filterSelect}
            value={timeframe}
            onChange={(e) => onTimeframeChange?.(e.target.value)}
            aria-label={`Timeframe filter for ${title}`}
          >
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="this_month">This Month</option>
          </select>
        )}
      </div>

      <div className={styles.chartBody}>{children}</div>
    </div>
  );
};

export default ChartCard;
