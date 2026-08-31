import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TasksPage } from './TasksPage';
import { taskService } from '../../services/taskService';
import { authService } from '../../services/authService';
import React from 'react';

vi.mock('../../services/taskService', () => ({
  taskService: {
    getAllTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(() => ({ id: 'usr-admin', name: 'Admin Lead', role: 'Administrator' })),
  },
}));

const mockTaskList = [
  {
    id: 'TSK-101',
    title: 'Frontend Refactoring Task',
    description: 'Refactor UI components',
    priority: 'high',
    category: 'Frontend',
    status: 'in_progress',
    dueDate: '2026-10-10',
    assignedUser: 'Admin Lead',
    assignedUserId: 'usr-admin',
    project: 'SaaS Tool',
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
    id: 'TSK-102',
    title: 'Backend API Security Audit',
    description: 'Audit JWT validation',
    priority: 'critical',
    category: 'Backend',
    status: 'pending',
    dueDate: '2026-11-01',
    assignedUser: 'Jane Doe',
    assignedUserId: 'usr-2',
    project: 'SaaS Tool',
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

describe('TasksPage - Full Interactive & Error Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getAllTasks as any).mockResolvedValue(mockTaskList);
  });

  it('1. renders initial task list with mocked data', async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Frontend Refactoring Task')).toBeDefined();
      expect(screen.getByText('Backend API Security Audit')).toBeDefined();
    });
  });

  it('2. triggers search and filter interactions', async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Frontend Refactoring Task')).toBeDefined());

    const searchInput = screen.getByPlaceholderText(/Search tasks or ID/i);
    fireEvent.change(searchInput, { target: { value: 'Security' } });

    await waitFor(() => {
      expect(taskService.getAllTasks).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Security' })
      );
    });
  });

  it('3. opens Create Task modal when Create Task button is clicked', async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Frontend Refactoring Task')).toBeDefined());

    const createBtn = screen.getByText('Create Task');
    fireEvent.click(createBtn.closest('button') || createBtn);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeDefined();
    });
  });

  it('4. executes single task deletion flow upon menu action and confirmation', async () => {
    (taskService.deleteTask as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Frontend Refactoring Task')).toBeDefined());

    const menuBtns = screen.getAllByTitle('Task options');
    if (menuBtns.length > 0) {
      fireEvent.click(menuBtns[0]);
      await waitFor(() => {
        const deleteMenuItem = screen.getByText('Delete Task');
        fireEvent.click(deleteMenuItem);
      });
      const confirmBtn = screen.getAllByText('Delete Task')[1] || screen.getAllByText('Delete Task')[0];
      fireEvent.click(confirmBtn);
      await waitFor(() => {
        expect(taskService.deleteTask).toHaveBeenCalledWith('TSK-101');
      });
    }
  });

  it('5. handles empty API response state gracefully', async () => {
    (taskService.getAllTasks as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tasks Overview')).toBeDefined();
    });
  });
});
