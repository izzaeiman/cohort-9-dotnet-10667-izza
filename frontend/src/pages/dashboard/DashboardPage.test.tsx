import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { taskService } from '../../services/taskService';
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
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'John Doe', role: 'Regular User' }, isAdmin: () => false }),
  default: () => ({ user: { id: 'u1', name: 'John Doe', role: 'Regular User' }, isAdmin: () => false }),
}));

vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
  default: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

const mockTasks = [
  {
    id: 'TSK-10',
    title: 'Regular User Task',
    description: 'Task assigned to John Doe',
    priority: 'medium',
    category: 'Frontend',
    status: 'pending',
    dueDate: '2026-10-15',
    assignedUser: 'John Doe',
    assignedUserId: 'u1',
    project: 'Dashboard App',
    projectId: 'p1',
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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getAllTasks as any).mockResolvedValue(mockTasks);
  });

  it('renders user greeting and dashboard widgets', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeDefined();
    });
  });

  it('handles empty task list cleanly', async () => {
    (taskService.getAllTasks as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeDefined();
    });
  });
});
