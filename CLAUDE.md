# POS.com RMS - Claude Code Guidelines

## Project Overview

POS.com RMS (Requirements Management System) is an AI-powered development workflow tool with a React dashboard that integrates with Claude CLI for issue management, SLA tracking, and automated workflows.

## Build & Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Development mode (watch all packages)
pnpm run dev

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
pnpm run lint:fix

# Testing
pnpm run test
pnpm run test:coverage

# Format code
pnpm run format
```

## Project Structure

```
@pos.com/rms-workflow/
├── packages/
│   ├── core/           # Shared types, schemas, utilities
│   ├── data/           # SQLite database layer
│   ├── agents/         # AI agent definitions (5 agents)
│   ├── integrations/   # Git, Teams, Claude CLI
│   ├── cli/            # Node.js CLI + API server
│   └── dashboard/      # React 19 + shadcn/ui
```

## Package Dependencies

- `@pos.com/core` - No dependencies (base package)
- `@pos.com/data` - Depends on `@pos.com/core`
- `@pos.com/agents` - Depends on `@pos.com/core`, `@pos.com/data`
- `@pos.com/integrations` - Depends on `@pos.com/core`
- `@pos.com/cli` - Depends on all packages
- `@pos.com/dashboard` - Depends on `@pos.com/core`

## Architecture Patterns

### Result Type for Error Handling

```typescript
import { ok, err, type Result } from '@pos.com/core';

async function createIssue(input: CreateIssueInput): Promise<Result<Issue, Error>> {
  try {
    const issue = await repo.create(input);
    return ok(issue);
  } catch (error) {
    return err(error as Error);
  }
}
```

### Optimistic Locking

```typescript
// Update with version check
const result = repo.update(id, updates, expectedVersion);
if (result.success === false && result.error instanceof OptimisticLockError) {
  // Handle concurrent modification
}
```

### Event-Driven Agent Communication

Events flow through the message bus:
- `issue:created` → Issue Manager, Workflow Enforcer, RMS-Learner
- `issue:updated` → Workflow Enforcer, UI Assistant
- `sla:warning` → UI Assistant, Teams Integration
- `cli:execute` → CLI Command Repository

## Database

SQLite with WAL mode. Migrations in `packages/data/src/migrations/`.

```bash
# Run migrations
pnpm --filter @pos.com/data run migrate
```

## Code Standards

- TypeScript strict mode with `noUncheckedIndexedAccess`
- ESLint + Prettier for formatting
- Use `type` imports: `import type { Issue } from '@pos.com/core'`
- File naming: PascalCase for components, kebab-case for utilities

## Key Technologies

- **Runtime**: Node.js 20+
- **Package Manager**: pnpm 8+
- **Build**: Turborepo + esbuild (CLI) + Vite (dashboard)
- **Database**: SQLite (better-sqlite3)
- **Frontend**: React 19, shadcn/ui, Tailwind CSS 4, Zustand
- **API**: Fastify + Socket.IO
- **Testing**: Vitest + Playwright

## Agent Architecture

5 agents orchestrated by Epic-RMS:
1. **Epic-RMS** - Orchestrator, routes commands to specialists
2. **Issue Manager** - CRUD, AI categorization
3. **Workflow Enforcer** - SLA tracking, stage transitions
4. **UI Assistant** - Notifications, exports
5. **RMS-Learner** - Pattern detection, optimization

## Testing Commands

```bash
# Unit tests
pnpm run test

# Coverage report
pnpm run test:coverage

# E2E tests (dashboard)
pnpm --filter @pos.com/dashboard run test:e2e
```
