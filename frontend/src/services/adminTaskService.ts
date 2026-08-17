import apiClient from './api';
import type { DetailedTaskItem } from '../data/tasks';
import type { TaskPriority, TaskStatus, TaskCategory } from '../types/dashboard.types';

type TaskChangeListener = () => void;
const listeners: Set<TaskChangeListener> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

// Map backend task DTO to frontend DetailedTaskItem
const mapBackendTaskToFrontend = (t: any): DetailedTaskItem => {
  const stringId = `TSK-${t.id}`;

  let status: TaskStatus = 'pending';
  if (t.status === 'InProgress' || t.status === 1) status = 'in_progress';
  else if (t.status === 'Completed' || t.status === 2) status = 'completed';
  else if (t.status === 'Pending' || t.status === 0) status = 'pending';

  let priority: TaskPriority = 'medium';
  if (t.priority === 'Low' || t.priority === 0) priority = 'low';
  else if (t.priority === 'Medium' || t.priority === 1) priority = 'medium';
  else if (t.priority === 'High' || t.priority === 2) priority = 'high';

  const dueDateStr = t.dueDate ? t.dueDate.split('T')[0] : '';
  const createdDateStr = t.createdAt ? t.createdAt.split('T')[0] : '';
  const modifiedDateStr = t.updatedAt ? t.updatedAt.split('T')[0] : '';

  // Choose a consistent avatar image based on assigned user ID
  const avatarNum = t.assignedUserId ? (parseInt(t.assignedUserId.replace(/\D/g, ''), 10) || 1) % 50 : 12;
  const avatarUrl = `https://i.pravatar.cc/150?img=${avatarNum}`;

  return {
    id: stringId,
    title: t.title,
    description: t.description || '',
    priority,
    category: (t.category || 'General') as TaskCategory,
    status,
    dueDate: dueDateStr,
    assignedUser: t.assignedUserName || 'Unassigned',
    assignedUserId: t.assignedUserId || '',
    project: 'Task Management System SaaS',
    startDate: createdDateStr,
    startTime: '09:00 AM',
    dueTime: '05:00 PM',
    timeLimit: 8,
    createdDate: createdDateStr,
    lastModified: modifiedDateStr,
    assignees: t.assignedUserId ? [
      {
        id: t.assignedUserId,
        name: t.assignedUserName || 'Unassigned',
        avatar: avatarUrl,
      }
    ] : [],
    comments: [],
    attachments: [],
  };
};

// Map frontend data to backend DTO format
const mapFrontendToBackendCreate = (data: any) => {
  let status = 'Pending';
  if (data.status === 'in_progress') status = 'InProgress';
  else if (data.status === 'completed') status = 'Completed';

  let priority = 'Medium';
  if (data.priority === 'low') priority = 'Low';
  else if (data.priority === 'high') priority = 'High';

  return {
    title: data.title,
    description: data.description || '',
    status,
    priority,
    category: data.category || 'General',
    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    assignedUserId: data.assignedUserId || null,
  };
};

