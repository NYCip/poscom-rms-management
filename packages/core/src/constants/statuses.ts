import type { IssueStatus } from '../types/issue';

export const STATUS_ORDER: Record<IssueStatus, number> = {
  backlog: 0,
  todo: 1,
  in_progress: 2,
  review: 3,
  testing: 4,
  done: 5,
  cancelled: 6,
} as const;

export const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  testing: 'Testing',
  done: 'Done',
  cancelled: 'Cancelled',
} as const;

export const STATUS_COLORS: Record<IssueStatus, string> = {
  backlog: '#6b7280', // gray-500
  todo: '#3b82f6', // blue-500
  in_progress: '#8b5cf6', // violet-500
  review: '#f59e0b', // amber-500
  testing: '#14b8a6', // teal-500
  done: '#22c55e', // green-500
  cancelled: '#ef4444', // red-500
} as const;

export const ACTIVE_STATUSES: IssueStatus[] = ['todo', 'in_progress', 'review', 'testing'];

export const CLOSED_STATUSES: IssueStatus[] = ['done', 'cancelled'];

export function isActiveStatus(status: IssueStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function isClosedStatus(status: IssueStatus): boolean {
  return CLOSED_STATUSES.includes(status);
}
