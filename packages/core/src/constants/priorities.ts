import type { IssuePriority } from '../types/issue';

export const PRIORITY_ORDER: Record<IssuePriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
} as const;

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
} as const;

export const PRIORITY_COLORS: Record<IssuePriority, string> = {
  critical: '#ef4444', // red-500
  high: '#f97316', // orange-500
  medium: '#eab308', // yellow-500
  low: '#22c55e', // green-500
} as const;

export const PRIORITY_ICONS: Record<IssuePriority, string> = {
  critical: '!!!',
  high: '!!',
  medium: '!',
  low: '-',
} as const;

export function comparePriority(a: IssuePriority, b: IssuePriority): number {
  return PRIORITY_ORDER[a] - PRIORITY_ORDER[b];
}
