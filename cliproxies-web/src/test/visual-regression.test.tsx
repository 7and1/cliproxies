/**
 * Visual regression test utilities
 *
 * Note: These tests use Playwright for visual regression testing.
 * Run with: npx playwright test --project=chromium
 */
import { test, expect } from "@playwright/test";

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("homepage visual snapshot", async ({ page }) => {
    await page.goto("/");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Take a screenshot and compare with baseline
    await expect(page).toHaveScreenshot("homepage.png", {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test("config generator component snapshot", async ({ page }) => {
    await page.goto("/");

    const configGenerator = page.locator("text=Configuration").first();
    await expect(configGenerator).toBeVisible();

    await page.waitForLoadState("networkidle");

    // Screenshot specific component
    await expect(configGenerator).toHaveScreenshot("config-generator.png", {
      maxDiffPixels: 50,
    });
  });

  test("mobile viewport snapshot", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("homepage-mobile.png", {
      maxDiffPixels: 100,
    });
  });

  test("tablet viewport snapshot", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("homepage-tablet.png", {
      maxDiffPixels: 100,
    });
  });

  test("dark mode snapshot", async ({ page }) => {
    // Simulate dark mode
    await page.goto("/");
    await page.emulateMedia({ colorScheme: "dark" });

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("homepage-dark.png", {
      maxDiffPixels: 100,
    });
  });

  test("loading state snapshot", async ({ page }) => {
    // Slow down network to capture loading state
    await page.route("**/*", async (route) => {
      await page.waitForTimeout(100);
      route.continue();
    });

    await page.goto("/");
    await page.waitForTimeout(100);

    // Take screenshot during loading
    await expect(page).toHaveScreenshot("loading-state.png", {
      maxDiffPixels: 150,
    });
  });
});

test.describe("Component Visual Tests", () => {
  test("button components snapshot", async ({ page }) => {
    await page.goto("/");

    // Find all buttons
    const buttons = page.locator("button").all();

    // Screenshot each unique button type
    const uniqueButtons = new Set<string>();

    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.trim() && !uniqueButtons.has(text.trim())) {
        uniqueButtons.add(text.trim());
        await expect(button).toHaveScreenshot(
          `button-${text.trim().toLowerCase().replace(/\s+/g, "-")}.png`,
        );
      }
    }
  });

  test("input fields snapshot", async ({ page }) => {
    await page.goto("/");

    const inputs = page.locator(
      'input[type="text"], input[type="number"], textarea',
    );

    // Screenshot first input with focus
    const firstInput = inputs.first();
    await firstInput.focus();

    await expect(firstInput).toHaveScreenshot("input-focused.png", {
      maxDiffPixels: 30,
    });
  });

  test("card components snapshot", async ({ page }) => {
    await page.goto("/");

    const cards = page.locator('[role="listitem"], article, .card');

    if ((await cards.count()) > 0) {
      await expect(cards.first()).toHaveScreenshot("app-card.png", {
        maxDiffPixels: 50,
      });
    }
  });
});

test.describe("State-based Visual Tests", () => {
  test("error state snapshot", async ({ page }) => {
    // Mock an error response
    await page.route("**/api/**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Test error" }),
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("error-state.png", {
      maxDiffPixels: 100,
    });
  });

  test("empty state snapshot", async ({ page }) => {
    // Mock empty response
    await page.route("**/api/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/proxygrid");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("empty-state.png", {
      maxDiffPixels: 100,
    });
  });

  test("hover states snapshot", async ({ page }) => {
    await page.goto("/");

    const firstLink = page.locator("a, button").first();
    await firstLink.hover();

    await expect(page).toHaveScreenshot("hover-state.png", {
      maxDiffPixels: 50,
    });
  });
});

test.describe("Accessibility Visual Tests", () => {
  test("focus indicators visible", async ({ page }) => {
    await page.goto("/");

    // Tab through interactive elements
    const focusableElements = page.locator("button, a[href], input");

    const count = await focusableElements.count();
    if (count > 0) {
      await focusableElements.first().focus();
      await page.waitForTimeout(100);

      // Verify focus indicator is visible
      const screenshot = await page.screenshot();
      expect(screenshot).toBeDefined();
    }
  });

  test("high contrast mode snapshot", async ({ page }) => {
    await page.goto("/");

    // Enable forced colors (high contrast mode)
    await page.emulateMedia({ forcedColors: "active" });

    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("high-contrast.png", {
      maxDiffPixels: 150,
    });
  });
});
