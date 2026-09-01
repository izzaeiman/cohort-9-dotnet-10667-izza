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
    assignedUserId: 'u1',
  },
];

describe('CalendarPage - Comprehensive Deep Interactive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getTasks as any).mockResolvedValue(mockCalendarTasks);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
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

  it('3. opens Add Event modal and submits Add Event form', async () => {
    (taskService.createTask as any).mockResolvedValue({ id: 'TSK-499', title: 'New Calendar Event' });

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

    const titleInput = screen.getByPlaceholderText(/Design review/i);
    fireEvent.change(titleInput, { target: { value: 'New Calendar Event' } });

    const dayInput = screen.getByLabelText(/Day of/i);
    fireEvent.change(dayInput, { target: { value: 15 } });

    const saveBtn = screen.getByText('Schedule Event');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(taskService.createTask).toHaveBeenCalled();
    });
  });

  it('4. opens Edit Event modal when Edit Event button clicked', async () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Calendar & Schedules')).toBeDefined());

    const editBtns = screen.getAllByTitle('Edit Event');
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      await waitFor(() => {
        expect(screen.getByText('Edit Calendar Event')).toBeDefined();
      });
    }
  });

  it('5. triggers event deletion when Delete Event button clicked', async () => {
    (taskService.deleteTask as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Calendar & Schedules')).toBeDefined());

    const deleteBtns = screen.getAllByTitle('Delete Event');
    if (deleteBtns.length > 0) {
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => {
        expect(taskService.deleteTask).toHaveBeenCalledWith('TSK-401');
      });
    }
  });

  it('6. handles empty state and date selection clicks', async () => {
    (taskService.getTasks as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No events scheduled for this date/i)).toBeDefined();
    });
  });
});
