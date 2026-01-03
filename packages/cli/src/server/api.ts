import type { FastifyInstance } from 'fastify';
import { readdir, readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

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

  fastify.get<{ Params: { id: string } }>('/api/issues/:id', { preHandler: [fastify.authenticate] }, async (request) => {
    const content = await readFile(join(issuesDir, `${request.params.id}.md`), 'utf-8');
    return { success: true, data: { id: request.params.id, content } };
  });

  fastify.post<{ Body: { title: string; type?: string; priority?: string } }>('/api/issues', { preHandler: [fastify.authenticate] }, async (request) => {
    const id = `ISSUE-${Date.now()}`;
    const content = `---
id: ${id}
type: ${request.body.type || 'feature'}
priority: ${request.body.priority || 'medium'}
status: draft
created: ${new Date().toISOString()}
---

# ${request.body.title}
`;
    await writeFile(join(issuesDir, `${id}.md`), content);
    return { success: true, data: { id } };
  });

  fastify.delete<{ Params: { id: string } }>('/api/issues/:id', { preHandler: [fastify.authenticate] }, async (request) => {
    await unlink(join(issuesDir, `${request.params.id}.md`));
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
}
