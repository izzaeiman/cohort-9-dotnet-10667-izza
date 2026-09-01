import { afterEach } from 'vitest';

// Capture the real jsdom localStorage at setup time (before any test file replaces it)
const realLocalStorage = window.localStorage;

// After each test, restore global.localStorage to jsdom's real implementation
// This prevents test files that do `global.localStorage = { getItem: vi.fn(), ... }`
// from polluting subsequent test files that rely on the real jsdom localStorage.
afterEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: realLocalStorage,
    writable: true,
    configurable: true,
  });
});
