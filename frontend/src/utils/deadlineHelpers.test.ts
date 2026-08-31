import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateTaskDeadlineStatus, formatDateDisplay } from './deadlineHelpers';
import type { DetailedTaskItem } from '../data/tasks';

// Helper to create a minimal task
const makeTask = (overrides: Partial<DetailedTaskItem> = {}): DetailedTaskItem => ({
  id: 'TSK-1',
  title: 'Test Task',
  description: '',
  priority: 'medium',
  category: 'General',
  status: 'pending',
  dueDate: '',
  assignedUser: 'User A',
  assignedUserId: 'u1',
  project: 'Project X',
  projectId: 'p1',
  startDate: '2026-08-01',
  startTime: '09:00 AM',
  dueTime: '05:00 PM',
  createdDate: '2026-08-01',
  lastModified: '2026-08-01',
  assignees: [],
  comments: [],
  attachments: [],
  ...overrides,
});

describe('calculateTaskDeadlineStatus', () => {
  it('returns COMPLETED for completed task', () => {
    const result = calculateTaskDeadlineStatus(makeTask({ status: 'completed' }));
    expect(result.state).toBe('COMPLETED');
    expect(result.badgeVariant).toBe('success');
    expect(result.label).toBe('Completed');
  });

  it('returns CANCELLED for cancelled task', () => {
    const result = calculateTaskDeadlineStatus(makeTask({ status: 'cancelled' }));
    expect(result.state).toBe('CANCELLED');
    expect(result.badgeVariant).toBe('secondary');
  });

  it('returns FAR_FROM_DEADLINE when no dueDate and no timeLimit', () => {
    const result = calculateTaskDeadlineStatus(makeTask({ dueDate: undefined, timeLimit: undefined }));
    expect(result.state).toBe('FAR_FROM_DEADLINE');
    expect(result.label).toBe('Invalid date');
  });

  it('returns FAR_FROM_DEADLINE for invalid date string', () => {
    const result = calculateTaskDeadlineStatus(makeTask({ dueDate: 'not-a-date' }));
    expect(result.state).toBe('FAR_FROM_DEADLINE');
    expect(result.label).toBe('Invalid date');
  });

  it('returns OVERDUE for past due date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = calculateTaskDeadlineStatus(makeTask({ dueDate: pastDate.toISOString() }));
    expect(result.state).toBe('OVERDUE');
    expect(result.badgeVariant).toBe('danger');
    expect(result.label).toMatch(/Overdue by \d+ days?/);
  });

  it('returns OVERDUE for status=overdue even if date is future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const result = calculateTaskDeadlineStatus(makeTask({ status: 'overdue' as any, dueDate: futureDate.toISOString() }));
    expect(result.state).toBe('OVERDUE');
  });

  it('returns DUE_TODAY for today due date', () => {
    const today = new Date().toISOString();
    const result = calculateTaskDeadlineStatus(makeTask({ dueDate: today }));
    expect(result.state).toBe('DUE_TODAY');
    expect(result.badgeVariant).toBe('warning');
    expect(result.label).toBe('Due today');
  });

  it('returns DUE_TOMORROW for tomorrow due date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = calculateTaskDeadlineStatus(makeTask({ dueDate: tomorrow.toISOString() }));
    expect(result.state).toBe('DUE_TOMORROW');
    expect(result.label).toBe('Due tomorrow');
  });

  it('returns APPROACHING_DEADLINE for 2 days remaining', () => {
    const twoDays = new Date();
    twoDays.setDate(twoDays.getDate() + 2);
    const result = calculateTaskDeadlineStatus(makeTask({ dueDate: twoDays.toISOString() }));
    expect(result.state).toBe('APPROACHING_DEADLINE');
    expect(result.badgeVariant).toBe('warning');
  });

  it('returns FAR_FROM_DEADLINE for far future', () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 30);
    const result = calculateTaskDeadlineStatus(makeTask({ dueDate: farFuture.toISOString() }));
    expect(result.state).toBe('FAR_FROM_DEADLINE');
    expect(result.badgeVariant).toBe('info');
    expect(result.label).toContain('days remaining');
  });

  it('computes dueDate from timeLimit and createdDate when no dueDate', () => {
    // Use a future createdDate so createdDate + 100 days is definitively in the future
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 5); // 5 days from now
    const task = makeTask({ dueDate: undefined, timeLimit: 100, createdDate: futureStart.toISOString() });
    const result = calculateTaskDeadlineStatus(task);
    // 100 days from a date 5 days in the future → FAR_FROM_DEADLINE
    expect(result.state).toBe('FAR_FROM_DEADLINE');
  });

  it('OVERDUE label uses singular "day" for exactly 1 day overdue', () => {
    // daysDiff = -1 → overdueDays = 1 → "Overdue by 1 day"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = calculateTaskDeadlineStatus(makeTask({ dueDate: yesterday.toISOString() }));
    expect(result.label).toMatch(/Overdue by 1 day$/);
  });
});

describe('formatDateDisplay', () => {
  it('returns N/A for undefined/empty date', () => {
    expect(formatDateDisplay(undefined)).toBe('N/A');
    expect(formatDateDisplay('')).toBe('N/A');
  });

  it('formats valid date string', () => {
    const result = formatDateDisplay('2026-08-15');
    expect(result).toMatch(/Aug/);
    expect(result).toMatch(/2026/);
  });

  it('appends time string when provided', () => {
    const result = formatDateDisplay('2026-08-15', '10:00 AM');
    expect(result).toContain('10:00 AM');
  });

  it('returns original string for invalid date', () => {
    const result = formatDateDisplay('not-a-date');
    expect(result).toBe('not-a-date');
  });
});
