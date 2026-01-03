# POS.com RMS - Requirements Management System

AI-powered development workflow tool with dashboard UI for managing issues, SLA tracking, and Claude CLI integration.

## Features

- **Kanban Board** - Drag-and-drop issue management
- **Screenshot Paste** - Ctrl+V with annotation tools
- **SLA Tracking** - Real-time countdown timers with Teams notifications
- **CLI Bridge** - Execute Claude commands from dashboard
- **AI Categorization** - Automatic issue classification
- **Git Integration** - Auto-link commits and PRs
- **Workflow Engine** - YAML-based configurable workflows

## Quick Start

```bash
# Install dependencies
pnpm install

# Run migrations
pnpm --filter @pos.com/data run migrate

# Start development
pnpm run dev

# Start dashboard
pnpm --filter @pos.com/cli run dashboard
```

## Requirements

- Node.js 20+
- pnpm 8+
- Claude Code (for CLI integration)

## Documentation

See [CLAUDE.md](./CLAUDE.md) for development guidelines.

## License

MIT
