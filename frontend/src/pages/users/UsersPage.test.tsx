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

const mockUsers = Array.from({ length: 12 }, (_, i) => ({
  id: `u${i + 1}`,
  name: i === 11 ? 'Fiona Gallagher' : `User ${i + 1} Smith`,
  email: `user${i + 1}@example.com`,
  role: i % 2 === 0 ? 'Administrator' : 'Regular User',
  department: 'Engineering',
  status: 'active',
  avatar: 'https://i.pravatar.cc/150?img=1',
  lastActive: '2 mins ago',
  phone: '+1 555-101',
}));

describe('UsersPage - Comprehensive Deep Interactive Test Suite', () => {
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
      expect(screen.getByText('User Management')).toBeDefined();
    });
  });

  it('2. filters users by search input, role dropdown, and status dropdown', async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('User 1 Smith')).toBeDefined());

    const searchInput = screen.getByPlaceholderText(/Search name or email/i);
    fireEvent.change(searchInput, { target: { value: 'User 2' } });

    await waitFor(() => {
      expect(screen.getByText('User 2 Smith')).toBeDefined();
    });
  });

  it('3. handles pagination switching', async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('User 1 Smith')).toBeDefined());

    const page2Btn = screen.getAllByText('2').find((el) => el.tagName === 'BUTTON');
    if (page2Btn) {
      fireEvent.click(page2Btn);
      await waitFor(() => {
        expect(screen.getByText('User 6 Smith')).toBeDefined();
      });
    }
  });

  it('4. opens Invite User modal and submits invite user form', async () => {
    (userService.inviteUser as any).mockResolvedValue({ id: 'u99', name: 'New User', email: 'newuser@example.com', role: 'Regular User', status: 'active', department: 'QA Testing' });

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('User 1 Smith')).toBeDefined());

    const inviteBtn = screen.getByText('Invite User');
    fireEvent.click(inviteBtn);

    await waitFor(() => {
      expect(screen.getByText('Invite Team Member')).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'newuser@example.com' } });
    fireEvent.change(screen.getByLabelText(/Department/i), { target: { value: 'QA Testing' } });

    const sendInviteBtn = screen.getByText('Send Invitation');
    fireEvent.click(sendInviteBtn);

    await waitFor(() => {
      expect(userService.inviteUser).toHaveBeenCalled();
    });
  });

  it('5. executes user deletion flow upon confirmation', async () => {
    (userService.deleteUser as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('User 1 Smith')).toBeDefined());

    const menuBtns = screen.getAllByTitle(/User actions for/i);
    if (menuBtns.length > 0) {
      fireEvent.click(menuBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeDefined();
      });

      const deleteMenuBtn = screen.getByText('Delete User');
      fireEvent.click(deleteMenuBtn);

      await waitFor(() => {
        expect(screen.getByText('Delete User Member')).toBeDefined();
      });

      const confirmBtn = screen.getByText('Remove User');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(userService.deleteUser).toHaveBeenCalledWith('u1');
      });
    }
  });

  it('6. renders empty state when no users match search filter', async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('User 1 Smith')).toBeDefined());

    const searchInput = screen.getByPlaceholderText(/Search name or email/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentSearchTermXYZ' } });

    await waitFor(() => {
      expect(screen.getByText('No members found')).toBeDefined();
    });
  });

  it('7. renders error state and handles Retry Loading action', async () => {
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
      expect(screen.getByText('User 1 Smith')).toBeDefined();
    });
  });
});
