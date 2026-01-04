import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { UserManager, User } from './users.js';

// Custom user type for our app
export type SafeUser = Omit<User, 'passwordHash'>;

// Input sanitization helpers
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  // Remove null bytes, trim whitespace, limit length
  return input.replace(/\0/g, '').trim().slice(0, 256);
}

function isValidUsername(username: string): boolean {
  // Alphanumeric, underscore, hyphen, 3-50 chars
  return /^[a-zA-Z0-9_-]{3,50}$/.test(username);
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { username: string; role: string };
    user: SafeUser;
  }
}

export function setupAuth(fastify: FastifyInstance, userManager: UserManager, jwtSecret: string) {
  // Register JWT plugin with shorter session timeout for security
  fastify.register(import('@fastify/jwt'), {
    secret: jwtSecret,
    cookie: {
      cookieName: 'rms_token',
      signed: false,
    },
    sign: {
      expiresIn: process.env['SESSION_TIMEOUT'] || '4h', // 4 hour default session
    },
  });

  // Register cookie plugin
  fastify.register(import('@fastify/cookie'), {
    secret: jwtSecret,
    hook: 'onRequest',
  });

  // Auth decorator
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // Try cookie first, then Authorization header
      const token = request.cookies['rms_token'] || request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return reply.status(401).send({ success: false, error: 'Authentication required' });
      }

      const decoded = fastify.jwt.verify<{ username: string; role: string }>(token);
      const user = userManager.getUser(decoded.username);

      if (!user) {
        return reply.status(401).send({ success: false, error: 'User not found' });
      }

      request.user = user;
    } catch {
      return reply.status(401).send({ success: false, error: 'Invalid or expired token' });
    }
  });

  // Admin-only decorator
  fastify.decorate('requireAdmin', async function (request: FastifyRequest, reply: FastifyReply) {
    if (request.user?.role !== 'admin') {
      return reply.status(403).send({ success: false, error: 'Admin access required' });
    }
  });
}

export function registerAuthRoutes(fastify: FastifyInstance, userManager: UserManager) {
  // Login with rate limiting and input validation
  fastify.post<{ Body: { username: string; password: string } }>('/api/auth/login', {
    config: {
      rateLimit: {
        max: 5, // Max 5 login attempts
        timeWindow: '15 minutes',
        errorResponseBuilder: () => ({
          success: false,
          error: 'Too many login attempts. Please try again in 15 minutes.',
          statusCode: 429,
        }),
      },
    },
  }, async (request, reply) => {
    // Sanitize and validate input
    const username = sanitizeInput(request.body?.username || '');
    const password = request.body?.password || '';

    if (!username || !password) {
      return reply.status(400).send({ success: false, error: 'Username and password required' });
    }

    if (!isValidUsername(username)) {
      return reply.status(400).send({ success: false, error: 'Invalid username format' });
    }

    if (password.length < 8 || password.length > 128) {
      // Generic error to prevent username enumeration
      await new Promise(r => setTimeout(r, 1000));
      return reply.status(401).send({ success: false, error: 'Invalid credentials' });
    }

    const user = await userManager.validatePassword(username, password);
    if (!user) {
      // Add delay to prevent timing attacks
      await new Promise(r => setTimeout(r, 1000));
      return reply.status(401).send({ success: false, error: 'Invalid credentials' });
    }

    const token = fastify.jwt.sign({ username: user.username, role: user.role });

    // Set secure cookie with appropriate settings
    reply.setCookie('rms_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 4 * 60 * 60, // 4 hours (matches JWT expiry)
    });

    const { passwordHash, ...safeUser } = user;
    return { success: true, data: { user: safeUser, token } };
  });

  // Logout
  fastify.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie('rms_token', { path: '/' });
    return { success: true };
  });

  // Get current user
  fastify.get('/api/auth/me', {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    return { success: true, data: { user: request.user } };
  });

  // Change password
  fastify.post<{ Body: { oldPassword: string; newPassword: string } }>('/api/auth/change-password', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { oldPassword, newPassword } = request.body;

    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Not authenticated' });
    }

    try {
      const changed = await userManager.changePassword(request.user.username, oldPassword, newPassword);
      if (!changed) {
        return reply.status(400).send({ success: false, error: 'Invalid current password' });
      }
      return { success: true };
    } catch (error) {
      return reply.status(400).send({ success: false, error: (error as Error).message });
    }
  });

  // Admin: List users
  fastify.get('/api/auth/users', {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async () => {
    return { success: true, data: userManager.listUsers() };
  });

  // Admin: Create user
  fastify.post<{ Body: { username: string; password: string; role?: 'admin' | 'user' | 'viewer' } }>('/api/auth/users', {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request, reply) => {
    const { username, password, role = 'user' } = request.body;

    try {
      const user = await userManager.createUser(username, password, role);
      const { passwordHash, ...safeUser } = user;
      return reply.status(201).send({ success: true, data: safeUser });
    } catch (error) {
      return reply.status(400).send({ success: false, error: (error as Error).message });
    }
  });

  // Admin: Delete user
  fastify.delete<{ Params: { username: string } }>('/api/auth/users/:username', {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request, reply) => {
    try {
      const deleted = await userManager.deleteUser(request.params.username);
      if (!deleted) {
        return reply.status(404).send({ success: false, error: 'User not found' });
      }
      return { success: true };
    } catch (error) {
      return reply.status(400).send({ success: false, error: (error as Error).message });
    }
  });
}

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
