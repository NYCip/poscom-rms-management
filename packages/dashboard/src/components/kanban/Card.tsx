import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '../ui/Badge';
import TaskActions from '../TaskActions';
import TaskModal from '../TaskModal';

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string;
  phase?: string;
  agent?: string;
  progress?: number;
  subtasks?: { text: string; done: boolean }[];
}

const PRIORITY_BORDERS: Record<string, string> = {
  critical: 'border-l-red-600',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
};

// API URL helper
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export default function Card({ issue }: { issue: Issue }) {
  const [showModal, setShowModal] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id });
  const borderColor = PRIORITY_BORDERS[issue.priority] || 'border-l-gray-300';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleViewDetails = () => setShowModal(true);

  const handleRunWithClaude = async () => {
    try {
      const token = localStorage.getItem('rms_token');
      await fetch(`${API_URL}/api/tasks/${issue.id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      alert(`Claude CLI command: rms run ${issue.id}\n\nRun this in your terminal to execute the task.`);
    } catch (err) {
      console.error('Failed to trigger task:', err);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      const token = localStorage.getItem('rms_token');
      await fetch(`${API_URL}/api/tasks/${issue.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <>
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
            <TaskActions
              task={issue}
              onViewDetails={handleViewDetails}
              onRunWithClaude={handleRunWithClaude}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge priority={issue.priority as any} />
            <span className="text-xs text-gray-400 font-mono">#{issue.id}</span>
            {issue.progress !== undefined && (
              <span className="text-xs text-blue-600 font-medium">{issue.progress}%</span>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <TaskModal
          task={issue}
          onClose={() => setShowModal(false)}
          onRunWithClaude={handleRunWithClaude}
        />
      )}
    </>
  );
}
