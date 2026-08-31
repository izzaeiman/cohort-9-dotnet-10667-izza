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
    getUsers: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('../../services/projectService', () => ({
  projectService: {
    getProjects: vi.fn(() => Promise.resolve([])),
  },
}));

const mockTasks = [
  {
    id: 'TSK-100',
    title: 'Admin Infrastructure Task',
    description: 'Deploy SSL certificates',
    priority: 'critical',
    category: 'DevOps',
    status: 'in_progress',
    dueDate: '2026-12-01',
    assignedUser: 'Admin User',
    assignedUserId: 'u1',
    project: 'Infrastructure',
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

describe('AdminTasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getAllTasks as any).mockResolvedValue(mockTasks);
    (userService.getUsers as any).mockResolvedValue([{ id: 'u1', name: 'Admin User' }]);
    (projectService.getProjects as any).mockResolvedValue([{ id: 'p1', name: 'Infrastructure' }]);
  });

  it('renders tasks table with mocked data', async () => {
    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Infrastructure Task')).toBeDefined();
    });
  });

  it('filters tasks when searching by query', async () => {
    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Admin Infrastructure Task')).toBeDefined());

    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'Admin' } });

    await waitFor(() => {
      expect(screen.getByText('Admin Infrastructure Task')).toBeDefined();
    });
  });

  it('opens Create Task modal when Add New Task button is clicked', async () => {
    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Admin Infrastructure Task')).toBeDefined());

    const addButton = screen.getByText('Create Task');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeDefined();
    });
  });

  it('displays error state when taskService rejects', async () => {
    (taskService.getAllTasks as any).mockRejectedValue(new Error('Server error'));

    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeDefined();
    });
  });
});
