import type {
  StatCardData,
  DeadlineItem,
  ProductivityDataPoint,
  StatusDistributionData,
} from '../types/dashboard.types';

export const INITIAL_STAT_CARDS: StatCardData[] = [
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

export const PRODUCTIVITY_THIS_WEEK: ProductivityDataPoint[] = [
  { day: 'Mon', completed: 4, created: 6 },
  { day: 'Tue', completed: 7, created: 5 },
  { day: 'Wed', completed: 9, created: 8 },
  { day: 'Thu', completed: 6, created: 4 },
  { day: 'Fri', completed: 11, created: 7 },
  { day: 'Sat', completed: 5, created: 2 },
  { day: 'Sun', completed: 3, created: 1 },
];

export const PRODUCTIVITY_LAST_WEEK: ProductivityDataPoint[] = [
  { day: 'Mon', completed: 3, created: 5 },
  { day: 'Tue', completed: 5, created: 4 },
  { day: 'Wed', completed: 6, created: 7 },
  { day: 'Thu', completed: 8, created: 3 },
  { day: 'Fri', completed: 9, created: 6 },
  { day: 'Sat', completed: 4, created: 3 },
  { day: 'Sun', completed: 2, created: 1 },
];

export const PRODUCTIVITY_THIS_MONTH: ProductivityDataPoint[] = [
  { day: 'Week 1', completed: 22, created: 28 },
  { day: 'Week 2', completed: 28, created: 24 },
  { day: 'Week 3', completed: 35, created: 30 },
  { day: 'Week 4', completed: 31, created: 25 },
];

export const STATUS_DISTRIBUTION: StatusDistributionData[] = [
  { name: 'Completed', value: 28, color: '#4CAF50' },
  { name: 'In Progress', value: 12, color: '#FF7A1A' },
  { name: 'Pending', value: 7, color: '#FFC107' },
  { name: 'Overdue', value: 3, color: '#FF5A5A' },
];

export const INITIAL_DEADLINES: DeadlineItem[] = [
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
