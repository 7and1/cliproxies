import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with DOM matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver as a real constructor for Next.js hooks
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
  root = null;
  rootMargin = "";
  thresholds = [];
}

global.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) =>
  setTimeout(callback, 0);

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(async () => {}),
    readText: vi.fn(async () => ""),
  },
});

try {
  Object.defineProperty(HTMLFormElement.prototype, "requestSubmit", {
    configurable: true,
    value: function requestSubmit() {
      this.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    },
  });
} catch {
  // Fallback in case the property is not configurable.
}
