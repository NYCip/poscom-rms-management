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

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onRunWithClaude: () => void;
}

export default function TaskModal({ task, onClose, onRunWithClaude }: TaskModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-mono opacity-75">{task.id}</span>
              <h2 className="text-xl font-bold">{task.title}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 uppercase">Phase</div>
              <div className="font-medium text-gray-900">{task.phase || 'N/A'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 uppercase">Agent</div>
              <div className="font-medium text-gray-900">{task.agent || 'N/A'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 uppercase">Priority</div>
              <div className={`font-medium ${
                task.priority === 'high' ? 'text-red-600' :
                task.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>{task.priority}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 uppercase">Status</div>
              <div className="font-medium text-gray-900">{task.status.replace('_', ' ')}</div>
            </div>
          </div>

          {/* Progress */}
          {task.progress !== undefined && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-bold text-blue-600">{task.progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Subtasks ({task.subtasks.filter(s => s.done).length}/{task.subtasks.length})</h3>
              <div className="space-y-2">
                {task.subtasks.map((subtask, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${subtask.done ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      subtask.done ? 'bg-green-500 text-white' : 'border-2 border-gray-300'
                    }`}>
                      {subtask.done && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={subtask.done ? 'text-gray-500 line-through' : 'text-gray-900'}>{subtask.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Run: <code className="bg-gray-200 px-2 py-0.5 rounded">rms run {task.id}</code>
          </div>
          <button
            onClick={onRunWithClaude}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run with Claude
          </button>
        </div>
      </div>
    </div>
  );
}
