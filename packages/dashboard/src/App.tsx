import { useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import Board from './components/kanban/Board';
import Login from './components/auth/Login';
import { useWebSocket } from './hooks/useWebSocket';
import { useIssueStore } from './stores/issue.store';
import { useAuthStore } from './stores/auth.store';

function Dashboard() {
  const { moveIssue } = useIssueStore();
  const { user, logout } = useAuthStore();
  useWebSocket();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveIssue(active.id as string, over.id as 'backlog' | 'todo' | 'in_progress' | 'review' | 'done');
    }
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
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <Board />
        </DndContext>
      </main>
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
