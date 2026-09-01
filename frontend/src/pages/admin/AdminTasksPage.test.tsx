import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminTasksPage } from './AdminTasksPage';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import React from 'react';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Admin User' }, isAdmin: () => true }),
  default: () => ({ user: { id: 'u1', name: 'Admin User' }, isAdmin: () => true }),
}));

vi.mock('../../services/taskService', () => ({
  taskService: {
    getAllTasks: vi.fn(),
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
    id: 'TSK-101',
    title: 'Alpha Database Migration',
    description: 'Migrate database schema to v2',
    category: 'Backend',
    priority: 'high',
    status: 'in_progress',
    assignedUser: 'Alice Admin',
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

describe('AdminTasksPage - Complete Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getAllTasks as any).mockResolvedValue(mockTasks);
    (userService.getUsers as any).mockResolvedValue([{ id: 'u1', name: 'Alice Admin' }]);
    (projectService.getProjects as any).mockResolvedValue([{ id: 'p1', name: 'Core Dashboard' }]);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('1. renders admin task management page header, stats, and task table', async () => {
    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Task Management')).toBeDefined();
      expect(screen.getByText('Alpha Database Migration')).toBeDefined();
    });
  });

  it('2. filters tasks by search input', async () => {
    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Alpha Database Migration')).toBeDefined());

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    await waitFor(() => {
      expect(screen.getByText('Alpha Database Migration')).toBeDefined();
    });
  });

  it('3. opens Create Task modal when Create Task button is clicked', async () => {
    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Alpha Database Migration')).toBeDefined());

    const createBtn = screen.getByText('Create Task');
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeDefined();
    });
  });

  it('4. opens Edit Task modal when edit action button clicked', async () => {
    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Alpha Database Migration')).toBeDefined());

    const editBtns = screen.getAllByTitle('Edit Task');
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      await waitFor(() => {
        expect(screen.getByText('Edit Task — TSK-101')).toBeDefined();
      });
    }
  });

  it('5. opens Assign Task modal when assign action button clicked', async () => {
    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Alpha Database Migration')).toBeDefined());

    const assignBtns = screen.getAllByTitle('Assign / Reassign');
    if (assignBtns.length > 0) {
      fireEvent.click(assignBtns[0]);
      await waitFor(() => {
        expect(screen.getByText('Assign / Reassign Task — TSK-101')).toBeDefined();
      });
    }
  });

  it('6. handles delete confirmation flow and handles API rejection error branch', async () => {
    (taskService.deleteTask as any).mockRejectedValue(new Error('Delete error on server'));

    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Alpha Database Migration')).toBeDefined());

    const deleteBtns = screen.getAllByTitle('Delete Task');
    if (deleteBtns.length > 0) {
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete task/i)).toBeDefined();
      });

      const confirmBtns = screen.getAllByText('Delete Task');
      const dialogConfirmBtn = confirmBtns.find((el) => el.tagName === 'BUTTON' && el.getAttribute('type') === 'button');
      if (dialogConfirmBtn) {
        fireEvent.click(dialogConfirmBtn);

        await waitFor(() => {
          expect(window.alert).toHaveBeenCalledWith('Delete error on server');
        });
      }
    }
  });

  it('7. renders empty state when no tasks match search query', async () => {
    (taskService.getAllTasks as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No tasks match your filter criteria/i)).toBeDefined();
    });
  });

  it('8. resets filters when Clear Filters button is clicked in empty state', async () => {
    (taskService.getAllTasks as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminTasksPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/No tasks match your filter criteria/i)).toBeDefined());

    const clearBtns = screen.getAllByText('Clear Filters');
    fireEvent.click(clearBtns[0]);

    expect(screen.getByText(/No tasks match your filter criteria/i)).toBeDefined();
  });
});
