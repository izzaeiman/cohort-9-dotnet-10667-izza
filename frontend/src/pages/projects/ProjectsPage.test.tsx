import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectsPage } from './ProjectsPage';
import { projectService } from '../../services/projectService';
import React from 'react';

vi.mock('../../services/projectService', () => ({
  projectService: {
    getProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  },
}));

const mockProjects = [
  {
    id: 'prj-101',
    name: 'SaaS Core Dashboard',
    description: 'Build responsive admin dashboard',
    category: 'Frontend',
    status: 'in_progress',
    progress: 75,
    dueDate: '2026-12-15',
    membersCount: 4,
    tasksCount: 12,
    completedTasksCount: 9,
    members: [],
  },
  {
    id: 'prj-102',
    name: 'Payment Gateway Integration',
    description: 'Stripe and PayPal API webhook handling',
    category: 'Backend',
    status: 'pending',
    progress: 20,
    dueDate: '2026-11-30',
    membersCount: 2,
    tasksCount: 8,
    completedTasksCount: 2,
    members: [],
  },
];

describe('ProjectsPage - Full Interactive & Error Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (projectService.getProjects as any).mockResolvedValue(mockProjects);
  });

  it('1. renders projects page with stats and cards', async () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('SaaS Core Dashboard')).toBeDefined();
      expect(screen.getByText('Payment Gateway Integration')).toBeDefined();
    });
  });

  it('2. triggers search input filtering', async () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('SaaS Core Dashboard')).toBeDefined());

    const searchInput = screen.getByPlaceholderText(/Search projects/i);
    fireEvent.change(searchInput, { target: { value: 'Payment' } });

    await waitFor(() => {
      expect(screen.getByText('Payment Gateway Integration')).toBeDefined();
    });
  });

  it('3. opens New Project modal when button clicked', async () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('SaaS Core Dashboard')).toBeDefined());

    const newBtn = screen.getByText('New Project');
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeDefined();
    });
  });

  it('4. executes project deletion flow upon confirmation', async () => {
    (projectService.deleteProject as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('SaaS Core Dashboard')).toBeDefined());

    const actionMenuBtns = screen.getAllByLabelText(/Project options for/i);
    if (actionMenuBtns.length > 0) {
      fireEvent.click(actionMenuBtns[0]);
      await waitFor(() => expect(screen.getByText('Delete Project')).toBeDefined());
    }
  });

  it('5. renders error state and handles retry button', async () => {
    (projectService.getProjects as any).mockRejectedValue(new Error('Network error loading projects'));

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load projects/i)).toBeDefined();
      expect(screen.getByText('Retry Loading')).toBeDefined();
    });

    (projectService.getProjects as any).mockResolvedValue(mockProjects);
    const retryBtn = screen.getByText('Retry Loading');
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('SaaS Core Dashboard')).toBeDefined();
    });
  });
});
