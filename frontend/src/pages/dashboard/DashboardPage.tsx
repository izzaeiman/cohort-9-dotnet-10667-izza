import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppButton from '../../components/ui/AppButton';
import DashboardCard from '../../components/dashboard/DashboardCard';
import ChartCard from '../../components/dashboard/ChartCard';
import WeeklyProductivityChart from '../../components/dashboard/WeeklyProductivityChart';
import TaskStatusChart from '../../components/dashboard/TaskStatusChart';
import TaskTable from '../../components/dashboard/TaskTable';
import UpcomingDeadlines from '../../components/dashboard/UpcomingDeadlines';
import QuickActions from '../../components/dashboard/QuickActions';
import { SkeletonCard, SkeletonTable } from '../../components/ui/SkeletonLoaders';
import useAuth from '../../hooks/useAuth';
import { isAdminUser } from '../../components/layout/AdminRoute';
import { taskService } from '../../services/taskService';
import type { DetailedTaskItem } from '../../data/tasks';
import type { StatCardData, DeadlineItem } from '../../types/dashboard.types';
import { calculateTaskDeadlineStatus, formatDateDisplay } from '../../utils/deadlineHelpers';
import { MdAdd } from 'react-icons/md';
import styles from './Dashboard.module.css';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);

  const [tasks, setTasks] = useState<DetailedTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  const loadDashboardTasks = async () => {
    try {
      setIsLoading(true);
      const allTasks = await taskService.getAllTasks();
      setTasks(allTasks);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardTasks();
    const unsub = taskService.subscribe(() => {
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
        change: 'Active',
        isPositive: true,
        period: 'All tasks',
        iconType: 'completed',
      },
      {
        id: '2',
        title: 'Completed',
        value: completed,
        change: 'Done',
        isPositive: true,
        period: 'Finished',
        iconType: 'completed',
      },
      {
        id: '3',
        title: 'In Progress',
        value: inProgress,
        change: 'Active',
        isPositive: true,
        period: 'Working on',
        iconType: 'in_progress',
      },
      {
        id: '4',
        title: 'Pending',
        value: pending,
        change: 'Queued',
        isPositive: false,
        period: 'Needs action',
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

  // Compute productivity data dynamically
  const productivityData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dayStr = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
      const targetIsoDate = targetDate.toISOString().split('T')[0];

      let createdCount = 0;
      let completedCount = 0;

      roleFilteredTasks.forEach(t => {
        if (t.createdDate === targetIsoDate) {
          createdCount++;
        }
        if (t.status === 'completed' && t.lastModified === targetIsoDate) {
          completedCount++;
        }
      });

      data.push({
        day: dayStr,
        created: createdCount,
        completed: completedCount,
      });
    }
    return data;
  }, [roleFilteredTasks]);

  // Compute upcoming deadlines dynamically
  const upcomingDeadlinesList = useMemo(() => {
    return roleFilteredTasks
      .filter((t) => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4)
      .map((t) => {
        const info = calculateTaskDeadlineStatus(t);
        let dueTag = 'Upcoming';
        if (info.state === 'DUE_TODAY') dueTag = 'Today';
        else if (info.state === 'DUE_TOMORROW') dueTag = 'Tomorrow';
        else if (info.state === 'APPROACHING_DEADLINE') dueTag = 'This Week';

        return {
          id: t.id,
          title: t.title,
          priority: t.priority,
          dueDate: formatDateDisplay(t.dueDate),
          dueTag,
          category: t.category,
        } as DeadlineItem;
      });
  }, [roleFilteredTasks]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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

      {/* ── Charts Grid ────────────────────────────────────────────────────── */}
      <section className={styles.chartsGrid} aria-label="Performance charts">
        <ChartCard
          title="Productivity Overview"
          subtitle="Comparison of completed vs created tasks (Last 7 Days)"
          showTimeFilter={false}
        >
          <WeeklyProductivityChart data={productivityData} />
        </ChartCard>

        <ChartCard
          title="Task Status Distribution"
          subtitle="Breakdown by status"
          showTimeFilter={false}
        >
          <TaskStatusChart data={statusDistribution} />
        </ChartCard>
      </section>

      {/* ── Main Content Grid ──────────────────────────────────────────────── */}
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

        {/* Right Column: Deadlines, Quick Actions */}
        <div className={styles.rightColumn}>
          <QuickActions />
          <UpcomingDeadlines items={upcomingDeadlinesList} />
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
