import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export interface SpecTask {
  id: string;
  title: string;
  phase: string;
  agent: string;
  priority: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  subtasks: { text: string; done: boolean }[];
  progress: number; // 0-100
}

export interface Spec {
  name: string;
  version: string;
  status: string;
  tasks: SpecTask[];
}

interface ParsedTask {
  id: string;
  title: string;
  phase: string;
  agent: string;
  priority: string;
  subtasks: { text: string; done: boolean }[];
}

/**
 * Parse a tasks.md file and extract all tasks with their status
 */
export async function parseTasksFile(filePath: string): Promise<SpecTask[]> {
  const content = await readFile(filePath, 'utf-8');
  const tasks: SpecTask[] = [];

  let currentPhase = '';
  let currentTask: ParsedTask | null = null;

  const lines = content.split('\n');

  for (const line of lines) {
    // Phase header: ## Phase 1: Project Foundation (Must)
    const phaseMatch = line.match(/^## Phase \d+: (.+)/);
    if (phaseMatch && phaseMatch[1]) {
      currentPhase = phaseMatch[1];
      continue;
    }

    // Task header: ### T1.1: Initialize Monorepo Structure
    const taskMatch = line.match(/^### (T[\d.]+): (.+)/);
    if (taskMatch && taskMatch[1] && taskMatch[2]) {
      // Save previous task
      if (currentTask) {
        tasks.push(finalizeTask(currentTask));
      }

      currentTask = {
        id: taskMatch[1],
        title: taskMatch[2],
        phase: currentPhase,
        agent: 'unknown',
        priority: 'medium',
        subtasks: [],
      };
      continue;
    }

    // Agent line: **Agent**: architect
    const agentMatch = line.match(/^\*\*Agent\*\*: (.+)/);
    if (agentMatch && agentMatch[1] && currentTask) {
      currentTask.agent = agentMatch[1];
      continue;
    }

    // Priority line: **Priority**: Must
    const priorityMatch = line.match(/^\*\*Priority\*\*: (.+)/);
    if (priorityMatch && priorityMatch[1] && currentTask) {
      currentTask.priority = priorityMatch[1].toLowerCase();
      continue;
    }

    // Subtask: - [ ] Create project or - [x] Done task
    const subtaskMatch = line.match(/^- \[([ x~])\] (.+)/);
    if (subtaskMatch && subtaskMatch[1] && subtaskMatch[2] && currentTask) {
      currentTask.subtasks.push({
        text: subtaskMatch[2],
        done: subtaskMatch[1] === 'x',
      });
      continue;
    }
  }

  // Don't forget the last task
  if (currentTask) {
    tasks.push(finalizeTask(currentTask));
  }

  return tasks;
}

/**
 * Calculate task status and progress from subtasks
 */
function finalizeTask(task: ParsedTask): SpecTask {
  const subtasks = task.subtasks;
  const total = subtasks.length;
  const done = subtasks.filter(s => s.done).length;

  let status: SpecTask['status'] = 'backlog';
  let progress = 0;

  if (total > 0) {
    progress = Math.round((done / total) * 100);

    if (done === total) {
      status = 'done';
    } else if (done > 0) {
      status = 'in_progress';
    } else {
      status = 'backlog';
    }
  }

  // Map priority to standard values
  let priority = task.priority;
  if (priority === 'must') priority = 'high';
  if (priority === 'should') priority = 'medium';
  if (priority === 'could') priority = 'low';

  return {
    id: task.id,
    title: task.title,
    phase: task.phase,
    agent: task.agent,
    priority,
    status,
    subtasks,
    progress,
  };
}

/**
 * Load all specs from the .claude/specs directory
 */
export async function loadSpecs(projectDir: string): Promise<Spec[]> {
  const specsDir = join(projectDir, '.claude', 'specs');
  const specs: Spec[] = [];

  try {
    const specFolders = await readdir(specsDir);

    for (const folder of specFolders) {
      const tasksPath = join(specsDir, folder, 'tasks.md');

      try {
        const tasks = await parseTasksFile(tasksPath);
        specs.push({
          name: folder,
          version: '1.0',
          status: 'active',
          tasks,
        });
      } catch {
        // Skip folders without tasks.md
      }
    }
  } catch {
    // No specs directory
  }

  return specs;
}

/**
 * Get all tasks from all specs as a flat list for the Kanban board
 */
export async function getAllTasks(projectDir: string): Promise<SpecTask[]> {
  const specs = await loadSpecs(projectDir);
  return specs.flatMap(spec => spec.tasks);
}
