import { cn } from '@/lib/utils';

const styles = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
};

export default function Badge({ priority }: { priority: 'critical' | 'high' | 'medium' | 'low' }) {
  return (
    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[priority])}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
