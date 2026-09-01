import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider } from './ThemeContext';
import { useTheme } from '../hooks/useTheme';
import React from 'react';

// Helper component that reads theme context
const ThemeConsumer = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button data-testid="toggle" onClick={toggleTheme}>Toggle</button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>Dark</button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>Light</button>
    </div>
  );
};

describe('ThemeProvider', () => {
  const originalMatchMedia = window.matchMedia;
  // Own localStorage simulation — re-create before each test so we start clean
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    // Replace global.localStorage with a full functional mock for this test
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length; },
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: originalMatchMedia });
    vi.unstubAllGlobals();
  });

  it('defaults to light theme when no localStorage value and no prefers-color-scheme', () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('current-theme').textContent).toBe('light');
  });

  it('reads stored theme from localStorage (workflow-theme key)', () => {
    store['workflow-theme'] = 'dark';
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
  });

  it('reads stored theme from localStorage (workflow_theme key)', () => {
    store['workflow_theme'] = 'dark';
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
  });

  it('falls back to system prefers-dark when no localStorage', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('dark'), media: query,
      })),
    });
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
  });

  it('toggleTheme switches from light to dark', async () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    await act(async () => { fireEvent.click(screen.getByTestId('toggle')); });
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(store['workflow-theme']).toBe('dark');
  });

  it('toggleTheme switches from dark to light', async () => {
    store['workflow-theme'] = 'dark';
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await act(async () => { fireEvent.click(screen.getByTestId('toggle')); });
    expect(screen.getByTestId('current-theme').textContent).toBe('light');
  });

  it('setTheme directly updates theme and writes both keys to localStorage', async () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await act(async () => { fireEvent.click(screen.getByTestId('set-dark')); });
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(store['workflow-theme']).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('useEffect sets data-theme attribute on mount', () => {
    store['workflow-theme'] = 'dark';
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

describe('useTheme — outside provider throws', () => {
  it('throws when used outside ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const BrokenConsumer = () => { useTheme(); return null; };
    expect(() => render(<BrokenConsumer />)).toThrow('useTheme must be used within a ThemeProvider');
    spy.mockRestore();
  });
});
