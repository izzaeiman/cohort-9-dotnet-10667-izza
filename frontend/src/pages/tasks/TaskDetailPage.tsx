import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MdArrowBack,
  MdEdit,
  MdDelete,
  MdAssignmentInd,
  MdAttachFile,
  MdSend,
  MdDownload,
} from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import StatusBadge from '../../components/ui/StatusBadge';
import TaskDeadlineBadge from '../../components/ui/TaskDeadlineBadge';
import AvatarGroup from '../../components/ui/AvatarGroup';
import Toast from '../../components/common/Toast';
import ConfirmationDialog from '../../components/shared/ConfirmationDialog';
import PageLoader from '../../components/common/PageLoader';

import EditTaskModal from '../../components/admin/EditTaskModal';
import AssignTaskModal from '../../components/admin/AssignTaskModal';

import TaskProgressSection from '../../components/tasks/TaskProgressSection';

import { taskService } from '../../services/taskService';
import type { DetailedTaskItem, TaskComment } from '../../data/tasks';
import { formatDateDisplay } from '../../utils/deadlineHelpers';
import styles from './TaskDetail.module.css';

export const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<DetailedTaskItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadTask = async () => {
    if (!id) {
      setTask(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await taskService.getTaskById(id);
      setTask(data);
    } catch {
      setTask(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
    const unsub = taskService.subscribe(() => {
      loadTask();
    });
    return () => unsub();
  }, [id]);

  if (isLoading) return <PageLoader />;

  if (!task) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/admin/tasks')}>
          <MdArrowBack size={18} /> Back to Tasks
        </button>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Task Not Found</h2>
          <p style={{ color: '#666' }}>The requested task ID "{id}" does not exist.</p>
        </div>
      </div>
    );
  }

  const handleDeleteTask = async () => {
    await taskService.deleteTask(task.id);
    setIsDeleteOpen(false);
    navigate('/admin/tasks');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: TaskComment = {
      id: `c-${Date.now()}`,
      author: 'Izza Eiman (Admin)',
      avatar: 'https://i.pravatar.cc/150?img=68',
      content: newCommentText.trim(),
      createdAt: 'Just now',
    };

    const updatedComments = [...task.comments, newComment];

    try {
      const updatedTask = await taskService.updateTask(task.id, { comments: updatedComments });
      setTask(updatedTask);
      setNewCommentText('');
      setToastMessage('Comment posted successfully!');
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to post comment.');
    }
  };

  return (
    <div className={styles.page}>
      {/* Top Bar Navigation & Actions */}
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          <MdArrowBack size={18} /> Back to Tasks
        </button>

        <div className={styles.actionRow}>
          <AppButton
            variant="outlined"
            size="sm"
            leftIcon={<MdAssignmentInd size={16} />}
            onClick={() => setIsAssignModalOpen(true)}
          >
            Assign / Reassign
          </AppButton>
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
                  background: 'var(--surface-secondary, #F8F8F8)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #666)',
                }}
              >
                {task.category}
              </span>
              <TaskDeadlineBadge task={task} />
            </div>

            {/* Visual Task Status Progress Bar */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                <span>Task Completion Progress</span>
                <span>
                  {task.status === 'completed' ? '100%' : task.status === 'in_progress' ? '50%' : task.status === 'overdue' ? '25%' : '0%'}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border, #e5e7eb)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: task.status === 'completed' ? '100%' : task.status === 'in_progress' ? '50%' : task.status === 'overdue' ? '25%' : '0%',
                    backgroundColor: task.status === 'completed' ? '#10b981' : task.status === 'in_progress' ? '#3b82f6' : task.status === 'overdue' ? '#ef4444' : '#9ca3af',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className={styles.sectionHeading}>Description</h3>
            <p className={styles.descriptionText}>{task.description}</p>
          </div>

          {/* Activity & Progress Log History */}
          <TaskProgressSection taskId={task.id} />

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
              <p style={{ color: 'var(--text-secondary, #888)', fontSize: '0.875rem' }}>
                No attachments uploaded yet.
              </p>
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

        {/* Right Column: Detailed Metadata Sidebar */}
        <div className={styles.card} style={{ height: 'fit-content' }}>
          <h3
            className={styles.sectionHeading}
            style={{
              borderBottom: '1px solid var(--border, #F0F0F0)',
              paddingBottom: '12px',
            }}
          >
            Task Metadata
          </h3>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Assigned User</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AvatarGroup assignees={task.assignees} size={28} />
              <span className={styles.metaVal}>{task.assignedUser}</span>
            </div>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Project</span>
            <span className={styles.metaVal}>{task.project}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Start Date & Time</span>
            <span className={styles.metaVal}>
              {formatDateDisplay(task.startDate, task.startTime)}
            </span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Due Date & Time</span>
            <span className={styles.metaVal}>
              {formatDateDisplay(task.dueDate, task.dueTime)}
            </span>
          </div>

          {task.timeLimit != null && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Time Limit</span>
              <span className={styles.metaVal}>{task.timeLimit} Days</span>
            </div>
          )}

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Time Remaining</span>
            <TaskDeadlineBadge task={task} />
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
      <EditTaskModal
        isOpen={isEditModalOpen}
        task={task}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={loadTask}
      />

      {/* Assign Modal */}
      <AssignTaskModal
        isOpen={isAssignModalOpen}
        task={task}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={loadTask}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}" (${task.id})? This action cannot be undone.`}
        confirmText="Delete Task"
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
