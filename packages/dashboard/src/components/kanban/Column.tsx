import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Card from './Card';

interface Issue { id: string; title: string; status: string; priority: string; }

interface ColumnProps { id: string; title: string; issues: Issue[]; }

const COLUMN_COLORS: Record<string, { header: string; border: string; dropBg: string }> = {
  backlog: { header: 'bg-gray-500', border: 'border-gray-400', dropBg: 'bg-gray-50' },
  todo: { header: 'bg-blue-500', border: 'border-blue-400', dropBg: 'bg-blue-50' },
  in_progress: { header: 'bg-yellow-500', border: 'border-yellow-400', dropBg: 'bg-yellow-50' },
  review: { header: 'bg-purple-500', border: 'border-purple-400', dropBg: 'bg-purple-50' },
  done: { header: 'bg-green-500', border: 'border-green-400', dropBg: 'bg-green-50' },
};

export default function Column({ id, title, issues }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const colors = COLUMN_COLORS[id] || COLUMN_COLORS.backlog;

  return (
    <div className="flex flex-col transition-all duration-200">
      {/* Colored Header */}
      <div className={`${colors.header} text-white rounded-t-lg p-3 shadow-sm`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">{issues.length}</span>
        </div>
      </div>

      {/* Card Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 rounded-b-lg border-2 border-t-0 p-3 min-h-[200px] transition-all duration-200 ${
          isOver
            ? `${colors.dropBg} ${colors.border} ring-2 ring-offset-1 scale-[1.02]`
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {issues.map((issue) => <Card key={issue.id} issue={issue} />)}
          </div>
        </SortableContext>
        {issues.length === 0 && (
          <div className={`flex-1 flex flex-col items-center justify-center text-gray-400 transition-all duration-200 ${isOver ? 'scale-105' : 'opacity-60'}`}>
            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium">{isOver ? 'Release to drop' : 'No items'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
