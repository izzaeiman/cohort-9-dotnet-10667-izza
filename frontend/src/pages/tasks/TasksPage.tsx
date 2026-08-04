import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdAdd, MdSearch } from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSelect from '../../components/ui/AppSelect';
import TaskTable from '../../components/dashboard/TaskTable';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { MOCK_TASKS } from '../../utils/mockDashboardData';
import type { TaskItem, TaskPriority, TaskCategory, TaskStatus } from '../../types/dashboard.types';
import styles from './Tasks.module.css';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').min(3, 'Title must be at least 3 characters'),
  category: z.enum(['Frontend', 'Backend', 'UI/UX Design', 'DevOps', 'Database']),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['completed', 'in_progress', 'pending', 'overdue']),
  dueDate: z.string().min(1, 'Due date is required'),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

export const TasksPage = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      category: 'Frontend',
      priority: 'medium',
      status: 'in_progress',
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  // Filter tasks based on controls
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const handleCreateTask = async (data: CreateTaskFormData) => {
    // TODO: Connect to ASP.NET Core Web API → await taskService.createTask(data);
    await new Promise((res) => setTimeout(res, 600));

    const newTask: TaskItem = {
      id: `TSK-10${tasks.length + 1}`,
      title: data.title,
      category: data.category as TaskCategory,
      priority: data.priority as TaskPriority,
      status: data.status as TaskStatus,
      dueDate: data.dueDate,
      assignees: [
        { id: 'usr-3', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' },
      ],
    };

    setTasks((prev) => [newTask, ...prev]);
    setIsModalOpen(false);
    reset();
    setToastMessage(`Task "${data.title}" created successfully!`);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
  };

  return (
    <div className={styles.page}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Tasks Management</h1>
          <p className={styles.subtitle}>
            Organize, prioritize, and track deliverables across your team
          </p>
        </div>

        <AppButton
          variant="primary"
          size="md"
          leftIcon={<MdAdd size={20} />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Task
        </AppButton>
      </header>

      {/* ── Controls & Filter Bar ─────────────────────────────────────────── */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <MdSearch size={18} />
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search tasks or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filtersGroup}>
          <select
            className={styles.selectFilter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
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
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            className={styles.selectFilter}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="UI/UX Design">UI/UX Design</option>
            <option value="DevOps">DevOps</option>
            <option value="Database">Database</option>
          </select>

          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
            <button type="button" className={styles.resetBtn} onClick={handleResetFilters}>
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Main Task Table / Empty State ─────────────────────────────────── */}
      {filteredTasks.length > 0 ? (
        <TaskTable tasks={filteredTasks} />
      ) : (
        <EmptyState
          title="No tasks found"
          description="Try adjusting your search terms or filters to find what you are looking for."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      )}

      {/* ── Interactive Create Task Modal ────────────────────────────────── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Task">
        <form className={styles.modalForm} onSubmit={handleSubmit(handleCreateTask)} noValidate>
          <AppInput
            id="task-title"
            label="Task Title"
            placeholder="e.g. Implement Serilog logging middleware"
            error={errors.title?.message}
            {...register('title')}
          />

          <AppSelect
            id="task-category"
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
              id="task-priority"
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
              id="task-status"
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
            id="task-duedate"
            label="Due Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Save Task
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* Mock Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default TasksPage;
