import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdAdd, MdSearch, MdMoreVert, MdDeleteOutline } from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSelect from '../../components/ui/AppSelect';
import StatusBadge from '../../components/ui/StatusBadge';
import AvatarGroup from '../../components/ui/AvatarGroup';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import Pagination from '../../components/shared/Pagination';
import ConfirmationDialog from '../../components/shared/ConfirmationDialog';
import PageLoader from '../../components/common/PageLoader';

import { taskService } from '../../services/taskService';
import { getLocalDate } from '../../utils/dateHelpers';
import type { DetailedTaskItem } from '../../data/tasks';
import type { TaskPriority, TaskCategory, TaskStatus } from '../../types/dashboard.types';
import styles from './Tasks.module.css';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.enum(['Frontend', 'Backend', 'UI/UX Design', 'DevOps', 'Database']),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['completed', 'in_progress', 'pending', 'overdue']),
  dueDate: z.string().min(1, 'Due date is required'),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

const PAGE_SIZE = 5;

export const TasksPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DetailedTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DetailedTaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<DetailedTaskItem | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Frontend',
      priority: 'medium',
      status: 'in_progress',
      dueDate: getLocalDate(),
    },
  });

  useEffect(() => {
    let isMounted = true;
    taskService.getTasks().then((data) => {
      if (isMounted) {
        setTasks(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & Sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    const result = tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'priority') {
        const pOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
        return pOrder[a.priority] - pOrder[b.priority];
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return result;
  }, [tasks, searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy]);

  // Paginated dataset
  const totalPages = Math.ceil(filteredAndSortedTasks.length / PAGE_SIZE);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedTasks.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedTasks, currentPage]);

  const handleCreateTask = async (data: CreateTaskFormData) => {
    const created = await taskService.createTask({
      title: data.title,
      description: data.description || '',
      category: data.category as TaskCategory,
      priority: data.priority as TaskPriority,
      status: data.status as TaskStatus,
      dueDate: data.dueDate,
      assignees: [{ id: 'usr-1', name: 'Jane Doe', avatar: 'https://i.pravatar.cc/150?img=68' }],
    });

    setTasks((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    reset();
    setToastMessage(`Task "${created.title}" created successfully!`);
  };

  const handleEditTask = async (data: CreateTaskFormData) => {
    if (!editingTask) return;
    const updated = await taskService.updateTask(editingTask.id, {
      title: data.title,
      description: data.description || '',
      category: data.category as TaskCategory,
      priority: data.priority as TaskPriority,
      status: data.status as TaskStatus,
      dueDate: data.dueDate,
    });

    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTask(null);
    setToastMessage('Task updated successfully!');
  };

  const handleDeleteSingle = async () => {
    if (!deletingTask) return;
    await taskService.deleteTask(deletingTask.id);
    setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
    setDeletingTask(null);
    setToastMessage('Task deleted successfully!');
  };

  const handleBulkDelete = async () => {
    for (const id of selectedTaskIds) {
      await taskService.deleteTask(id);
    }
    setTasks((prev) => prev.filter((t) => !selectedTaskIds.includes(t.id)));
    setSelectedTaskIds([]);
    setIsBulkDeleteOpen(false);
    setToastMessage(`${selectedTaskIds.length} tasks deleted successfully!`);
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === paginatedTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(paginatedTasks.map((t) => t.id));
    }
  };

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className={styles.page}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Task Management</h1>
          <p className={styles.subtitle}>
            Organize, prioritize, and track deliverables across your team
          </p>
        </div>

        <AppButton
          variant="primary"
          size="md"
          leftIcon={<MdAdd size={20} />}
          onClick={() => {
            reset({
              title: '',
              description: '',
              category: 'Frontend',
              priority: 'medium',
              status: 'in_progress',
              dueDate: getLocalDate(),
            });
            setIsCreateModalOpen(true);
          }}
        >
          Create Task
        </AppButton>
      </header>

      {/* ── Controls & Filter Bar ─────────────────────────────────────────── */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden="true">
            <MdSearch size={18} />
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search tasks or ID..."
            aria-label="Search tasks by title or ID"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className={styles.filtersGroup}>
          <select
            className={styles.selectFilter}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter tasks by status"
          >
            <option value="all">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            className={styles.selectFilter}
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter tasks by priority"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            className={styles.selectFilter}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter tasks by category"
          >
            <option value="all">All Categories</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="UI/UX Design">UI/UX Design</option>
            <option value="DevOps">DevOps</option>
            <option value="Database">Database</option>
          </select>

          <select
            className={styles.selectFilter}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort tasks"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
      </div>

      {/* Bulk selection actions bar */}
      {selectedTaskIds.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFF5EC',
            padding: '12px 20px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 122, 26, 0.3)',
          }}
        >
          <span style={{ fontWeight: 700, color: '#C65100', fontSize: '0.9rem' }}>
            {selectedTaskIds.length} tasks selected
          </span>
          <AppButton
            variant="outlined"
            size="sm"
            leftIcon={<MdDeleteOutline size={18} />}
            onClick={() => setIsBulkDeleteOpen(true)}
            style={{ color: '#D32F2F', borderColor: '#FFCDD2', backgroundColor: '#ffffff' }}
          >
            Delete Selected
          </AppButton>
        </div>
      )}

      {/* ── Main Task Table / Empty State ─────────────────────────────────── */}
      {paginatedTasks.length > 0 ? (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={
                      paginatedTasks.length > 0 &&
                      selectedTaskIds.length === paginatedTasks.length
                    }
                    onChange={toggleSelectAll}
                    aria-label="Select all tasks on page"
                  />
                </th>
                <th className={styles.th}>Task</th>
                <th className={styles.th}>Priority</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Due Date</th>
                <th className={styles.th}>Assignees</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.map((t) => (
                <tr key={t.id} className={styles.tr}>
                  <td className={styles.td}>
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(t.id)}
                      onChange={() => toggleSelectTask(t.id)}
                      aria-label={`Select task ${t.title}`}
                    />
                  </td>
                  <td className={styles.td}>
                    <div
                      className={styles.taskTitle}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/tasks/${t.id}`)}
                    >
                      <span className={styles.taskTitleHover}>{t.title}</span>
                      <span className={styles.taskId}>{t.id}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <StatusBadge priority={t.priority} size="sm" />
                  </td>
                  <td className={styles.td}>
                    <span className={styles.categoryTag}>{t.category}</span>
                  </td>
                  <td className={styles.td}>
                    <StatusBadge status={t.status} size="sm" />
                  </td>
                  <td className={styles.td}>
                    <span className={styles.dueDate}>{t.dueDate}</span>
                  </td>
                  <td className={styles.td}>
                    <AvatarGroup assignees={t.assignees} size={28} />
                  </td>
                  <td className={`${styles.td} ${styles.actionCell}`}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      title="Task options"
                      aria-label={`Task options for ${t.title}`}
                      aria-expanded={activeMenuTaskId === t.id}
                      onClick={() =>
                        setActiveMenuTaskId((prev) => (prev === t.id ? null : t.id))
                      }
                    >
                      <MdMoreVert size={18} />
                    </button>

                    {activeMenuTaskId === t.id && (
                      <div className={styles.menuDropdown} role="menu">
                        <button
                          type="button"
                          className={styles.menuItem}
                          role="menuitem"
                          onClick={() => {
                            setActiveMenuTaskId(null);
                            navigate(`/tasks/${t.id}`);
                          }}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className={styles.menuItem}
                          role="menuitem"
                          onClick={() => {
                            setActiveMenuTaskId(null);
                            setEditingTask(t);
                            reset({
                              title: t.title,
                              description: t.description || '',
                              category: t.category as TaskCategory,
                              priority: t.priority as TaskPriority,
                              status: t.status as TaskStatus,
                              dueDate: t.dueDate,
                            });
                          }}
                        >
                          Edit Task
                        </button>
                        <button
                          type="button"
                          className={`${styles.menuItem} ${styles.menuItemDanger}`}
                          role="menuitem"
                          onClick={() => {
                            setActiveMenuTaskId(null);
                            setDeletingTask(t);
                          }}
                        >
                          Delete Task
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAndSortedTasks.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <EmptyState
          title="No tasks found"
          description="Try adjusting your search terms or filters to find what you are looking for."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setPriorityFilter('all');
            setCategoryFilter('all');
          }}
        />
      )}

      {/* ── Create Task Modal ────────────────────────────────────────────── */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Task">
        <form className={styles.modalForm} onSubmit={handleSubmit(handleCreateTask)} noValidate>
          <AppInput
            id="create-task-title"
            label="Task Title"
            placeholder="e.g. Implement Serilog logging middleware"
            error={errors.title?.message}
            {...register('title')}
          />

          <AppInput
            id="create-task-desc"
            label="Description"
            placeholder="Detailed task goals and deliverables..."
            error={errors.description?.message}
            {...register('description')}
          />

          <AppSelect
            id="create-task-category"
            label="Category"
            options={[
              { value: 'Frontend', label: 'Frontend' },
              { value: 'Backend', label: 'Backend' },
              { value: 'UI/UX Design', label: 'UI/UX Design' },
              { value: 'DevOps', label: 'DevOps' },
              { value: 'Database', label: 'Database' },
            ]}
            error={errors.category?.message}
            {...register('category')}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <AppSelect
              id="create-task-priority"
              label="Priority"
              options={[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              error={errors.priority?.message}
              {...register('priority')}
            />

            <AppSelect
              id="create-task-status"
              label="Initial Status"
              options={[
                { value: 'in_progress', label: 'In Progress' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
              ]}
              error={errors.status?.message}
              {...register('status')}
            />
          </div>

          <AppInput
            id="create-task-duedate"
            label="Due Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Save Task
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* ── Edit Task Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task">
        <form className={styles.modalForm} onSubmit={handleSubmit(handleEditTask)} noValidate>
          <AppInput
            id="edit-task-title"
            label="Task Title"
            error={errors.title?.message}
            {...register('title')}
          />

          <AppInput
            id="edit-task-desc"
            label="Description"
            error={errors.description?.message}
            {...register('description')}
          />

          <AppSelect
            id="edit-task-category"
            label="Category"
            options={[
              { value: 'Frontend', label: 'Frontend' },
              { value: 'Backend', label: 'Backend' },
              { value: 'UI/UX Design', label: 'UI/UX Design' },
              { value: 'DevOps', label: 'DevOps' },
              { value: 'Database', label: 'Database' },
            ]}
            error={errors.category?.message}
            {...register('category')}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <AppSelect
              id="edit-task-priority"
              label="Priority"
              options={[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              error={errors.priority?.message}
              {...register('priority')}
            />

            <AppSelect
              id="edit-task-status"
              label="Status"
              options={[
                { value: 'in_progress', label: 'In Progress' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'overdue', label: 'Overdue' },
              ]}
              error={errors.status?.message}
              {...register('status')}
            />
          </div>

          <AppInput
            id="edit-task-duedate"
            label="Due Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => setEditingTask(null)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Save Changes
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* Delete Single Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteSingle}
        title="Delete Task"
        message={`Are you sure you want to delete task "${deletingTask?.title}"?`}
        confirmLabel="Delete Task"
        isDanger
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Bulk Delete Tasks"
        message={`Are you sure you want to delete all ${selectedTaskIds.length} selected tasks? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedTaskIds.length} Tasks`}
        isDanger
      />

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default TasksPage;
