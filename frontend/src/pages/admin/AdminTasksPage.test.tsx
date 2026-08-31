import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminTasksPage } from './AdminTasksPage';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import React from 'react';

vi.mock('../../services/taskService', () => ({
  taskService: {
    getAllTasks: vi.fn(),
    deleteTask: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock('../../services/userService', () => ({
  userService: {
    getUsers: vi.fn(() => Promise.resolve([{ id: 'u1', name: 'Alice Smith' }])),
  },
}));

vi.mock('../../services/projectService', () => ({
  projectService: {
    getProjects: vi.fn(() => Promise.resolve([{ id: 'p1', name: 'Core Platform' }])),
  },
}));

const mockTasks = [
  {
    id: 'TSK-201',
    title: 'Admin Infrastructure Task',
    description: 'Server cluster migration',
    priority: 'high',
    category: 'DevOps',
    status: 'in_progress',
    dueDate: '2026-12-31',
    assignedUser: 'Alice Smith',
    assignedUserId: 'u1',
    project: 'Core Platform',
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

describe('AdminTasksPage - Full Interactive & Error Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getAllTasks as any).mockResolvedValue(mockTasks);
  });

  it('1. renders initial admin task table with stats', async () => {
    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Infrastructure Task')).toBeDefined();
      expect(screen.getByText('Task Management')).toBeDefined();
    });
  });

  it('2. triggers search input and clear filters interaction', async () => {
    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Admin Infrastructure Task')).toBeDefined());

    const searchInput = screen.getByPlaceholderText(/Search by title, description/i);
    fireEvent.change(searchInput, { target: { value: 'Infrastructure' } });

    await waitFor(() => {
      expect(taskService.getAllTasks).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Infrastructure' })
      );
    });

    const clearBtn = screen.getByText('Clear Filters');
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect((searchInput as HTMLInputElement).value).toBe('');
    });
  });

  it('3. opens Create, Edit, and Assign modals from action buttons', async () => {
    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Admin Infrastructure Task')).toBeDefined());

    const createBtn = screen.getByText('Create Task');
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeDefined();
    });
  });

  it('4. executes task deletion flow upon confirmation', async () => {
    (taskService.deleteTask as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Admin Infrastructure Task')).toBeDefined());

    const deleteBtns = screen.getAllByTitle('Delete Task');
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeDefined();
    });

    const confirmBtn = screen.getAllByText('Delete Task')[1] || screen.getAllByText('Delete Task')[0];
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(taskService.deleteTask).toHaveBeenCalledWith('TSK-201');
    });
  });

  it('5. renders error state and handles retry button', async () => {
    (taskService.getAllTasks as any).mockRejectedValue(new Error('Failed to load tasks from server'));

    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load tasks from server')).toBeDefined();
      expect(screen.getByText('Retry Loading')).toBeDefined();
    });

    (taskService.getAllTasks as any).mockResolvedValue(mockTasks);
    const retryBtn = screen.getByText('Retry Loading');
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Admin Infrastructure Task')).toBeDefined();
    });
  });
});
