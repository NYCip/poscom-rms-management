import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { access, mkdir } from 'fs/promises';
import crypto from 'crypto';
import { registerApiRoutes } from './api.js';
import { setupWebSocket } from './websocket.js';
import { UserManager, setupAuth, registerAuthRoutes } from '../auth/index.js';
import { registerStatusRoutes } from './status.js';
import { streamLogger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  // Security headers with Helmet
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Required for inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'wss:', 'ws:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for dashboard
  });

  // Global rate limiting
  await fastify.register(fastifyRateLimit, {
    max: 100, // Max 100 requests per window
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too many requests. Please slow down.',
      statusCode: 429,
    }),
  });

  // Stricter rate limit for auth endpoints (applied in auth routes)
  fastify.decorate('authRateLimit', {
    max: 5, // Max 5 login attempts per window
    timeWindow: '15 minutes',
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too many login attempts. Please try again in 15 minutes.',
      statusCode: 429,
    }),
  });

  // Setup authentication
  await setupAuth(fastify, userManager, jwtSecret);

  // Register auth routes (login, logout, etc.)
  registerAuthRoutes(fastify, userManager);

  // Register protected API routes
  registerApiRoutes(fastify, rmsDir);

  // Register status routes (health, logs, system info)
  registerStatusRoutes(fastify);

  // Serve static dashboard files
  const dashboardPath = join(__dirname, '..', '..', '..', 'dashboard', 'dist');
  try {
    await access(dashboardPath);
    await fastify.register(fastifyStatic, {
      root: dashboardPath,
      prefix: '/',
    });
  } catch {
    // Dashboard not built, serve simple HTML
    fastify.get('/', async (_request, reply) => {
      reply.type('text/html').send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RMS Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; width: 90%; }
    h1 { color: #1f2937; margin-bottom: 1rem; }
    .status { color: #059669; font-weight: 600; }
    .info { color: #6b7280; margin: 1rem 0; }
    .endpoint { background: #f3f4f6; padding: 0.5rem 1rem; border-radius: 0.5rem; font-family: monospace; margin: 0.5rem 0; }
    form { margin-top: 1.5rem; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; margin-bottom: 0.75rem; }
    button { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; }
    button:hover { background: #1d4ed8; }
    .error { color: #dc2626; margin-top: 0.5rem; display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔒 POS.com RMS</h1>
    <p class="status">Server Running</p>
    <p class="info">API Endpoints:</p>
    <div class="endpoint">POST /api/auth/login</div>
    <div class="endpoint">GET /api/issues</div>
    <div class="endpoint">GET /health</div>

    <form id="loginForm">
      <input type="text" id="username" placeholder="Username" value="admin" required>
      <input type="password" id="password" placeholder="Password" required>
      <button type="submit">Login</button>
      <p class="error" id="error"></p>
    </form>
    <p class="info" style="margin-top:1rem;font-size:0.875rem;">Default: admin / Admin123!</p>
  </div>
  <script>
    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const error = document.getElementById('error');
      error.style.display = 'none';
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
          })
        });
        const data = await res.json();
        if (data.success) {
          alert('Login successful! Token: ' + data.data.token.substring(0, 20) + '...');
          localStorage.setItem('rms_token', data.data.token);
        } else {
          error.textContent = data.error;
          error.style.display = 'block';
        }
      } catch (err) {
        error.textContent = 'Network error';
        error.style.display = 'block';
      }
    };
  </script>
</body>
</html>
      `);
    });
  }

  // Note: /health route is registered in status.ts via registerStatusRoutes()

  // Start server
  const address = await fastify.listen({ port: options.port, host: options.host });

  // Setup WebSocket with auth
  setupWebSocket(fastify.server, rmsDir, jwtSecret, userManager);

  streamLogger.info('Server started successfully', { address, port: options.port });
  streamLogger.info('Dashboard available', { url: address });

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
