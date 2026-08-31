import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import React from 'react';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'admin1', name: 'Admin Lead', role: 'Administrator' } }),
  default: () => ({ user: { id: 'admin1', name: 'Admin Lead', role: 'Administrator' } }),
}));

vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
  default: () => ({ theme: 'light', toggleTheme: vi.fn() }),
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
    getUsers: vi.fn(() => Promise.resolve([{ id: 'u1', name: 'Alice Smith' }, { id: 'u2', name: 'Bob Jones' }])),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
}));

const mockTasks = [
  {
    id: 'TSK-301',
    title: 'Database Index Optimization',
    description: 'Optimize PostgreSQL query performance',
    priority: 'critical',
    category: 'Database',
    status: 'overdue',
    dueDate: '2026-08-01',
    assignedUser: 'Alice Smith',
    assignedUserId: 'u1',
    project: 'SaaS Tool',
    projectId: 'p1',
    startDate: '2026-07-01',
    startTime: '09:00 AM',
    dueTime: '05:00 PM',
    createdDate: '2026-07-01',
    lastModified: '2026-07-01',
    assignees: [],
    comments: [],
    attachments: [],
  },
];

describe('AdminDashboardPage - Full Interactive & Error Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (taskService.getAllTasks as any).mockResolvedValue(mockTasks);
  });

  it('1. renders admin dashboard stats and overdue warning banner', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Reassign Task')).toBeDefined();
    });
  });

  it('2. triggers quick action buttons properly', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Reassign Task')).toBeDefined());

    const quickActionBtns = screen.getAllByText('Create Task');
    expect(quickActionBtns.length).toBeGreaterThan(0);
    fireEvent.click(quickActionBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeDefined();
    });
  });

  it('3. opens Reassign modal when reassign button on overdue card is clicked', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Reassign Task')).toBeDefined());

    const reassignBtn = screen.getByText('Reassign Task');
    fireEvent.click(reassignBtn);

    await waitFor(() => {
      expect(screen.getByText(/Assign \/ Reassign Task/i)).toBeDefined();
    });
  });

  it('4. renders header action buttons correctly', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Create Task').length).toBeGreaterThan(0);
    });
  });

  it('5. handles empty API state gracefully without crashing', async () => {
    (taskService.getAllTasks as any).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Tasks')).toBeDefined();
    });
  });
});
