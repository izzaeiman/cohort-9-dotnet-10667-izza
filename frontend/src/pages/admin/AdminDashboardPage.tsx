import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdAdd,
  MdAssignmentInd,
  MdPersonAdd,
  MdFolderOpen,
  MdFormatListBulleted,
  MdPeople,
  MdWarning,
} from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import DashboardCard from '../../components/dashboard/DashboardCard';
import ChartCard from '../../components/dashboard/ChartCard';
import WeeklyProductivityChart from '../../components/dashboard/WeeklyProductivityChart';
import TaskStatusChart from '../../components/dashboard/TaskStatusChart';
import UpcomingDeadlines from '../../components/dashboard/UpcomingDeadlines';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline';
import StatusBadge from '../../components/ui/StatusBadge';
import TaskDeadlineBadge from '../../components/ui/TaskDeadlineBadge';
import { SkeletonCard, SkeletonTable } from '../../components/ui/SkeletonLoaders';

import CreateTaskModal from '../../components/admin/CreateTaskModal';
import AssignTaskModal from '../../components/admin/AssignTaskModal';
import EditTaskModal from '../../components/admin/EditTaskModal';
import ConfirmationDialog from '../../components/shared/ConfirmationDialog';
import Toast from '../../components/common/Toast';

import useAuth from '../../hooks/useAuth';
import { adminTaskService } from '../../services/adminTaskService';
import { INITIAL_USERS } from '../../data/users';
import { INITIAL_PROJECTS } from '../../data/projects';
import type { DetailedTaskItem } from '../../data/tasks';
import type { StatCardData } from '../../types/dashboard.types';
import {
  MOCK_PRODUCTIVITY_DATA,
  MOCK_PRODUCTIVITY_LAST_WEEK,
  MOCK_PRODUCTIVITY_THIS_MONTH,
  MOCK_ACTIVITIES,
} from '../../utils/mockDashboardData';
import { calculateTaskDeadlineStatus, formatDateDisplay } from '../../utils/deadlineHelpers';

