import type { ReactNode } from 'react';
import styles from './SectionTitle.module.css';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const SectionTitle = ({ title, subtitle, action }: SectionTitleProps) => (
  <div className={styles.header}>
    <div>
      <h3 className={styles.title}>{title}</h3>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
    {action && <div className={styles.action}>{action}</div>}
  </div>
);

export default SectionTitle;
