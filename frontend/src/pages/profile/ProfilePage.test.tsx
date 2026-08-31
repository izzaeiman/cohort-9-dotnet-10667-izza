import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import { profileService } from '../../services/profileService';
import React from 'react';

vi.mock('../../services/profileService', () => ({
  profileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    user: { id: 'u1', name: 'Profile Test User', email: 'profile@example.com', role: 'Regular User' },
    updateUserAvatar: vi.fn(),
  }),
}));

const mockProfileData = {
  id: 'u1',
  name: 'Profile Test User',
  email: 'profile@example.com',
  role: 'Regular User',
  department: 'Engineering',
  avatar: null,
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (profileService.getProfile as any).mockResolvedValue(mockProfileData);
  });

  it('renders profile details on load', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Profile Test User')).toBeDefined();
    });
  });

  it('switches tabs when clicking Activity Log tab', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Profile Test User')).toBeDefined());

    const activityTab = screen.getByText(/Activity/i);
    fireEvent.click(activityTab);

    await waitFor(() => {
      expect(screen.getByText(/Recent Activity/i)).toBeDefined();
    });
  });
});
