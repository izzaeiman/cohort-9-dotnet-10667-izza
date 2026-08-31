import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateTaskModal } from './CreateTaskModal';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import React from 'react';

vi.mock('../../services/taskService', () => ({
  taskService: {
    createTask: vi.fn(),
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

describe('CreateTaskModal', () => {
  const handleClose = vi.fn();
  const handleSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal content when open', () => {
    render(<CreateTaskModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />);
    expect(screen.getByText('Create New Task')).toBeDefined();
  });

  it('does not render content when closed', () => {
    render(<CreateTaskModal isOpen={false} onClose={handleClose} onSuccess={handleSuccess} />);
    expect(screen.queryByText('Create New Task')).toBeNull();
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<CreateTaskModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />);
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
