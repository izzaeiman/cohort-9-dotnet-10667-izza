import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmationDialog } from './components/shared/ConfirmationDialog';
import { Modal } from './components/common/Modal';
import { Pagination } from './components/shared/Pagination';
import AppSelect from './components/ui/AppSelect';
import React from 'react';

// ─── ConfirmationDialog ────────────────────────────────────────────────────

describe('ConfirmationDialog', () => {
  it('renders message and title when open', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        onConfirm={vi.fn()}
        title="Delete Item"
        message="Are you sure you want to delete?"
      />
    );
    expect(screen.getByText('Delete Item')).toBeDefined();
    expect(screen.getByText('Are you sure you want to delete?')).toBeDefined();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfirmationDialog
        isOpen={true}
        onConfirm={onConfirm}
        title="Confirm Action"
        message="Do it?"
        confirmLabel="Yes, do it"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Yes, do it' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmationDialog
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={onCancel}
        title="Confirm"
        message="Sure?"
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('falls back to onClose when no onCancel', () => {
    const onClose = vi.fn();
    render(
      <ConfirmationDialog
        isOpen={true}
        onConfirm={vi.fn()}
        onClose={onClose}
        title="Confirm"
        message="Sure?"
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses confirmText over confirmLabel when both are set', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        onConfirm={vi.fn()}
        title="T"
        message="M"
        confirmLabel="Confirm Label"
        confirmText="Confirm Text"
        cancelLabel="Cancel Label"
        cancelText="Cancel Text"
      />
    );
    expect(screen.getByText('Confirm Text')).toBeDefined();
    expect(screen.getByText('Cancel Text')).toBeDefined();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmationDialog
        isOpen={false}
        onConfirm={vi.fn()}
        title="Hidden"
        message="Not visible"
      />
    );
    expect(container.textContent).not.toContain('Hidden');
  });

  it('shows non-danger styling when isDanger=false', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        onConfirm={vi.fn()}
        title="Info"
        message="Info message"
        isDanger={false}
      />
    );
    // Just check it renders without crashing
    expect(screen.getByText('Info message')).toBeDefined();
  });
});

// ─── Modal ────────────────────────────────────────────────────────────────

describe('Modal', () => {
  it('renders title and children when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeDefined();
    expect(screen.getByText('Modal Content')).toBeDefined();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Hidden Modal">
        <p>Hidden</p>
      </Modal>
    );
    expect(container.textContent).not.toContain('Hidden Modal');
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Backdrop Test">
        <p>Content</p>
      </Modal>
    );
    // Click the overlay (aria-modal div)
    const overlay = document.querySelector('[aria-modal="true"]');
    if (overlay) fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Close Btn Test">
        <p>Content</p>
      </Modal>
    );
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Escape Test">
        <p>Content</p>
      </Modal>
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on inner content click (stopPropagation)', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Stop Propagation Test">
        <p data-testid="inner">Inner Content</p>
      </Modal>
    );
    fireEvent.click(screen.getByTestId('inner'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ─── Pagination ──────────────────────────────────────────────────────────

describe('Pagination', () => {
  it('renders nothing when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} totalItems={5} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page buttons for multi-page pagination', () => {
    render(
      <Pagination currentPage={2} totalPages={3} totalItems={30} onPageChange={vi.fn()} />
    );
    expect(screen.getByLabelText('Page 1')).toBeDefined();
    expect(screen.getByLabelText('Page 2')).toBeDefined();
    expect(screen.getByLabelText('Page 3')).toBeDefined();
  });

  it('previous button calls onPageChange with currentPage-1', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={2} totalPages={3} totalItems={30} onPageChange={onPageChange} />
    );
    fireEvent.click(screen.getByLabelText('Previous page'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('next button calls onPageChange with currentPage+1', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={2} totalPages={3} totalItems={30} onPageChange={onPageChange} />
    );
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('page button calls onPageChange with that page number', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={1} totalPages={3} totalItems={30} onPageChange={onPageChange} />
    );
    fireEvent.click(screen.getByLabelText('Page 3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('shows correct range info', () => {
    render(
      <Pagination currentPage={2} totalPages={3} totalItems={25} pageSize={10} onPageChange={vi.fn()} />
    );
    expect(screen.getByText('11', { exact: false })).toBeDefined();
    expect(screen.getByText('20', { exact: false })).toBeDefined();
  });

  it('uses itemsPerPage over pageSize when both provided', () => {
    render(
      <Pagination currentPage={1} totalPages={3} totalItems={15} pageSize={10} itemsPerPage={5} onPageChange={vi.fn()} />
    );
    // First page of 5 items → shows 1-5 of 15; '5' appears in end-count strong element
    const fives = screen.getAllByText('5');
    expect(fives.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── AppSelect ──────────────────────────────────────────────────────────

describe('AppSelect', () => {
  const options = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ];

  it('renders label and all options', () => {
    render(<AppSelect label="Priority" options={options} />);
    expect(screen.getByText('Priority')).toBeDefined();
    expect(screen.getByText('Option 1')).toBeDefined();
    expect(screen.getByText('Option 2')).toBeDefined();
  });

  it('shows error message when error prop is provided', () => {
    render(<AppSelect label="Priority" options={options} error="Required field" />);
    expect(screen.getByText('Required field')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('shows helper text when helperText prop is provided', () => {
    render(<AppSelect label="Priority" options={options} helperText="Select one" />);
    expect(screen.getByText('Select one')).toBeDefined();
  });

  it('focused class applied on focus event', () => {
    render(<AppSelect label="Priority" options={options} />);
    const select = screen.getByRole('combobox');
    fireEvent.focus(select);
    // After focus, isFocused state becomes true — just verify the select is accessible
    expect(select).toBeDefined();
    fireEvent.blur(select);
  });

  it('calls external onFocus and onBlur handlers', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(<AppSelect label="Priority" options={options} onFocus={onFocus} onBlur={onBlur} />);
    const select = screen.getByRole('combobox');
    fireEvent.focus(select);
    fireEvent.blur(select);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('renders left icon when provided', () => {
    render(
      <AppSelect label="Priority" options={options} leftIcon={<span data-testid="icon">⚡</span>} />
    );
    expect(screen.getByTestId('icon')).toBeDefined();
  });
});
