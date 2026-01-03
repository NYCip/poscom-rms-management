import { useEffect, useState, useCallback } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import Board from './components/kanban/Board';
import Login from './components/auth/Login';
import StatusPanel from './components/StatusPanel';
import LogViewer from './components/LogViewer';
import ModuleEditor from './components/ModuleEditor';
import { useWebSocket } from './hooks/useWebSocket';
import { useIssueStore } from './stores/issue.store';
import { useAuthStore } from './stores/auth.store';

interface LogEntry {
  level: string;
  time: number;
  msg: string;
  [key: string]: unknown;
}

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memory: { used: number; total: number; percentage: number };
  cpu: number[];
  tasks: { total: number; inProgress: number; completed: number };
  connections: number;
  timestamp: string;
}

function Dashboard() {
  const { moveIssue } = useIssueStore();
  const { user, logout, token } = useAuthStore();
  useWebSocket();

  // New state for monitoring
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showModuleEditor, setShowModuleEditor] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveIssue(active.id as string, over.id as 'backlog' | 'todo' | 'in_progress' | 'review' | 'done');
    }
  };

  // Fetch system status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, [token]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, [token]);

  // Clear logs
  const clearLogs = useCallback(async () => {
    try {
      await fetch('/api/logs', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  }, [token]);

  // Periodic status fetch
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Fetch logs when panel opens
  useEffect(() => {
    if (showLogs) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [showLogs, fetchLogs]);

  // Handle module save
  const handleModuleSave = (module: { name: string; version: string; description: string; tasks: { id: string; title: string; status: string; priority: string }[] }) => {
    console.log('Module saved:', module);
    setShowModuleEditor(false);
    // TODO: Call API to save module
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg px-6 py-4">
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
              <span className="text-xl font-bold text-blue-600">📊</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">POS.com RMS</h1>
              <p className="text-xs text-blue-200">Requirements Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Create Module Button */}
            <button
              onClick={() => setShowModuleEditor(true)}
              className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Module
            </button>
            {/* Logs Toggle */}
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                showLogs ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {showLogs ? 'Hide Logs' : 'Show Logs'}
              {logs.length > 0 && <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs">{logs.length}</span>}
            </button>
            {/* User info */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <div className="font-medium">{user?.username}</div>
                <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                  user?.role === 'admin' ? 'bg-purple-500 text-white' :
                  user?.role === 'user' ? 'bg-blue-500 text-white' :
                  'bg-gray-400 text-white'
                }`}>
                  {user?.role}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Status Panel - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <StatusPanel status={systemStatus} onRefresh={fetchStatus} />
            </div>
          </div>
          {/* Kanban Board - Main Content */}
          <div className="lg:col-span-3">
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <Board />
            </DndContext>
          </div>
        </div>
      </main>

      {/* Log Viewer - Bottom Panel */}
      {showLogs && (
        <div className="fixed bottom-0 left-0 right-0 h-72 bg-white border-t shadow-lg z-40">
          <LogViewer logs={logs} onClear={clearLogs} />
        </div>
      )}

      {/* Module Editor Modal */}
      {showModuleEditor && (
        <ModuleEditor
          onSave={handleModuleSave}
          onCancel={() => setShowModuleEditor(false)}
        />
      )}
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Dashboard />;
}

export default App;
