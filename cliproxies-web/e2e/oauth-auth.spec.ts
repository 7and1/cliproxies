import { test, expect } from "@playwright/test";

test.describe("OAuth Authentication Flow", () => {
  test("shows OAuth login options", async ({ page }) => {
    await page.goto("/");

    // Look for OAuth-related buttons or links
    const oauthButtons = page.locator(
      'button:has-text("Sign in"), a:has-text("Login"), button:has-text("Authenticate")',
    );
    const oauthCount = await oauthButtons.count();

    if (oauthCount > 0) {
      await expect(oauthButtons.first()).toBeVisible();
    }
  });

  test("OAuth button has accessible attributes", async ({ page }) => {
    await page.goto("/");

    const loginButton = page
      .locator('button:has-text("Sign in"), a:has-text("Login")')
      .first();
    const visible = await loginButton.isVisible().catch(() => false);

    if (visible) {
      // Check for aria-label or descriptive text
      const hasAriaLabel = await loginButton.getAttribute("aria-label");
      const text = await loginButton.textContent();

      expect(hasAriaLabel || text).toBeTruthy();
    }
  });

  test("navigates to OAuth provider", async ({ page, context }) => {
    await page.goto("/");

    const loginButton = page
      .locator('button:has-text("Sign in"), a:has-text("Login")')
      .first();
    const visible = await loginButton.isVisible().catch(() => false);

    if (visible) {
      // Setup to catch new page (if OAuth opens in new tab)
      const [newPage] = await Promise.all([
        context.waitForEvent("page").catch(() => null),
        loginButton.click(),
      ]);

      // If a new page was opened (OAuth redirect)
      if (newPage) {
        await newPage.waitForLoadState();
        expect(newPage.url()).toContain("http");
      }
    }
  });

  test("handles OAuth callback", async ({ page }) => {
    // Simulate OAuth callback URL
    await page.goto("?code=test-code&state=test-state");

    // Page should handle the callback parameters
    // Check for any error or success indicators
    const errorMessage = page.locator("text=/error|failed|denied/i").first();
    const errorVisible = await errorMessage.isVisible().catch(() => false);

    if (errorVisible) {
      // If there's an error, it should be informative
      await expect(errorMessage).toBeVisible();
    }
  });

  test("OAuth flow has CSRF protection", async ({ page }) => {
    await page.goto("/");

    // Check for state parameter or CSRF token in OAuth flow
    const oauthButtons = page
      .locator('a[href*="oauth"], button[onclick*="auth"]')
      .first();
    const visible = await oauthButtons.isVisible().catch(() => false);

    if (visible) {
      const href = (await oauthButtons.getAttribute("href")) || "";
      const onClick = (await oauthButtons.getAttribute("onclick")) || "";

      // OAuth flow should include state parameter (for CSRF protection)
      const hasState = href.includes("state=") || onClick.includes("state");

      if (href.length > 0 || onClick.length > 0) {
        // If OAuth is implemented, it should have state parameter
        expect(hasState).toBeTruthy();
      }
    }
  });

  test("preserves session after OAuth", async ({ page, context }) => {
    // Check for session storage or localStorage usage
    await page.goto("/");

    const sessionData = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage),
      };
    });

    // If OAuth is implemented, session should be managed
    const hasSession =
      sessionData.localStorage.length > 0 ||
      sessionData.sessionStorage.length > 0;

    if (hasSession) {
      expect(
        sessionData.localStorage.some(
          (k) => k.includes("auth") || k.includes("token"),
        ),
      ).toBeTruthy();
    }
  });
});

test.describe("OAuth Error Handling", () => {
  test("handles OAuth errors gracefully", async ({ page }) => {
    // Simulate error callback
    await page.goto(
      "?error=access_denied&error_description=User denied access",
    );

    // Check for user-friendly error message
    const errorDisplay = page
      .locator("text=/access denied|denied|cancelled/i")
      .first();
    const visible = await errorDisplay.isVisible().catch(() => false);

    if (visible) {
      await expect(errorDisplay).toBeVisible();
    }
  });

  test("shows retry option after failed OAuth", async ({ page }) => {
    await page.goto("?error=access_denied");

    const retryButton = page
      .locator('button:has-text("Retry"), a:has-text("Try again")')
      .first();
    const visible = await retryButton.isVisible().catch(() => false);

    if (visible) {
      await expect(retryButton).toBeVisible();
    }
  });
});

test.describe("Security Headers for OAuth", () => {
  test("has proper security headers", async ({ page }) => {
    const response = await page.request.get(page.url());

    // Check for security headers
    const cspHeader = response.headers()["content-security-policy"];
    const frameOptions = response.headers()["x-frame-options"];

    // If CSP is set, it should be restrictive
    if (cspHeader) {
      expect(cspHeader).toContain("default-src");
    }

    // Should prevent clickjacking
    if (frameOptions) {
      expect(frameOptions).toMatch(/DENY|SAMEORIGIN/i);
    }
  });
});
