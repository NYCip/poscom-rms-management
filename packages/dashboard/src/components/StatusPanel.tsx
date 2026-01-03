interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: number[];
  tasks: {
    total: number;
    inProgress: number;
    completed: number;
  };
  connections: number;
  timestamp: string;
}

interface StatusPanelProps {
  status: SystemStatus | null;
  onRefresh?: () => void;
}

const STATUS_COLORS = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  unhealthy: 'bg-red-500',
};

export default function StatusPanel({ status, onRefresh }: StatusPanelProps) {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (!status) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse flex items-center justify-center h-32">
          <div className="text-gray-400">Loading status...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status.status]} animate-pulse`} />
            <h3 className="font-semibold">System Status</h3>
          </div>
          {onRefresh && (
            <button onClick={onRefresh} className="p-1.5 hover:bg-white/20 rounded transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 uppercase mb-1">Uptime</div>
          <div className="text-lg font-bold text-gray-900">{formatUptime(status.uptime)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 uppercase mb-1">Memory</div>
          <div className="text-lg font-bold text-gray-900">{status.memory.percentage}%</div>
          <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${status.memory.percentage > 80 ? 'bg-red-500' : status.memory.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${status.memory.percentage}%` }}
            />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 uppercase mb-1">CPU Load</div>
          <div className="text-lg font-bold text-gray-900">{status.cpu[0]?.toFixed(2) || '0.00'}</div>
          <div className="text-xs text-gray-400">1m avg</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 uppercase mb-1">Connections</div>
          <div className="text-lg font-bold text-gray-900">{status.connections}</div>
          <div className="text-xs text-gray-400">active</div>
        </div>
      </div>

      {/* Task Stats */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Task Overview</div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{status.tasks.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{status.tasks.inProgress}</div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{status.tasks.completed}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 text-xs text-gray-400 text-right">
        Last updated: {new Date(status.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
