import type { TaskItem, TaskPriority, TaskStatus, TaskCategory } from '../types/dashboard.types';

export interface TaskComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
}

export interface DetailedTaskItem extends TaskItem {
  description: string;
  assignedUser: string;
  assignedUserId: string;
  project: string;
  projectId?: string;
  startDate: string;
  startTime: string;
  dueTime: string;
  timeLimit?: number; // in days
  createdDate: string;
  lastModified: string;
  comments: TaskComment[];
  attachments: TaskAttachment[];
}


