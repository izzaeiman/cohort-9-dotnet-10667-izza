import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MdArrowBack,
  MdEdit,
  MdDelete,
  MdAttachFile,
  MdSend,
  MdDownload,
} from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSelect from '../../components/ui/AppSelect';
import StatusBadge from '../../components/ui/StatusBadge';
import AvatarGroup from '../../components/ui/AvatarGroup';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import ConfirmationDialog from '../../components/shared/ConfirmationDialog';
import PageLoader from '../../components/common/PageLoader';
import { taskService } from '../../services/taskService';
import type { DetailedTaskItem, TaskComment } from '../../data/tasks';
import type { TaskPriority, TaskCategory, TaskStatus } from '../../types/dashboard.types';
import styles from './TaskDetail.module.css';

const editTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['Frontend', 'Backend', 'UI/UX Design', 'DevOps', 'Database']),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['completed', 'in_progress', 'pending', 'overdue']),
  dueDate: z.string().min(1, 'Due date is required'),
});

type EditTaskFormData = z.infer<typeof editTaskSchema>;

export const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<DetailedTaskItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
  });

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    taskService
      .getTaskById(id)
      .then((data) => {
        if (isMounted) {
          if (data) {
            setTask(data);
            reset({
              title: data.title,
              description: data.description,
              category: data.category as TaskCategory,
              priority: data.priority as TaskPriority,
              status: data.status as TaskStatus,
              dueDate: data.dueDate,
            });
          }
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [id, reset]);

  if (isLoading) return <PageLoader />;

  if (!task) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/tasks')}>
          <MdArrowBack size={18} /> Back to Tasks
        </button>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Task Not Found</h2>
          <p style={{ color: '#666' }}>The requested task ID "{id}" does not exist.</p>
        </div>
      </div>
    );
  }

  const handleUpdateTask = async (data: EditTaskFormData) => {
    const updated = await taskService.updateTask(task.id, data);
    setTask(updated);
    setIsEditModalOpen(false);
    setToastMessage('Task details updated successfully!');
  };

  const handleDeleteTask = async () => {
    await taskService.deleteTask(task.id);
    setIsDeleteOpen(false);
    navigate('/tasks');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: TaskComment = {
      id: `c-${Date.now()}`,
      author: 'Jane Doe',
      avatar: 'https://i.pravatar.cc/150?img=68',
      content: newCommentText.trim(),
      createdAt: 'Just now',
    };

    setTask((prev) => (prev ? { ...prev, comments: [...prev.comments, newComment] } : null));
    setNewCommentText('');
    setToastMessage('Comment posted!');
  };

  return (
    <div className={styles.page}>
      {/* Top Bar Navigation & Actions */}
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/tasks')}>
          <MdArrowBack size={18} /> Back to Tasks
        </button>

        <div className={styles.actionRow}>
          <AppButton
            variant="outlined"
            size="sm"
            leftIcon={<MdEdit size={16} />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Task
          </AppButton>
          <AppButton
            variant="outlined"
            size="sm"
            leftIcon={<MdDelete size={16} />}
            onClick={() => setIsDeleteOpen(true)}
            style={{ color: '#D32F2F', borderColor: '#FFCDD2' }}
          >
            Delete
          </AppButton>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className={styles.layoutGrid}>
        {/* Left Column: Task Header, Description, Attachments, Comments */}
        <div className={styles.card}>
          <div className={styles.headerSection}>
            <span className={styles.taskId}>{task.id}</span>
            <h1 className={styles.title}>{task.title}</h1>
            <div className={styles.badgesRow}>
              <StatusBadge status={task.status} size="md" />
              <StatusBadge priority={task.priority} size="md" />
              <span
                style={{
                  background: '#F8F8F8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#666',
                }}
              >
                {task.category}
              </span>
            </div>
          </div>

          <div>
            <h3 className={styles.sectionHeading}>Description</h3>
            <p className={styles.descriptionText}>{task.description}</p>
          </div>

          {/* Attachments Section */}
          <div>
            <h3 className={styles.sectionHeading}>Attachments ({task.attachments.length})</h3>
            {task.attachments.length > 0 ? (
              <div className={styles.attachmentsList}>
                {task.attachments.map((att) => (
                  <div key={att.id} className={styles.attachmentItem}>
                    <div className={styles.attachmentMeta}>
                      <MdAttachFile className={styles.fileIcon} />
                      <div>
                        <span className={styles.fileName}>{att.fileName}</span>
                        <div className={styles.fileSub}>
                          {att.fileSize} • Uploaded {att.uploadedAt}
                        </div>
                      </div>
                    </div>
                    <AppButton
                      variant="outlined"
                      size="sm"
                      leftIcon={<MdDownload size={16} />}
                      onClick={() => setToastMessage(`Downloading ${att.fileName}...`)}
                    >
                      Download
                    </AppButton>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#888', fontSize: '0.875rem' }}>No attachments uploaded yet.</p>
            )}
          </div>

          {/* Comments Section */}
          <div className={styles.commentsSection}>
            <h3 className={styles.sectionHeading}>Task Discussion ({task.comments.length})</h3>

            {task.comments.map((c) => (
              <div key={c.id} className={styles.commentCard}>
                <img src={c.avatar} alt={c.author} className={styles.commentAvatar} />
                <div className={styles.commentBody}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>{c.author}</span>
                    <span className={styles.commentTime}>{c.createdAt}</span>
                  </div>
                  <p className={styles.commentContent}>{c.content}</p>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddComment} className={styles.commentForm}>
              <input
                type="text"
                className={styles.commentInput}
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                aria-label="Write a comment on task"
              />
              <AppButton type="submit" variant="primary" size="sm" leftIcon={<MdSend size={16} />}>
                Post
              </AppButton>
            </form>
          </div>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div className={styles.card} style={{ height: 'fit-content' }}>
          <h3 className={styles.sectionHeading} style={{ borderBottom: '1px solid #F0F0F0', paddingBottom: '12px' }}>
            Task Details
          </h3>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Assignees</span>
            <AvatarGroup assignees={task.assignees} size={30} />
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Due Date</span>
            <span className={styles.metaVal}>{task.dueDate}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Created Date</span>
            <span className={styles.metaVal}>{task.createdDate}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Last Modified</span>
            <span className={styles.metaVal}>{task.lastModified}</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Task">
        <form onSubmit={handleSubmit(handleUpdateTask)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AppInput
            id="edit-title"
            label="Task Title"
            error={errors.title?.message}
            {...register('title')}
          />

          <AppInput
            id="edit-desc"
            label="Description"
            error={errors.description?.message}
            {...register('description')}
          />

          <AppSelect
            id="edit-category"
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
              id="edit-priority"
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
              id="edit-status"
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
            id="edit-duedate"
            label="Due Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Save Changes
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}" (${task.id})? This action cannot be undone.`}
        confirmLabel="Delete Task"
        isDanger
      />

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default TaskDetailPage;
