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
    getProgressEntries: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    user: { id: 'u1', name: 'Project Admin', role: 'Administrator' },
    isAdmin: () => true,
  }),
}));

const mockProjects = [
  {
    id: 'proj-1',
    name: 'Cloud Infrastructure Upgrade',
    description: 'Migrate servers to AWS Kubernetes',
    category: 'Backend',
    status: 'in_progress',
    progress: 65,
    completedTasks: 13,
    totalTasks: 20,
    dueDate: '2026-11-30',
    leadUserId: 'u1',
    leadUserName: 'Project Admin',
    team: ['Project Admin'],
  },
  {
    id: 'proj-2',
    name: 'Mobile App Redesign',
    description: 'UI UX overhaul for iOS and Android',
    category: 'UiUxDesign',
    status: 'planning',
    progress: 10,
    completedTasks: 1,
    totalTasks: 10,
    dueDate: '2026-12-15',
    leadUserId: 'u1',
    leadUserName: 'Project Admin',
    team: ['Project Admin'],
  },
];

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (projectService.getProjects as any).mockResolvedValue(mockProjects);
  });

  it('renders projects grid on initial load', async () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Cloud Infrastructure Upgrade')).toBeDefined();
      expect(screen.getByText('Mobile App Redesign')).toBeDefined();
    });
  });

  it('filters projects when search input changes', async () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Cloud Infrastructure Upgrade')).toBeDefined());

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Cloud' } });

    await waitFor(() => {
      expect(screen.getByText('Cloud Infrastructure Upgrade')).toBeDefined();
      expect(screen.queryByText('Mobile App Redesign')).toBeNull();
    });
  });

  it('opens Create Project modal when Add Project button clicked', async () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Cloud Infrastructure Upgrade')).toBeDefined());

    const addBtn = screen.getByText('New Project');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeDefined();
    });
  });

  it('displays error message when projectService fails', async () => {
    (projectService.getProjects as any).mockRejectedValue(new Error('Network error loading projects'));

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load projects/i)).toBeDefined();
    });
  });
});
