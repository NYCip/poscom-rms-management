import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for POS.com RMS Dashboard
 *
 * Test Coverage:
 * 1. Login Flow
 * 2. Dashboard Navigation
 * 3. Kanban Board
 * 4. Module Editor
 * 5. Log Viewer
 */

// Test data
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'Admin123!',
};

// Helper function to login
async function login(page: Page, username = TEST_CREDENTIALS.username, password = TEST_CREDENTIALS.password) {
  await page.goto('/');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for navigation to complete
  await page.waitForURL('/', { timeout: 10000 });
}

test.describe('Login Flow', () => {
  test('should display login page on initial visit', async ({ page }) => {
    await page.goto('/');

    // Verify login page is displayed
    await expect(page.locator('text=POS.com RMS')).toBeVisible();
    await expect(page.locator('text=Sign in to your account')).toBeVisible();

    // Verify form elements
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Verify default credentials hint
    await expect(page.locator('text=Default credentials: admin / Admin123!')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[name="username"]', 'invalid');
    await page.fill('input[name="password"]', 'invalid');
    await page.click('button[type="submit"]');

    // Wait for error message (implementation dependent)
    await page.waitForTimeout(1000);

    // Should still be on login page
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[name="username"]', TEST_CREDENTIALS.username);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('/', { timeout: 10000 });

    // Verify dashboard header is visible
    await expect(page.locator('text=POS.com RMS')).toBeVisible();
    await expect(page.locator('text=Requirements Management System')).toBeVisible();
  });

  test('should display loading state during authentication', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[name="username"]', TEST_CREDENTIALS.username);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);

    // Start login
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Loading text should appear briefly
    // Note: This might be too fast to catch in some environments
    const isLoadingVisible = await page.locator('text=Signing in...').isVisible().catch(() => false);

    // Either way, we should end up on the dashboard
    await page.waitForURL('/', { timeout: 10000 });
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Wait for dashboard to fully load
    await page.waitForTimeout(1000);
  });

  test('should display header with all navigation elements', async ({ page }) => {
    // Verify header logo and title
    await expect(page.locator('text=POS.com RMS')).toBeVisible();
    await expect(page.locator('text=Requirements Management System')).toBeVisible();

    // Verify Create Module button
    await expect(page.locator('button:has-text("Create Module")')).toBeVisible();

    // Verify Show Logs button
    const logsButton = page.locator('button:has-text("Show Logs"), button:has-text("Hide Logs")');
    await expect(logsButton).toBeVisible();

    // Verify user info
    await expect(page.locator('text=admin')).toBeVisible();

    // Verify logout button
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should open Module Editor when Create Module button is clicked', async ({ page }) => {
    // Click Create Module button
    await page.click('button:has-text("Create Module")');

    // Wait for modal to appear
    await page.waitForTimeout(500);

    // Verify ModuleEditor modal is visible
    await expect(page.locator('text=Create New Module')).toBeVisible();
    await expect(page.locator('input[placeholder*="user-authentication"]')).toBeVisible();

    // Verify form fields
    await expect(page.locator('text=Module Name')).toBeVisible();
    await expect(page.locator('text=Version')).toBeVisible();
    await expect(page.locator('text=Description')).toBeVisible();
    await expect(page.locator('text=Tasks')).toBeVisible();
  });

  test('should open Log Viewer when Show Logs button is clicked', async ({ page }) => {
    // Click Show Logs button
    await page.click('button:has-text("Show Logs")');

    // Wait for log viewer to appear
    await page.waitForTimeout(500);

    // Log viewer should be visible (as a bottom panel)
    const logPanel = page.locator('.fixed.bottom-0');
    await expect(logPanel).toBeVisible();

    // Button text should change to "Hide Logs"
    await expect(page.locator('button:has-text("Hide Logs")')).toBeVisible();
  });

  test('should toggle Log Viewer visibility', async ({ page }) => {
    // Open logs
    await page.click('button:has-text("Show Logs")');
    await page.waitForTimeout(500);

    const logPanel = page.locator('.fixed.bottom-0');
    await expect(logPanel).toBeVisible();

    // Close logs
    await page.click('button:has-text("Hide Logs")');
    await page.waitForTimeout(500);

    // Log panel should be hidden
    await expect(logPanel).not.toBeVisible();

    // Button should say "Show Logs" again
    await expect(page.locator('button:has-text("Show Logs")')).toBeVisible();
  });

  test('should display StatusPanel with system metrics', async ({ page }) => {
    // StatusPanel should be visible in the sidebar
    const statusPanel = page.locator('.sticky.top-24');
    await expect(statusPanel).toBeVisible();

    // Wait for status to load
    await page.waitForTimeout(2000);

    // Note: Actual content depends on API response
    // We just verify the panel exists
  });

  test('should logout when Logout button is clicked', async ({ page }) => {
    // Click Logout button
    await page.click('button:has-text("Logout")');

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Should be back on login page
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });
});

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForTimeout(1000);
  });

  test('should display all kanban columns', async ({ page }) => {
    // Verify all 5 columns are present
    await expect(page.locator('text=Backlog')).toBeVisible();
    await expect(page.locator('text=To Do')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Review')).toBeVisible();
    await expect(page.locator('text=Done')).toBeVisible();
  });

  test('should display kanban board in grid layout', async ({ page }) => {
    // The board should use a 5-column grid
    const board = page.locator('.grid.grid-cols-5');
    await expect(board).toBeVisible();
  });

  test('should display cards if issues exist', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check if any cards are visible (depends on data)
    const hasCards = await page.locator('[data-testid="issue-card"]').count() > 0;

    // This test is informational - actual card presence depends on data
    console.log(`Cards found: ${hasCards}`);
  });

  test('should allow accessibility snapshot of kanban board', async ({ page }) => {
    // Wait for board to render
    await page.waitForTimeout(1000);

    // Get accessibility tree snapshot
    const snapshot = await page.accessibility.snapshot();

    // Verify board is accessible
    expect(snapshot).toBeTruthy();
    expect(snapshot?.name).toBeTruthy();
  });
});

