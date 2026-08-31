import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import React from 'react';

vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
  default: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  it('renders settings page cleanly with appearance tab', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('System Settings')).toBeDefined();
    expect(screen.getByText('Appearance & Theme')).toBeDefined();
  });

  it('switches between settings tabs', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const notifTab = screen.getByText('Notification Preferences');
    fireEvent.click(notifTab);

    await waitFor(() => {
      expect(screen.getByText(/Email Task Reminders/i)).toBeDefined();
    });

    const secTab = screen.getByText('Password & Security');
    fireEvent.click(secTab);

    await waitFor(() => {
      expect(screen.getByText(/Change Password/i)).toBeDefined();
    });
  });
});
