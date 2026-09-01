import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TasksPage } from './TasksPage';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import React from 'react';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Task User' }, isAdmin: () => true }),
  default: () => ({ user: { id: 'u1', name: 'Task User' }, isAdmin: () => true }),
}));

vi.mock('../../services/taskService', () => ({
  taskService: {
    getTasks: vi.fn(),
    getAllTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock('../../services/userService', () => ({
  userService: {
    getUsers: vi.fn(),
  },
}));

vi.mock('../../services/projectService', () => ({
  projectService: {
    getProjects: vi.fn(),
  },
}));

const mockTasks = [
  {
    id: 'TSK-1',
    title: 'Design System Polish',
    description: 'Update buttons and inputs',
    category: 'Frontend',
    priority: 'high',
    status: 'in_progress',
    assignedUser: 'Task User',
    assignedUserId: 'u1',
    assignees: [],
    project: 'Core Dashboard',
    projectId: 'p1',
    startDate: '2026-09-01',
    startTime: '09:00 AM',
    dueDate: '2026-09-10',
    dueTime: '05:00 PM',
  },
];

describe('TasksPage - Interactive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => JSON.stringify({ id: 'u1', name: 'Task User', role: 'Administrator' })),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    (taskService.getTasks as any).mockResolvedValue(mockTasks);
    (taskService.getAllTasks as any).mockImplementation((filters?: any) => {
      if (filters?.search === 'NonExistentTaskXYZ') {
        return Promise.resolve([]);
      }
      return Promise.resolve(mockTasks);
    });
    (userService.getUsers as any).mockResolvedValue([{ id: 'u1', name: 'Task User' }]);
    (projectService.getProjects as any).mockResolvedValue([{ id: 'p1', name: 'Core Dashboard' }]);
  });

  it('1. renders user task dashboard page with stats and cards', async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Design System Polish')).toBeDefined();
    });
  });

  it('2. filters tasks by status dropdown and search input', async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Design System Polish')).toBeDefined());

    const statusSelect = screen.getByLabelText('Filter tasks by status');
    fireEvent.change(statusSelect, { target: { value: 'in_progress' } });

    const searchInput = screen.getByPlaceholderText(/Search tasks/i);
    fireEvent.change(searchInput, { target: { value: 'Design' } });

    await waitFor(() => {
      expect(screen.getByText('Design System Polish')).toBeDefined();
    });
  });

  it('3. renders empty state and clears filters', async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Design System Polish')).toBeDefined());

    const searchInput = screen.getByPlaceholderText(/Search tasks/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentTaskXYZ' } });

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeDefined();
    });

    const clearBtn = screen.getByText('Clear Filters');
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.getByText('Design System Polish')).toBeDefined();
    });
  });
});
