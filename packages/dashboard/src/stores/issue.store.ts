import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Issue {
  id: string;
  title: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface IssueStore {
  issues: Issue[];
  setIssues: (issues: Issue[]) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  moveIssue: (id: string, status: Issue['status']) => void;
}

export const useIssueStore = create<IssueStore>()(
  devtools((set) => ({
    issues: [],
    setIssues: (issues) => set({ issues }),
    updateIssue: (id, updates) => set((s) => ({
      issues: s.issues.map((i) => i.id === id ? { ...i, ...updates } : i)
    })),
    moveIssue: (id, status) => set((s) => ({
      issues: s.issues.map((i) => i.id === id ? { ...i, status } : i)
    })),
  }))
);
