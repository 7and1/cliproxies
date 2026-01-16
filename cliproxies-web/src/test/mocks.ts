/**
 * Mock data and utilities for testing
 */

// Mock API responses
export const mockApiResponses = {
  models: {
    object: "list" as const,
    data: [
      {
        id: "claude-sonnet-4-20250514",
        object: "model" as const,
        created: 1715712000,
        owned_by: "anthropic",
      },
      {
        id: "claude-opus-4-20250514",
        object: "model" as const,
        created: 1715712000,
        owned_by: "anthropic",
      },
    ],
  },

  chatCompletion: {
    id: "chatcmpl-123",
    object: "chat.completion" as const,
    created: 1234567890,
    model: "claude-sonnet-4-20250514",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant" as const,
          content: "Hello! How can I help you today?",
        },
        finish_reason: "stop" as const,
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 9,
      total_tokens: 19,
    },
  },

  statusCheck: {
    status: "ok",
    timestamp: Date.now(),
  },

  providerStatus: [
    {
      provider: "anthropic",
      status: "operational",
      responseTime: 150,
    },
    {
      provider: "openai",
      status: "operational",
      responseTime: 200,
    },
  ],
} as const;

// Mock apps data
export const mockApps = [
  {
    id: "1",
    name: "Claude Code",
    description: "AI-powered coding assistant",
    category: "Development",
    provider: "anthropic",
    stars: 15000,
    url: "https://github.com/anthropics/claude-code",
    lastUpdated: "2024-01-15",
  },
  {
    id: "2",
    name: "GPT Engineer",
    description: "AI for building web apps",
    category: "Development",
    provider: "openai",
    stars: 45000,
    url: "https://github.com/AntonOsika/gpt-engineer",
    lastUpdated: "2024-01-10",
  },
  {
    id: "3",
    name: "Cursor",
    description: "AI-first code editor",
    category: "Tools",
    provider: "anthropic",
    stars: 25000,
    url: "https://github.com/getcursor/cursor",
    lastUpdated: "2024-01-12",
  },
];

// Mock user data
export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  avatar: "https://example.com/avatar.png",
  createdAt: "2024-01-01T00:00:00Z",
};

// Mock OAuth providers
export const mockOAuthProviders = [
  { id: "github", name: "GitHub", icon: "github" },
  { id: "google", name: "Google", icon: "google" },
  { id: "gitlab", name: "GitLab", icon: "gitlab" },
];

// Mock config data
export const mockConfig = {
  port: 8317,
  apiKeys: ["sk-test-key-1234567890abcdef"],
  providers: ["anthropic", "openai", "gemini"],
};

// Mock error responses
export const mockErrors = {
  unauthorized: {
    error: {
      message: "Invalid API key",
      type: "invalid_request_error",
      code: "invalid_api_key",
    },
  },
  rateLimit: {
    error: {
      message: "Rate limit exceeded",
      type: "rate_limit_error",
      code: "rate_limit_exceeded",
    },
  },
  notFound: {
    error: {
      message: "Resource not found",
      type: "invalid_request_error",
      code: "not_found",
    },
  },
};

// Mock fetch implementation
export function createMockFetch(responses: Record<string, any>) {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const key = Object.keys(responses).find((k) => url.includes(k));

    if (key) {
      const data = responses[key];
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  };
}

// Mock clipboard API
export const mockClipboard = {
  writeText: vi.fn(() => Promise.resolve()),
  readText: vi.fn(() => Promise.resolve("mocked text")),
};

// Mock localStorage
export function createMockLocalStorage() {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    // Helper for tests
    _store: () => store,
  };
}

// Mock IntersectionObserver
export class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  readonly disconnect = vi.fn();
  readonly observe = vi.fn();
  readonly takeRecords = vi.fn(() => []);
  readonly unobserve = vi.fn();
}

// Mock ResizeObserver
export class MockResizeObserver implements ResizeObserver {
  readonly disconnect = vi.fn();
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
}

// Mock MediaSource for testing
export function mockMatchMedia(matches: boolean = false) {
  return {
    matches,
    media: "(max-width: 768px)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

// Test data generators
export const testDataGenerators = {
  apiKey: (prefix: string = "sk") =>
    `${prefix}-test-${Math.random().toString(36).substring(7)}`,
  port: () => Math.floor(Math.random() * 64512) + 1024,
  email: () => `test-${Math.random().toString(36).substring(7)}@example.com`,
  username: () => `user_${Math.random().toString(36).substring(7)}`,
  timestamp: () => new Date().toISOString(),
};

// Helper to create mock response with custom status
export function createMockResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Helper to create mock error response
export function createMockErrorResponse(
  message: string,
  status: number = 400,
): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        type: "error",
        code: status.toString(),
      },
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

// Mock WebSocket for testing
export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  private eventQueue: Event[] = [];
  private openTimeout: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.url = url;
    this.openTimeout = setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event("open"));
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close", { code, reason }));
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
    }
  }

  // Test helpers
  simulateMessage(data: any): void {
    this.onmessage?.(new MessageEvent("message", { data }));
  }

  simulateError(): void {
    this.onerror?.(new Event("error"));
  }
}

// Helper to wait for async operations
export const asyncHelpers = {
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  waitFor: (
    condition: () => boolean,
    timeout: number = 1000,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("Condition not met within timeout"));
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  },

  waitForElement: (
    selector: string,
    timeout: number = 1000,
  ): Promise<Element> => {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within timeout`));
      }, timeout);
    });
  },
};

// Mock requestIdleCallback
export function mockRequestIdleCallback() {
  return (callback: IdleRequestCallback): number => {
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => 50,
      });
    }, 0) as unknown as number;
  };
}

// Mock cancellation token for async operations
export class CancellationToken {
  private cancelled = false;
  private callbacks: Array<() => void> = [];

  isCancelled(): boolean {
    return this.cancelled;
  }

  cancel(): void {
    this.cancelled = true;
    this.callbacks.forEach((cb) => cb());
    this.callbacks = [];
  }

  register(callback: () => void): () => void {
    if (this.cancelled) {
      callback();
      return () => {};
    }
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }
}
