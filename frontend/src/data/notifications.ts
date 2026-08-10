export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'task' | 'comment' | 'system' | 'deadline';
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Task Completed',
    message: 'Alice Carter completed Task System Spec',
    timestamp: '10 mins ago',
    isRead: false,
    type: 'task',
  },
  {
    id: 'notif-2',
    title: 'New PR Comment',
    message: 'John Smith commented on your PR #3',
    timestamp: '1 hour ago',
    isRead: false,
    type: 'comment',
  },
  {
    id: 'notif-3',
    title: 'Approaching Deadline',
    message: 'Deadline approaching for SQL Migration Script',
    timestamp: '3 hours ago',
    isRead: false,
    type: 'deadline',
  },
];
