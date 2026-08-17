import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../common/Modal';
import AppSelect from '../ui/AppSelect';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import { userService } from '../../services/userService';
import type { DetailedTaskItem } from '../../data/tasks';
import { adminTaskService } from '../../services/adminTaskService';
import { assignTaskSchema, type AssignTaskFormData } from '../../utils/taskSchema';
import Toast from '../common/Toast';
import styles from './TaskModalForm.module.css';

interface AssignTaskModalProps {
  isOpen: boolean;
  task: DetailedTaskItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  task,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingUsers(true);
      userService.getUsers()
        .then(data => setUsers(data || []))
        .catch(err => console.error('Failed to load users for assignment', err))
        .finally(() => setIsLoadingUsers(false));
    }
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AssignTaskFormData>({
    resolver: zodResolver(assignTaskSchema),
  });

  useEffect(() => {
    if (task) {
      setValue('assignedUserId', task.assignedUserId || '');
      setValue('startDate', task.startDate);
      setValue('startTime', task.startTime || '09:00 AM');
      setValue('dueDate', task.dueDate);
      setValue('dueTime', task.dueTime || '05:00 PM');
      setValue('timeLimit', task.timeLimit ? String(task.timeLimit) : '');
    }
  }, [task, setValue]);

  if (!task) return null;

  const handleFormSubmit = async (data: AssignTaskFormData) => {
    try {
      setIsSubmitting(true);
      await adminTaskService.assignTask(
        task.id,
        data.assignedUserId,
        data.startDate,
        data.startTime,
        data.dueDate,
        data.dueTime,
        data.timeLimit ? Number(data.timeLimit) : undefined,
      );

      const assignedUserObj = users.find((u) => u.id === data.assignedUserId);
      setToastMessage(
        `Task ${task.id} successfully assigned to ${assignedUserObj?.name || 'user'}!`,
      );

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Failed to assign task.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Assign / Reassign Task — ${task.id}`}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
          <div className={styles.taskPreviewCard}>
            <span className={styles.previewLabel}>Target Task:</span>
            <strong className={styles.previewTitle}>{task.title}</strong>
            <span className={styles.previewSub}>
              Project: {task.project} | Current Assignee: {task.assignedUser}
            </span>
          </div>

          <AppSelect
            label="Assignee User *"
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

          <div className={styles.grid2}>
            <AppInput
              label="Start Date"
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
              label="Due Date"
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
            label="Time Limit (Days)"
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
              Confirm Assignment
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

export default AssignTaskModal;
