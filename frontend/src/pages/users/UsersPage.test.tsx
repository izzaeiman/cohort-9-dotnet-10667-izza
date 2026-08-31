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
    id: 'u-10',
    name: 'Alice Cooper',
    email: 'alice@example.com',
    role: 'Administrator',
    department: 'Engineering',
    phone: '+1 555-0199',
    status: 'active',
    avatar: 'https://i.pravatar.cc/150?img=1',
    tasksAssigned: 4,
    lastActive: '2 hours ago',
  },
  {
    id: 'u-20',
    name: 'Bob Marley',
    email: 'bob@example.com',
    role: 'Regular User',
    department: 'Design',
    phone: '+1 555-0200',
    status: 'pending',
    avatar: 'https://i.pravatar.cc/150?img=2',
    tasksAssigned: 1,
    lastActive: '1 day ago',
  },
];

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (userService.getUsers as any).mockResolvedValue(mockUsers);
  });

  it('renders users list on initial load', async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Cooper')).toBeDefined();
      expect(screen.getByText('Bob Marley')).toBeDefined();
    });
  });

  it('filters users by search query', async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Alice Cooper')).toBeDefined());

    const searchInput = screen.getByPlaceholderText('Search name or email...');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    await waitFor(() => {
      expect(screen.getByText('Alice Cooper')).toBeDefined();
      expect(screen.queryByText('Bob Marley')).toBeNull();
    });
  });

  it('opens Invite New User modal when button is clicked', async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Alice Cooper')).toBeDefined());

    const inviteBtn = screen.getByText('Invite User');
    fireEvent.click(inviteBtn);

    await waitFor(() => {
      expect(screen.getByText('Invite Team Member')).toBeDefined();
    });
  });

  it('displays error message when userService fails', async () => {
    (userService.getUsers as any).mockRejectedValue(new Error('Failed to fetch users'));

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load users/i)).toBeDefined();
    });
  });
});
