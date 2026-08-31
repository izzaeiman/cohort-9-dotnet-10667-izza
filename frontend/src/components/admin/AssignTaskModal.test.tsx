import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssignTaskModal } from './AssignTaskModal';
import { userService } from '../../services/userService';
import { taskService } from '../../services/taskService';
import React from 'react';

vi.mock('../../services/userService', () => ({
  userService: {
    getUsers: vi.fn(() => Promise.resolve([{ id: 'u1', name: 'User 1' }])),
  },
}));

vi.mock('../../services/taskService', () => ({
  taskService: {
    assignTask: vi.fn(),
  },
}));

const mockTask = {
  id: 'TSK-10',
  title: 'Task To Assign',
  description: 'Desc',
  priority: 'high',
  category: 'DevOps',
  status: 'pending',
  dueDate: '2026-12-01',
  assignedUser: 'Unassigned',
  assignedUserId: null,
  project: 'P1',
  projectId: 'p1',
  startDate: '2026-09-01',
  startTime: '09:00 AM',
  dueTime: '05:00 PM',
  createdDate: '2026-08-01',
  lastModified: '2026-08-01',
  assignees: [],
  comments: [],
  attachments: [],
};

describe('AssignTaskModal', () => {
  const handleClose = vi.fn();
  const handleSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal content when open', async () => {
    render(<AssignTaskModal isOpen={true} task={mockTask as any} onClose={handleClose} onSuccess={handleSuccess} />);

    await waitFor(() => {
      expect(screen.getByText(/Assign Task/i)).toBeDefined();
    });
  });

  it('does not render content when closed', () => {
    render(<AssignTaskModal isOpen={false} task={null} onClose={handleClose} onSuccess={handleSuccess} />);
    expect(screen.queryByText(/Assign Task/i)).toBeNull();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    render(<AssignTaskModal isOpen={true} task={mockTask as any} onClose={handleClose} onSuccess={handleSuccess} />);

    await waitFor(() => expect(screen.getByText(/Assign Task/i)).toBeDefined());

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
