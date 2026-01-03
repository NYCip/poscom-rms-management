import { format, formatDistanceToNow, differenceInMinutes, differenceInHours } from 'date-fns';

/**
 * Format a date for display
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return format(d, 'MMM d, yyyy');
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return format(d, 'MMM d, yyyy HH:mm');
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format SLA remaining time
 */
export function formatSLARemaining(deadline: Date | string | number): string {
  const d = new Date(deadline);
  const now = new Date();

  if (d <= now) {
    return 'Breached';
  }

  const minutes = differenceInMinutes(d, now);
  const hours = differenceInHours(d, now);

  if (minutes < 60) {
    return `${minutes}m remaining`;
  }
  if (hours < 24) {
    return `${hours}h remaining`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h remaining`;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  return new Date(date) < new Date();
}

/**
 * Get ISO string for database storage
 */
export function toISOString(date: Date | string | number): string {
  return new Date(date).toISOString();
}

/**
 * Parse date from various formats
 */
export function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}
