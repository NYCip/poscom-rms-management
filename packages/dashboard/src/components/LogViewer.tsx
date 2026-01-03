import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  level: string;
  time: number;
  msg: string;
  [key: string]: unknown;
}

interface LogViewerProps {
  logs: LogEntry[];
  onClear?: () => void;
  onSubscribe?: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  info: 'text-blue-600 bg-blue-50',
  warn: 'text-yellow-600 bg-yellow-50',
  error: 'text-red-600 bg-red-50',
  debug: 'text-gray-600 bg-gray-50',
};

export default function LogViewer({ logs, onClear, onSubscribe }: LogViewerProps) {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  useEffect(() => {
    onSubscribe?.();
  }, [onSubscribe]);

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (search && !log.msg.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatTime = (time: number) => {
    return new Date(time).toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-semibold">Server Logs</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{logs.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-1.5 rounded transition-colors ${autoScroll ? 'bg-green-500' : 'bg-gray-600'}`}
              title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            {onClear && (
              <button onClick={onClear} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded transition-colors" title="Clear logs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border rounded-lg px-2 py-1 bg-white"
        >
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full text-sm border rounded-lg pl-8 pr-3 py-1"
          />
          <svg className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Log entries */}
      <div ref={containerRef} className="flex-1 overflow-y-auto font-mono text-xs p-2 bg-gray-900 min-h-[200px]">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No logs to display</div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 py-1 hover:bg-gray-800 px-2 rounded">
              <span className="text-gray-500 flex-shrink-0">{formatTime(log.time)}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold flex-shrink-0 ${LEVEL_COLORS[log.level] || 'bg-gray-100 text-gray-600'}`}>
                {log.level}
              </span>
              <span className="text-gray-200 break-all">{log.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
