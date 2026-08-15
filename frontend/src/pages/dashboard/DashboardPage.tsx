import { useState, useEffect, useMemo } from 'react';
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
import { isAdminUser } from '../../components/layout/AdminRoute';
import { adminTaskService } from '../../services/adminTaskService';
import type { DetailedTaskItem } from '../../data/tasks';
import type { StatCardData } from '../../types/dashboard.types';
import {
  MOCK_PRODUCTIVITY_DATA,
  MOCK_PRODUCTIVITY_LAST_WEEK,
  MOCK_PRODUCTIVITY_THIS_MONTH,
  MOCK_DEADLINES,
  MOCK_ACTIVITIES,
} from '../../utils/mockDashboardData';
import { MdAdd } from 'react-icons/md';
import styles from './Dashboard.module.css';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);

  const [tasks, setTasks] = useState<DetailedTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productivityTimeframe, setProductivityTimeframe] = useState('this_week');

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  const loadDashboardTasks = async () => {
    try {
      setIsLoading(true);
      const allTasks = await adminTaskService.getAllTasks();
      setTasks(allTasks);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardTasks();
    const unsub = adminTaskService.subscribe(() => {
      loadDashboardTasks();
    });
    return () => unsub();
  }, []);

  // Filter tasks by user role (Member sees only assigned tasks; Admin sees all)
  const roleFilteredTasks = useMemo(() => {
    if (isAdmin) return tasks;
    return tasks.filter(
      (t) =>
        t.assignedUserId === user?.id ||
        (t.assignedUser &&
          user?.name &&
          t.assignedUser.toLowerCase() === user.name.toLowerCase()),
    );
  }, [tasks, isAdmin, user]);

  // Compute stat cards from role-filtered tasks
  const statCards: StatCardData[] = useMemo(() => {
    const total = roleFilteredTasks.length;
    const completed = roleFilteredTasks.filter((t) => t.status === 'completed').length;
    const inProgress = roleFilteredTasks.filter((t) => t.status === 'in_progress').length;
    const pending = roleFilteredTasks.filter((t) => t.status === 'pending').length;

    return [
      {
        id: '1',
        title: 'Total Tasks',
        value: total,
        change: '+12%',
        isPositive: true,
        period: 'vs last week',
        iconType: 'completed',
      },
      {
        id: '2',
        title: 'Completed',
        value: completed,
        change: '+8%',
        isPositive: true,
        period: 'vs last week',
        iconType: 'completed',
      },
      {
        id: '3',
        title: 'In Progress',
        value: inProgress,
        change: '+5%',
        isPositive: true,
        period: 'vs last week',
        iconType: 'in_progress',
      },
      {
        id: '4',
        title: 'Pending',
        value: pending,
        change: '-2%',
        isPositive: false,
        period: 'vs last week',
        iconType: 'pending',
      },
    ];
  }, [roleFilteredTasks]);

  // Compute status distribution pie chart data
  const statusDistribution = useMemo(() => {
    const completed = roleFilteredTasks.filter((t) => t.status === 'completed').length;
    const inProgress = roleFilteredTasks.filter((t) => t.status === 'in_progress').length;
    const pending = roleFilteredTasks.filter((t) => t.status === 'pending').length;
    const overdue = roleFilteredTasks.filter((t) => t.status === 'overdue').length;

    return [
      { name: 'Completed', value: completed, color: '#10B981' },
      { name: 'In Progress', value: inProgress, color: '#3B82F6' },
      { name: 'Pending', value: pending, color: '#F59E0B' },
      { name: 'Overdue', value: overdue, color: '#EF4444' },
    ];
  }, [roleFilteredTasks]);

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
          <h1 className={styles.title}>
            Welcome back, {firstName}! 👋 {isAdmin ? '(Admin Dashboard)' : ''}
          </h1>
          <p className={styles.subtitle}>
            <span>
              {isAdmin
                ? "Here is the full organization workspace overview today."
                : "Here is what's happening with your assigned tasks today."}
            </span>
            <span className={styles.dateBadge}>{todayFormatted}</span>
          </p>
        </div>

        <AppButton
          variant="primary"
          size="md"
          leftIcon={<MdAdd size={20} />}
          onClick={() => navigate(isAdmin ? '/admin/tasks' : '/tasks')}
        >
          {isAdmin ? 'Manage Admin Tasks' : 'Create Task'}
        </AppButton>
      </header>

      {/* ── Statistics Cards Grid ─────────────────────────────────────────── */}
      <section className={styles.statsGrid} aria-label="Key statistics">
        {isLoading
          ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
          : statCards.map((stat) => <DashboardCard key={stat.id} data={stat} />)}
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
          <TaskStatusChart data={statusDistribution} />
        </ChartCard>
      </section>

      {/* ── Main Content Grid (Recent Tasks + Side Column) ────────────────── */}
      <section className={styles.contentGrid}>
        {/* Left Column: Recent Tasks Table */}
        <div>
          {isLoading ? (
            <SkeletonTable />
          ) : (
            <TaskTable
              tasks={roleFilteredTasks.slice(0, 5)}
              onViewAll={() => navigate(isAdmin ? '/admin/tasks' : '/tasks')}
            />
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
