import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import type { UserManager } from '../auth/index.js';
import { getAllTasks } from './spec-parser.js';
import { logEmitter, type LogEntry } from './logger.js';
import { incrementConnections, decrementConnections } from './status.js';

interface JWTPayload {
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

const ALLOWED_COMMANDS = ['issue:list', 'issue:get', 'workflow:get', 'stats:get', 'ping'];

// Security: Max connections per user
const MAX_CONNECTIONS_PER_USER = 5;
const userConnections = new Map<string, number>();

// Security: Command rate limiting
const COMMAND_RATE_LIMIT = 30; // commands per minute
const commandCounts = new Map<string, { count: number; resetTime: number }>();

function checkCommandRateLimit(socketId: string): boolean {
  const now = Date.now();
  const entry = commandCounts.get(socketId);

  if (!entry || now > entry.resetTime) {
    commandCounts.set(socketId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (entry.count >= COMMAND_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Parse cookie string to extract token
function parseCookies(cookieStr: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieStr) return cookies;

  cookieStr.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length) {
      cookies[name] = rest.join('=');
    }
  });
  return cookies;
}

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

  // Subscribe to log events and broadcast to all clients
  logEmitter.on('log', (entry: LogEntry) => {
    io.emit('log', entry);
  });

  // Authentication middleware for Socket.IO with enhanced security
  io.use(async (socket, next) => {
    try {
      // Get token from multiple sources (cookie, auth, query, header)
      const cookies = parseCookies(socket.handshake.headers.cookie || '');
      const token = cookies['rms_token'] ||
                    socket.handshake.auth['token'] ||
                    socket.handshake.query['token'] ||
                    socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication required'));
      }

      // Security: Basic token format validation
      if (token.length > 1000) {
        return next(new Error('Invalid token format'));
      }

      // Verify JWT
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      // Verify user still exists
      const user = userManager.getUser(decoded.username);
      if (!user) {
        return next(new Error('User not found'));
      }

      // Security: Check connection limit per user
      const currentConnections = userConnections.get(user.username) || 0;
      if (currentConnections >= MAX_CONNECTIONS_PER_USER) {
        return next(new Error('Too many connections. Please close other sessions.'));
      }

      // Attach user to socket
      socket.data.user = user;
      next();
    } catch (error) {
      const message = error instanceof jwt.TokenExpiredError
        ? 'Session expired. Please login again.'
        : 'Invalid or expired token';
      next(new Error(message));
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

    // Track user connections
    const currentCount = userConnections.get(user.username) || 0;
    userConnections.set(user.username, currentCount + 1);
    incrementConnections();

    // Send initial spec tasks on connection
    const tasks = await loadSpecTasks();
    socket.emit('issues:init', tasks);

    socket.on('command', async (data: { command: string; payload?: unknown }) => {
      // Security: Rate limit commands
      if (!checkCommandRateLimit(socket.id)) {
        socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
        return;
      }

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

      // Decrement user connections
      const count = userConnections.get(user.username) || 1;
      if (count <= 1) {
        userConnections.delete(user.username);
      } else {
        userConnections.set(user.username, count - 1);
      }

      // Clean up rate limit tracking
      commandCounts.delete(socket.id);
      decrementConnections();
    });
  });

  return io;
}
