import { EventEmitter } from 'events';

export interface LogEntry {
  level: string;
  time: number;
  msg: string;
  [key: string]: unknown;
}

// Log event emitter for streaming to clients
export const logEmitter = new EventEmitter();

// Log buffer for recent logs (last 100 entries)
const logBuffer: LogEntry[] = [];
const MAX_LOG_BUFFER = 100;

// Log levels with colors for console
const LEVELS: Record<string, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
};

function log(level: string, msg: string, extra?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    time: Date.now(),
    msg,
    ...extra,
  };

  // Add to buffer
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_BUFFER) {
    logBuffer.shift();
  }

  // Emit for WebSocket streaming
  logEmitter.emit('log', entry);

  // Console output with color
  const color = LEVELS[level] || LEVELS.reset;
  const timestamp = new Date(entry.time).toISOString();
  console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${LEVELS.reset} ${msg}`, extra ? JSON.stringify(extra) : '');
}

export const streamLogger = {
  debug: (msg: string, extra?: Record<string, unknown>) => log('debug', msg, extra),
  info: (msg: string, extra?: Record<string, unknown>) => log('info', msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => log('warn', msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => log('error', msg, extra),
  getRecentLogs: (): LogEntry[] => [...logBuffer],
  clearLogs: () => { logBuffer.length = 0; },
};

export default streamLogger;
