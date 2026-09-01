import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import React from 'react';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Auth User', role: 'Regular User' }, isAuthenticated: true, isAdmin: () => false }),
  default: () => ({ user: { id: 'u1', name: 'Auth User', role: 'Regular User' }, isAuthenticated: true, isAdmin: () => false }),
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

vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
  default: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('../services/taskService', () => ({
  taskService: {
    getAllTasks: vi.fn(() => Promise.resolve([])),
    getTasks: vi.fn(() => Promise.resolve([])),
    subscribe: vi.fn(() => () => {}),
  },
}));

describe('AppRoutes', () => {
  it('renders application routes smoothly', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeDefined();
    });
  });
});
