import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateTaskModal } from './CreateTaskModal';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import React from 'react';

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
    createTask: vi.fn(),
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

describe('CreateTaskModal - Standalone Component Test Suite', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (userService.getUsers as any).mockResolvedValue(mockUsers);
    (projectService.getProjects as any).mockResolvedValue(mockProjects);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('1. populates user and project dropdowns from service calls', async () => {
    render(<CreateTaskModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined();
      expect(screen.getByText('Core Dashboard')).toBeDefined();
    });
  });

  it('2. validates required fields and blocks submission when empty', async () => {
    render(<CreateTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined());

    const submitBtn = screen.getByText('Create Task');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Task title is required.')).toBeDefined();
      expect(screen.getByText('Task description is required.')).toBeDefined();
      expect(screen.getByText('Assigned user is required.')).toBeDefined();
      expect(screen.getByText('Project is required.')).toBeDefined();
    });

    expect(taskService.createTask).not.toHaveBeenCalled();
  });

  it('3. validates date range (rejects due date before start date)', async () => {
    render(<CreateTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined());

    fireEvent.change(screen.getByLabelText(/Task Title \*/i), { target: { value: 'Valid Title' } });
    fireEvent.change(screen.getByPlaceholderText(/Detailed description/i), { target: { value: 'Valid Description' } });
    fireEvent.change(screen.getByLabelText(/Assigned User \*/i), { target: { value: 'u1' } });
    fireEvent.change(screen.getByLabelText(/Project \*/i), { target: { value: 'p1' } });

    fireEvent.change(screen.getByLabelText(/Start Date \*/i), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText(/Due Date \*/i), { target: { value: '2026-09-05' } });

    const submitBtn = screen.getByText('Create Task');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Due Date cannot be before Start Date.')).toBeDefined();
    });

    expect(taskService.createTask).not.toHaveBeenCalled();
  });

  it('4. executes successful submit path and calls onSuccess and onClose', async () => {
    (taskService.createTask as any).mockResolvedValue({ id: 'TSK-999', title: 'New Task' });

    render(<CreateTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined());

    fireEvent.change(screen.getByLabelText(/Task Title \*/i), { target: { value: 'Build New Feature' } });
    fireEvent.change(screen.getByPlaceholderText(/Detailed description/i), { target: { value: 'Build amazing feature' } });
    fireEvent.change(screen.getByLabelText(/Assigned User \*/i), { target: { value: 'u1' } });
    fireEvent.change(screen.getByLabelText(/Project \*/i), { target: { value: 'p1' } });

    const submitBtn = screen.getByText('Create Task');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(taskService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Build New Feature',
          description: 'Build amazing feature',
          assignedUserId: 'u1',
          projectId: 'p1',
        })
      );
    });

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('5. handles cancel/close button click without submitting form', async () => {
    render(<CreateTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined());

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(taskService.createTask).not.toHaveBeenCalled();
  });

  it('6. displays alert error and keeps modal open on API submit rejection', async () => {
    (taskService.createTask as any).mockRejectedValue(new Error('Server error creating task'));

    render(<CreateTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined());

    fireEvent.change(screen.getByLabelText(/Task Title \*/i), { target: { value: 'Valid Title' } });
    fireEvent.change(screen.getByPlaceholderText(/Detailed description/i), { target: { value: 'Valid Description' } });
    fireEvent.change(screen.getByLabelText(/Assigned User \*/i), { target: { value: 'u1' } });
    fireEvent.change(screen.getByLabelText(/Project \*/i), { target: { value: 'p1' } });

    const submitBtn = screen.getByText('Create Task');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Server error creating task');
    });

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('7. renders error message and handles retry when user loading fails', async () => {
    (userService.getUsers as any).mockRejectedValueOnce(new Error('Network error'));

    render(<CreateTaskModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load users. Please try again.')).toBeDefined();
    });

    (userService.getUsers as any).mockResolvedValue(mockUsers);
    const retryBtn = screen.getByText('Retry');
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined();
    });
  });
});