import styles from './AdminDashboardPage.module.css';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<DetailedTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productivityTimeframe, setProductivityTimeframe] = useState('this_week');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assigningTask, setAssigningTask] = useState<DetailedTaskItem | null>(null);
  const [editingTask, setEditingTask] = useState<DetailedTaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<DetailedTaskItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminTaskService.getAllTasks();
      setTasks(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard tasks.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const unsub = adminTaskService.subscribe(() => {
      loadTasks();
    });
    return () => unsub();
  }, []);

  // Compute organization-wide statistics
  const statsSummary = useMemo(() => {
    const totalUsers = INITIAL_USERS.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
    const overdueTasks = tasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      if (t.status === 'overdue') return true;
      const statusInfo = calculateTaskDeadlineStatus(t);
      return statusInfo.state === 'OVERDUE';
    }).length;

    const dueTodayTasks = tasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      const statusInfo = calculateTaskDeadlineStatus(t);
      return statusInfo.state === 'DUE_TODAY';
    }).length;

    const activeProjects = INITIAL_PROJECTS.length;

    return {
      totalUsers,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      dueTodayTasks,
      activeProjects,
    };
  }, [tasks]);

  const statCards: StatCardData[] = [
    {
      id: 'stat-users',
      title: 'Total Users',
      value: statsSummary.totalUsers,
      change: 'Active Team',
      isPositive: true,
      period: 'Organization Wide',
      iconType: 'completed',
    },
    {
      id: 'stat-total-tasks',
      title: 'Total Tasks',
      value: statsSummary.totalTasks,
      change: '+14%',
      isPositive: true,
      period: 'vs last week',
      iconType: 'completed',
    },
    {
      id: 'stat-completed',
      title: 'Completed Tasks',
      value: statsSummary.completedTasks,
      change: '+8%',
      isPositive: true,
      period: 'Finished',
      iconType: 'completed',
    },
    {
      id: 'stat-in-progress',
      title: 'In Progress Tasks',
      value: statsSummary.inProgressTasks,
      change: '+5%',
      isPositive: true,
      period: 'Active',
      iconType: 'in_progress',
    },
    {
      id: 'stat-pending',
      title: 'Pending Tasks',
      value: statsSummary.pendingTasks,
      change: 'Queued',
      isPositive: true,
      period: 'Needs action',
      iconType: 'pending',
    },
    {
      id: 'stat-overdue',
      title: 'Overdue Tasks',
      value: statsSummary.overdueTasks,
      change: 'Requires attention',
      isPositive: false,
      period: 'Past due',
      iconType: 'overdue',
    },
    {
      id: 'stat-due-today',
      title: 'Tasks Due Today',
      value: statsSummary.dueTodayTasks,
      change: 'High Priority',
      isPositive: false,
      period: 'Deadline today',
      iconType: 'pending',
    },
    {
      id: 'stat-projects',
      title: 'Active Projects',
      value: statsSummary.activeProjects,
      change: 'On Track',
      isPositive: true,
      period: 'SaaS Architecture',
      iconType: 'completed',
    },
  ];

  // Status Distribution Chart Data (Mutually Exclusive Buckets)
  const statusDistribution = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let overdue = 0;
    let cancelled = 0;

    tasks.forEach((t) => {
      if (t.status === 'completed') {
        completed++;
      } else if (t.status === 'cancelled') {
        cancelled++;
      } else {
        const deadlineInfo = calculateTaskDeadlineStatus(t);
        if (t.status === 'overdue' || deadlineInfo.state === 'OVERDUE') {
          overdue++;
        } else if (t.status === 'in_progress') {
          inProgress++;
        } else {
          pending++;
        }
      }
    });

    return [
      { name: 'Completed', value: completed, color: '#10B981' },
      { name: 'In Progress', value: inProgress, color: '#3B82F6' },
      { name: 'Pending', value: pending, color: '#F59E0B' },
      { name: 'Overdue', value: overdue, color: '#EF4444' },
      { name: 'Cancelled', value: cancelled, color: '#6B7280' },
    ];
  }, [tasks]);

  // Overdue Task List for prominent banner
  const overdueTasksList = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      if (t.status === 'overdue') return true;
      const statusInfo = calculateTaskDeadlineStatus(t);
      return statusInfo.state === 'OVERDUE';
    });
  }, [tasks]);

  // Upcoming Deadlines List (Filtered to upcoming/due this week, sorted ascending by due date)
  const upcomingDeadlinesList = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        const info = calculateTaskDeadlineStatus(t);
        return (
          info.state === 'DUE_TODAY' ||
          info.state === 'DUE_TOMORROW' ||
          info.state === 'APPROACHING_DEADLINE'
        );
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .map((t) => {
        const info = calculateTaskDeadlineStatus(t);
        let dueTag: 'Today' | 'Tomorrow' | 'This Week' = 'This Week';
        if (info.state === 'DUE_TODAY') dueTag = 'Today';
        if (info.state === 'DUE_TOMORROW') dueTag = 'Tomorrow';

        return {
          id: t.id,
          title: t.title,
          priority: t.priority,
          dueDate: t.dueDate,
          dueTag,
          category: t.category,
        };
      })
      .slice(0, 5);
  }, [tasks]);

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    await adminTaskService.deleteTask(deletingTask.id);
    setToastMessage(`Task ${deletingTask.id} deleted.`);
    setDeletingTask(null);
    await loadTasks();
  };

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

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={styles.page}>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.greeting}>
          <h1 className={styles.title}>
            Admin Overview, {user?.name ? user.name.split(' ')[0] : 'Admin'} 👑
          </h1>
          <p className={styles.subtitle}>
            <span>Global workspace statistics, team performance, and administrative controls.</span>
            <span className={styles.dateBadge}>{todayFormatted}</span>
          </p>
        </div>

        <div className={styles.headerActions}>
          <AppButton
            variant="primary"
            leftIcon={<MdAdd size={20} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Task
          </AppButton>
        </div>
      </header>

      {/* ── Prominent Overdue Warning Banner (If Any) ────────────────────────── */}
      {overdueTasksList.length > 0 && (
        <div className={styles.overdueBanner}>
          <div className={styles.bannerHeader}>
            <MdWarning size={22} className={styles.warningIcon} />
            <strong>Attention Required: {overdueTasksList.length} Overdue Tasks Detected</strong>
          </div>
          <div className={styles.overdueGrid}>
            {overdueTasksList.slice(0, 3).map((t) => (
              <div key={t.id} className={styles.overdueCard}>
                <span className={styles.overdueTitle}>{t.title}</span>
                <span className={styles.overdueMeta}>
                  Assigned to: <strong>{t.assignedUser}</strong> | Due: {t.dueDate}
                </span>
                <button
                  type="button"
                  className={styles.reassignBtn}
                  onClick={() => setAssigningTask(t)}
                >
                  Reassign Task
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions Bar ───────────────────────────────────────────────── */}
      <section className={styles.quickActionsCard} aria-label="Admin quick actions">
        <h2 className={styles.cardSectionTitle}>Administrative Quick Actions</h2>
        <div className={styles.actionButtonsRow}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <MdAdd size={20} className={styles.actionIcon} />
            <span>Create Task</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => navigate('/admin/tasks')}
          >
            <MdAssignmentInd size={20} className={styles.actionIcon} />
            <span>Assign Task</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => navigate('/admin/users')}
          >
            <MdPersonAdd size={20} className={styles.actionIcon} />
            <span>Manage Users</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => navigate('/projects')}
          >
            <MdFolderOpen size={20} className={styles.actionIcon} />
            <span>Projects</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => navigate('/admin/tasks')}
          >
            <MdFormatListBulleted size={20} className={styles.actionIcon} />
            <span>View All Tasks</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => navigate('/admin/users')}
          >
            <MdPeople size={20} className={styles.actionIcon} />
            <span>User Directory</span>
          </button>
        </div>
      </section>

      {/* ── 8 Metrics / Statistics Grid ───────────────────────────────────── */}
      <section className={styles.statsGrid} aria-label="Organization key metrics">
        {isLoading
          ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonCard key={i} />)
          : statCards.map((stat) => <DashboardCard key={stat.id} data={stat} />)}
      </section>

      {/* ── Performance Charts Grid ───────────────────────────────────────── */}
      <section className={styles.chartsGrid} aria-label="Organization charts">
        <ChartCard
          title="Organization Productivity Overview"
          subtitle="Completed vs Created tasks across team"
          timeframe={productivityTimeframe}
          onTimeframeChange={setProductivityTimeframe}
        >
          <WeeklyProductivityChart data={getProductivityData()} />
        </ChartCard>

        <ChartCard
          title="Organization Task Distribution"
          subtitle="Breakdown by status across all projects"
          showTimeFilter={false}
        >
          <TaskStatusChart data={statusDistribution} />
        </ChartCard>
      </section>

      {/* ── Main Content Grid (Recent Tasks + Side Column) ────────────────── */}
      <section className={styles.contentGrid}>
        {/* Left Column: Organization Recent Tasks Table */}
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div>
              <h2 className={styles.tableTitle}>Recent Organization Tasks</h2>
              <p className={styles.tableSub}>Live view of tasks created and updated across team members.</p>
            </div>
            <AppButton variant="outlined" size="sm" onClick={() => navigate('/admin/tasks')}>
              View All Tasks
            </AppButton>
          </div>

          {isLoading ? (
            <SkeletonTable />
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Task Name</th>
                    <th>Assigned To</th>
                    <th>Project</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.slice(0, 6).map((task) => (
                    <tr key={task.id} className={styles.tr}>
                      <td>
                        <div className={styles.taskCell}>
                          <span className={styles.taskId}>{task.id}</span>
                          <strong className={styles.taskName}>{task.title}</strong>
                        </div>
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <img
                            src={task.assignees[0]?.avatar || 'https://i.pravatar.cc/150?img=68'}
                            alt={task.assignedUser}
                            className={styles.userAvatar}
                          />
                          <span>{task.assignedUser}</span>
                        </div>
                      </td>
                      <td>{task.project}</td>
                      <td>
                        <StatusBadge priority={task.priority} />
                      </td>
                      <td>
                        <StatusBadge status={task.status} />
                      </td>
                      <td>
                        <TaskDeadlineBadge task={task} />
                      </td>
                      <td>
                        <div className={styles.actionsFlex}>
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            title="View Task Details"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => setEditingTask(task)}
                            title="Edit Task"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => setAssigningTask(task)}
                            title="Reassign Task"
                          >
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Deadlines & Team Activity */}
        <div className={styles.rightColumn}>
          <UpcomingDeadlines items={upcomingDeadlinesList} />
          <ActivityTimeline activities={MOCK_ACTIVITIES} />
        </div>
      </section>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadTasks}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSuccess={loadTasks}
      />

      <AssignTaskModal
        isOpen={!!assigningTask}
        task={assigningTask}
        onClose={() => setAssigningTask(null)}
        onSuccess={loadTasks}
      />

      <ConfirmationDialog
        isOpen={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete task "${deletingTask?.title}"?`}
        confirmLabel="Delete Task"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingTask(null)}
        isDanger
      />

      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default AdminDashboardPage;
