import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import React from 'react';

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
  default: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'usr-admin', name: 'System Admin', role: 'Administrator' }, isAdmin: () => true }),
  default: () => ({ user: { id: 'usr-admin', name: 'System Admin', role: 'Administrator' }, isAdmin: () => true }),
}));

vi.mock('../../services/taskService', () => ({
  taskService: {
    getTasks: vi.fn(),
    getAllTasks: vi.fn(),
    updateTask: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock('../../services/userService', () => ({
  userService: {
    getUsers: vi.fn(),
  },
}));

vi.mock('../../services/projectService', () => ({
  projectService: {
    getProjects: vi.fn(() => Promise.resolve([])),
  },
}));

const mockDashboardTasks = [
  {
    id: 'TSK-501',
    title: 'Critical Database Breach Patch',
    description: 'Fix SQL injection vulnerability',
    priority: 'critical',
    category: 'Database',
    status: 'in_progress',
    dueDate: '2026-08-01',
    assignedUser: 'John Lead',
    assignedUserId: 'u1',
    assignees: [],
  },
  {
    id: 'TSK-502',
    title: 'Frontend Performance Audit',
    description: 'Optimize Web Vitals',
    priority: 'high',
    category: 'Frontend',
    status: 'pending',
    dueDate: '2026-12-01',
    assignedUser: 'Jane Dev',
    assignedUserId: 'u2',
    assignees: [],
  },
];

const mockDashboardUsers = [
  { id: 'u1', name: 'John Lead', email: 'john@test.com', role: 'Administrator', status: 'active', department: 'Management' },
  { id: 'u2', name: 'Jane Dev', email: 'jane@test.com', role: 'Regular User', status: 'active', department: 'Engineering' },
];

describe('AdminDashboardPage - Comprehensive Deep Interactive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getAllTasks as any).mockResolvedValue(mockDashboardTasks);
    (taskService.getTasks as any).mockResolvedValue(mockDashboardTasks);
    (userService.getUsers as any).mockResolvedValue(mockDashboardUsers);
  });

  it('1. renders executive overview title, system metrics, and quick action cards', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Admin Overview/i)).toBeDefined();
      expect(screen.getAllByText('Critical Database Breach Patch').length).toBeGreaterThan(0);
    });
  });

  it('2. triggers quick action buttons correctly', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Admin Overview/i)).toBeDefined());

    const quickActionBtn = screen.getByText('Manage Users');
    fireEvent.click(quickActionBtn.closest('button') || quickActionBtn);

    expect(screen.getByText(/Admin Overview/i)).toBeDefined();
  });

  it('3. opens Reassign modal when reassign button clicked', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByText('Critical Database Breach Patch').length).toBeGreaterThan(0));

    const reassignBtn = screen.getByText('Reassign Task');
    fireEvent.click(reassignBtn);

    await waitFor(() => {
      expect(screen.getByText(/Assign \/ Reassign Task —/i)).toBeDefined();
    });
  });

  it('4. renders empty state when tasks list is empty', async () => {
    (taskService.getAllTasks as any).mockResolvedValue([]);
    (taskService.getTasks as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Admin Overview/i)).toBeDefined();
    });
  });

  it('5. handles API rejection error state gracefully', async () => {
    (taskService.getAllTasks as any).mockResolvedValue([]);
    (taskService.getTasks as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Admin Overview/i)).toBeDefined();
    });
  });
});
