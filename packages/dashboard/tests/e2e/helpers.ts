import { type Page, expect } from '@playwright/test';

/**
 * Test helper functions for POS.com RMS Dashboard E2E tests
 */

// Default test credentials
export const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'Admin123!',
};

/**
 * Login helper - authenticates user and waits for dashboard to load
 */
export async function login(
  page: Page,
  username = TEST_CREDENTIALS.username,
  password = TEST_CREDENTIALS.password
): Promise<void> {
  await page.goto('/');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL('/', { timeout: 10000 });

  // Wait for dashboard to fully load
  await page.waitForSelector('text=POS.com RMS', { timeout: 5000 });
}

/**
 * Logout helper - clicks logout button and waits for login page
 */
export async function logout(page: Page): Promise<void> {
  await page.click('button:has-text("Logout")');
  await page.waitForSelector('text=Sign in to your account', { timeout: 5000 });
}

/**
 * Open Module Editor helper
 */
export async function openModuleEditor(page: Page): Promise<void> {
  await page.click('button:has-text("Create Module")');
  await page.waitForSelector('text=Create New Module', { timeout: 5000 });
}

/**
 * Close Module Editor helper
 */
export async function closeModuleEditor(page: Page, method: 'cancel' | 'backdrop' | 'save' = 'cancel'): Promise<void> {
  if (method === 'cancel') {
    await page.click('button:has-text("Cancel")');
  } else if (method === 'backdrop') {
    await page.click('.fixed.inset-0.bg-black\\/50', { position: { x: 10, y: 10 } });
  } else if (method === 'save') {
    await page.click('button:has-text("Create Module")').last();
  }

  await page.waitForTimeout(500);
}

/**
 * Open Log Viewer helper
 */
export async function openLogViewer(page: Page): Promise<void> {
  await page.click('button:has-text("Show Logs")');
  await page.waitForSelector('.fixed.bottom-0', { timeout: 5000 });
}

/**
 * Close Log Viewer helper
 */
export async function closeLogViewer(page: Page): Promise<void> {
  await page.click('button:has-text("Hide Logs")');
  await page.waitForTimeout(500);
}

/**
 * Add task to module editor
 */
export async function addTaskToModule(page: Page, taskTitle: string): Promise<void> {
  await page.fill('input[placeholder="Add a task..."]', taskTitle);
  await page.click('button:has-text("Add")');
  await page.waitForTimeout(500);
}

/**
 * Create a complete module with tasks
 */
export async function createModule(
  page: Page,
  module: {
    name: string;
    version?: string;
    description?: string;
    tasks?: string[];
  }
): Promise<void> {
  await openModuleEditor(page);

  // Fill module name
  await page.fill('input[placeholder*="user-authentication"]', module.name);

  // Fill version if provided
  if (module.version) {
    await page.fill('input[placeholder="1.0.0"]', module.version);
  }

  // Fill description if provided
  if (module.description) {
    await page.fill('textarea[placeholder*="Brief description"]', module.description);
  }

  // Add tasks if provided
  if (module.tasks && module.tasks.length > 0) {
    for (const task of module.tasks) {
      await addTaskToModule(page, task);
    }
  }

  // Save module
  const saveButton = page.locator('button:has-text("Create Module")').last();
  await saveButton.click();

  // Wait for modal to close
  await page.waitForTimeout(500);
}

/**
 * Verify kanban columns are visible
 */
export async function verifyKanbanColumns(page: Page): Promise<void> {
  const columns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];

  for (const column of columns) {
    await expect(page.locator(`text=${column}`)).toBeVisible();
  }
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Take accessibility snapshot and verify it's valid
 */
export async function verifyAccessibility(page: Page): Promise<void> {
  const snapshot = await page.accessibility.snapshot();
  expect(snapshot).toBeTruthy();
  expect(snapshot?.name).toBeTruthy();
}

/**
 * Simulate network offline mode
 */
export async function setOffline(page: Page, offline = true): Promise<void> {
  await page.context().setOffline(offline);
}

/**
 * Set viewport size for responsive testing
 */
export async function setViewport(
  page: Page,
  size: 'mobile' | 'tablet' | 'desktop'
): Promise<void> {
  const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
  };

  await page.setViewportSize(viewports[size]);
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page, timeout = 5000): Promise<void> {
  // Wait for any loading spinners to disappear
  await page.waitForTimeout(1000);

  // Additional checks can be added here
  // e.g., wait for specific loading indicators to disappear
}

/**
 * Screenshot with metadata
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  fullPage = false
): Promise<void> {
  await page.screenshot({
    path: `playwright-screenshots/${name}.png`,
    fullPage,
  });
}

/**
 * Verify element is in viewport
 */
export async function isElementInViewport(
  page: Page,
  selector: string
): Promise<boolean> {
  const element = page.locator(selector);
  const box = await element.boundingBox();

  if (!box) return false;

  const viewport = page.viewportSize();
  if (!viewport) return false;

  return (
    box.y >= 0 &&
    box.x >= 0 &&
    box.y + box.height <= viewport.height &&
    box.x + box.width <= viewport.width
  );
}
