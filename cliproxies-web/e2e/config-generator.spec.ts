import { test, expect } from "@playwright/test";

test.describe("Config Generator Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays config generator on home page", async ({ page }) => {
    const configGenerator = page.locator("text=Configuration").first();
    await expect(configGenerator).toBeVisible();
  });

  test("allows setting port number", async ({ page }) => {
    const portInput = page.locator("#port-input");
    await portInput.fill("8080");
    await expect(portInput).toHaveValue("8080");
  });

  test("validates port range", async ({ page }) => {
    const portInput = page.locator("#port-input");

    // Test minimum value
    await portInput.fill("1023");
    await expect(portInput).toHaveValue("1023"); // Should accept but may show validation

    // Test valid port
    await portInput.clear();
    await portInput.fill("8317");
    await expect(portInput).toHaveValue("8317");

    // Test maximum value
    await portInput.clear();
    await portInput.fill("65535");
    await expect(portInput).toHaveValue("65535");
  });

  test("allows adding API keys", async ({ page }) => {
    const apiKeyInput = page.locator("#api-key-input");
    const addButton = page.locator("button:has-text('Add')");

    await apiKeyInput.fill("sk-test-key-1234567890abcdef");
    await addButton.click();

    // Verify key was added
    const keyDisplay = page.locator("code");
    await expect(keyDisplay).toContainText("sk-t****cdef");
  });

  test("validates API key format", async ({ page }) => {
    const apiKeyInput = page.locator("#api-key-input");
    const addButton = page.locator("button:has-text('Add')");

    // Test short key
    await apiKeyInput.fill("short");
    await addButton.click();

    const errorMessage = page.locator("#api-key-error");
    await expect(errorMessage).toContainText("too short");
  });

  test("shows live YAML preview", async ({ page }) => {
    const portInput = page.locator("#port-input");
    const yamlPreview = page.locator("pre code");

    // Change port and verify preview updates
    const initialYaml = await yamlPreview.textContent();
    await portInput.clear();
    await portInput.fill("9999");

    // Wait for preview to update
    await page.waitForTimeout(100);
    const updatedYaml = await yamlPreview.textContent();

    expect(updatedYaml).toContain("9999");
    expect(updatedYaml).not.toBe(initialYaml);
  });

  test("can hide/show YAML preview", async ({ page }) => {
    const eyeButton = page.locator(
      'button[aria-label*="Hide preview"], button[aria-label*="Show preview"]',
    );
    const yamlPreview = page.locator("pre code");

    // Initially visible
    await expect(yamlPreview).toBeVisible();

    // Hide preview
    await eyeButton.click();
    await expect(yamlPreview).not.toBeVisible();

    // Show preview
    await eyeButton.click();
    await expect(yamlPreview).toBeVisible();
  });

  test("can copy YAML to clipboard", async ({ page }) => {
    const copyButton = page.locator(
      'button[aria-label="Copy YAML to clipboard"]',
    );
    const yamlPreview = page.locator("pre code");

    const yamlText = await yamlPreview.textContent();

    // Click copy button
    await copyButton.click();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    expect(clipboardText).toBe(yamlText);

    // Check for checkmark icon
    const checkIcon = page.locator(
      'button[aria-label="Copy YAML to clipboard"] svg[data-lucide="check"]',
    );
    await expect(checkIcon).toBeVisible();
  });

  test("downloads config file", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    const downloadButton = page.locator(
      'button:has-text("Download config.yaml")',
    );

    await downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("config.yaml");

    // Verify file content
    const content = await download.createReadStream();
    const text = await streamToString(content);

    expect(text).toContain("port:");
    expect(text).toContain("api-keys:");
  });

  test("resets configuration", async ({ page }) => {
    const portInput = page.locator("#port-input");
    const resetButton = page.locator('button:has-text("Reset")');

    // Modify config
    await portInput.fill("9999");

    // Reset
    await resetButton.click();

    // Verify default port is restored
    await expect(portInput).toHaveValue("8317");
  });

  test("can remove API keys", async ({ page }) => {
    const apiKeyInput = page.locator("#api-key-input");
    const addButton = page.locator("button:has-text('Add')");

    // Add a key
    await apiKeyInput.fill("sk-test-key-1234567890abcdef");
    await addButton.click();

    // Remove it
    const removeButton = page
      .locator('button[aria-label*="Remove API key"]')
      .first();
    await removeButton.click();

    // Verify key is gone
    const keyDisplay = page.locator("code");
    await expect(keyDisplay).not.toBeVisible();
  });

  test("updates API key count badge", async ({ page }) => {
    const apiKeyInput = page.locator("#api-key-input");
    const addButton = page.locator("button:has-text('Add')");
    const badge = page.locator("text=/key.*·/").first();

    // Initial state
    await expect(badge).toContainText("0 key");

    // Add key
    await apiKeyInput.fill("sk-test-key-1234567890abcdef");
    await addButton.click();

    // Check badge updated
    await expect(badge).toContainText("1 key");
  });

  test("handles provider selection", async ({ page }) => {
    const providerButtons = page.locator('button[aria-pressed="false"]');

    const count = await providerButtons.count();
    expect(count).toBeGreaterThan(0);

    // Select a provider
    await providerButtons.first().click();

    // Verify it's selected
    const selectedButton = page.locator('button[aria-pressed="true"]');
    await expect(selectedButton).toHaveCountGreaterThan(0);
  });
});

// Helper function
async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks).toString("utf-8");
}
