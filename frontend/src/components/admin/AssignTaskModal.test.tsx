import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssignTaskModal } from './AssignTaskModal';
import { userService } from '../../services/userService';
import { taskService } from '../../services/taskService';
import type { DetailedTaskItem } from '../../data/tasks';
import React from 'react';

vi.mock('../../services/userService', () => ({
  userService: {
    getUsers: vi.fn(),
  },
}));

vi.mock('../../services/taskService', () => ({
  taskService: {
    assignTask: vi.fn(),
  },
}));

const mockUsers = [
  { id: 'u1', name: 'Alice Admin', role: 'Administrator' },
  { id: 'u2', name: 'Bob Developer', role: 'Regular User' },
];

const mockTask: DetailedTaskItem = {
  id: 'TSK-301',
  title: 'Implement Security OAuth Flow',
  description: 'Add OAuth 2.0 PKCE support',
  category: 'Backend',
  priority: 'critical',
  status: 'pending',
  assignedUser: 'Unassigned',
  assignedUserId: '',
  project: 'Core Dashboard',
  projectId: 'p1',
  startDate: '2026-09-01',
  startTime: '09:00 AM',
  dueDate: '2026-09-15',
  dueTime: '05:00 PM',
  timeLimit: 7,
  createdDate: '2026-09-01',
  lastModified: '2026-09-01',
  comments: [],
  attachments: [],
  assignees: [],
};

describe('AssignTaskModal - Standalone Component Test Suite', () => {
  const defaultProps = {
    isOpen: true,
    task: mockTask,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (userService.getUsers as any).mockResolvedValue(mockUsers);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('1. renders task target title and populates user options', async () => {
    render(<AssignTaskModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Implement Security OAuth Flow')).toBeDefined();
      expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined();
    });
  });

  it('2. validates user selection and blocks submission when unassigned', async () => {
    render(<AssignTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined());

    const submitBtn = screen.getByText('Confirm Assignment');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Please select a user to assign.')).toBeDefined();
    });

    expect(taskService.assignTask).not.toHaveBeenCalled();
  });

  it('3. executes successful assignment submit path', async () => {
    (taskService.assignTask as any).mockResolvedValue({ ...mockTask, assignedUserId: 'u2' });

    render(<AssignTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined());

    const userSelect = screen.getByRole('combobox');
    fireEvent.change(userSelect, { target: { value: 'u2' } });

    const submitBtn = screen.getByText('Confirm Assignment');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(taskService.assignTask).toHaveBeenCalledWith(
        'TSK-301',
        'u2',
        '2026-09-01',
        '09:00 AM',
        '2026-09-15',
        '05:00 PM',
        expect.anything()
      );
    });

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('4. handles cancel button click without calling assignTask API', async () => {
    render(<AssignTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined());

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(taskService.assignTask).not.toHaveBeenCalled();
  });

  it('5. displays alert error and keeps modal open on API submit rejection', async () => {
    (taskService.assignTask as any).mockRejectedValue(new Error('Assignment API failed'));

    render(<AssignTaskModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Alice Admin (Administrator)')).toBeDefined());

    const userSelect = screen.getByRole('combobox');
    fireEvent.change(userSelect, { target: { value: 'u2' } });

    const submitBtn = screen.getByText('Confirm Assignment');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Assignment API failed');
    });

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});