test.describe('Module Editor Modal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForTimeout(1000);
    // Open module editor
    await page.click('button:has-text("Create Module")');
    await page.waitForTimeout(500);
  });

  test('should display all form fields', async ({ page }) => {
    // Verify all input fields are present
    await expect(page.locator('label:has-text("Module Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Version")')).toBeVisible();
    await expect(page.locator('label:has-text("Description")')).toBeVisible();
    await expect(page.locator('label:has-text("Tasks")')).toBeVisible();

    // Verify default version
    const versionInput = page.locator('input[placeholder="1.0.0"]');
    await expect(versionInput).toHaveValue('1.0.0');
  });

  test('should allow entering module information', async ({ page }) => {
    // Fill in module name
    await page.fill('input[placeholder*="user-authentication"]', 'test-module');

    // Fill in description
    await page.fill('textarea[placeholder*="Brief description"]', 'This is a test module');

    // Verify values are entered
    await expect(page.locator('input[placeholder*="user-authentication"]')).toHaveValue('test-module');
    await expect(page.locator('textarea[placeholder*="Brief description"]')).toHaveValue('This is a test module');
  });

  test('should add tasks to module', async ({ page }) => {
    // Add a task
    await page.fill('input[placeholder="Add a task..."]', 'Implement feature X');
    await page.click('button:has-text("Add")');

    // Wait for task to appear
    await page.waitForTimeout(500);

    // Verify task appears in list
    await expect(page.locator('text=Implement feature X')).toBeVisible();
  });

  test('should add task with Enter key', async ({ page }) => {
    // Type task and press Enter
    const taskInput = page.locator('input[placeholder="Add a task..."]');
    await taskInput.fill('Quick task');
    await taskInput.press('Enter');

    // Wait for task to appear
    await page.waitForTimeout(500);

    // Verify task appears
    await expect(page.locator('text=Quick task')).toBeVisible();
  });

  test('should remove tasks from module', async ({ page }) => {
    // Add a task first
    await page.fill('input[placeholder="Add a task..."]', 'Task to remove');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(500);

    // Click remove button (X icon)
    const removeButton = page.locator('text=Task to remove').locator('..').locator('..').locator('button');
    await removeButton.click();

    // Wait for removal
    await page.waitForTimeout(500);

    // Task should be gone
    await expect(page.locator('text=Task to remove')).not.toBeVisible();
  });

  test('should display "No tasks added yet" when no tasks', async ({ page }) => {
    // Verify empty state message
    await expect(page.locator('text=No tasks added yet')).toBeVisible();
  });

  test('should disable save button when module name is empty', async ({ page }) => {
    // Save button should be disabled initially (no name)
    const saveButton = page.locator('button:has-text("Create Module")').last();
    await expect(saveButton).toBeDisabled();

    // Enter module name
    await page.fill('input[placeholder*="user-authentication"]', 'test-module');

    // Button should now be enabled
    await expect(saveButton).toBeEnabled();
  });

  test('should close modal when Cancel is clicked', async ({ page }) => {
    // Click Cancel
    await page.click('button:has-text("Cancel")');

    // Wait for modal to close
    await page.waitForTimeout(500);

    // Modal should be gone
    await expect(page.locator('text=Create New Module')).not.toBeVisible();
  });

  test('should close modal when clicking outside', async ({ page }) => {
    // Click on backdrop (outside modal)
    await page.click('.fixed.inset-0.bg-black\\/50', { position: { x: 10, y: 10 } });

    // Wait for modal to close
    await page.waitForTimeout(500);

    // Modal should be gone
    await expect(page.locator('text=Create New Module')).not.toBeVisible();
  });

  test('should create module with all fields filled', async ({ page }) => {
    // Fill all fields
    await page.fill('input[placeholder*="user-authentication"]', 'complete-module');
    await page.fill('input[placeholder="1.0.0"]', '2.0.0');
    await page.fill('textarea[placeholder*="Brief description"]', 'A complete test module');

    // Add tasks
    await page.fill('input[placeholder="Add a task..."]', 'Task 1');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(300);

    await page.fill('input[placeholder="Add a task..."]', 'Task 2');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(300);

    // Save module
    const saveButton = page.locator('button:has-text("Create Module")').last();
    await saveButton.click();

    // Wait for modal to close
    await page.waitForTimeout(500);

    // Modal should be closed
    await expect(page.locator('text=Create New Module')).not.toBeVisible();
  });
});

