# Test Suite Index

Quick navigation for the POS.com RMS Dashboard E2E test suite.

## Getting Started

**New to the test suite?** Start here:
1. [QUICK-START.md](./QUICK-START.md) - Get running in 5 minutes
2. [README.md](./README.md) - Complete documentation

**Need a test report template?**
- [TEST-REPORT-TEMPLATE.md](./TEST-REPORT-TEMPLATE.md)

## Test Files

### Main Test Suites

| File | Tests | Description |
|------|-------|-------------|
| [dashboard.spec.ts](./e2e/dashboard.spec.ts) | 35 | UI functionality tests |
| [api-integration.spec.ts](./e2e/api-integration.spec.ts) | 15 | API and integration tests |
| [helpers.ts](./e2e/helpers.ts) | - | Reusable test utilities |

### Test Coverage by Category

#### UI Tests (35)
- **Login Flow** (5) - Authentication flows
- **Dashboard Navigation** (6) - Header, buttons, panels
- **Kanban Board** (4) - Columns, cards, layout
- **Module Editor** (11) - Form, tasks, validation
- **Log Viewer** (3) - Panel, loading, display
- **Accessibility** (3) - ARIA, semantic HTML
- **Responsive** (2) - Mobile, tablet viewports
- **Error Handling** (1) - Network errors

#### API Tests (15)
- **API Integration** (10) - Auth, endpoints, errors
- **WebSocket** (2) - Connection, reconnection
- **Data Persistence** (2) - Auth persistence, cleanup
- **Performance** (2) - Load times, concurrent requests

## Quick Reference

### Run Tests

```bash
npm run test:e2e           # Headless
npm run test:e2e:ui        # Interactive
npm run test:e2e:headed    # See browser
npm run test:e2e:debug     # Debug mode
npm run test:e2e:report    # Show report
```

### Using Helper Script

```bash
./run-tests.sh             # Run all
./run-tests.sh --ui        # Interactive
./run-tests.sh -t "Login"  # Specific tests
./run-tests.sh --help      # All options
```

## Documentation Structure

```
tests/
├── INDEX.md                      # This file - Navigation
├── QUICK-START.md                # 5-minute quick start
├── README.md                     # Complete documentation
├── TEST-REPORT-TEMPLATE.md       # Report template
└── e2e/
    ├── dashboard.spec.ts         # Main UI tests
    ├── api-integration.spec.ts   # API tests
    └── helpers.ts                # Test utilities
```

## Common Tasks

### Run Specific Tests

```bash
# By file
npx playwright test dashboard.spec.ts

# By name pattern
npx playwright test -g "Login"

# Single test
npx playwright test -g "should successfully login"
```

### Debug Failing Tests

```bash
# Best: UI Mode
npm run test:e2e:ui

# Alternative: Debug Mode
npm run test:e2e:debug

# Alternative: Headed + Slow Motion
npx playwright test --headed --slow-mo=500
```

### View Results

```bash
# After running tests
npm run test:e2e:report

# Or with script
./run-tests.sh --report
```

## Test Data

```
Default Login:
  Username: admin
  Password: Admin123!

Base URL:
  http://localhost:3000

Timeouts:
  Test: 30s
  Navigation: 10s
```

## Helper Functions

Commonly used helpers from `helpers.ts`:

```typescript
// Authentication
login(page, username?, password?)
logout(page)

// Module Editor
openModuleEditor(page)
closeModuleEditor(page, method?)
createModule(page, module)
addTaskToModule(page, taskTitle)

// Log Viewer
openLogViewer(page)
closeLogViewer(page)

// Utilities
verifyKanbanColumns(page)
verifyAccessibility(page)
setViewport(page, 'mobile'|'tablet'|'desktop')
waitForApiResponse(page, pattern)
```

## Configuration

Main config file: `../playwright.config.ts`

Key settings:
- Test directory: `./tests/e2e`
- Base URL: `http://localhost:3000`
- Browser: Chromium
- Reporters: HTML + List
- Screenshots: On failure
- Video: On retry

## CI/CD

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests

Workflow: `../../.github/workflows/dashboard-e2e-tests.yml`

## Need Help?

1. Check [QUICK-START.md](./QUICK-START.md) for common scenarios
2. Read [README.md](./README.md) for detailed documentation
3. Review [Playwright Docs](https://playwright.dev/)
4. Check test file comments for specifics

## File Paths

All paths relative to `/home/epic/dev/poscom-rms-management/packages/dashboard/`

- Configuration: `playwright.config.ts`
- Tests: `tests/e2e/*.spec.ts`
- Helpers: `tests/e2e/helpers.ts`
- Docs: `tests/*.md`
- Runner: `run-tests.sh`
- CI: `../../.github/workflows/dashboard-e2e-tests.yml`

---

**Test Suite Index | POS.com RMS Dashboard**
**Last Updated:** 2026-01-03
**Total Tests:** 50
