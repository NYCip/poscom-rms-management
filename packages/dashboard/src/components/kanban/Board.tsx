import { useIssueStore } from '@/stores/issue.store';
import Column from './Column';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
] as const;

export default function Board() {
  const issues = useIssueStore((s) => s.issues);

  return (
    <div className="grid grid-cols-5 gap-4">
      {COLUMNS.map((col) => (
        <Column
          key={col.id}
          id={col.id}
          title={col.title}
          issues={issues.filter((i) => i.status === col.id)}
        />
      ))}
    </div>
  );
}
