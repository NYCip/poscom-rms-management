# Quick Start Guide - Playwright E2E Tests

## Installation

```bash
# From project root
cd packages/dashboard

# Install dependencies (including Playwright)
npm install

# Install Playwright browsers
npx playwright install chromium
```

## Running Tests

### Basic Commands

```bash
# Run all tests (headless mode)
npm run test:e2e

# Run tests with interactive UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Show HTML report
npm run test:e2e:report
```

### Advanced Commands

```bash
# Run specific test file
npx playwright test dashboard.spec.ts

# Run specific test by name
npx playwright test -g "Login Flow"

# Run single test
npx playwright test -g "should successfully login"

# Run tests on specific browser
npx playwright test --project=chromium

# Run with specific number of workers
npx playwright test --workers=4

# Update snapshots
npx playwright test --update-snapshots
```

## Test Organization

```
tests/
├── e2e/
│   ├── dashboard.spec.ts        # Main UI tests (35 tests)
│   ├── api-integration.spec.ts  # API tests (15 tests)
│   └── helpers.ts               # Helper functions
├── README.md                     # Full documentation
├── QUICK-START.md               # This file
└── TEST-REPORT-TEMPLATE.md      # Report template
```

## Common Scenarios

### 1. Run tests before committing

```bash
npm run test:e2e
```

### 2. Debug failing test

```bash
# Option 1: UI Mode (recommended)
npm run test:e2e:ui

# Option 2: Debug mode
npm run test:e2e:debug

# Option 3: Headed mode with slow motion
npx playwright test --headed --slow-mo=500
```

### 3. Run tests in CI

```bash
CI=true npm run test:e2e
```

### 4. Generate report after test run

```bash
npm run test:e2e:report
```

## Test Coverage

- **Login Flow:** 5 tests
- **Dashboard Navigation:** 6 tests
- **Kanban Board:** 4 tests
- **Module Editor:** 11 tests
- **Log Viewer:** 3 tests
- **Accessibility:** 3 tests
- **Responsive Design:** 2 tests
- **Error Handling:** 1 test
- **API Integration:** 15 tests

**Total:** 50 tests

## Default Test Credentials

```
Username: admin
Password: Admin123!
```

## Troubleshooting

### Tests fail with "browser not found"

```bash
npx playwright install chromium
```

### Tests fail with "port in use"

```bash
# Kill process on port 3000
npx kill-port 3000

# Or change port in playwright.config.ts
```

### Tests are slow

```bash
# Reduce timeout
npx playwright test --timeout=10000

# Increase workers
npx playwright test --workers=4
```

### Want to see what's happening

```bash
# Use headed mode
npm run test:e2e:headed

# Use UI mode for interactive debugging
npm run test:e2e:ui
```

## CI/CD

Tests automatically run on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

See `.github/workflows/dashboard-e2e-tests.yml`

## Best Practices

1. Run tests locally before pushing
2. Use UI mode for debugging
3. Check HTML report for failures
4. Keep tests independent
5. Use semantic selectors
6. Prefer accessibility snapshots

## Need Help?

- [Full README](./README.md)
- [Playwright Docs](https://playwright.dev/)
- [Test Report Template](./TEST-REPORT-TEMPLATE.md)

---

**Quick Start | POS.com RMS Dashboard E2E Tests**
