import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UsersPage } from './UsersPage';
import { userService } from '../../services/userService';
import React from 'react';

vi.mock('../../services/userService', () => ({
  userService: {
    getUsers: vi.fn(),
    inviteUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

const mockUsers = [
  {
    id: 'u1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: 'Administrator',
    department: 'Software Engineering',
    status: 'active',
    avatar: 'https://i.pravatar.cc/150?img=1',
    lastActive: '2 mins ago',
    phone: '+1 (555) 123-4567',
  },
  {
    id: 'u2',
    name: 'Bob Jones',
    email: 'bob@example.com',
    role: 'Regular User',
    department: 'Product Management',
    status: 'offline',
    avatar: 'https://i.pravatar.cc/150?img=2',
    lastActive: '1 day ago',
    phone: '+1 (555) 987-6543',
  },
];

describe('UsersPage - Full Interactive & Error Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (userService.getUsers as any).mockResolvedValue(mockUsers);
  });

  it('1. renders user management page with stats and table', async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeDefined();
      expect(screen.getByText('User Management')).toBeDefined();
    });
  });

  it('2. triggers search input filtering', async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeDefined());

    const searchInput = screen.getByPlaceholderText(/Search name or email/i);
    fireEvent.change(searchInput, { target: { value: 'Bob' } });

    await waitFor(() => {
      expect(screen.getByText('Bob Jones')).toBeDefined();
    });
  });

  it('3. opens Invite User modal when button clicked', async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeDefined());

    const inviteBtn = screen.getByText('Invite User');
    fireEvent.click(inviteBtn);

    await waitFor(() => {
      expect(screen.getByText('Invite Team Member')).toBeDefined();
    });
  });

  it('4. executes user deletion flow upon confirmation', async () => {
    (userService.deleteUser as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeDefined());

    const actionBtns = screen.getAllByTitle(/User actions for/i);
    fireEvent.click(actionBtns[0]);

    await waitFor(() => expect(screen.getByText('Delete User')).toBeDefined());
    fireEvent.click(screen.getByText('Delete User'));

    await waitFor(() => expect(screen.getByText('Remove User')).toBeDefined());
    fireEvent.click(screen.getByText('Remove User'));

    await waitFor(() => {
      expect(userService.deleteUser).toHaveBeenCalledWith('u1');
    });
  });

  it('5. renders error state and handles retry button', async () => {
    (userService.getUsers as any).mockRejectedValue(new Error('Network error loading users'));

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load users/i)).toBeDefined();
      expect(screen.getByText('Retry Loading')).toBeDefined();
    });

    (userService.getUsers as any).mockResolvedValue(mockUsers);
    const retryBtn = screen.getByText('Retry Loading');
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeDefined();
    });
  });
});
