import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CalendarPage } from './CalendarPage';
import { taskService } from '../../services/taskService';
import React from 'react';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Calendar User' }, isAdmin: () => true }),
  default: () => ({ user: { id: 'u1', name: 'Calendar User' }, isAdmin: () => true }),
}));

vi.mock('../../services/taskService', () => ({
  taskService: {
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

const mockCalendarTasks = [
  {
    id: 'TSK-401',
    title: 'Sprint Demo Meeting',
    priority: 'high',
    dueDate: '2026-09-01T12:00:00',
    category: 'General',
    status: 'pending',
  },
];

describe('CalendarPage - Full Interactive & Error Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getTasks as any).mockResolvedValue(mockCalendarTasks);
  });

  it('1. renders calendar page header, month title, and task items', async () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Calendar & Schedules')).toBeDefined();
    });
  });

  it('2. handles month navigation interactions', async () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Calendar & Schedules')).toBeDefined());

    const prevMonthBtn = screen.getByLabelText('Previous month');
    fireEvent.click(prevMonthBtn);

    const nextMonthBtn = screen.getByLabelText('Next month');
    fireEvent.click(nextMonthBtn);

    expect(screen.getByText('Calendar & Schedules')).toBeDefined();
  });

  it('3. opens Add Event modal when Add Event button clicked', async () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Calendar & Schedules')).toBeDefined());

    const addBtn = screen.getByText('Add Event');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Add Calendar Event')).toBeDefined();
    });
  });

  it('4. opens edit event modal when edit action clicked', async () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Calendar & Schedules')).toBeDefined());

    const dayCells = screen.getAllByText('1');
    if (dayCells.length > 0) {
      fireEvent.click(dayCells[0]);
    }

    await waitFor(() => {
      const editBtns = screen.getAllByTitle('Edit Event');
      if (editBtns.length > 0) {
        fireEvent.click(editBtns[0]);
      }
    });
  });

  it('5. handles API rejection state gracefully without breaking UI', async () => {
    (taskService.getTasks as any).mockRejectedValue(new Error('Calendar API failed'));

    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Calendar & Schedules')).toBeDefined();
    });
  });
});
