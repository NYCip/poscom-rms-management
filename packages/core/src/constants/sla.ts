import type { SLATier } from '../types/issue';

export const SLA_HOURS: Record<SLATier, number> = {
  critical: 4,
  high: 24,
  medium: 72,
  low: 168,
} as const;

export const SLA_COLORS: Record<SLATier, string> = {
  critical: '#ef4444', // red-500
  high: '#f97316', // orange-500
  medium: '#eab308', // yellow-500
  low: '#22c55e', // green-500
} as const;

export const SLA_WARNING_THRESHOLDS = {
  green: 50, // > 50% remaining
  yellow: 20, // 20-50% remaining
  red: 0, // < 20% remaining
} as const;

export function getSLAColor(percentRemaining: number): 'green' | 'yellow' | 'red' {
  if (percentRemaining > SLA_WARNING_THRESHOLDS.green) {
    return 'green';
  }
  if (percentRemaining > SLA_WARNING_THRESHOLDS.red) {
    return 'yellow';
  }
  return 'red';
}

export function calculateSLADeadline(tier: SLATier, startDate: Date = new Date()): Date {
  const hours = SLA_HOURS[tier];
  return new Date(startDate.getTime() + hours * 60 * 60 * 1000);
}

export function getSLAPercentRemaining(deadline: Date, now: Date = new Date()): number {
  const total = deadline.getTime() - now.getTime();
  if (total <= 0) return 0;

  // Estimate original duration based on common SLA tiers
  const hoursRemaining = total / (60 * 60 * 1000);
  const estimatedTotalHours = Object.values(SLA_HOURS).find((h) => hoursRemaining <= h) ?? 168;
  const originalDuration = estimatedTotalHours * 60 * 60 * 1000;

  return Math.min(100, Math.max(0, (total / originalDuration) * 100));
}
