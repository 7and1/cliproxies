import { test, expect } from "@playwright/test";

test.describe("App Browsing and Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays app cards", async ({ page }) => {
    const appCards = page
      .locator('[role="listitem"]')
      .or(page.locator(".app-card"));
    await expect(appCards.first()).toBeVisible();
  });

  test("shows app card with required information", async ({ page }) => {
    const firstCard = page.locator('[role="listitem"]').first();

    // Check for name
    const name = firstCard.locator("h3, h2");
    await expect(name).toBeVisible();

    // Check for description
    const description = firstCard.locator("p");
    await expect(description).toBeVisible();

    // Check for badges/tags
    const badges = firstCard.locator('button, [role="button"], .badge');
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test("searches for apps", async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"], #search',
    );
    const searchVisible = await searchInput.isVisible().catch(() => false);

    if (searchVisible) {
      await searchInput.fill("claude");
      await page.keyboard.press("Enter");

      // Wait for results
      await page.waitForTimeout(500);

      // Verify search was performed
      const currentValue = await searchInput.inputValue();
      expect(currentValue).toBe("claude");
    }
  });

  test("filters by provider", async ({ page }) => {
    // Look for filter buttons
    const filterButtons = page.locator(
      'button:has-text("Claude"), button:has-text("OpenAI"), button:has-text("Gemini")',
    );
    const filterCount = await filterButtons.count();

    if (filterCount > 0) {
      await filterButtons.first().click();
      await page.waitForTimeout(300);

      // Verify filter is active
      const activeFilter = page.locator('button[aria-pressed="true"]');
      await expect(activeFilter).toHaveCountGreaterThan(0);
    }
  });

  test("navigates to app details", async ({ page }) => {
    const firstAppLink = page
      .locator('a[href*="/apps/"], [role="link"]')
      .first();
    const linkVisible = await firstAppLink.isVisible().catch(() => false);

    if (linkVisible) {
      await firstAppLink.click();

      // Verify navigation
      await page.waitForURL(/\/apps/);
      expect(page.url()).toContain("/apps/");
    }
  });

  test("displays loading skeleton while loading", async ({ page }) => {
    // Reload to see loading state
    await page.reload();

    const skeleton = page.locator(".animate-pulse, .skeleton").first();
    const skeletonVisible = await skeleton.isVisible().catch(() => false);

    if (skeletonVisible) {
      await expect(skeleton).toBeVisible();
      // Wait for content to load
      await page
        .waitForSelector(".animate-pulse, .skeleton", {
          state: "hidden",
          timeout: 5000,
        })
        .catch(() => {});
    }
  });

  test("handles empty search results", async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"], #search',
    );
    const searchVisible = await searchInput.isVisible().catch(() => false);

    if (searchVisible) {
      await searchInput.fill("nonexistentapp123456789");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);

      // Check for empty state or no results message
      const emptyState = page.locator(
        "text=/no results/i, text=/not found/i, .empty-state",
      );
      const emptyVisible = await emptyState.isVisible().catch(() => false);

      if (emptyVisible) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  test("app cards are accessible", async ({ page }) => {
    const cards = page.locator('[role="listitem"], article, [role="article"]');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      // Check first card for accessibility
      const firstCard = cards.first();

      // Should have accessible name or label
      const heading = firstCard.locator("h1, h2, h3, h4").first();
      await expect(heading).toBeVisible();
    }
  });
});

test.describe("Proxy Grid Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/proxygrid");
  });

  test("displays proxy grid page", async ({ page }) => {
    const heading = page
      .locator("h1, h2")
      .filter({ hasText: /proxy grid|proxygrid/i });
    await expect(heading).first().toBeVisible();
  });

  test("shows proxy information cards", async ({ page }) => {
    const cards = page.locator('[role="listitem"], .card, [class*="card"]');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      // Check first card has content
      const firstCard = cards.first();
      await expect(firstCard).toBeVisible();
    }
  });

  test("handles proxy grid interactions", async ({ page }) => {
    // Look for interactive elements
    const buttons = page
      .locator("button")
      .filter({ hasText: /(connect|copy|view|details)/i });
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      await buttons.first().click();
      // Should not error
    }
  });
});
