import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppButton from '../../components/ui/AppButton';
import DashboardCard from '../../components/dashboard/DashboardCard';
import ChartCard from '../../components/dashboard/ChartCard';
import WeeklyProductivityChart from '../../components/dashboard/WeeklyProductivityChart';
import TaskStatusChart from '../../components/dashboard/TaskStatusChart';
import TaskTable from '../../components/dashboard/TaskTable';
import UpcomingDeadlines from '../../components/dashboard/UpcomingDeadlines';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline';
import QuickActions from '../../components/dashboard/QuickActions';
import { SkeletonCard, SkeletonTable } from '../../components/ui/SkeletonLoaders';
import useAuth from '../../hooks/useAuth';
import {
  MOCK_STAT_CARDS,
  MOCK_PRODUCTIVITY_DATA,
  MOCK_PRODUCTIVITY_LAST_WEEK,
  MOCK_PRODUCTIVITY_THIS_MONTH,
  MOCK_STATUS_DISTRIBUTION,
  MOCK_TASKS,
  MOCK_DEADLINES,
  MOCK_ACTIVITIES,
} from '../../utils/mockDashboardData';
import { MdAdd } from 'react-icons/md';
import styles from './Dashboard.module.css';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [productivityTimeframe, setProductivityTimeframe] = useState('this_week');

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  // Simulate initial data loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getProductivityData = () => {
    switch (productivityTimeframe) {
      case 'last_week':
        return MOCK_PRODUCTIVITY_LAST_WEEK;
      case 'this_month':
        return MOCK_PRODUCTIVITY_THIS_MONTH;
      default:
        return MOCK_PRODUCTIVITY_DATA;
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.greeting}>
          <h1 className={styles.title}>Welcome back, {firstName}! 👋</h1>
          <p className={styles.subtitle}>
            <span>Here is what's happening across your workspace today.</span>
            <span className={styles.dateBadge}>{todayFormatted}</span>
          </p>
        </div>

        <AppButton
          variant="primary"
          size="md"
          leftIcon={<MdAdd size={20} />}
          onClick={() => navigate('/tasks')}
        >
          Create Task
        </AppButton>
      </header>

      {/* ── Statistics Cards Grid ─────────────────────────────────────────── */}
      <section className={styles.statsGrid} aria-label="Key statistics">
        {isLoading
          ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
          : MOCK_STAT_CARDS.map((stat) => (
              <DashboardCard key={stat.id} data={stat} />
            ))}
      </section>

      {/* ── Charts Grid (Weekly Productivity + Task Status Distribution) ─── */}
      <section className={styles.chartsGrid} aria-label="Performance charts">
        <ChartCard
          title="Productivity Overview"
          subtitle="Comparison of completed vs created tasks"
          timeframe={productivityTimeframe}
          onTimeframeChange={setProductivityTimeframe}
        >
          <WeeklyProductivityChart data={getProductivityData()} />
        </ChartCard>

        <ChartCard
          title="Task Status Distribution"
          subtitle="Breakdown by status"
          showTimeFilter={false}
        >
          <TaskStatusChart data={MOCK_STATUS_DISTRIBUTION} />
        </ChartCard>
      </section>

      {/* ── Main Content Grid (Recent Tasks + Side Column) ────────────────── */}
      <section className={styles.contentGrid}>
        {/* Left Column: Recent Tasks Table */}
        <div>
          {isLoading ? (
            <SkeletonTable />
          ) : (
            <TaskTable tasks={MOCK_TASKS} onViewAll={() => navigate('/tasks')} />
          )}
        </div>

        {/* Right Column: Deadlines, Activity, Quick Actions */}
        <div className={styles.rightColumn}>
          <QuickActions />
          <UpcomingDeadlines items={MOCK_DEADLINES} />
          <ActivityTimeline activities={MOCK_ACTIVITIES} />
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
