import type { ActivityItemData } from '../types/dashboard.types';

export const INITIAL_ACTIVITIES: ActivityItemData[] = [
  {
    id: 'act-1',
    user: 'Jane Doe',
    avatar: 'https://i.pravatar.cc/150?img=68',
    action: 'completed task',
    target: 'Responsive Split-Screen Login & Signup UI',
    timestamp: '10 mins ago',
    type: 'completed',
  },
  {
    id: 'act-2',
    user: 'John Smith (Mentor)',
    avatar: 'https://i.pravatar.cc/150?img=33',
    action: 'approved Pull Request',
    target: '#3 feat(dashboard): resolve CodeRabbit review comments',
    timestamp: '1 hour ago',
    type: 'updated',
  },
  {
    id: 'act-3',
    user: 'Alice Carter',
    avatar: 'https://i.pravatar.cc/150?img=32',
    action: 'created task',
    target: 'Design System & Token Architecture',
    timestamp: '3 hours ago',
    type: 'created',
  },
  {
    id: 'act-4',
    user: 'Bob Wilson',
    avatar: 'https://i.pravatar.cc/150?img=12',
    action: 'commented on',
    target: 'Serilog Logging & Structured Exception Middleware',
    timestamp: '5 hours ago',
    type: 'commented',
  },
];
