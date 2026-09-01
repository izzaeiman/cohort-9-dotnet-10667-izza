import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdAdd,
  MdSearch,
  MdRefresh,
  MdVisibility,
  MdEdit,
  MdAssignmentInd,
  MdDeleteOutline,
  MdSort,
} from 'react-icons/md';
import AppButton from '../../components/ui/AppButton';
import StatusBadge from '../../components/ui/StatusBadge';
import TaskDeadlineBadge from '../../components/ui/TaskDeadlineBadge';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/shared/Pagination';
import ConfirmationDialog from '../../components/shared/ConfirmationDialog';
import Toast from '../../components/common/Toast';
import { SkeletonTable } from '../../components/ui/SkeletonLoaders';

import CreateTaskModal from '../../components/admin/CreateTaskModal';
import EditTaskModal from '../../components/admin/EditTaskModal';
import AssignTaskModal from '../../components/admin/AssignTaskModal';

import type { DetailedTaskItem } from '../../data/tasks';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { calculateTaskDeadlineStatus, formatDateDisplay } from '../../utils/deadlineHelpers';

import styles from './AdminTasksPage.module.css';

const ITEMS_PER_PAGE = 10;

export const AdminTasksPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [tasks, setTasks] = useState<DetailedTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState('all');

  // Sort State
  const [sortBy, setSortBy] = useState<'title' | 'assignedUser' | 'priority' | 'status' | 'startDate' | 'dueDate'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DetailedTaskItem | null>(null);
  const [assigningTask, setAssigningTask] = useState<DetailedTaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<DetailedTaskItem | null>(null);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Fetch Tasks
  const loadTasks = async (filters: {
    search?: string;
    status?: string;
    priority?: string;
    assignedUserId?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await taskService.getAllTasks(filters);
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  const reloadTasks = () => {
    loadTasks({
      search: searchQuery,
      status: statusFilter,
      priority: priorityFilter,
      assignedUserId: userFilter,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks({
        search: searchQuery,
        status: statusFilter,
        priority: priorityFilter,
        assignedUserId: userFilter,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, priorityFilter, userFilter]);

  useEffect(() => {
    userService.getUsers()
      .then(data => setUsers(data || []))
      .catch(err => console.error('Failed to load users for filter', err));
    
    projectService.getProjects()
      .then(data => setProjects(data || []))
      .catch(err => console.error('Failed to load projects for filter', err));

    const unsubscribe = taskService.subscribe(reloadTasks);
    return () => unsubscribe();
  }, [searchQuery, statusFilter, priorityFilter, userFilter]);

  // Calculate Statistics dynamically
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const overdue = tasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      if (t.status === 'overdue') return true;
      const statusInfo = calculateTaskDeadlineStatus(t);
      return statusInfo.state === 'OVERDUE';
    }).length;

    return { total, pending, inProgress, completed, overdue };
  }, [tasks]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter, userFilter, projectFilter, deadlineFilter, sortBy, sortOrder]);

  // Sorted Tasks (Filtering moved to backend)
  const sortedTasks = useMemo(() => {
    return [...tasks].filter((task) => {
      // 5. Project Filter (Not supported in backend yet, keep client side)
      if (projectFilter !== 'all' && task.project !== projectFilter) {
        return false;
      }

      // 6. Deadline Filter (Complex logic, keep client side)
      if (deadlineFilter !== 'all') {
        const deadlineInfo = calculateTaskDeadlineStatus(task);
        if (deadlineFilter === 'due_today' && deadlineInfo.state !== 'DUE_TODAY') return false;
        if (deadlineFilter === 'due_tomorrow' && deadlineInfo.state !== 'DUE_TOMORROW') return false;
        if (
          deadlineFilter === 'due_this_week' &&
          deadlineInfo.state !== 'DUE_TODAY' &&
          deadlineInfo.state !== 'DUE_TOMORROW' &&
          deadlineInfo.state !== 'APPROACHING_DEADLINE'
        ) {
          return false;
        }
        if (deadlineFilter === 'overdue' && deadlineInfo.state !== 'OVERDUE') return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'assignedUser') {
        comparison = (a.assignedUser || '').localeCompare(b.assignedUser || '');
      } else if (sortBy === 'priority') {
        const pOrder: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
        comparison = (pOrder[a.priority] || 0) - (pOrder[b.priority] || 0);
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortBy === 'startDate') {
        comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      } else if (sortBy === 'dueDate') {
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tasks, projectFilter, deadlineFilter, sortBy, sortOrder]);

  // Pagination Calculations
  const totalPages = Math.ceil(sortedTasks.length / ITEMS_PER_PAGE) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTasks = useMemo(() => {
    const start = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return sortedTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedTasks, validCurrentPage]);

  // Handlers
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setUserFilter('all');
    setProjectFilter('all');
    setDeadlineFilter('all');
    setSortBy('dueDate');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    try {
      await taskService.deleteTask(deletingTask.id);
      setToastMessage(`Task ${deletingTask.id} deleted successfully.`);
      setDeletingTask(null);
      reloadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Task Management</h1>
          <p className={styles.subtitle}>
            Manage, assign, and track tasks across your entire engineering team.
          </p>
        </div>
        <AppButton
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<MdAdd size={20} />}
        >
          Create Task
        </AppButton>
      </div>

      {/* ── Statistics Summary Cards ────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Tasks</span>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statSub}>In directory</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending</span>
          <span className={styles.statValue}>{stats.pending}</span>
          <span className={styles.statSub}>Awaiting action</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>In Progress</span>
          <span className={styles.statValue}>{stats.inProgress}</span>
          <span className={styles.statSub}>Active tasks</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Completed</span>
          <span className={styles.statValue}>{stats.completed}</span>
          <span className={styles.statSub}>Finished tasks</span>
        </div>
        <div className={styles.statCard + ' ' + styles.statCardOverdue}>
          <span className={styles.statLabel}>Overdue</span>
          <span className={styles.statValue}>{stats.overdue}</span>
          <span className={styles.statSub}>Requires immediate review</span>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ─────────────────────────────────────────── */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrap}>
            <MdSearch className={styles.searchIcon} size={20} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by title, description, user, project, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <AppButton
            variant="outlined"
            onClick={handleClearFilters}
            leftIcon={<MdRefresh size={18} />}
          >
            Clear Filters
          </AppButton>
        </div>

        <div className={styles.filterGrid}>
          {/* Status Filter */}
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Status</label>
            <select
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Priority</label>
            <select
              className={styles.select}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Assigned User Filter */}
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Assigned User</label>
            <select
              className={styles.select}
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Project</label>
            <select
              className={styles.select}
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Deadline Filter */}
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Deadline</label>
            <select
              className={styles.select}
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
            >
              <option value="all">All Deadlines</option>
              <option value="due_today">Due Today</option>
              <option value="due_tomorrow">Due Tomorrow</option>
              <option value="due_this_week">Due This Week</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Sorting */}
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Sort By</label>
            <div className={styles.sortFlex}>
              <select
                className={styles.select}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="dueDate">Due Date</option>
                <option value="title">Task Title</option>
                <option value="assignedUser">Assigned User</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="startDate">Start Date</option>
              </select>
              <button
                type="button"
                className={styles.sortToggleBtn}
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                <MdSort size={18} />
                <span>{sortOrder.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Task Table / Content Area ─────────────────────────────────── */}
      {isLoading ? (
        <SkeletonTable />
      ) : error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <AppButton variant="outlined" onClick={reloadTasks}>
            Retry Loading
          </AppButton>
        </div>
      ) : sortedTasks.length === 0 ? (
        <EmptyState
          title="No tasks match your filter criteria"
          description="Try adjusting your search query, status, user, or project filters to find what you are looking for."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Assigned To</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Due Date</th>
                  <th>Time Remaining</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.map((task) => (
                  <tr key={task.id} className={styles.tableRow}>
                    <td className={styles.taskTitleCell}>
                      <span className={styles.taskId}>{task.id}</span>
                      <strong className={styles.taskTitle}>{task.title}</strong>
                    </td>
                    <td>
                      <div className={styles.userCell}>
                        <img
                          src={
                            task.assignees[0]?.avatar ||
                            'https://i.pravatar.cc/150?img=68'
                          }
                          alt={task.assignedUser}
                          className={styles.avatar}
                        />
                        <span>{task.assignedUser}</span>
                      </div>
                    </td>
                    <td className={styles.projectCell}>{task.project}</td>
                    <td>
                      <span className={styles.categoryPill}>{task.category}</span>
                    </td>
                    <td>
                      <StatusBadge priority={task.priority} />
                    </td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    <td className={styles.dateCell}>
                      {formatDateDisplay(task.startDate, task.startTime)}
                    </td>
                    <td className={styles.dateCell}>
                      {formatDateDisplay(task.dueDate, task.dueTime)}
                    </td>
                    <td>
                      <TaskDeadlineBadge task={task} />
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          title="View Details"
                        >
                          <MdVisibility size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => setEditingTask(task)}
                          title="Edit Task"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => setAssigningTask(task)}
                          title="Assign / Reassign"
                        >
                          <MdAssignmentInd size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn + ' ' + styles.actionBtnDanger}
                          onClick={() => setDeletingTask(task)}
                          title="Delete Task"
                        >
                          <MdDeleteOutline size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={validCurrentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            totalItems={sortedTasks.length}
            pageSize={ITEMS_PER_PAGE}
          />
        </div>
      )}

      {/* ── Modals & Dialogs ─────────────────────────────────────────────────── */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={reloadTasks}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSuccess={reloadTasks}
      />

      <AssignTaskModal
        isOpen={!!assigningTask}
        task={assigningTask}
        onClose={() => setAssigningTask(null)}
        onSuccess={reloadTasks}
      />

      <ConfirmationDialog
        isOpen={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete task "${deletingTask?.title}" (${deletingTask?.id})? This action cannot be undone.`}
        confirmLabel="Delete Task"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingTask(null)}
        isDanger
      />

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default AdminTasksPage;
