import { useState, type ReactNode } from 'react';
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
  timeframe,
  onTimeframeChange,
}: ChartCardProps) => {
  const [internalTimeframe, setInternalTimeframe] = useState('this_week');
  const activeTimeframe = timeframe !== undefined ? timeframe : internalTimeframe;

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
            value={activeTimeframe}
            onChange={(e) => {
              const val = e.target.value;
              setInternalTimeframe(val);
              onTimeframeChange?.(val);
            }}
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
