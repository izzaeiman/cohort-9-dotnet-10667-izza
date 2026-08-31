import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CalendarPage } from './CalendarPage';
import { taskService } from '../../services/taskService';
import React from 'react';

vi.mock('../../services/taskService', () => ({
  taskService: {
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    user: { id: 'u1', name: 'Calendar User', role: 'Regular User' },
    isAdmin: () => false,
  }),
}));

const mockCalendarTasks = [
  {
    id: 'TSK-99',
    title: 'Sprint Demo Meeting',
    description: 'Present features to stakeholders',
    priority: 'high',
    category: 'General',
    status: 'pending',
    dueDate: '2026-09-01',
    assignedUser: 'Calendar User',
    assignedUserId: 'u1',
    project: 'Project X',
    projectId: 'p1',
    startDate: '2026-09-01',
    startTime: '09:00 AM',
    dueTime: '05:00 PM',
    createdDate: '2026-09-01',
    lastModified: '2026-09-01',
    assignees: [],
    comments: [],
    attachments: [],
  },
];

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getTasks as any).mockResolvedValue(mockCalendarTasks);
  });

  it('renders calendar page cleanly', () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Calendar & Schedules')).toBeTruthy();
  });

  it('opens Schedule Event modal when Add Event button is clicked', async () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    const addBtn = screen.getByText('Add Event');
    fireEvent.click(addBtn.closest('button') || addBtn);

    await waitFor(() => {
      expect(screen.getByText('Add Calendar Event')).toBeTruthy();
    });
  });

  it('handles empty task response cleanly', () => {
    (taskService.getTasks as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Calendar & Schedules')).toBeTruthy();
  });
});
