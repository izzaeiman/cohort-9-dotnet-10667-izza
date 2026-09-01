// ─── Dashboard Data Types ──────────────────────────────────────────────────

export type TaskStatus = 'completed' | 'in_progress' | 'pending' | 'overdue' | 'cancelled';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskCategory = 'General' | 'Frontend' | 'Backend' | 'UiUxDesign' | 'DevOps' | 'Database' | 'FullStack';

export interface StatCardData {
  id: string;
  title: string;
  value: number | string;
  change: string;
  isPositive: boolean;
  period: string;
  iconType: 'completed' | 'in_progress' | 'pending' | 'overdue';
}

export interface TaskAssignee {
  id: string;
  name: string;
  avatar: string;
}

export interface TaskItem {
  id: string;
  title: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  dueDate: string;
  assignees: TaskAssignee[];
}

export interface ActivityItemData {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'created' | 'updated' | 'completed' | 'commented';
}

export interface DeadlineItem {
  id: string;
  title: string;
  priority: TaskPriority;
  dueDate: string;
  dueTag: 'Today' | 'Tomorrow' | 'This Week';
  category: TaskCategory;
}

export interface ProductivityDataPoint {
  day: string;
  completed: number;
  created: number;
}

export interface StatusDistributionData {
  name: string;
  value: number;
  color: string;
}