const mapFrontendToBackendUpdate = (data: any) => {
  const result: any = {};
  if (data.title !== undefined) result.title = data.title;
  if (data.description !== undefined) result.description = data.description;
  if (data.category !== undefined) result.category = data.category;

  if (data.status !== undefined) {
    let status = 'Pending';
    if (data.status === 'in_progress') status = 'InProgress';
    else if (data.status === 'completed') status = 'Completed';
    result.status = status;
  }

  if (data.priority !== undefined) {
    let priority = 'Medium';
    if (data.priority === 'low') priority = 'Low';
    else if (data.priority === 'high') priority = 'High';
    result.priority = priority;
  }

  if (data.dueDate !== undefined) {
    result.dueDate = data.dueDate ? new Date(data.dueDate).toISOString() : null;
  }

  if (data.assignedUserId !== undefined) {
    result.assignedUserId = data.assignedUserId || null;
  }

  return result;
};

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedUserId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export const adminTaskService = {
  subscribe(listener: TaskChangeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async getAllTasks(filters?: TaskFilters): Promise<DetailedTaskItem[]> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.assignedUserId && filters.assignedUserId !== 'all') params.append('assignedUserId', filters.assignedUserId);
      if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
      if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo);

      if (filters.status && filters.status !== 'all') {
        let backendStatus = '';
        if (filters.status === 'in_progress') backendStatus = 'InProgress';
        else if (filters.status === 'completed') backendStatus = 'Completed';
        else if (filters.status === 'pending') backendStatus = 'Pending';
        else if (filters.status === 'cancelled') backendStatus = 'Cancelled';

        if (backendStatus) {
          params.append('status', backendStatus);
        }
      }

      if (filters.priority && filters.priority !== 'all') {
        let backendPriority = '';
        if (filters.priority === 'low') backendPriority = 'Low';
        else if (filters.priority === 'medium') backendPriority = 'Medium';
        else if (filters.priority === 'high') backendPriority = 'High';
        else if (filters.priority === 'critical') backendPriority = 'Critical';
        
        if (backendPriority) {
          params.append('priority', backendPriority);
        }
      }
    }

    const queryString = params.toString();
    const url = queryString ? `/tasks?${queryString}` : '/tasks';
    const response = await apiClient.get(url);
    return response.data.map(mapBackendTaskToFrontend);
  },

  async getTaskById(id: string): Promise<DetailedTaskItem | null> {
    const rawId = parseInt(id.replace('TSK-', ''), 10);
    if (isNaN(rawId)) return null;

    try {
      const response = await apiClient.get(`/tasks/${rawId}`);
      return mapBackendTaskToFrontend(response.data);
    } catch {
      return null;
    }
  },

  async createTask(
    newTaskData: Omit<
      DetailedTaskItem,
      'id' | 'createdDate' | 'lastModified' | 'comments' | 'attachments' | 'assignees'
    > & { assignedUserId?: string },
  ): Promise<DetailedTaskItem> {
    const payload = mapFrontendToBackendCreate(newTaskData);
    const response = await apiClient.post('/tasks', payload);
    const created = mapBackendTaskToFrontend(response.data);
    notifyListeners();
    return created;
  },

  async updateTask(
    id: string,
    updatedData: Partial<DetailedTaskItem>,
  ): Promise<DetailedTaskItem> {
    const rawId = parseInt(id.replace('TSK-', ''), 10);
    if (isNaN(rawId)) {
      throw new Error(`Invalid task ID: ${id}`);
    }

    const payload = mapFrontendToBackendUpdate(updatedData);

    // Check if the update is just comments (local-only property)
    if (Object.keys(payload).length === 0 && updatedData.comments !== undefined) {
      const current = await this.getTaskById(id);
      if (!current) throw new Error(`Task with ID ${id} not found.`);
      const updatedTask = { ...current, comments: updatedData.comments };
      notifyListeners();
      return updatedTask;
    }

    const response = await apiClient.put(`/tasks/${rawId}`, payload);
    const updated = mapBackendTaskToFrontend(response.data);
    notifyListeners();
    return updated;
  },

  async deleteTask(id: string): Promise<boolean> {
    const rawId = parseInt(id.replace('TSK-', ''), 10);
    if (isNaN(rawId)) return false;

    try {
      await apiClient.delete(`/tasks/${rawId}`);
      notifyListeners();
      return true;
    } catch {
      return false;
    }
  },

  async assignTask(
    taskId: string,
    userId: string,
    newStartDate?: string,
    newStartTime?: string,
    newDueDate?: string,
    newDueTime?: string,
    newTimeLimit?: number,
  ): Promise<DetailedTaskItem> {
    const updated = await this.updateTask(taskId, {
      assignedUserId: userId,
      ...(newDueDate && { dueDate: newDueDate }),
    });
    return updated;
  },
};
