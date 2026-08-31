import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectProgressSection } from './ProjectProgressSection';
import { projectService } from '../../services/projectService';
import React from 'react';

vi.mock('../../services/projectService', () => ({
  projectService: {
    getProgressEntries: vi.fn(),
    addProgressEntry: vi.fn(),
    updateProgressEntry: vi.fn(),
    deleteProgressEntry: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Lead User', role: 'Administrator' }, isAdmin: () => true }),
  default: () => ({ user: { id: 'u1', name: 'Lead User', role: 'Administrator' }, isAdmin: () => true }),
}));

const mockEntries = [
  {
    id: 201,
    projectId: 'p-88',
    userId: 'u1',
    userName: 'Lead User',
    description: 'Project kick-off milestone reached',
    createdAt: '2026-09-01T10:00:00Z',
  },
];

describe('ProjectProgressSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    (projectService.getProgressEntries as any).mockResolvedValue(mockEntries);
  });

  it('renders project progress entries list on load', async () => {
    render(<ProjectProgressSection projectId="p-88" />);

    await waitFor(() => {
      expect(screen.getByText('Project kick-off milestone reached')).toBeDefined();
    });
  });

  it('adds a new project progress update via form submission', async () => {
    (projectService.addProgressEntry as any).mockResolvedValue({ id: 202 });

    render(<ProjectProgressSection projectId="p-88" />);

    await waitFor(() => expect(screen.getByText('Project kick-off milestone reached')).toBeDefined());

    const input = screen.getByPlaceholderText(/Add a project update/i);
    fireEvent.change(input, { target: { value: 'Completed sprint 1' } });

    const submitBtn = screen.getByText('Save Progress');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(projectService.addProgressEntry).toHaveBeenCalledWith('p-88', 'Completed sprint 1');
    });
  });

  it('triggers edit mode when edit button is clicked', async () => {
    render(<ProjectProgressSection projectId="p-88" />);

    await waitFor(() => expect(screen.getByText('Project kick-off milestone reached')).toBeDefined());

    const editBtn = screen.getByTitle('Edit entry');
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeDefined();
      expect(screen.getByText('Cancel')).toBeDefined();
    });
  });

  it('deletes progress entry when delete button is clicked', async () => {
    (projectService.deleteProgressEntry as any).mockResolvedValue({});

    render(<ProjectProgressSection projectId="p-88" />);

    await waitFor(() => expect(screen.getByText('Project kick-off milestone reached')).toBeDefined());

    const deleteBtn = screen.getByTitle('Delete entry');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(projectService.deleteProgressEntry).toHaveBeenCalledWith('p-88', 201);
    });
  });
});
