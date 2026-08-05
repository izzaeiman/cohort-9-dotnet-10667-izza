import type { TaskItem } from '../types/dashboard.types';

export interface TaskComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
}

export interface DetailedTaskItem extends TaskItem {
  description: string;
  createdDate: string;
  lastModified: string;
  comments: TaskComment[];
  attachments: TaskAttachment[];
}

export const INITIAL_TASKS: DetailedTaskItem[] = [
  {
    id: 'TSK-101',
    title: 'Design System & Token Architecture',
    description: 'Establish foundational color tokens, CSS custom properties, typography scales, glassmorphic elevation cards, and focus-visible accessibility rings.',
    priority: 'high',
    category: 'UI/UX Design',
    status: 'in_progress',
    dueDate: '2026-08-10',
    createdDate: '2026-08-01',
    lastModified: '2026-08-05',
    assignees: [
      { id: 'usr-3', name: 'Alice Carter', avatar: 'https://i.pravatar.cc/150?img=32' },
      { id: 'usr-4', name: 'Bob Wilson', avatar: 'https://i.pravatar.cc/150?img=12' },
    ],
    comments: [
      {
        id: 'c-1',
        author: 'Alice Carter',
        avatar: 'https://i.pravatar.cc/150?img=32',
        content: 'Figma tokens exported and CSS variables updated across all shared UI components.',
        createdAt: '2 hours ago',
      },
      {
        id: 'c-2',
        author: 'Jane Doe',
        avatar: 'https://i.pravatar.cc/150?img=68',
        content: 'Verified WCAG AA contrast for all badge status variants.',
        createdAt: '30 mins ago',
      },
    ],
    attachments: [
      {
        id: 'att-1',
        fileName: 'WorkFlow_Design_System_Spec.pdf',
        fileSize: '2.4 MB',
        fileType: 'PDF Document',
        uploadedAt: 'Aug 2, 2026',
      },
      {
        id: 'att-2',
        fileName: 'Color_Palette_Tokens.json',
        fileSize: '45 KB',
        fileType: 'JSON Specs',
        uploadedAt: 'Aug 3, 2026',
      },
    ],
  },
  {
    id: 'TSK-102',
    title: 'JWT Authentication Endpoints in ASP.NET Core',
    description: 'Implement ASP.NET Core Identity, JWT Bearer Token validation, Refresh Token handling, and Role-based authorization policies.',
    priority: 'high',
    category: 'Backend',
    status: 'pending',
    dueDate: '2026-08-12',
    createdDate: '2026-08-02',
    lastModified: '2026-08-04',
    assignees: [
      { id: 'usr-1', name: 'Jane Doe', avatar: 'https://i.pravatar.cc/150?img=68' },
    ],
    comments: [
      {
        id: 'c-3',
        author: 'John Smith (Mentor)',
        avatar: 'https://i.pravatar.cc/150?img=33',
        content: 'Ensure token expiration is set to 60 minutes with sliding refresh token renewal.',
        createdAt: ' Yesterday',
      },
    ],
    attachments: [
      {
        id: 'att-3',
        fileName: 'AuthConfig_Middleware.cs',
        fileSize: '12 KB',
        fileType: 'C# Code File',
        uploadedAt: 'Aug 4, 2026',
      },
    ],
  },
  {
    id: 'TSK-103',
    title: 'Responsive Split-Screen Login & Signup UI',
    description: 'Build accessible authentication forms with React Hook Form, Zod validation schemas, password visibility toggles, and brand illustration.',
    priority: 'medium',
    category: 'Frontend',
    status: 'completed',
    dueDate: '2026-08-03',
    createdDate: '2026-07-28',
    lastModified: '2026-08-03',
    assignees: [
      { id: 'usr-1', name: 'Jane Doe', avatar: 'https://i.pravatar.cc/150?img=68' },
      { id: 'usr-6', name: 'Diana Evans', avatar: 'https://i.pravatar.cc/150?img=47' },
    ],
    comments: [
      {
        id: 'c-4',
        author: 'Jane Doe',
        avatar: 'https://i.pravatar.cc/150?img=68',
        content: 'Sign up and Forgot password flows tested with 0 lint or accessibility errors.',
        createdAt: 'Aug 3, 2026',
      },
    ],
    attachments: [],
  },
  {
    id: 'TSK-104',
    title: 'Entity Framework Core Database Migration Script',
    description: 'Design relational database tables for Users, Roles, Tasks, Projects, Comments, and Audit Logs using EF Core Code-First migrations.',
    priority: 'high',
    category: 'Database',
    status: 'overdue',
    dueDate: '2026-08-02',
    createdDate: '2026-07-25',
    lastModified: '2026-08-01',
    assignees: [
      { id: 'usr-5', name: 'Charlie Davis', avatar: 'https://i.pravatar.cc/150?img=59' },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: 'TSK-105',
    title: 'Serilog Logging & Structured Exception Middleware',
    description: 'Configure Serilog sink for file and SQL Server logging with global Exception Handling Middleware in ASP.NET Core pipeline.',
    priority: 'low',
    category: 'Backend',
    status: 'in_progress',
    dueDate: '2026-08-14',
    createdDate: '2026-08-04',
    lastModified: '2026-08-05',
    assignees: [
      { id: 'usr-4', name: 'Bob Wilson', avatar: 'https://i.pravatar.cc/150?img=12' },
    ],
    comments: [],
    attachments: [],
  },
];
