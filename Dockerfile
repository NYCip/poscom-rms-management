# ============================================
# POS.com RMS - Production Dockerfile
# ============================================
# Multi-stage build for minimal image size

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/data/package.json ./packages/data/
COPY packages/agents/package.json ./packages/agents/
COPY packages/cli/package.json ./packages/cli/
COPY packages/dashboard/package.json ./packages/dashboard/
COPY packages/integrations/package.json ./packages/integrations/
COPY packages/testing/package.json ./packages/testing/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all packages
RUN pnpm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Create non-root user for security
RUN addgroup -g 1001 -S rms && \
    adduser -S rms -u 1001 -G rms

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/data/package.json ./packages/data/
COPY packages/agents/package.json ./packages/agents/
COPY packages/cli/package.json ./packages/cli/
COPY packages/dashboard/package.json ./packages/dashboard/
COPY packages/integrations/package.json ./packages/integrations/
COPY packages/testing/package.json ./packages/testing/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/data/dist ./packages/data/dist
COPY --from=builder /app/packages/agents/dist ./packages/agents/dist
COPY --from=builder /app/packages/cli/dist ./packages/cli/dist
COPY --from=builder /app/packages/dashboard/dist ./packages/dashboard/dist
COPY --from=builder /app/packages/integrations/dist ./packages/integrations/dist

# Create data directory
RUN mkdir -p /app/.rms && chown -R rms:rms /app

# Switch to non-root user
USER rms

# Environment
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start server
CMD ["node", "packages/cli/dist/index.js", "serve", "--port", "4000"]
