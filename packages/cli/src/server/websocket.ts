import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import type { UserManager } from '../auth/index.js';
import { getAllTasks } from './spec-parser.js';

interface JWTPayload {
  username: string;
  role: string;
}

const ALLOWED_COMMANDS = ['issue:list', 'issue:get', 'workflow:get', 'stats:get', 'ping'];

export function setupWebSocket(
  httpServer: HTTPServer,
  rmsDir: string,
  jwtSecret: string,
  userManager: UserManager
) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env['NODE_ENV'] === 'production'
        ? process.env['CORS_ORIGIN'] || false
        : true,
      credentials: true,
    },
  });

  const issuesDir = join(rmsDir, 'issues');

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth or query
      const token = socket.handshake.auth['token'] ||
                    socket.handshake.query['token'] ||
                    socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication required'));
      }

      // Verify JWT
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      // Verify user still exists
      const user = userManager.getUser(decoded.username);
      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  // Helper to load spec tasks from .claude/specs/
  async function loadSpecTasks() {
    try {
      // Use current working directory as project root
      const projectDir = process.cwd();
      console.log('Loading spec tasks from:', projectDir);
      const tasks = await getAllTasks(projectDir);
      console.log('Loaded', tasks.length, 'tasks');
      return tasks;
    } catch (err) {
      console.error('Error loading spec tasks:', err);
      return [];
    }
  }

  io.on('connection', async (socket) => {
    const user = socket.data.user;
    console.log(`Client connected: ${socket.id} (user: ${user.username})`);

    // Send initial spec tasks on connection
    const tasks = await loadSpecTasks();
    socket.emit('issues:init', tasks);

    socket.on('command', async (data: { command: string; payload?: unknown }) => {
      if (!ALLOWED_COMMANDS.includes(data.command)) {
        socket.emit('error', { message: `Command not allowed: ${data.command}` });
        return;
      }

      try {
        switch (data.command) {
          case 'ping':
            socket.emit('pong', { timestamp: new Date().toISOString(), user: user.username });
            break;
          case 'issue:list':
            const files = await readdir(issuesDir);
            socket.emit('issue:list:response', { data: files.filter(f => f.endsWith('.md')) });
            break;
          case 'workflow:get':
            const workflow = await readFile(join(rmsDir, 'workflow', 'workflow.json'), 'utf-8');
            socket.emit('workflow:get:response', { data: JSON.parse(workflow) });
            break;
        }
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id} (user: ${user.username})`);
    });
  });

  return io;
}
