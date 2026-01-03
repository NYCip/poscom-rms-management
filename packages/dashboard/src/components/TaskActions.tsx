import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  phase?: string;
  agent?: string;
  progress?: number;
  subtasks?: { text: string; done: boolean }[];
}

interface TaskActionsProps {
  task: Task;
  onViewDetails: () => void;
  onRunWithClaude: () => void;
  onUpdateStatus: (status: string) => void;
}

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];

export default function TaskActions({ task, onViewDetails, onRunWithClaude, onUpdateStatus }: TaskActionsProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {/* View Details */}
      <button
        onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="View Details"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>

      {/* Run with Claude */}
      <button
        onClick={(e) => { e.stopPropagation(); onRunWithClaude(); }}
        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
        title="Run with Claude"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Status Menu */}
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
          title="Update Status"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </button>

        {showStatusMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(status);
                  setShowStatusMenu(false);
                }}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 ${
                  task.status === status ? 'text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
