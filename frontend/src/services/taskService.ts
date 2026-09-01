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
  else if (t.status === 'Cancelled' || t.status === 3) status = 'cancelled';
  else if (t.status === 'Pending' || t.status === 0) status = 'pending';

  let priority: TaskPriority = 'medium';
  if (t.priority === 'Low' || t.priority === 0) priority = 'low';
  else if (t.priority === 'Medium' || t.priority === 1) priority = 'medium';
  else if (t.priority === 'High' || t.priority === 2) priority = 'high';
  else if (t.priority === 'Critical' || t.priority === 3) priority = 'critical';

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
    project: t.projectName || 'Unassigned',
    projectId: t.projectId || '',
    startDate: createdDateStr,
    startTime: '09:00 AM',
    dueTime: '05:00 PM',
    timeLimit: t.timeLimit !== null && t.timeLimit !== undefined ? t.timeLimit : undefined,
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
  else if (data.status === 'cancelled') status = 'Cancelled';

  let priority = 'Medium';
  if (data.priority === 'low') priority = 'Low';
  else if (data.priority === 'high') priority = 'High';
  else if (data.priority === 'critical') priority = 'Critical';

  return {
    title: data.title,
    description: data.description || '',
    status,
    priority,
    category: data.category || 'General',
    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    assignedUserId: data.assignedUserId || null,
    projectId: data.projectId || null,
    timeLimit: data.timeLimit !== undefined && data.timeLimit !== null && data.timeLimit !== '' ? parseInt(data.timeLimit as any, 10) : null,
  };
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

export const taskService = {
  subscribe(listener: TaskChangeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async getTasks(filters?: TaskFilters): Promise<DetailedTaskItem[]> {
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

  // Alias for backward compatibility with adminTaskService calls
  async getAllTasks(filters?: TaskFilters): Promise<DetailedTaskItem[]> {
    return await this.getTasks(filters);
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

    const currentResponse = await apiClient.get(`/tasks/${rawId}`);
    const current = currentResponse.data;

    const payload: any = {
      title: updatedData.title ?? current.title,
      description: updatedData.description ?? current.description,
      category: updatedData.category ?? current.category,
      assignedUserId: updatedData.assignedUserId !== undefined ? updatedData.assignedUserId : current.assignedUserId,
      projectId: updatedData.projectId !== undefined ? updatedData.projectId : current.projectId,
      timeLimit: updatedData.timeLimit !== undefined ? (updatedData.timeLimit !== null && updatedData.timeLimit !== ('' as any) ? parseInt(updatedData.timeLimit as any, 10) : null) : current.timeLimit,
    };

    if (updatedData.status !== undefined) {
      let status = 'Pending';
      if (updatedData.status === 'in_progress') status = 'InProgress';
      else if (updatedData.status === 'completed') status = 'Completed';
      else if (updatedData.status === 'cancelled') status = 'Cancelled';
      payload.status = status;
    } else {
      payload.status = current.status;
    }

    if (updatedData.priority !== undefined) {
      let priority = 'Medium';
      if (updatedData.priority === 'low') priority = 'Low';
      else if (updatedData.priority === 'high') priority = 'High';
      else if (updatedData.priority === 'critical') priority = 'Critical';
      payload.priority = priority;
    } else {
      payload.priority = current.priority;
    }

    if (updatedData.dueDate !== undefined) {
      payload.dueDate = updatedData.dueDate ? new Date(updatedData.dueDate).toISOString() : null;
    } else {
      payload.dueDate = current.dueDate;
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

  async getProgressEntries(taskId: string | number): Promise<any[]> {
    const rawId = typeof taskId === 'string' ? parseInt(taskId.replace('TSK-', ''), 10) : taskId;
    const res = await apiClient.get(`/tasks/${rawId}/progress`);
    return res.data || [];
  },

  async addProgressEntry(taskId: string | number, description: string): Promise<any> {
    const rawId = typeof taskId === 'string' ? parseInt(taskId.replace('TSK-', ''), 10) : taskId;
    const res = await apiClient.post(`/tasks/${rawId}/progress`, { description });
    return res.data;
  },

  async updateProgressEntry(taskId: string | number, progressId: number, description: string): Promise<any> {
    const rawId = typeof taskId === 'string' ? parseInt(taskId.replace('TSK-', ''), 10) : taskId;
    const res = await apiClient.put(`/tasks/${rawId}/progress/${progressId}`, { description });
    return res.data;
  },

  async deleteProgressEntry(taskId: string | number, progressId: number): Promise<boolean> {
    const rawId = typeof taskId === 'string' ? parseInt(taskId.replace('TSK-', ''), 10) : taskId;
    await apiClient.delete(`/tasks/${rawId}/progress/${progressId}`);
    return true;
  },
};
