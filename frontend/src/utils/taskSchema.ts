import { z } from 'zod';

export const taskFormSchema = z
  .object({
    title: z.string().min(1, 'Task title is required.'),
    description: z.string().min(1, 'Task description is required.'),
    assignedUserId: z.string().min(1, 'Assigned user is required.'),
    project: z.string().min(1, 'Project is required.'),
    category: z.string().min(1, 'Category is required.'),
    priority: z.enum(['low', 'medium', 'high', 'critical'], {
      errorMap: () => ({ message: 'Priority is required.' }),
    }),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'overdue'], {
      errorMap: () => ({ message: 'Status is required.' }),
    }),
    startDate: z.string().min(1, 'Start date is required.'),
    startTime: z.string().default('09:00 AM'),
    dueDate: z.string().min(1, 'Due date is required.'),
    dueTime: z.string().default('05:00 PM'),
    timeLimit: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true;
          const num = Number(val);
          return !isNaN(num) && num > 0;
        },
        { message: 'Time limit must be a positive number greater than 0.' },
      ),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.dueDate) return true;
      const startStr = `${data.startDate}T${data.startTime || '00:00'}`;
      const dueStr = `${data.dueDate}T${data.dueTime || '23:59'}`;
      const start = new Date(startStr);
      const due = new Date(dueStr);
      if (!isNaN(start.getTime()) && !isNaN(due.getTime())) {
        return due >= start;
      }
      return new Date(data.dueDate) >= new Date(data.startDate);
    },
    {
      message: 'Due Date/Time cannot be before Start Date/Time.',
      path: ['dueDate'],
    },
  );

export type TaskFormData = z.infer<typeof taskFormSchema>;

export const assignTaskSchema = z
  .object({
    assignedUserId: z.string().min(1, 'Please select a user to assign.'),
    startDate: z.string().optional(),
    startTime: z.string().optional(),
    dueDate: z.string().optional(),
    dueTime: z.string().optional(),
    timeLimit: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true;
          const num = Number(val);
          return !isNaN(num) && num > 0;
        },
        { message: 'Time limit must be a positive number greater than 0.' },
      ),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.dueDate) return true;
      const startStr = `${data.startDate}T${data.startTime || '00:00'}`;
      const dueStr = `${data.dueDate}T${data.dueTime || '23:59'}`;
      const start = new Date(startStr);
      const due = new Date(dueStr);
      if (!isNaN(start.getTime()) && !isNaN(due.getTime())) {
        return due >= start;
      }
      return new Date(data.dueDate) >= new Date(data.startDate);
    },
    {
      message: 'Due Date/Time cannot be before Start Date/Time.',
      path: ['dueDate'],
    },
  );

export type AssignTaskFormData = z.infer<typeof assignTaskSchema>;
