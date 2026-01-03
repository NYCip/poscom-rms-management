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
      <header className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">RMS Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.username} ({user?.role})
            </span>
            <button
              onClick={logout}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
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
