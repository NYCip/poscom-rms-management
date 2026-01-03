import Fastify from 'fastify';
import { join } from 'path';
import { access, mkdir } from 'fs/promises';
import crypto from 'crypto';
import { registerApiRoutes } from './api.js';
import { setupWebSocket } from './websocket.js';
import { UserManager, setupAuth, registerAuthRoutes } from '../auth/index.js';

interface ServerOptions {
  port: number;
  host: string;
}

// Generate or load JWT secret
async function getJwtSecret(rmsDir: string): Promise<string> {
  const secretFile = join(rmsDir, '.jwt-secret');
  try {
    const { readFile } = await import('fs/promises');
    return (await readFile(secretFile, 'utf-8')).trim();
  } catch {
    // Generate new secret
    const secret = crypto.randomBytes(64).toString('hex');
    const { writeFile } = await import('fs/promises');
    await writeFile(secretFile, secret, { mode: 0o600 });
    return secret;
  }
}

export async function startServer(options: ServerOptions): Promise<void> {
  const rmsDir = join(process.cwd(), '.rms');

  // Ensure .rms directory exists
  try {
    await access(rmsDir);
  } catch {
    await mkdir(rmsDir, { recursive: true });
  }

  // Initialize user manager
  const userManager = new UserManager(rmsDir);
  await userManager.initialize();

  // Get JWT secret
  const jwtSecret = process.env['JWT_SECRET'] || await getJwtSecret(rmsDir);

  const fastify = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] || 'info',
    }
  });

  // CORS - restrict in production
  await fastify.register(import('@fastify/cors'), {
    origin: process.env['NODE_ENV'] === 'production'
      ? process.env['CORS_ORIGIN'] || false
      : true,
    credentials: true,
  });

  // Setup authentication
  await setupAuth(fastify, userManager, jwtSecret);

  // Register auth routes (login, logout, etc.)
  registerAuthRoutes(fastify, userManager);

  // Register protected API routes
  registerApiRoutes(fastify, rmsDir);

  // Health check (public)
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    authenticated: false,
  }));

  // Start server
  const address = await fastify.listen({ port: options.port, host: options.host });

  // Setup WebSocket with auth
  setupWebSocket(fastify.server, rmsDir, jwtSecret, userManager);

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🔒 RMS Dashboard Server (Secured)                           ║
║                                                               ║
║   URL: ${address.padEnd(52)} ║
║   Auth: JWT + bcrypt                                          ║
║                                                               ║
║   Default credentials (CHANGE IMMEDIATELY):                   ║
║   Username: admin                                             ║
║   Password: Admin123!                                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
}
