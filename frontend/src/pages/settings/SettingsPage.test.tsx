import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsPage } from './SettingsPage';

const mockSetTheme = vi.fn();

// Mock hooks/useTheme
vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
  default: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}));

// Mock services/authService
vi.mock('../../services/authService', () => ({
  authService: {
    changePassword: vi.fn(),
    ensureCsrfToken: vi.fn(),
  },
}));

// Mock services/api
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import apiClient from '../../services/api';
import { useTheme } from '../../hooks/useTheme';

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn()
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  it('renders settings page components successfully', () => {
    render(<SettingsPage />);
    expect(screen.getByText('System Settings')).toBeDefined();
    expect(screen.getByText('Appearance & Theme')).toBeDefined();
  });

  it('switches tabs and fetches active sessions', async () => {
    const mockSessions = [
      { id: 1, createdAt: '2026-08-31T12:00:00Z', expiresAt: '2026-09-07T12:00:00Z', isRevoked: false, isCurrent: true },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSessions });

    render(<SettingsPage />);

    // Click Security tab
    const securityTab = screen.getByText('Password & Security');
    fireEvent.click(securityTab);

    // Verify session loading
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/auth/sessions');
    });
  });

  it('validates password fields and submits data', async () => {
    render(<SettingsPage />);

    // Switch to security tab
    fireEvent.click(screen.getByText('Password & Security'));

    // Try submitting empty passwords
    const submitBtn = screen.getByText('Update Password');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Current password is required')).toBeDefined();
    });
  });

  it('triggers theme toggle changes', () => {
    render(<SettingsPage />);
    
    const toggle = screen.getByLabelText('Dark Mode (Theme Toggle)');
    fireEvent.click(toggle);

    expect(mockSetTheme).toHaveBeenCalled();
  });

  it('triggers notification preferences toggling and saving', () => {
    render(<SettingsPage />);
    
    // Switch to notification preferences
    fireEvent.click(screen.getByText('Notification Preferences'));

    // Toggle checkboxes
    const emailCheckbox = screen.getByLabelText('Email Task Reminders');
    fireEvent.click(emailCheckbox);

    // Save preferences
    fireEvent.click(screen.getByText('Save Preferences'));
    expect(window.localStorage.setItem).toHaveBeenCalled();
  });
});
