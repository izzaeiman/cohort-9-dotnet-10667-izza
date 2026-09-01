import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditTaskModal } from './EditTaskModal';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import type { DetailedTaskItem } from '../../data/tasks';
import React from 'react';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Admin User' }, isAdmin: () => true }),
  default: () => ({ user: { id: 'u1', name: 'Admin User' }, isAdmin: () => true }),
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

vi.mock('../../services/taskService', () => ({
  taskService: {
    updateTask: vi.fn(),
    getTaskProgress: vi.fn().mockResolvedValue({ totalSubtasks: 0, completedSubtasks: 0, percentage: 0 }),
    getSubtasks: vi.fn().mockResolvedValue([]),
  },
}));

const mockUsers = [
  { id: 'u1', name: 'Alice Admin', role: 'Administrator' },
  { id: 'u2', name: 'Bob Developer', role: 'Regular User' },
];

const mockProjects = [
  { id: 'p1', name: 'Core Dashboard' },
  { id: 'p2', name: 'Mobile App' },
];

const mockTask: DetailedTaskItem = {
  id: 'TSK-201',
  title: 'Fix Database Index Bottleneck',
  description: 'Add composite index for fast querying',
  category: 'Backend',
  priority: 'high',
  status: 'in_progress',
  assignedUser: 'Alice Admin',
  assignedUserId: 'u1',
  project: 'Core Dashboard',
  projectId: 'p1',
  startDate: '2026-09-01',
  startTime: '09:00 AM',
  dueDate: '2026-09-10',
  dueTime: '05:00 PM',
  timeLimit: 5,
  createdDate: '2026-09-01',
  lastModified: '2026-09-01',
  comments: [],
  attachments: [],
  assignees: [],
};

describe('EditTaskModal - Standalone Component Test Suite', () => {
  const defaultProps = {
    isOpen: true,
    task: mockTask,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (userService.getUsers as any).mockResolvedValue(mockUsers);
    (projectService.getProjects as any).mockResolvedValue(mockProjects);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('1. pre-populates form inputs with task prop values', async () => {
    render(<EditTaskModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Fix Database Index Bottleneck')).toBeDefined();
      expect(screen.getByDisplayValue('Add composite index for fast querying')).toBeDefined();
    });
  });

  it('2. validates required fields when cleared and blocks submission', async () => {
    render(<EditTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByDisplayValue('Fix Database Index Bottleneck')).toBeDefined());

    const titleInput = screen.getByDisplayValue('Fix Database Index Bottleneck');
    fireEvent.change(titleInput, { target: { value: '' } });

    const submitBtn = screen.getByText('Save Changes');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Task title is required.')).toBeDefined();
    });

    expect(taskService.updateTask).not.toHaveBeenCalled();
  });

  it('3. validates date range (rejects due date before start date)', async () => {
    render(<EditTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByDisplayValue('Fix Database Index Bottleneck')).toBeDefined());

    fireEvent.change(screen.getByLabelText(/Start Date \*/i), { target: { value: '2026-09-20' } });
    fireEvent.change(screen.getByLabelText(/Due Date \*/i), { target: { value: '2026-09-05' } });

    const submitBtn = screen.getByText('Save Changes');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Due Date cannot be before Start Date.')).toBeDefined();
    });

    expect(taskService.updateTask).not.toHaveBeenCalled();
  });

  it('4. executes successful submit path and calls onSuccess and onClose', async () => {
    (taskService.updateTask as any).mockResolvedValue({ ...mockTask, title: 'Updated Task Title' });

    render(<EditTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByDisplayValue('Fix Database Index Bottleneck')).toBeDefined());

    const titleInput = screen.getByDisplayValue('Fix Database Index Bottleneck');
    fireEvent.change(titleInput, { target: { value: 'Updated Task Title' } });

    const submitBtn = screen.getByText('Save Changes');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(taskService.updateTask).toHaveBeenCalledWith(
        'TSK-201',
        expect.objectContaining({
          title: 'Updated Task Title',
        })
      );
    });

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('5. handles cancel/close button click without submitting form', async () => {
    render(<EditTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByDisplayValue('Fix Database Index Bottleneck')).toBeDefined());

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(taskService.updateTask).not.toHaveBeenCalled();
  });

  it('6. displays alert error and keeps modal open on API submit rejection', async () => {
    (taskService.updateTask as any).mockRejectedValue(new Error('Update failed on server'));

    render(<EditTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByDisplayValue('Fix Database Index Bottleneck')).toBeDefined());

    const submitBtn = screen.getByText('Save Changes');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Update failed on server');
    });

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});
