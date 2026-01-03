import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '../ui/Badge';

interface Issue { id: string; title: string; status: string; priority: string; }

const PRIORITY_BORDERS: Record<string, string> = {
  critical: 'border-l-red-600',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
};

export default function Card({ issue }: { issue: Issue }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id });
  const borderColor = PRIORITY_BORDERS[issue.priority] || 'border-l-gray-300';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        cursor-grab rounded-lg border-l-4 ${borderColor} bg-white p-3
        shadow-sm transition-all duration-200 ease-out group
        ${isDragging
          ? 'opacity-50 shadow-2xl scale-105 rotate-2'
          : 'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1'
        }
      `}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{issue.title}</h3>
          <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge priority={issue.priority as any} />
          <span className="text-xs text-gray-400 font-mono">#{issue.id.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}
