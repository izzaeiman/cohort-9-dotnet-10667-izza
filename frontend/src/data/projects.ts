export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  category: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  dueDate: string;
  lead: { id: string; name: string; avatar: string };
  team: { id: string; name: string; avatar: string }[];
  status: 'in_progress' | 'completed' | 'pending';
}

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'PRJ-01',
    name: 'Task Management System SaaS',
    description: 'React 19 + TypeScript + ASP.NET Core Web API fullstack internship assignment.',
    category: 'FullStack',
    progress: 78,
    completedTasks: 18,
    totalTasks: 23,
    dueDate: '2026-08-15',
    lead: { id: 'usr-1', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' },
    team: [
      { id: 'usr-1', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' },
      { id: 'usr-3', name: 'Alice Carter', avatar: 'https://i.pravatar.cc/150?img=32' },
      { id: 'usr-4', name: 'Bob Wilson', avatar: 'https://i.pravatar.cc/150?img=12' },
    ],
    status: 'in_progress',
  },
  {
    id: 'PRJ-02',
    name: 'JWT & EF Core Infrastructure',
    description: 'Secure authentication, role authorization, and SQL Server database schema migrations.',
    category: 'Backend',
    progress: 45,
    completedTasks: 9,
    totalTasks: 20,
    dueDate: '2026-08-22',
    lead: { id: 'usr-4', name: 'Bob Wilson', avatar: 'https://i.pravatar.cc/150?img=12' },
    team: [
      { id: 'usr-4', name: 'Bob Wilson', avatar: 'https://i.pravatar.cc/150?img=12' },
      { id: 'usr-5', name: 'Charlie Davis', avatar: 'https://i.pravatar.cc/150?img=59' },
    ],
    status: 'in_progress',
  },
  {
    id: 'PRJ-03',
    name: 'UI/UX Glassmorphism Design System',
    description: 'Figma design tokens, color variables, reusable components, and responsive layouts.',
    category: 'UiUxDesign',
    progress: 100,
    completedTasks: 14,
    totalTasks: 14,
    dueDate: '2026-07-30',
    lead: { id: 'usr-3', name: 'Alice Carter', avatar: 'https://i.pravatar.cc/150?img=32' },
    team: [
      { id: 'usr-3', name: 'Alice Carter', avatar: 'https://i.pravatar.cc/150?img=32' },
      { id: 'usr-1', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' },
    ],
    status: 'completed',
  },
  {
    id: 'PRJ-04',
    name: 'Real-Time SignalR Notifications',
    description: 'WebSockets Hub integration for live activity alerts and collaborative task updates.',
    category: 'FullStack',
    progress: 15,
    completedTasks: 3,
    totalTasks: 18,
    dueDate: '2026-08-28',
    lead: { id: 'usr-5', name: 'Charlie Davis', avatar: 'https://i.pravatar.cc/150?img=59' },
    team: [
      { id: 'usr-5', name: 'Charlie Davis', avatar: 'https://i.pravatar.cc/150?img=59' },
      { id: 'usr-1', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' },
    ],
    status: 'pending',
  },
];
