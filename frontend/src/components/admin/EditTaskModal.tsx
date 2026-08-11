import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../common/Modal';
import AppInput from '../ui/AppInput';
import AppSelect from '../ui/AppSelect';
import AppButton from '../ui/AppButton';
import { INITIAL_USERS } from '../../data/users';
import { INITIAL_PROJECTS } from '../../data/projects';
import type { DetailedTaskItem } from '../../data/tasks';
import { adminTaskService } from '../../services/adminTaskService';
import { taskFormSchema, type TaskFormData } from '../../utils/taskSchema';
import Toast from '../common/Toast';
import styles from './TaskModalForm.module.css';

interface EditTaskModalProps {
  isOpen: boolean;
  task: DetailedTaskItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  task,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
  });

  useEffect(() => {
    if (task) {
      setValue('title', task.title);
      setValue('description', task.description || '');
      setValue('assignedUserId', task.assignedUserId || 'usr-1');
      setValue('project', task.project || INITIAL_PROJECTS[0]?.name);
      setValue('category', task.category || 'Frontend');
      setValue('priority', task.priority || 'medium');
      setValue('status', task.status || 'pending');
      setValue('startDate', task.startDate || new Date().toISOString().split('T')[0]);
      setValue('startTime', task.startTime || '09:00 AM');
      setValue('dueDate', task.dueDate || new Date().toISOString().split('T')[0]);
      setValue('dueTime', task.dueTime || '05:00 PM');
      setValue('timeLimit', task.timeLimit ? String(task.timeLimit) : '');
    }
  }, [task, setValue]);

  if (!task) return null;

  const handleFormSubmit = async (data: TaskFormData) => {
    try {
      setIsSubmitting(true);
      const selectedUser = INITIAL_USERS.find((u) => u.id === data.assignedUserId);

      await adminTaskService.updateTask(task.id, {
        title: data.title.trim(),
        description: data.description.trim(),
        assignedUser: selectedUser?.name || task.assignedUser,
        assignedUserId: data.assignedUserId,
        project: data.project,
        category: data.category as any,
        priority: data.priority,
        status: data.status,
        startDate: data.startDate,
        startTime: data.startTime || '09:00 AM',
        dueDate: data.dueDate,
        dueTime: data.dueTime || '05:00 PM',
        timeLimit: data.timeLimit ? Number(data.timeLimit) : undefined,
      });

      setToastMessage('Task updated successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        reset();
        onSuccess();
        onClose();
      }, 500);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Failed to update task.';
      alert(msg);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Edit Task — ${task.id}`}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
          <AppInput
            label="Task Title *"
            {...register('title')}
            error={errors.title?.message}
          />

          <div className={styles.formGroup}>
            <label className={styles.label}>Description *</label>
            <textarea
              className={styles.textarea}
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <span className={styles.errorText}>{errors.description.message}</span>
            )}
          </div>

          <div className={styles.grid2}>
            <AppSelect
              label="Assigned User *"
              {...register('assignedUserId')}
              error={errors.assignedUserId?.message}
              options={INITIAL_USERS.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.role})`,
              }))}
            />

            <AppSelect
              label="Project *"
              {...register('project')}
              error={errors.project?.message}
              options={INITIAL_PROJECTS.map((p) => ({
                value: p.name,
                label: p.name,
              }))}
            />
          </div>

          <div className={styles.grid3}>
            <AppSelect
              label="Category *"
              {...register('category')}
              error={errors.category?.message}
              options={[
                { value: 'Frontend', label: 'Frontend' },
                { value: 'Backend', label: 'Backend' },
                { value: 'UI/UX Design', label: 'UI/UX Design' },
                { value: 'DevOps', label: 'DevOps' },
                { value: 'Database', label: 'Database' },
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
            <AppButton variant="primary" type="submit" isLoading={isSubmitting}>
              Save Changes
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

export default EditTaskModal;
