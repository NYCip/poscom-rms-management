import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Module {
  name: string;
  version: string;
  description: string;
  tasks: Task[];
}

interface ModuleEditorProps {
  module?: Module;
  onSave: (module: Module) => void;
  onCancel: () => void;
}

export default function ModuleEditor({ module, onSave, onCancel }: ModuleEditorProps) {
  const [name, setName] = useState(module?.name || '');
  const [version, setVersion] = useState(module?.version || '1.0.0');
  const [description, setDescription] = useState(module?.description || '');
  const [tasks, setTasks] = useState<Task[]>(module?.tasks || []);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: `T${tasks.length + 1}`,
      title: newTaskTitle.trim(),
      status: 'backlog',
      priority: 'medium',
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const handleRemoveTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), version, description: description.trim(), tasks });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{module ? 'Edit Module' : 'Create New Module'}</h2>
            <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., user-authentication" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
            <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={3} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tasks</label>
            <div className="flex gap-2 mb-3">
              <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Add a task..." className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500" onKeyPress={(e) => e.key === 'Enter' && handleAddTask()} />
              <button onClick={handleAddTask} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">Add</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-4">No tasks added yet</div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{task.id}</span>
                      <span className="text-sm text-gray-700">{task.title}</span>
                    </div>
                    <button onClick={() => handleRemoveTask(task.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors">{module ? 'Save Changes' : 'Create Module'}</button>
        </div>
      </div>
    </div>
  );
}
