import { adminTaskService } from './adminTaskService';
import type { DetailedTaskItem } from '../data/tasks';

export const taskService = {
  /**
   * Fetch all tasks
   */
  async getTasks(): Promise<DetailedTaskItem[]> {
    return await adminTaskService.getAllTasks();
  },

  /**
   * Fetch single task by ID
   */
  async getTaskById(id: string): Promise<DetailedTaskItem | null> {
    return await adminTaskService.getTaskById(id);
  },

  /**
   * Create a new task
   */
  async createTask(
    newTaskData: Omit<
      DetailedTaskItem,
      'id' | 'createdDate' | 'lastModified' | 'comments' | 'attachments'
    > & { assignedUserId?: string }
  ): Promise<DetailedTaskItem> {
    return await adminTaskService.createTask(newTaskData);
  },

  /**
   * Update an existing task
   */
  async updateTask(id: string, updatedData: Partial<DetailedTaskItem>): Promise<DetailedTaskItem> {
    return await adminTaskService.updateTask(id, updatedData);
  },

  /**
   * Delete a task by ID
   */
  async deleteTask(id: string): Promise<boolean> {
    return await adminTaskService.deleteTask(id);
  },
};
