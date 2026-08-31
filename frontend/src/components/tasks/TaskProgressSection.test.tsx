import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskProgressSection } from './TaskProgressSection';
import { taskService } from '../../services/taskService';
import React from 'react';

vi.mock('../../services/taskService', () => ({
  taskService: {
    getProgressEntries: vi.fn(),
    addProgressEntry: vi.fn(),
    updateProgressEntry: vi.fn(),
    deleteProgressEntry: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Author User', role: 'Administrator' }, isAdmin: () => true }),
  default: () => ({ user: { id: 'u1', name: 'Author User', role: 'Administrator' }, isAdmin: () => true }),
}));

const mockEntries = [
  {
    id: 101,
    taskId: 55,
    userId: 'u1',
    userName: 'Author User',
    description: 'Initial analysis completed',
    createdAt: '2026-09-01T10:00:00Z',
  },
];

describe('TaskProgressSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    (taskService.getProgressEntries as any).mockResolvedValue(mockEntries);
  });

  it('renders progress entries list on load', async () => {
    render(<TaskProgressSection taskId={55} />);

    await waitFor(() => {
      expect(screen.getByText('Initial analysis completed')).toBeDefined();
    });
  });

  it('adds a new progress update via form submission', async () => {
    (taskService.addProgressEntry as any).mockResolvedValue({ id: 102 });

    render(<TaskProgressSection taskId={55} />);

    await waitFor(() => expect(screen.getByText('Initial analysis completed')).toBeDefined());

    const input = screen.getByPlaceholderText(/What did you accomplish/i);
    fireEvent.change(input, { target: { value: 'Implemented unit tests' } });

    const submitBtn = screen.getByText('Save Progress');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(taskService.addProgressEntry).toHaveBeenCalledWith(55, 'Implemented unit tests');
    });
  });

  it('triggers edit mode when edit button is clicked', async () => {
    render(<TaskProgressSection taskId={55} />);

    await waitFor(() => expect(screen.getByText('Initial analysis completed')).toBeDefined());

    const editBtn = screen.getByTitle('Edit entry');
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeDefined();
      expect(screen.getByText('Cancel')).toBeDefined();
    });
  });

  it('deletes progress entry when delete button is clicked', async () => {
    (taskService.deleteProgressEntry as any).mockResolvedValue({});

    render(<TaskProgressSection taskId={55} />);

    await waitFor(() => expect(screen.getByText('Initial analysis completed')).toBeDefined());

    const deleteBtn = screen.getByTitle('Delete entry');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(taskService.deleteProgressEntry).toHaveBeenCalledWith(55, 101);
    });
  });
});
