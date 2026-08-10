import { INITIAL_TASKS, type DetailedTaskItem } from '../data/tasks';
import { INITIAL_USERS } from '../data/users';

const STORAGE_KEY = 'workflow_admin_tasks_store';

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

type TaskChangeListener = () => void;
const listeners: Set<TaskChangeListener> = new Set();

const loadTasksFromStorage = (): DetailedTaskItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback to INITIAL_TASKS
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
  return [...INITIAL_TASKS];
};

const saveTasksToStorage = (tasks: DetailedTaskItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  listeners.forEach((listener) => listener());
};

let memoryStore: DetailedTaskItem[] = loadTasksFromStorage();

export const adminTaskService = {
  /**
   * Subscribe to task data changes across components
   */
  subscribe(listener: TaskChangeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * Fetch all tasks (Admin view)
   */
  async getAllTasks(): Promise<DetailedTaskItem[]> {
    await delay();
    memoryStore = loadTasksFromStorage();
    return [...memoryStore];
  },

  /**
   * Fetch single task by ID
   */
  async getTaskById(id: string): Promise<DetailedTaskItem | null> {
    await delay();
    memoryStore = loadTasksFromStorage();
    const task = memoryStore.find((t) => t.id === id);
    return task ? { ...task } : null;
  },

  /**
   * Create new task
   */
  async createTask(
    newTaskData: Omit<
      DetailedTaskItem,
      'id' | 'createdDate' | 'lastModified' | 'comments' | 'attachments' | 'assignees'
    > & { assignedUserId?: string },
  ): Promise<DetailedTaskItem> {
    await delay();
    memoryStore = loadTasksFromStorage();

    const assignedUserObj = INITIAL_USERS.find(
      (u) => u.id === newTaskData.assignedUserId || u.name === newTaskData.assignedUser,
    ) || {
      id: newTaskData.assignedUserId || 'usr-1',
      name: newTaskData.assignedUser || 'Unassigned',
      avatar: 'https://i.pravatar.cc/150?img=68',
    };

    const nextIdNumber = memoryStore.length + 101;
    const newTask: DetailedTaskItem = {
      ...newTaskData,
      id: `TSK-${nextIdNumber}`,
      assignedUser: assignedUserObj.name,
      assignedUserId: assignedUserObj.id,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      assignees: [
        {
          id: assignedUserObj.id,
          name: assignedUserObj.name,
          avatar: assignedUserObj.avatar,
        },
      ],
      comments: [],
      attachments: [],
    };

    memoryStore = [newTask, ...memoryStore];
    saveTasksToStorage(memoryStore);
    return newTask;
  },

  /**
   * Update task by ID
   */
  async updateTask(
    id: string,
    updatedData: Partial<DetailedTaskItem>,
  ): Promise<DetailedTaskItem> {
    await delay();
    memoryStore = loadTasksFromStorage();

    const index = memoryStore.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task with ID ${id} not found.`);
    }

    const current = memoryStore[index];

    let updatedAssignedUser = updatedData.assignedUser || current.assignedUser;
    let updatedAssignedUserId = updatedData.assignedUserId || current.assignedUserId;
    let updatedAssignees = current.assignees;

    if (updatedData.assignedUserId || updatedData.assignedUser) {
      const foundUser = INITIAL_USERS.find(
        (u) => u.id === updatedData.assignedUserId || u.name === updatedData.assignedUser,
      );
      if (foundUser) {
        updatedAssignedUser = foundUser.name;
        updatedAssignedUserId = foundUser.id;
        updatedAssignees = [
          {
            id: foundUser.id,
            name: foundUser.name,
            avatar: foundUser.avatar,
          },
        ];
      }
    }

    const updatedTask: DetailedTaskItem = {
      ...current,
      ...updatedData,
      assignedUser: updatedAssignedUser,
      assignedUserId: updatedAssignedUserId,
      assignees: updatedAssignees,
      lastModified: new Date().toISOString().split('T')[0],
    };

    memoryStore[index] = updatedTask;
    saveTasksToStorage(memoryStore);
    return updatedTask;
  },

  /**
   * Delete task by ID
   */
  async deleteTask(id: string): Promise<boolean> {
    await delay();
    memoryStore = loadTasksFromStorage();

    const initialLen = memoryStore.length;
    memoryStore = memoryStore.filter((t) => t.id !== id);

    if (memoryStore.length < initialLen) {
      saveTasksToStorage(memoryStore);
      return true;
    }
    return false;
  },

  /**
   * Assign or Reassign task to a user
   */
  async assignTask(
    taskId: string,
    userId: string,
    newStartDate?: string,
    newStartTime?: string,
    newDueDate?: string,
    newDueTime?: string,
    newTimeLimit?: number,
  ): Promise<DetailedTaskItem> {
    await delay();
    memoryStore = loadTasksFromStorage();

    const task = memoryStore.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found.`);
    }

    const foundUser = INITIAL_USERS.find((u) => u.id === userId);
    if (!foundUser) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const updated = await this.updateTask(taskId, {
      assignedUser: foundUser.name,
      assignedUserId: foundUser.id,
      assignees: [{ id: foundUser.id, name: foundUser.name, avatar: foundUser.avatar }],
      ...(newStartDate && { startDate: newStartDate }),
      ...(newStartTime && { startTime: newStartTime }),
      ...(newDueDate && { dueDate: newDueDate }),
      ...(newDueTime && { dueTime: newDueTime }),
      ...(newTimeLimit !== undefined && { timeLimit: newTimeLimit }),
    });

    return updated;
  },
};