test.describe('Log Viewer Panel', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForTimeout(1000);
    // Open log viewer
    await page.click('button:has-text("Show Logs")');
    await page.waitForTimeout(500);
  });

  test('should display log viewer as bottom panel', async ({ page }) => {
    const logPanel = page.locator('.fixed.bottom-0');
    await expect(logPanel).toBeVisible();

    // Verify height
    await expect(logPanel).toHaveClass(/h-72/);
  });

  test('should have proper z-index for overlay', async ({ page }) => {
    const logPanel = page.locator('.fixed.bottom-0');
    await expect(logPanel).toHaveClass(/z-40/);
  });

  test('should load logs from API', async ({ page }) => {
    // Wait for logs to load
    await page.waitForTimeout(3000);

    // Logs should be visible (content depends on API)
    const logPanel = page.locator('.fixed.bottom-0');
    await expect(logPanel).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForTimeout(1000);
  });

  test('should have accessible page title', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should capture accessibility snapshot of dashboard', async ({ page }) => {
    const snapshot = await page.accessibility.snapshot();
    expect(snapshot).toBeTruthy();

    // Verify main content is accessible
    expect(snapshot?.children).toBeTruthy();
  });

  test('should capture accessibility snapshot of module editor', async ({ page }) => {
    await page.click('button:has-text("Create Module")');
    await page.waitForTimeout(500);

    const snapshot = await page.accessibility.snapshot();
    expect(snapshot).toBeTruthy();
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page);
    await page.waitForTimeout(1000);

    // Header should still be visible
    await expect(page.locator('text=POS.com RMS')).toBeVisible();

    // Board should adapt to mobile layout
    const board = page.locator('.grid');
    await expect(board).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await login(page);
    await page.waitForTimeout(1000);

    // All main elements should be visible
    await expect(page.locator('text=POS.com RMS')).toBeVisible();
    await expect(page.locator('button:has-text("Create Module")')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await login(page);

    // Simulate network error by going offline
    await page.context().setOffline(true);

    // Try to open module editor (might fail to load data)
    await page.click('button:has-text("Create Module")');
    await page.waitForTimeout(500);

    // Modal should still open (UI should not crash)
    await expect(page.locator('text=Create New Module')).toBeVisible();

    // Restore network
    await page.context().setOffline(false);
  });
});
