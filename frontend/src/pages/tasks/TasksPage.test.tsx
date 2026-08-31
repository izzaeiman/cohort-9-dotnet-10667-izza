import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TasksPage } from './TasksPage';
import { taskService } from '../../services/taskService';
import React from 'react';

vi.mock('../../services/taskService', () => ({
  taskService: {
    getAllTasks: vi.fn(),
    getTasks: vi.fn(),
    createTask: vi.fn(),
    deleteTask: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: () => ({
      id: 'usr-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'Administrator',
    }),
  },
}));

const mockTasks = [
  {
    id: 'TSK-1',
    title: 'Frontend Component Bug',
    description: 'Fix render glitch in tasks page',
    priority: 'high',
    category: 'Frontend',
    status: 'pending',
    dueDate: '2026-10-01',
    assignedUser: 'Test User',
    assignedUserId: 'usr-1',
    project: 'Task Manager App',
    projectId: 'p1',
    startDate: '2026-09-01',
    startTime: '09:00 AM',
    dueTime: '05:00 PM',
    createdDate: '2026-08-01',
    lastModified: '2026-08-01',
    assignees: [],
    comments: [],
    attachments: [],
  },
  {
    id: 'TSK-2',
    title: 'Database Migration Query',
    description: 'Optimize indexes for user query',
    priority: 'low',
    category: 'Database',
    status: 'completed',
    dueDate: '2026-11-01',
    assignedUser: 'Test User',
    assignedUserId: 'usr-1',
    project: 'Task Manager App',
    projectId: 'p1',
    startDate: '2026-09-01',
    startTime: '09:00 AM',
    dueTime: '05:00 PM',
    createdDate: '2026-08-01',
    lastModified: '2026-08-01',
    assignees: [],
    comments: [],
    attachments: [],
  },
];

describe('TasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getAllTasks as any).mockImplementation((filters?: any) => {
      if (filters?.search) {
        return Promise.resolve(mockTasks.filter((t) => t.title.toLowerCase().includes(filters.search.toLowerCase())));
      }
      return Promise.resolve(mockTasks);
    });
    (taskService.getTasks as any).mockResolvedValue(mockTasks);
  });

  it('renders tasks list on initial load', async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Frontend Component Bug')).toBeDefined();
      expect(screen.getByText('Database Migration Query')).toBeDefined();
    });
  });

  it('filters tasks when search input changes', async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Frontend Component Bug')).toBeDefined());

    const searchInput = screen.getByPlaceholderText(/Search tasks/i);
    fireEvent.change(searchInput, { target: { value: 'Frontend' } });

    await waitFor(() => {
      expect(screen.getByText('Frontend Component Bug')).toBeDefined();
      expect(screen.queryByText('Database Migration Query')).toBeNull();
    });
  });

  it('renders empty state when API returns empty array', async () => {
    (taskService.getAllTasks as any).mockResolvedValue([]);
    (taskService.getTasks as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No tasks found')).toBeDefined();
    });
  });
});
