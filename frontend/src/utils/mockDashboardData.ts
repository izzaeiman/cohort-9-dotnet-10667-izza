import type {
  StatCardData,
  TaskItem,
  ActivityItemData,
  DeadlineItem,
  ProductivityDataPoint,
  StatusDistributionData,
} from '../types/dashboard.types';

export const MOCK_STAT_CARDS: StatCardData[] = [
  {
    id: 'stat-completed',
    title: 'Completed Tasks',
    value: 28,
    change: '+14.2%',
    isPositive: true,
    period: 'vs last week',
    iconType: 'completed',
  },
  {
    id: 'stat-in-progress',
    title: 'In Progress',
    value: 12,
    change: '+5.8%',
    isPositive: true,
    period: 'vs last week',
    iconType: 'in_progress',
  },
  {
    id: 'stat-pending',
    title: 'Pending Review',
    value: 7,
    change: '-3.1%',
    isPositive: false,
    period: 'vs last week',
    iconType: 'pending',
  },
  {
    id: 'stat-overdue',
    title: 'Overdue Tasks',
    value: 3,
    change: '-25.0%',
    isPositive: true,
    period: 'vs last week',
    iconType: 'overdue',
  },
];

export const MOCK_PRODUCTIVITY_DATA: ProductivityDataPoint[] = [
  { day: 'Mon', completed: 4, created: 6 },
  { day: 'Tue', completed: 7, created: 5 },
  { day: 'Wed', completed: 9, created: 8 },
  { day: 'Thu', completed: 6, created: 4 },
  { day: 'Fri', completed: 11, created: 7 },
  { day: 'Sat', completed: 5, created: 2 },
  { day: 'Sun', completed: 3, created: 1 },
];

export const MOCK_STATUS_DISTRIBUTION: StatusDistributionData[] = [
  { name: 'Completed', value: 28, color: '#4CAF50' },
  { name: 'In Progress', value: 12, color: '#FF7A1A' },
  { name: 'Pending', value: 7, color: '#FFC107' },
  { name: 'Overdue', value: 3, color: '#FF5A5A' },
];

export const MOCK_TASKS: TaskItem[] = [
  {
    id: 'TSK-101',
    title: 'Design System & Token Architecture',
    priority: 'high',
    category: 'UI/UX Design',
    status: 'in_progress',
    dueDate: '2026-08-05',
    assignees: [
      { id: 'usr-1', name: 'Sarah Connor', avatar: 'https://i.pravatar.cc/150?img=32' },
      { id: 'usr-2', name: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?img=12' },
    ],
  },
  {
    id: 'TSK-102',
    title: 'JWT Authentication Endpoints in ASP.NET Core',
    priority: 'high',
    category: 'Backend',
    status: 'pending',
    dueDate: '2026-08-06',
    assignees: [
      { id: 'usr-3', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' },
    ],
  },
  {
    id: 'TSK-103',
    title: 'Responsive Split-Screen Login & Signup UI',
    priority: 'medium',
    category: 'Frontend',
    status: 'completed',
    dueDate: '2026-08-03',
    assignees: [
      { id: 'usr-3', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' },
      { id: 'usr-4', name: 'Elena Rostova', avatar: 'https://i.pravatar.cc/150?img=47' },
    ],
  },
  {
    id: 'TSK-104',
    title: 'Entity Framework Core Database Migration Script',
    priority: 'high',
    category: 'Database',
    status: 'overdue',
    dueDate: '2026-08-02',
    assignees: [
      { id: 'usr-5', name: 'David Miller', avatar: 'https://i.pravatar.cc/150?img=59' },
    ],
  },
  {
    id: 'TSK-105',
    title: 'Serilog Logging & Structured Exception Middleware',
    priority: 'low',
    category: 'Backend',
    status: 'in_progress',
    dueDate: '2026-08-08',
    assignees: [
      { id: 'usr-2', name: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?img=12' },
    ],
  },
];

export const MOCK_DEADLINES: DeadlineItem[] = [
  {
    id: 'dl-1',
    title: 'Sprint 2 Code Review & Demo Prep',
    priority: 'high',
    dueDate: 'Today, 5:00 PM',
    dueTag: 'Today',
    category: 'DevOps',
  },
  {
    id: 'dl-2',
    title: 'SQL Server Schema Validation',
    priority: 'high',
    dueDate: 'Tomorrow, 12:00 PM',
    dueTag: 'Tomorrow',
    category: 'Database',
  },
  {
    id: 'dl-3',
    title: 'xUnit Controller Integration Tests',
    priority: 'medium',
    dueDate: 'Aug 8, 2026',
    dueTag: 'This Week',
    category: 'Backend',
  },
];

export const MOCK_ACTIVITIES: ActivityItemData[] = [
  {
    id: 'act-1',
    user: 'Izza Eiman',
    avatar: 'https://i.pravatar.cc/150?img=68',
    action: 'completed task',
    target: 'Responsive Split-Screen Login & Signup UI',
    timestamp: '10 mins ago',
    type: 'completed',
  },
  {
    id: 'act-2',
    user: 'Nouman (Mentor)',
    avatar: 'https://i.pravatar.cc/150?img=33',
    action: 'approved Pull Request',
    target: '#2 feat(auth): add responsive signup & forgot password',
    timestamp: '1 hour ago',
    type: 'updated',
  },
  {
    id: 'act-3',
    user: 'Sarah Connor',
    avatar: 'https://i.pravatar.cc/150?img=32',
    action: 'created task',
    target: 'Design System & Token Architecture',
    timestamp: '3 hours ago',
    type: 'created',
  },
  {
    id: 'act-4',
    user: 'Alex Rivera',
    avatar: 'https://i.pravatar.cc/150?img=12',
    action: 'commented on',
    target: 'Serilog Logging & Structured Exception Middleware',
    timestamp: '5 hours ago',
    type: 'commented',
  },
];
