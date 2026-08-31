import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Toast from './Toast';

describe('Toast', () => {
  it('renders Toast with message successfully', () => {
    const onClose = vi.fn();
    render(<Toast message="Hello Toast!" onClose={onClose} />);
    expect(screen.getByText('Hello Toast!')).toBeDefined();
  });

  it('triggers onClose callback after duration', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast message="Hello Toast!" onClose={onClose} duration={1000} />);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
