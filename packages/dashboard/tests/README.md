# POS.com RMS Dashboard E2E Tests

Comprehensive end-to-end testing suite for the POS.com RMS Dashboard using Playwright.

## Overview

This test suite provides automated browser-based testing for:

- **Login Flow** - Authentication and authorization
- **Dashboard Navigation** - Header, buttons, and navigation elements
- **Kanban Board** - Column display and card interaction
- **Module Editor** - Create/edit module modal functionality
- **Log Viewer** - Bottom panel log display
- **Accessibility** - ARIA compliance and semantic HTML
- **Responsive Design** - Mobile, tablet, and desktop viewports
- **Error Handling** - Network errors and edge cases

## Test Structure

```
tests/
├── e2e/
│   ├── dashboard.spec.ts    # Main test suite
│   └── helpers.ts            # Test helper functions
└── README.md                 # This file
```

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers (if not already installed):
```bash
npx playwright install chromium
```

### Run Tests

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

### Run Specific Tests

```bash
# Run specific test file
npx playwright test dashboard.spec.ts

# Run tests matching a pattern
npx playwright test -g "Login Flow"

# Run single test
npx playwright test -g "should successfully login"
```

## Test Scenarios

### 1. Login Flow (5 tests)

- Display login page on initial visit
- Show error on invalid credentials
- Successfully login with valid credentials
- Display loading state during authentication
- Verify form elements are present

**Default Credentials:**
- Username: `admin`
- Password: `Admin123!`

### 2. Dashboard Navigation (6 tests)

- Display header with all navigation elements
- Open Module Editor when Create Module button clicked
- Open Log Viewer when Show Logs button clicked
- Toggle Log Viewer visibility
- Display StatusPanel with system metrics
- Logout when Logout button clicked

### 3. Kanban Board (4 tests)

- Display all 5 kanban columns (Backlog, To Do, In Progress, Review, Done)
- Display board in grid layout
- Display cards if issues exist
- Allow accessibility snapshot of board

### 4. Module Editor Modal (11 tests)

- Display all form fields
- Allow entering module information
- Add tasks to module
- Add task with Enter key
- Remove tasks from module
- Display "No tasks added yet" when empty
- Disable save button when name is empty
- Close modal when Cancel clicked
- Close modal when clicking outside
- Create module with all fields filled

### 5. Log Viewer Panel (3 tests)

- Display log viewer as bottom panel
- Have proper z-index for overlay
- Load logs from API

### 6. Accessibility (3 tests)

- Have accessible page title
- Capture accessibility snapshot of dashboard
- Capture accessibility snapshot of module editor

### 7. Responsive Design (2 tests)

- Display correctly on mobile viewport (375x667)
- Display correctly on tablet viewport (768x1024)

### 8. Error Handling (1 test)

- Handle network errors gracefully

## Test Helpers

The `helpers.ts` file provides reusable functions:

### Authentication
- `login(page, username?, password?)` - Login and wait for dashboard
- `logout(page)` - Logout and return to login page

### Module Editor
- `openModuleEditor(page)` - Open module editor modal
- `closeModuleEditor(page, method?)` - Close modal (cancel/backdrop/save)
- `addTaskToModule(page, taskTitle)` - Add task to module
- `createModule(page, module)` - Complete module creation flow

### Log Viewer
- `openLogViewer(page)` - Open log viewer panel
- `closeLogViewer(page)` - Close log viewer panel

### Verification
- `verifyKanbanColumns(page)` - Verify all columns are visible
- `verifyAccessibility(page)` - Take and verify accessibility snapshot

### Utilities
- `waitForApiResponse(page, urlPattern, timeout?)` - Wait for API call
- `setOffline(page, offline)` - Simulate network offline
- `setViewport(page, size)` - Set responsive viewport
- `waitForLoading(page, timeout?)` - Wait for loading states
- `takeScreenshot(page, name, fullPage?)` - Capture screenshot
- `isElementInViewport(page, selector)` - Check element visibility

## Configuration

Test configuration is in `playwright.config.ts`:

```typescript
{
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  }
}
```

### Environment Variables

- `CI` - Set to enable CI mode (more retries, single worker)

## Testing Strategy

### Prefer Accessibility Snapshots

Use accessibility snapshots over screenshots when possible:

```typescript
// GOOD - Fast, semantic, reliable
const snapshot = await page.accessibility.snapshot();
expect(snapshot).toBeTruthy();

// AVOID - Slow, brittle
await page.screenshot();
```

### Use Semantic Selectors

Prefer semantic selectors over fragile ones:

```typescript
// GOOD
await page.click('button:has-text("Create Module")');
await page.locator('input[name="username"]');

// AVOID
await page.click('.btn-primary-123');
```

### Wait for Elements Properly

Use explicit waits instead of arbitrary timeouts:

```typescript
// GOOD
await page.waitForSelector('text=Create New Module');
await page.waitForURL('/');

// AVOID (when possible)
await page.waitForTimeout(5000);
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npx playwright install chromium
      - run: npm run test:e2e
        env:
          CI: true
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### Visual Debugging

```bash
# UI Mode (best for development)
npm run test:e2e:ui

# Debug Mode (step through tests)
npm run test:e2e:debug

# Headed Mode (see browser)
npm run test:e2e:headed
```

### Playwright Inspector

The debug mode opens Playwright Inspector where you can:
- Step through test execution
- Inspect DOM at each step
- See console logs and network activity
- Edit and re-run tests

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots (on failure)
- Videos (on failure, if enabled)
- Traces (on first retry)

View in the HTML report:
```bash
npm run test:e2e:report
```

## Best Practices

1. **Independent Tests** - Each test should be self-contained
2. **Clean State** - Use `beforeEach` to reset state
3. **Explicit Waits** - Wait for elements, not arbitrary timeouts
4. **Semantic Selectors** - Use accessible, meaningful selectors
5. **Helper Functions** - Reuse common actions via helpers
6. **Error Messages** - Use descriptive assertions
7. **Accessibility First** - Use accessibility snapshots when possible

## Troubleshooting

### Tests Fail Locally

1. Ensure dev server is running: `npm run dev`
2. Check Playwright is installed: `npx playwright install`
3. Clear browser cache: `npx playwright clean`

### Tests Pass Locally but Fail in CI

1. Check CI environment variables
2. Increase timeout values
3. Enable video recording to debug
4. Use `page.waitForLoadState('networkidle')`

### Flaky Tests

1. Add explicit waits instead of timeouts
2. Use `page.waitForSelector` with timeout
3. Check for race conditions
4. Enable retries in playwright.config.ts

## Performance Metrics

Typical test execution times:
- Login Flow: ~5-8 seconds
- Dashboard Navigation: ~10-15 seconds
- Kanban Board: ~5-8 seconds
- Module Editor: ~15-20 seconds
- Full Suite: ~60-90 seconds

## Contributing

When adding new tests:

1. Follow existing test structure
2. Add test to appropriate `describe` block
3. Use helper functions for common actions
4. Add new helpers to `helpers.ts`
5. Update this README with new scenarios
6. Ensure tests are independent and idempotent

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [CI/CD Integration](https://playwright.dev/docs/ci)

---

**POS.com RMS Agents v1.0.0 | E2E Testing with Playwright**
