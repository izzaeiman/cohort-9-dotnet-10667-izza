import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import React from 'react';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div data-testid="pie-chart" />,
  Cell: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div data-testid="bar-chart" />,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div data-testid="area-chart" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
}));

vi.mock('../../services/taskService', () => ({
  taskService: {
    getAllTasks: vi.fn(),
    deleteTask: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock('../../services/userService', () => ({
  userService: {
    getUsers: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    user: { id: 'u-admin', name: 'System', role: 'Administrator' },
    isAdmin: () => true,
  }),
}));

vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
  default: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

const mockTasks = [
  {
    id: 'TSK-500',
    title: 'Admin Dashboard Overview Task',
    description: 'System metrics review',
    priority: 'high',
    category: 'Backend',
    status: 'in_progress',
    dueDate: '2026-10-01',
    assignedUser: 'System Admin',
    assignedUserId: 'u-admin',
    project: 'Core Platform',
    projectId: 'p10',
    startDate: '2026-09-01',
    startTime: '09:00 AM',
    dueTime: '05:00 PM',
    createdDate: '2026-08-01',
    lastModified: '2026-08-01',
    assignees: [],
    comments: [],
    attachments: [],
  },
];

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getAllTasks as any).mockResolvedValue(mockTasks);
  });

  it('renders admin dashboard stats and task table', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Admin Overview/i)).toBeDefined();
    });
  });

  it('opens Create Task modal when Create Task button is clicked', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Admin Overview/i)).toBeDefined());

    const createBtns = screen.getAllByText('Create Task');
    fireEvent.click(createBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeDefined();
    });
  });

  it('renders cleanly when taskService returns empty tasks', async () => {
    (taskService.getAllTasks as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Admin Overview/i)).toBeDefined();
    });
  });

  it('handles empty response state gracefully', async () => {
    (taskService.getAllTasks as any).mockResolvedValue([]);

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
