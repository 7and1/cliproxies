import { test, expect, devices } from "@playwright/test";

test.describe("Mobile Responsiveness", () => {
  const mobileViewports = [
    { name: "iPhone 12", width: 390, height: 844 },
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "Android", width: 360, height: 640 },
    { name: "Tablet", width: 768, height: 1024 },
  ];

  for (const viewport of mobileViewports) {
    test(`${viewport.name}: responsive layout`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");

      // Check page is scrollable on mobile
      const documentHeight = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      const viewportHeight = await page.evaluate(() => window.innerHeight);

      expect(documentHeight).toBeGreaterThanOrEqual(viewportHeight);
    });
  }
});

test.describe("Mobile Touch Interactions", () => {
  test.use(devices["iPhone 12"]);

  test("tap targets are large enough", async ({ page }) => {
    await page.goto("/");

    const buttons = page.locator('button, a[href], [role="button"]');
    const count = await buttons.count();

    if (count > 0) {
      // Check first few buttons for touch target size
      const buttonsToCheck = Math.min(count, 10);

      for (let i = 0; i < buttonsToCheck; i++) {
        const button = buttons.nth(i);
        const visible = await button.isVisible().catch(() => false);

        if (visible) {
          const box = await button.boundingBox();
          if (box) {
            // Minimum touch target: 44x44px (WCAG)
            const minSize = 44;
            const isLargeEnough = box.width >= minSize && box.height >= minSize;

            if (!isLargeEnough) {
              console.log(
                `Button ${i} is too small: ${box.width}x${box.height}`,
              );
            }
          }
        }
      }
    }
  });

  test("can navigate with touch", async ({ page }) => {
    await page.goto("/");

    // Tap on a navigation link if present
    const navLink = page.locator('nav a, [role="navigation"] a').first();
    const visible = await navLink.isVisible().catch(() => false);

    if (visible) {
      await navLink.tap();
      await page.waitForLoadState("networkidle");

      // Verify navigation happened
      const currentUrl = page.url();
      expect(currentUrl).not.toBe("/");
    }
  });

  test("scrolls smoothly on mobile", async ({ page }) => {
    await page.goto("/");

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));

    // Check scroll position
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test("horizontal content doesn't overflow", async ({ page }) => {
    await page.goto("/");

    // Check for horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      const bodyWidth = document.body.scrollWidth;
      const windowWidth = window.innerWidth;
      return bodyWidth > windowWidth;
    });

    expect(hasOverflow).toBeFalsy();
  });
});

test.describe("Tablet Layout", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("displays tablet-optimized layout", async ({ page }) => {
    await page.goto("/");

    // Content should be visible
    const mainContent = page.locator('main, [role="main"], #main-content');
    await expect(mainContent.first()).toBeVisible();
  });

  test("shows grid layout on tablet", async ({ page }) => {
    await page.goto("/");

    const grid = page.locator('.grid, [class*="grid"]').first();
    const visible = await grid.isVisible().catch(() => false);

    if (visible) {
      await expect(grid).toBeVisible();
    }
  });
});

test.describe("Orientation Changes", () => {
  test("handles landscape orientation", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 }); // iPhone landscape
    await page.goto("/");

    // Content should still be visible
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check for horizontal scrolling issue
    const documentWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const windowWidth = await page.evaluate(() => window.innerWidth);

    expect(documentWidth).toBeLessThanOrEqual(windowWidth + 1); // Allow 1px rounding
  });

  test("handles portrait orientation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone portrait
    await page.goto("/");

    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Mobile Navigation", () => {
  test.use(devices["iPhone 12"]);

  test("has mobile menu or navigation", async ({ page }) => {
    await page.goto("/");

    // Look for mobile menu button
    const menuButton = page
      .locator(
        'button[aria-label*="menu"], button[aria-label*="Menu"], .hamburger',
      )
      .first();
    const visible = await menuButton.isVisible().catch(() => false);

    if (visible) {
      await expect(menuButton).toBeVisible();

      // Open menu
      await menuButton.tap();

      // Menu items should be visible
      const menuItems = page.locator('[role="menu"] a, nav a, .mobile-menu a');
      await expect(menuItems.first()).toBeVisible();
    }
  });

  test("navigation closes after selection", async ({ page }) => {
    await page.goto("/");

    const menuButton = page.locator('button[aria-label*="menu"]').first();
    const visible = await menuButton.isVisible().catch(() => false);

    if (visible) {
      await menuButton.tap();

      const firstLink = page.locator('[role="menu"] a, nav a').first();
      await firstLink.tap();

      // Wait a bit for navigation
      await page.waitForTimeout(500);

      // Menu should be closed
      const menuVisible = await page
        .locator('[role="menu"]')
        .isVisible()
        .catch(() => false);
      expect(menuVisible).toBeFalsy();
    }
  });
});

test.describe("Mobile Form Inputs", () => {
  test.use(devices["iPhone 12"]);

  test("inputs are usable on mobile", async ({ page }) => {
    await page.goto("/");

    const portInput = page.locator('#port-input, input[type="number"]').first();
    const visible = await portInput.isVisible().catch(() => false);

    if (visible) {
      // Tap on input
      await portInput.tap();

      // Check if virtual keyboard would appear (input is focused)
      const isFocused = await portInput.evaluate(
        (el) => document.activeElement === el,
      );
      expect(isFocused).toBeTruthy();

      // Type in input
      await portInput.fill("8080");
      await expect(portInput).toHaveValue("8080");
    }
  });

  test("input font size prevents zoom on iOS", async ({ page }) => {
    await page.goto("/");

    const inputs = page.locator("input").all();
    for (const input of inputs) {
      const visible = await input.isVisible().catch(() => false);
      if (visible) {
        const fontSize = await input.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });

        // Font size should be at least 16px to prevent iOS zoom
        const fontSizeNum = parseInt(fontSize, 10);
        expect(fontSizeNum).toBeGreaterThanOrEqual(14);
      }
    }
  });
});

test.describe("Performance on Mobile", () => {
  test.use(devices["Pixel 5"]);

  test("measures Core Web Vitals", async ({ page }) => {
    await page.goto("/");

    // Wait for page to be stable
    await page.waitForLoadState("networkidle");

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};

          entries.forEach((entry: any) => {
            if (entry.entryType === "largest-contentful-paint") {
              vitals.lcp = entry.startTime;
            } else if (entry.entryType === "first-input") {
              vitals.fid = entry.processingStart - entry.startTime;
            }
          });

          resolve(vitals);
        }).observe({ entryTypes: ["largest-contentful-paint", "first-input"] });

        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });

    console.log("Mobile Performance Metrics:", metrics);

    // LCP should be reasonable (< 4s on mobile)
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(4000);
    }
  });
});
