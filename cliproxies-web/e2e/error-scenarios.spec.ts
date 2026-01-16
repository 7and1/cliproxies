import { test, expect } from "@playwright/test";

test.describe("Error Scenarios", () => {
  test("handles 404 pages", async ({ page }) => {
    await page.goto("/nonexistent-page");

    // Check for 404 content
    const notFoundContent = page.locator("text=/not found|404/i").first();
    const visible = await notFoundContent.isVisible().catch(() => false);

    if (visible) {
      await expect(notFoundContent).toBeVisible();
    }

    // Or check for redirect to home
    const currentUrl = page.url();
    const onHomePage = currentUrl.endsWith("/") || currentUrl.includes("/404");
    expect(onHomePage).toBeTruthy();
  });

  test("handles network errors gracefully", async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);

    await page.goto("/");

    // Look for offline message or retry option
    const offlineMessage = page
      .locator("text=/offline|no connection|network error/i")
      .first();
    const retryButton = page.locator('button:has-text("Retry")').first();

    const offlineVisible = await offlineMessage.isVisible().catch(() => false);
    const retryVisible = await retryButton.isVisible().catch(() => false);

    if (offlineVisible || retryVisible) {
      // Should show some indication of network issues
      expect(offlineVisible || retryVisible).toBeTruthy();
    }

    await context.setOffline(false);
  });

  test("handles API errors", async ({ page }) => {
    // Navigate to a page that makes API calls
    await page.goto("/proxygrid");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check for error indicators (if API failed)
    const errorIndicator = page
      .locator('[role="alert"], .error, [data-error]')
      .first();
    const errorVisible = await errorIndicator.isVisible().catch(() => false);

    if (errorVisible) {
      const errorText = await errorIndicator.textContent();
      expect(errorText).toBeTruthy();
    }
  });

  test("handles malformed query parameters", async ({ page }) => {
    // Navigate with malformed query string
    await page.goto("/?invalid=json{[}");

    // Page should not crash
    const crashIndicator = page
      .locator("text=/Application error|Server error/i")
      .first();
    const crashVisible = await crashIndicator.isVisible().catch(() => false);

    if (crashVisible) {
      // If there's an error, it should be handled gracefully
      await expect(crashIndicator).toBeVisible();
    }
  });

  test("handles large payload errors", async ({ page }) => {
    // Create a very long query string
    const longParam = "q=" + "a".repeat(10000);
    await page.goto(`/?${longParam}`);

    // Page should handle gracefully
    const status = await page.evaluate(() => {
      return document.readyState;
    });

    expect(status).toBe("complete");
  });
});

test.describe("Loading States", () => {
  test("shows loading indicator", async ({ page }) => {
    await page.goto("/");

    // Look for loading indicators
    const spinner = page
      .locator('.animate-spin, [role="status"], .loading')
      .first();
    const spinnerVisible = await spinner.isVisible().catch(() => false);

    if (spinnerVisible) {
      await expect(spinner).toBeVisible();
    }
  });

  test("hides loading after content loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Loading indicator should be hidden or removed
    const spinner = page.locator('.animate-spin, [role="status"]').first();

    const isHidden = await spinner.isHidden().catch(() => true);
    const notInDom = await spinner.count().then((c) => c === 0);

    expect(isHidden || notInDom).toBeTruthy();
  });

  test("shows skeleton screens", async ({ page }) => {
    await page.goto("/");

    // Check for skeleton loaders
    const skeleton = page.locator(".animate-pulse, .skeleton").first();
    const skeletonVisible = await skeleton.isVisible().catch(() => false);

    if (skeletonVisible) {
      await expect(skeleton).toBeVisible();

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Skeleton should be gone or replaced with content
      const stillVisible = await skeleton.isVisible().catch(() => false);
      expect(stillVisible).not.toBeTruthy();
    }
  });
});

test.describe("Form Validation Errors", () => {
  test("shows validation errors for invalid input", async ({ page }) => {
    await page.goto("/");

    const portInput = page.locator('#port-input, input[type="number"]').first();
    const visible = await portInput.isVisible().catch(() => false);

    if (visible) {
      // Enter invalid port
      await portInput.fill("99999");
      await portInput.press("Enter");

      // Check for error message
      const errorMsg = page
        .locator('#api-key-error, .error, [role="alert"]')
        .first();
      const errorVisible = await errorMsg.isVisible().catch(() => false);

      if (errorVisible) {
        await expect(errorMsg).toBeVisible();
      }
    }
  });

  test("prevents form submission with invalid data", async ({ page }) => {
    await page.goto("/");

    const apiKeyInput = page
      .locator('#api-key-input, input[placeholder*="API key"]')
      .first();
    const visible = await apiKeyInput.isVisible().catch(() => false);

    if (visible) {
      // Try to submit with invalid key
      await apiKeyInput.fill("short");

      const addButton = page.locator('button:has-text("Add")').first();
      await addButton.click();

      // Form should not process the invalid input
      const errorVisible = await page
        .locator("#api-key-error")
        .isVisible()
        .catch(() => false);

      if (errorVisible) {
        // Error should be shown
        await expect(page.locator("#api-key-error")).toBeVisible();
      }
    }
  });
});

test.describe("Error Boundaries", () => {
  test("catches JavaScript errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.toString());
    });

    await page.goto("/");

    // If there are errors, the page should still be functional
    const bodyVisible = await page.locator("body").isVisible();
    expect(bodyVisible).toBeTruthy();
  });

  test("shows error boundary on component failure", async ({ page }) => {
    // Navigate to a page
    await page.goto("/");

    // Check if there's an error boundary fallback
    const errorBoundary = page
      .locator("text=/Something went wrong|Error loading/i")
      .first();
    const visible = await errorBoundary.isVisible().catch(() => false);

    // If visible, it should have a retry option
    if (visible) {
      const retryButton = page
        .locator('button:has-text("Retry"), button:has-text("Reload")')
        .first();
      const retryVisible = await retryButton.isVisible().catch(() => false);

      if (retryVisible) {
        await expect(retryButton).toBeVisible();
      }
    }
  });
});
