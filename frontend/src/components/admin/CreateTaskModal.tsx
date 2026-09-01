import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../common/Modal';
import AppInput from '../ui/AppInput';
import AppSelect from '../ui/AppSelect';
import AppButton from '../ui/AppButton';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { taskFormSchema, type TaskFormData } from '../../utils/taskSchema';
import Toast from '../common/Toast';
import { getLocalDate } from '../../utils/dateHelpers';
import styles from './TaskModalForm.module.css';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const fetchIdRef = React.useRef(0);

  const loadUsers = React.useCallback(() => {
    setIsLoadingUsers(true);
    setUsersError(null);
    setUsers([]);
    
    const currentFetchId = ++fetchIdRef.current;

    userService.getUsers()
      .then(data => {
        if (currentFetchId !== fetchIdRef.current) return;
        setUsers(data || []);
        setUsersError(null);
      })
      .catch(err => {
        if (currentFetchId !== fetchIdRef.current) return;
        console.error('Failed to load users for assignment', err);
        setUsers([]);
        setUsersError('Unable to load users. Please try again.');
      })
      .finally(() => {
        if (currentFetchId !== fetchIdRef.current) return;
        setIsLoadingUsers(false);
      });
  }, []);

  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const loadProjects = React.useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const data = await projectService.getProjects();
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadProjects();
    }
  }, [isOpen, loadUsers, loadProjects]);

  const startDate = new Date();
  const defaultStartDate = getLocalDate(startDate);
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + 7);
  const defaultDueDate = getLocalDate(dueDate);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      assignedUserId: '',
      project: '',
      category: 'Frontend',
      priority: 'medium',
      status: 'pending',
      startDate: defaultStartDate,
      startTime: '09:00 AM',
      dueDate: defaultDueDate,
      dueTime: '05:00 PM',
      timeLimit: '7',
    },
  });

  const handleFormSubmit = async (data: TaskFormData) => {
    try {
      setIsSubmitting(true);
      const selectedUser = users.find((u) => u.id === data.assignedUserId);
      const selectedProject = data.project === 'none' ? null : projects.find((p) => p.id === data.project);

      await taskService.createTask({
        title: data.title.trim(),
        description: data.description.trim(),
        assignedUser: selectedUser?.name || 'Unassigned',
        assignedUserId: data.assignedUserId,
        project: selectedProject?.name || 'Unassigned',
        projectId: data.project === 'none' ? undefined : data.project,
        category: data.category as any,
        priority: data.priority,
        status: data.status,
        startDate: data.startDate,
        startTime: data.startTime || '09:00 AM',
        dueDate: data.dueDate,
        dueTime: data.dueTime || '05:00 PM',
        timeLimit: data.timeLimit ? Number(data.timeLimit) : undefined,
      });

      setToastMessage('Task created successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        reset();
        onSuccess();
        onClose();
      }, 500);
    } catch (err: unknown) {
      setIsSubmitting(false);
      alert(err instanceof Error ? err.message : 'Failed to create task.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
        <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
          <AppInput
            label="Task Title *"
            placeholder="e.g., Implement JWT Auth Refresh Tokens"
            {...register('title')}
            error={errors.title?.message}
          />

          <div className={styles.formGroup}>
            <label className={styles.label}>Description *</label>
            <textarea
              className={styles.textarea}
              placeholder="Detailed description of task objectives, requirements, and scope..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <span className={styles.errorText}>{errors.description.message}</span>
            )}
          </div>

          <div className={styles.grid2}>
            <div>
              <AppSelect
                label="Assigned User *"
                {...register('assignedUserId')}
                error={errors.assignedUserId?.message}
                options={[
                  { value: '', label: isLoadingUsers ? 'Loading...' : 'Select User...' },
                  ...users.map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.role})`,
                  }))
                ]}
              />
              {usersError && (
                <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={styles.errorText}>{usersError}</span>
                  <button 
                    type="button" 
                    onClick={loadUsers}
                    disabled={isLoadingUsers} 
                    style={{ background: 'none', border: 'none', color: isLoadingUsers ? '#9ca3af' : '#0070f3', cursor: isLoadingUsers ? 'default' : 'pointer', padding: 0, textDecoration: 'underline', fontSize: '0.875rem' }}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            <AppSelect
              label="Project *"
              {...register('project')}
              error={errors.project?.message}
              options={[
                { value: '', label: 'Select Project...' },
                { value: 'none', label: 'No Project' },
                ...projects.map((p) => ({ value: p.id, label: p.name }))
              ]}
            />
          </div>

          <div className={styles.grid3}>
            <AppSelect
              label="Category *"
              {...register('category')}
              error={errors.category?.message}
              options={[
                { value: 'General', label: 'General' },
                { value: 'Frontend', label: 'Frontend' },
                { value: 'Backend', label: 'Backend' },
                { value: 'UiUxDesign', label: 'UI/UX Design' },
                { value: 'DevOps', label: 'DevOps' },
                { value: 'Database', label: 'Database' },
                { value: 'FullStack', label: 'Full Stack' },
              ]}
            />

            <AppSelect
              label="Priority *"
              {...register('priority')}
              error={errors.priority?.message}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />

            <AppSelect
              label="Status *"
              {...register('status')}
              error={errors.status?.message}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'overdue', label: 'Overdue' },
              ]}
            />
          </div>

          <div className={styles.grid2}>
            <AppInput
              label="Start Date *"
              type="date"
              {...register('startDate')}
              error={errors.startDate?.message}
            />
            <AppInput
              label="Start Time"
              type="text"
              placeholder="09:00 AM"
              {...register('startTime')}
              error={errors.startTime?.message}
            />
          </div>

          <div className={styles.grid2}>
            <AppInput
              label="Due Date *"
              type="date"
              {...register('dueDate')}
              error={errors.dueDate?.message}
            />
            <AppInput
              label="Due Time"
              type="text"
              placeholder="05:00 PM"
              {...register('dueTime')}
              error={errors.dueTime?.message}
            />
          </div>

          <AppInput
            label="Time Limit (Days - Optional)"
            type="number"
            placeholder="e.g. 5"
            {...register('timeLimit')}
            error={errors.timeLimit?.message}
          />

          <div className={styles.actions}>
            <AppButton variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </AppButton>
            <AppButton 
              variant="primary" 
              type="submit" 
              isLoading={isSubmitting}
              disabled={isLoadingUsers || usersError !== null}
            >
              Create Task
            </AppButton>
          </div>
        </form>
      </Modal>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
};

export default CreateTaskModal;
