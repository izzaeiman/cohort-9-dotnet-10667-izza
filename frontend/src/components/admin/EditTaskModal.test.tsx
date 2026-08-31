import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditTaskModal } from './EditTaskModal';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import React from 'react';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u-1', name: 'User A', role: 'Administrator' }, isAdmin: () => true }),
  default: () => ({ user: { id: 'u-1', name: 'User A', role: 'Administrator' }, isAdmin: () => true }),
}));

vi.mock('../../services/taskService', () => ({
  taskService: {
    updateTask: vi.fn(),
    getProgressEntries: vi.fn(() => Promise.resolve([])),
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

const mockTask = {
  id: 'TSK-99',
  title: 'Edit Me Task',
  description: 'Description to update',
  priority: 'high',
  category: 'Frontend',
  status: 'pending',
  dueDate: '2026-12-01',
  assignedUser: 'User A',
  assignedUserId: 'u-1',
  project: 'P-1',
  projectId: 'p-1',
  startDate: '2026-09-01',
  startTime: '09:00 AM',
  dueTime: '05:00 PM',
  createdDate: '2026-08-01',
  lastModified: '2026-08-01',
  assignees: [],
  comments: [],
  attachments: [],
};

describe('EditTaskModal', () => {
  const handleClose = vi.fn();
  const handleSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal content when open with task data', () => {
    render(<EditTaskModal isOpen={true} task={mockTask as any} onClose={handleClose} onSuccess={handleSuccess} />);
    expect(screen.getByText(/Edit Task/i)).toBeDefined();
  });

  it('does not render content when closed or null task', () => {
    render(<EditTaskModal isOpen={false} task={null} onClose={handleClose} onSuccess={handleSuccess} />);
    expect(screen.queryByText(/Edit Task/i)).toBeNull();
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<EditTaskModal isOpen={true} task={mockTask as any} onClose={handleClose} onSuccess={handleSuccess} />);
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
