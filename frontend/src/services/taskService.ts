import { INITIAL_TASKS, type DetailedTaskItem } from '../data/tasks';

// Simulated delay helper
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let tasksStore: DetailedTaskItem[] = [...INITIAL_TASKS];

export const taskService = {
  /**
   * Fetch all tasks
   */
  async getTasks(): Promise<DetailedTaskItem[]> {
    // TODO: ASP.NET Core API Integration -> GET /api/tasks
    await delay();
    return [...tasksStore];
  },

  /**
   * Fetch single task by ID
   */
  async getTaskById(id: string): Promise<DetailedTaskItem | null> {
    // TODO: ASP.NET Core API Integration -> GET /api/tasks/{id}
    await delay();
    const task = tasksStore.find((t) => t.id === id);
    return task ? { ...task } : null;
  },

  /**
   * Create a new task
   */
  async createTask(newTaskData: Omit<DetailedTaskItem, 'id' | 'createdDate' | 'lastModified' | 'comments' | 'attachments'>): Promise<DetailedTaskItem> {
    // TODO: ASP.NET Core API Integration -> POST /api/tasks
    await delay();
    const newTask: DetailedTaskItem = {
      ...newTaskData,
      id: `TSK-${100 + tasksStore.length + 1}`,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      comments: [],
      attachments: [],
    };
    tasksStore = [newTask, ...tasksStore];
    return newTask;
  },

  /**
   * Update an existing task
   */
  async updateTask(id: string, updatedData: Partial<DetailedTaskItem>): Promise<DetailedTaskItem> {
    // TODO: ASP.NET Core API Integration -> PUT /api/tasks/{id}
    await delay();
    const index = tasksStore.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task with ID ${id} not found`);
    }
    const updatedTask = {
      ...tasksStore[index],
      ...updatedData,
      lastModified: new Date().toISOString().split('T')[0],
    };
    tasksStore[index] = updatedTask;
    return updatedTask;
  },

  /**
   * Delete a task by ID
   */
  async deleteTask(id: string): Promise<boolean> {
    // TODO: ASP.NET Core API Integration -> DELETE /api/tasks/{id}
    await delay();
    const initialLength = tasksStore.length;
    tasksStore = tasksStore.filter((t) => t.id !== id);
    return tasksStore.length < initialLength;
  },
};
