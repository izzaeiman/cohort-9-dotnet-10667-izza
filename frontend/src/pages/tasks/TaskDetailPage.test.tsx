import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TaskDetailPage } from './TaskDetailPage';
import { taskService } from '../../services/taskService';
import React from 'react';

vi.mock('../../services/taskService', () => ({
  taskService: {
    getTaskById: vi.fn(),
    deleteTask: vi.fn(),
    addComment: vi.fn(),
    getProgressEntries: vi.fn(() => Promise.resolve([])),
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    user: { id: 'u1', name: 'Task Owner', role: 'Administrator' },
    isAdmin: () => true,
  }),
}));

const mockTask = {
  id: '7024',
  title: 'Detailed Task 7024',
  description: 'Full detail page test task',
  priority: 'high',
  category: 'Backend',
  status: 'in_progress',
  dueDate: '2026-12-01',
  assignedUser: 'Task Owner',
  assignedUserId: 'u1',
  project: 'Core Backend',
  projectId: 'p10',
  startDate: '2026-09-01',
  startTime: '09:00 AM',
  dueTime: '05:00 PM',
  createdDate: '2026-08-01',
  lastModified: '2026-08-01',
  assignees: [],
  comments: [],
  attachments: [],
};

describe('TaskDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getTaskById as any).mockResolvedValue(mockTask);
  });

  it('renders task details on load', async () => {
    render(
      <MemoryRouter initialEntries={['/tasks/7024']}>
        <Routes>
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Detailed Task 7024')).toBeDefined();
      expect(screen.getByText('Full detail page test task')).toBeDefined();
    });
  });

  it('displays not found state when task is missing', async () => {
    (taskService.getTaskById as any).mockRejectedValue(new Error('Not found'));

    render(
      <MemoryRouter initialEntries={['/tasks/9999']}>
        <Routes>
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Task Not Found/i)).toBeDefined();
    });
  });
});
