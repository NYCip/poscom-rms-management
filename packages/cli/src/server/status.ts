import type { FastifyInstance } from 'fastify';
import { getAllTasks } from './spec-parser.js';
import { streamLogger } from './logger.js';
import os from 'os';

export interface SystemStatus {
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

const startTime = Date.now();
let connectionCount = 0;

export function getConnectionCount(): number {
  return connectionCount;
}

export function incrementConnections(): void {
  connectionCount++;
}

export function decrementConnections(): void {
  connectionCount--;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const tasks = await getAllTasks(process.cwd());
  const totalMem = os.totalmem();
  const usedMem = totalMem - os.freemem();

  const status: SystemStatus = {
    status: 'healthy',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    memory: {
      used: Math.round(usedMem / 1024 / 1024),
      total: Math.round(totalMem / 1024 / 1024),
      percentage: Math.round((usedMem / totalMem) * 100),
    },
    cpu: os.loadavg(),
    tasks: {
      total: tasks.length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'done').length,
    },
    connections: connectionCount,
    timestamp: new Date().toISOString(),
  };

  if (status.memory.percentage > 90 || status.cpu[0] > 10) {
    status.status = 'degraded';
  }

  return status;
}

export function registerStatusRoutes(fastify: FastifyInstance) {
  // Health check (no auth required)
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  }));

  // Detailed status (auth required)
  fastify.get('/api/status', { preHandler: [fastify.authenticate] }, async () => {
    const status = await getSystemStatus();
    streamLogger.debug('Status check', { connections: status.connections });
    return { success: true, data: status };
  });

  // Recent logs (auth required)
  fastify.get('/api/logs', { preHandler: [fastify.authenticate] }, async () => ({
    success: true,
    data: streamLogger.getRecentLogs()
  }));

  // Clear logs (auth required)
  fastify.delete('/api/logs', { preHandler: [fastify.authenticate] }, async () => {
    streamLogger.clearLogs();
    streamLogger.info('Logs cleared');
    return { success: true };
  });

  // Server info
  fastify.get('/api/info', { preHandler: [fastify.authenticate] }, async () => ({
    success: true,
    data: {
      name: 'POS.com RMS Server',
      version: '1.0.0',
      node: process.version,
      platform: process.platform,
      pid: process.pid,
    },
  }));
}
