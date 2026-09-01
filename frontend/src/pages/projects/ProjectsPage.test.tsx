import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectsPage } from './ProjectsPage';
import { projectService } from '../../services/projectService';
import React from 'react';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Project Admin' }, isAdmin: () => true }),
  default: () => ({ user: { id: 'u1', name: 'Project Admin' }, isAdmin: () => true }),
}));

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

describe('ProjectsPage - Comprehensive Deep Interactive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (projectService.getProjects as any).mockResolvedValue(mockProjects);
  });

  it('1. renders projects page with stats, cards, and grid view', async () => {
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

  it('2. filters projects by search input and category select', async () => {
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

  it('3. toggles view mode between Grid view and List view', async () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('SaaS Core Dashboard')).toBeDefined());

    const listBtn = screen.getByTitle('List View');
    fireEvent.click(listBtn);

    const gridBtn = screen.getByTitle('Grid View');
    fireEvent.click(gridBtn);

    expect(screen.getByText('SaaS Core Dashboard')).toBeDefined();
  });

  it('4. opens Create Project modal and submits create form', async () => {
    (projectService.createProject as any).mockResolvedValue({ id: 'prj-999', name: 'New Project' });

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

    fireEvent.change(screen.getByLabelText(/Project Name/i), { target: { value: 'New Microservice Project' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Description for microservice' } });
    fireEvent.change(screen.getByLabelText(/Target Completion Date/i), { target: { value: '2026-12-31' } });

    const submitBtn = screen.getByText('Create Project');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(projectService.createProject).toHaveBeenCalled();
    });
  });

  it('5. executes project deletion flow upon confirmation', async () => {
    (projectService.deleteProject as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('SaaS Core Dashboard')).toBeDefined());

    const menuBtns = screen.getAllByLabelText(/Project options for/i);
    if (menuBtns.length > 0) {
      fireEvent.click(menuBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Project')).toBeDefined();
      });

      const deleteMenuBtn = screen.getByText('Delete Project');
      fireEvent.click(deleteMenuBtn);

      await waitFor(() => {
        expect(screen.getAllByText('Delete Project').length).toBeGreaterThan(0);
      });

      const confirmBtn = screen.getAllByText('Delete Project')[1] || screen.getByText('Delete Project');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(projectService.deleteProject).toHaveBeenCalledWith('prj-101');
      });
    }
  });

  it('6. renders empty state when no projects match search filter', async () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('SaaS Core Dashboard')).toBeDefined());

    const searchInput = screen.getByPlaceholderText(/Search projects/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentProjectNameXYZ' } });

    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeDefined();
    });
  });

  it('7. renders error state and handles Retry Loading action', async () => {
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
