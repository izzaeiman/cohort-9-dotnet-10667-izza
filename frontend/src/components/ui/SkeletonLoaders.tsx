import styles from './SkeletonLoaders.module.css';

export const SkeletonCard = () => (
  <div className={styles.cardSkeleton}>
    <div className={styles.headerRow}>
      <div className={`${styles.skeleton} ${styles.title}`} />
      <div className={`${styles.skeleton} ${styles.icon}`} />
    </div>
    <div className={`${styles.skeleton} ${styles.value}`} />
    <div className={`${styles.skeleton} ${styles.subtext}`} />
  </div>
);

export const SkeletonTable = () => (
  <div className={styles.tableSkeleton}>
    <div className={styles.tableHeader}>
      <div className={`${styles.skeleton} ${styles.th}`} />
      <div className={`${styles.skeleton} ${styles.th}`} />
      <div className={`${styles.skeleton} ${styles.th}`} />
      <div className={`${styles.skeleton} ${styles.th}`} />
    </div>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className={styles.tableRow}>
        <div className={`${styles.skeleton} ${styles.tdLong}`} />
        <div className={`${styles.skeleton} ${styles.tdShort}`} />
        <div className={`${styles.skeleton} ${styles.tdShort}`} />
        <div className={`${styles.skeleton} ${styles.tdShort}`} />
      </div>
    ))}
  </div>
);
