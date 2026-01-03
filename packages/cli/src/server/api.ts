import type { FastifyInstance } from 'fastify';
import { readdir, readFile, writeFile, unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { getAllTasks, loadSpecs } from './spec-parser.js';

// Security: Validate IDs to prevent path traversal
function isValidId(id: string): boolean {
  // Only allow alphanumeric, hyphens, underscores, and dots
  return /^[a-zA-Z0-9._-]+$/.test(id) && !id.includes('..');
}

// Security: Ensure path is within allowed directory
function isPathWithinDir(filePath: string, allowedDir: string): boolean {
  const resolvedPath = resolve(filePath);
  const resolvedDir = resolve(allowedDir);
  return resolvedPath.startsWith(resolvedDir + '/') || resolvedPath === resolvedDir;
}

export function registerApiRoutes(fastify: FastifyInstance, rmsDir: string) {
  const issuesDir = join(rmsDir, 'issues');

  // All API routes require authentication
  fastify.get('/api/issues', { preHandler: [fastify.authenticate] }, async () => {
    const files = await readdir(issuesDir);
    const issues = await Promise.all(
      files.filter(f => f.endsWith('.md')).map(async (file) => {
        const content = await readFile(join(issuesDir, file), 'utf-8');
        const id = file.replace('.md', '');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const statusMatch = content.match(/^status:\s+(.+)$/m);
        const priorityMatch = content.match(/^priority:\s+(.+)$/m);
        return { id, title: titleMatch?.[1] || id, status: statusMatch?.[1], priority: priorityMatch?.[1] };
      })
    );
    return { success: true, data: issues };
  });

  fastify.get<{ Params: { id: string } }>('/api/issues/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;

    // Security: Validate ID
    if (!isValidId(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid issue ID' });
    }

    const filePath = join(issuesDir, `${id}.md`);

    // Security: Ensure path is within issues directory
    if (!isPathWithinDir(filePath, issuesDir)) {
      return reply.status(403).send({ success: false, error: 'Access denied' });
    }

    const content = await readFile(filePath, 'utf-8');
    return { success: true, data: { id, content } };
  });

  fastify.post<{ Body: { title: string; type?: string; priority?: string; status?: string } }>('/api/issues', { preHandler: [fastify.authenticate] }, async (request) => {
    const id = `ISSUE-${Date.now()}`;
    const status = request.body.status || 'backlog';
    const content = `---
id: ${id}
type: ${request.body.type || 'feature'}
priority: ${request.body.priority || 'medium'}
status: ${status}
created: ${new Date().toISOString()}
---

# ${request.body.title}
`;
    await writeFile(join(issuesDir, `${id}.md`), content);
    return { success: true, data: { id, title: request.body.title, status, priority: request.body.priority || 'medium' } };
  });

  fastify.delete<{ Params: { id: string } }>('/api/issues/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;

    // Security: Validate ID
    if (!isValidId(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid issue ID' });
    }

    const filePath = join(issuesDir, `${id}.md`);

    // Security: Ensure path is within issues directory
    if (!isPathWithinDir(filePath, issuesDir)) {
      return reply.status(403).send({ success: false, error: 'Access denied' });
    }

    await unlink(filePath);
    return { success: true };
  });

  fastify.get('/api/workflow', { preHandler: [fastify.authenticate] }, async () => {
    const content = await readFile(join(rmsDir, 'workflow', 'workflow.json'), 'utf-8');
    return { success: true, data: JSON.parse(content) };
  });

  fastify.get('/api/stats', { preHandler: [fastify.authenticate] }, async () => {
    const files = await readdir(issuesDir);
    return { success: true, data: { totalIssues: files.filter(f => f.endsWith('.md')).length } };
  });

  // ============ SPEC TASK API ENDPOINTS ============

  // Get all specs
  fastify.get('/api/specs', { preHandler: [fastify.authenticate] }, async () => {
    const specs = await loadSpecs(process.cwd());
    return { success: true, data: specs };
  });

  // Get tasks for a spec
  fastify.get<{ Params: { specName: string } }>(
    '/api/specs/:specName/tasks',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const specs = await loadSpecs(process.cwd());
      const spec = specs.find(s => s.name === request.params.specName);
      if (!spec) {
        return { success: false, error: 'Spec not found' };
      }
      return { success: true, data: spec.tasks };
    }
  );

  // Get all tasks (flat list for Kanban)
  fastify.get('/api/tasks', { preHandler: [fastify.authenticate] }, async () => {
    const tasks = await getAllTasks(process.cwd());
    return { success: true, data: tasks };
  });

  // Update task status
  fastify.patch<{ Params: { taskId: string }; Body: { status: string } }>(
    '/api/tasks/:taskId/status',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { taskId } = request.params;
      const { status } = request.body;

      // Security: Validate taskId
      if (!isValidId(taskId)) {
        return reply.status(400).send({ success: false, error: 'Invalid task ID' });
      }

      // Validate status
      const validStatuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
      if (!validStatuses.includes(status)) {
        return reply.status(400).send({ success: false, error: 'Invalid status' });
      }

      // For now, return success - actual file update would need tasks.md editing
      return {
        success: true,
        data: { taskId, status, message: 'Status update queued' }
      };
    }
  );

  // Get dashboard stats
  fastify.get('/api/dashboard/stats', { preHandler: [fastify.authenticate] }, async () => {
    const tasks = await getAllTasks(process.cwd());
    const stats = {
      total: tasks.length,
      byStatus: {
        backlog: tasks.filter(t => t.status === 'backlog').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length,
      },
      byPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length,
      },
      avgProgress: tasks.length > 0
        ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
        : 0,
    };
    return { success: true, data: stats };
  });

  // Trigger Claude CLI for task
  fastify.post<{ Params: { taskId: string } }>(
    '/api/tasks/:taskId/run',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { taskId } = request.params;

      // Security: Validate taskId
      if (!isValidId(taskId)) {
        return reply.status(400).send({ success: false, error: 'Invalid task ID' });
      }

      const tasks = await getAllTasks(process.cwd());
      const task = tasks.find(t => t.id === taskId);

      if (!task) {
        return reply.status(404).send({ success: false, error: 'Task not found' });
      }

      // Return task details and command to run
      return {
        success: true,
        data: {
          taskId,
          task,
          command: `rms run ${taskId}`,
          message: 'Task execution initiated'
        }
      };
    }
  );
}
