import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taskFormSchema, assignTaskSchema } from './taskSchema';

describe('taskFormSchema', () => {
  const validData = {
    title: 'Fix bug',
    description: 'Fix the login bug',
    assignedUserId: 'usr-1',
    project: 'proj-1',
    category: 'Backend',
    priority: 'high' as const,
    status: 'pending' as const,
    startDate: '2026-08-01',
    startTime: '09:00 AM',
    dueDate: '2026-09-01',
    dueTime: '05:00 PM',
  };

  it('accepts valid full form data', () => {
    const result = taskFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = taskFormSchema.safeParse({ ...validData, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const result = taskFormSchema.safeParse({ ...validData, description: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing assignedUserId', () => {
    const result = taskFormSchema.safeParse({ ...validData, assignedUserId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const result = taskFormSchema.safeParse({ ...validData, priority: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = taskFormSchema.safeParse({ ...validData, status: 'blocked' });
    expect(result.success).toBe(false);
  });

  it('rejects dueDate before startDate', () => {
    const result = taskFormSchema.safeParse({
      ...validData,
      startDate: '2026-09-01',
      dueDate: '2026-08-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const dueDateError = result.error.issues.find(i => i.path.includes('dueDate'));
      expect(dueDateError?.message).toBe('Due Date cannot be before Start Date.');
    }
  });

  it('accepts equal startDate and dueDate', () => {
    const result = taskFormSchema.safeParse({
      ...validData,
      startDate: '2026-09-01',
      dueDate: '2026-09-01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid timeLimit as positive number string', () => {
    const result = taskFormSchema.safeParse({ ...validData, timeLimit: '5' });
    expect(result.success).toBe(true);
  });

  it('rejects timeLimit of 0', () => {
    const result = taskFormSchema.safeParse({ ...validData, timeLimit: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects negative timeLimit', () => {
    const result = taskFormSchema.safeParse({ ...validData, timeLimit: '-1' });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric timeLimit', () => {
    const result = taskFormSchema.safeParse({ ...validData, timeLimit: 'abc' });
    expect(result.success).toBe(false);
  });

  it('accepts empty string timeLimit (optional)', () => {
    const result = taskFormSchema.safeParse({ ...validData, timeLimit: '' });
    expect(result.success).toBe(true);
  });

  it('skips dueDate validation when dates are missing', () => {
    // When startDate or dueDate is empty, the refine skips → base validation catches missing fields
    const result = taskFormSchema.safeParse({ ...validData, startDate: '', dueDate: '' });
    // startDate is required (min 1), so it will fail on that
    expect(result.success).toBe(false);
  });
});

describe('assignTaskSchema', () => {
  it('requires assignedUserId', () => {
    const result = assignTaskSchema.safeParse({ assignedUserId: '' });
    expect(result.success).toBe(false);
  });

  it('accepts valid assignedUserId with optional fields', () => {
    const result = assignTaskSchema.safeParse({
      assignedUserId: 'usr-1',
      startDate: '2026-08-01',
      dueDate: '2026-09-01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts only assignedUserId (all optionals absent)', () => {
    const result = assignTaskSchema.safeParse({ assignedUserId: 'usr-2' });
    expect(result.success).toBe(true);
  });
});
