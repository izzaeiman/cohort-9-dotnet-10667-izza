import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthContext } from '../../context/AuthContextInstance';
import React from 'react';
import type { AuthUser } from '../../services/authService';

const makeAuthUser = (role: 'Administrator' | 'Regular User'): AuthUser => ({
  id: 'usr-1', name: 'Test User', email: 'test@example.com', role, avatar: '',
});

const makeContextValue = (user: AuthUser | null) => ({
  user,
  isAuthenticated: !!user,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  hasRole: (role: string) => user?.role === role,
  isAdmin: () => user?.role === 'Administrator',
  isMember: () => user?.role === 'Regular User',
  updateUserAvatar: vi.fn(),
});

const renderWithRouter = (contextValue: any, initialEntry: string, requiredRole?: 'Administrator' | 'Regular User') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthContext.Provider value={contextValue}>
        <Routes>
          <Route element={<ProtectedRoute requiredRole={requiredRole} />}>
            <Route path="/dashboard" element={<div>Member Dashboard</div>} />
            <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    renderWithRouter(makeContextValue(null), '/dashboard');
    expect(screen.getByText('Login Page')).toBeDefined();
  });

  it('allows regular user to access member dashboard', () => {
    renderWithRouter(makeContextValue(makeAuthUser('Regular User')), '/dashboard', 'Regular User');
    expect(screen.getByText('Member Dashboard')).toBeDefined();
  });

  it('redirects regular user to /dashboard when accessing admin route', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AuthContext.Provider value={makeContextValue(makeAuthUser('Regular User'))}>
          <Routes>
            <Route element={<ProtectedRoute requiredRole="Administrator" />}>
              <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
            </Route>
            <Route path="/dashboard" element={<div>Member Dashboard Redirect</div>} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByText('Member Dashboard Redirect')).toBeDefined();
  });

  it('redirects admin to /admin/dashboard when accessing member-only route', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthContext.Provider value={makeContextValue(makeAuthUser('Administrator'))}>
          <Routes>
            <Route element={<ProtectedRoute requiredRole="Regular User" />}>
              <Route path="/dashboard" element={<div>Member Dashboard</div>} />
            </Route>
            <Route path="/admin/dashboard" element={<div>Admin Dashboard Redirect</div>} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByText('Admin Dashboard Redirect')).toBeDefined();
  });

  it('renders children prop directly when provided', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthContext.Provider value={makeContextValue(makeAuthUser('Regular User'))}>
          <ProtectedRoute>
            <div>Direct Child</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByText('Direct Child')).toBeDefined();
  });
});
