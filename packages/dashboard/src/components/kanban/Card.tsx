import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '../ui/Badge';

interface Issue { id: string; title: string; status: string; priority: string; }

export default function Card({ issue }: { issue: Issue }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded border bg-white p-3 shadow-sm hover:shadow-md"
    >
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{issue.title}</h3>
        <div className="flex items-center gap-2">
          <Badge priority={issue.priority as any} />
          <span className="text-xs text-gray-400">#{issue.id.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}
