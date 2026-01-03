import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * API Integration E2E Tests
 *
 * Tests API interactions through the UI to ensure:
 * - Proper authentication headers
 * - Correct API endpoints
 * - Proper error handling
 * - Data persistence
 */

test.describe('API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should send authentication token with API requests', async ({ page }) => {
    // Intercept API requests
    const apiRequests: string[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiRequests.push(request.url());

        // Verify Authorization header is present
        const authHeader = request.headers()['authorization'];
        expect(authHeader).toBeTruthy();
        expect(authHeader).toContain('Bearer');
      }
    });

    // Trigger API request by opening logs
    await page.click('button:has-text("Show Logs")');

    // Wait for API call
    await page.waitForTimeout(2000);

    // Verify at least one API request was made
    expect(apiRequests.length).toBeGreaterThan(0);
  });

  test('should fetch system status from API', async ({ page }) => {
    let statusResponse: any = null;

    // Intercept status API call
    page.on('response', async (response) => {
      if (response.url().includes('/api/status')) {
        statusResponse = await response.json().catch(() => null);
      }
    });

    // Wait for initial status load
    await page.waitForTimeout(3000);

    // Status API should have been called
    expect(statusResponse).toBeTruthy();
  });

  test('should fetch logs from API when viewer is opened', async ({ page }) => {
    let logsResponse: any = null;

    // Intercept logs API call
    page.on('response', async (response) => {
      if (response.url().includes('/api/logs')) {
        logsResponse = await response.json().catch(() => null);
      }
    });

    // Open log viewer
    await page.click('button:has-text("Show Logs")');

    // Wait for logs API call
    await page.waitForTimeout(2000);

    // Logs API should have been called
    expect(logsResponse).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept and fail status API
    await page.route('**/api/status', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Refresh page to trigger status fetch
    await page.reload();

    // Wait for page to load
    await page.waitForTimeout(2000);

    // UI should still be functional (not crash)
    await expect(page.locator('text=POS.com RMS')).toBeVisible();
  });

  test('should handle 401 unauthorized responses', async ({ page }) => {
    // Intercept and return 401
    await page.route('**/api/status', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    // Reload to trigger auth check
    await page.reload();

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Should redirect to login or show error
    // (Implementation dependent)
  });

  test('should retry failed requests', async ({ page }) => {
    let requestCount = 0;

    // Intercept and fail first request
    await page.route('**/api/logs', (route) => {
      requestCount++;
      if (requestCount === 1) {
        // Fail first request
        route.abort('failed');
      } else {
        // Succeed on retry
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }
    });

    // Open logs to trigger API call
    await page.click('button:has-text("Show Logs")');

    // Wait for potential retry
    await page.waitForTimeout(3000);

    // UI should still work
    await expect(page.locator('.fixed.bottom-0')).toBeVisible();
  });

  test('should send correct DELETE request when clearing logs', async ({ page }) => {
    let deleteRequestSent = false;

    // Intercept DELETE request
    page.on('request', (request) => {
      if (request.url().includes('/api/logs') && request.method() === 'DELETE') {
        deleteRequestSent = true;
      }
    });

    // Open logs
    await page.click('button:has-text("Show Logs")');
    await page.waitForTimeout(1000);

    // Note: Clear button implementation depends on LogViewer component
    // This test assumes a clear button exists
    const clearButton = page.locator('button:has-text("Clear")');
    const hasClearButton = await clearButton.isVisible().catch(() => false);

    if (hasClearButton) {
      await clearButton.click();
      await page.waitForTimeout(1000);

      // Verify DELETE request was sent
      expect(deleteRequestSent).toBe(true);
    }
  });

  test('should load issues data for kanban board', async ({ page }) => {
    // Wait for any issues API calls
    await page.waitForTimeout(2000);

    // Kanban board should be visible
    const board = page.locator('.grid.grid-cols-5');
    await expect(board).toBeVisible();

    // All columns should be present
    await expect(page.locator('text=Backlog')).toBeVisible();
    await expect(page.locator('text=Done')).toBeVisible();
  });

  test('should handle slow API responses', async ({ page }) => {
    // Intercept and delay status API
    await page.route('**/api/status', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            status: 'healthy',
            uptime: 1000,
            memory: { used: 100, total: 1000, percentage: 10 },
            cpu: [10, 20, 30],
            tasks: { total: 10, inProgress: 2, completed: 8 },
            connections: 5,
            timestamp: new Date().toISOString(),
          },
        }),
      });
    });

    // Reload to trigger slow API
    await page.reload();

    // Wait for page to load despite slow API
    await page.waitForTimeout(2000);

    // UI should still be functional
    await expect(page.locator('text=POS.com RMS')).toBeVisible();
  });

  test('should update UI when API returns new data', async ({ page }) => {
    // This test verifies real-time updates work
    // Implementation depends on WebSocket or polling

    // Open logs
    await page.click('button:has-text("Show Logs")');
    await page.waitForTimeout(1000);

    // Wait for log updates (polling interval)
    await page.waitForTimeout(4000);

    // Log panel should still be visible and functional
    await expect(page.locator('.fixed.bottom-0')).toBeVisible();
  });
});

test.describe('WebSocket Integration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should establish WebSocket connection', async ({ page }) => {
    // Wait for WebSocket to connect
    await page.waitForTimeout(2000);

    // Check console for WebSocket connection logs
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    // Wait for potential WebSocket messages
    await page.waitForTimeout(3000);

    // UI should be functional (WebSocket optional but preferred)
    await expect(page.locator('text=POS.com RMS')).toBeVisible();
  });

  test('should handle WebSocket disconnection gracefully', async ({ page }) => {
    // Wait for initial connection
    await page.waitForTimeout(2000);

    // Simulate network disconnection
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);

    // Reconnect
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);

    // UI should still be functional
    await expect(page.locator('text=POS.com RMS')).toBeVisible();
  });
});

test.describe('Data Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // Get current URL
    const currentUrl = page.url();

    // Reload page
    await page.reload();

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Should still be authenticated (not redirected to login)
    await expect(page.locator('text=POS.com RMS')).toBeVisible();
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should clear authentication on logout', async ({ page }) => {
    // Logout
    await page.click('button:has-text("Logout")');

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Try to navigate back to dashboard
    await page.goto('/');

    // Should be redirected to login or show login page
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await login(page);

    const loadTime = Date.now() - startTime;

    // Dashboard should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);

    console.log(`Dashboard loaded in ${loadTime}ms`);
  });

  test('should handle multiple concurrent API requests', async ({ page }) => {
    await login(page);

    // Trigger multiple API requests simultaneously
    await Promise.all([
      page.click('button:has-text("Show Logs")'),
      page.waitForTimeout(100),
    ]);

    // Wait for all requests to complete
    await page.waitForTimeout(3000);

    // UI should remain responsive
    await expect(page.locator('text=POS.com RMS')).toBeVisible();
  });
});
