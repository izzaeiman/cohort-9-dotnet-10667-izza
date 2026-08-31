import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';
import React from 'react';

describe('NotFoundPage', () => {
  it('renders 404 header and return home button', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/404/i)).toBeDefined();
    expect(screen.getByText(/Page Not Found/i)).toBeDefined();
  });
});
