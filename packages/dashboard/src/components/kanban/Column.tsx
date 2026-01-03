import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Card from './Card';

interface Issue { id: string; title: string; status: string; priority: string; }

interface ColumnProps { id: string; title: string; issues: Issue[]; }

export default function Column({ id, title, issues }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-lg border bg-white p-4 ${isOver ? 'border-blue-500 bg-blue-50' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">{title}</h2>
        <span className="bg-gray-200 px-2 py-1 rounded-full text-xs">{issues.length}</span>
      </div>
      <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {issues.map((issue) => <Card key={issue.id} issue={issue} />)}
        </div>
      </SortableContext>
      {issues.length === 0 && (
        <div className="h-24 flex items-center justify-center border-2 border-dashed rounded text-gray-400 text-sm">
          Drop here
        </div>
      )}
    </div>
  );
}
