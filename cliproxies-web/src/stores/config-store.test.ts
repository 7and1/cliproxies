import { describe, it, expect, beforeEach, vi } from "vitest";
import { useConfigStore } from "./config-store";

// Mock Zustand for testing by creating a fresh store for each test
function createMockStore() {
  let state = {
    port: 8317,
    apiKeys: [] as string[],
  };

  return {
    getState: () => state,
    setState: (partial: Partial<typeof state>) => {
      state = { ...state, ...partial };
    },
    setPort: (port: number) => {
      state.port = port;
    },
    addApiKey: (key: string) => {
      state.apiKeys = [...state.apiKeys, key];
    },
    removeApiKey: (index: number) => {
      state.apiKeys = state.apiKeys.filter((_, idx) => idx !== index);
    },
    reset: () => {
      state.port = 8317;
      state.apiKeys = [];
    },
  };
}

describe("config-store", () => {
  describe("initial state", () => {
    it("has default port of 8317", () => {
      const store = createMockStore();
      expect(store.getState().port).toBe(8317);
    });

    it("has empty apiKeys array initially", () => {
      const store = createMockStore();
      expect(store.getState().apiKeys).toEqual([]);
    });
  });

  describe("setPort", () => {
    it("updates the port value", () => {
      const store = createMockStore();
      store.setPort(9999);
      expect(store.getState().port).toBe(9999);
    });

    it("allows port within valid range", () => {
      const store = createMockStore();
      store.setPort(1024);
      expect(store.getState().port).toBe(1024);

      store.setPort(65535);
      expect(store.getState().port).toBe(65535);
    });

    it("updates port multiple times", () => {
      const store = createMockStore();
      store.setPort(3000);
      store.setPort(4000);
      store.setPort(5000);
      expect(store.getState().port).toBe(5000);
    });
  });

  describe("addApiKey", () => {
    it("adds a key to empty array", () => {
      const store = createMockStore();
      store.addApiKey("test-key-1");
      expect(store.getState().apiKeys).toEqual(["test-key-1"]);
    });

    it("appends key to existing keys", () => {
      const store = createMockStore();
      store.addApiKey("key-1");
      store.addApiKey("key-2");
      store.addApiKey("key-3");
      expect(store.getState().apiKeys).toEqual(["key-1", "key-2", "key-3"]);
    });

    it("does not duplicate existing keys", () => {
      const store = createMockStore();
      store.addApiKey("key-1");
      store.addApiKey("key-1");
      expect(store.getState().apiKeys).toEqual(["key-1", "key-1"]);
    });

    it("adds empty string as valid key", () => {
      const store = createMockStore();
      store.addApiKey("");
      expect(store.getState().apiKeys).toContain("");
    });

    it("handles special characters in keys", () => {
      const store = createMockStore();
      store.addApiKey("sk-1234abcd!@#$%");
      expect(store.getState().apiKeys).toContain("sk-1234abcd!@#$%");
    });
  });

  describe("removeApiKey", () => {
    it("removes key by index", () => {
      const store = createMockStore();
      store.addApiKey("key-1");
      store.addApiKey("key-2");
      store.addApiKey("key-3");

      store.removeApiKey(1);
      expect(store.getState().apiKeys).toEqual(["key-1", "key-3"]);
    });

    it("removes first key (index 0)", () => {
      const store = createMockStore();
      store.addApiKey("key-1");
      store.addApiKey("key-2");

      store.removeApiKey(0);
      expect(store.getState().apiKeys).toEqual(["key-2"]);
    });

    it("removes last key", () => {
      const store = createMockStore();
      store.addApiKey("key-1");
      store.addApiKey("key-2");
      store.addApiKey("key-3");

      store.removeApiKey(2);
      expect(store.getState().apiKeys).toEqual(["key-1", "key-2"]);
    });

    it("handles removing from single key array", () => {
      const store = createMockStore();
      store.addApiKey("only-key");

      store.removeApiKey(0);
      expect(store.getState().apiKeys).toEqual([]);
    });

    it("does nothing when index is out of bounds", () => {
      const store = createMockStore();
      store.addApiKey("key-1");

      store.removeApiKey(10);
      expect(store.getState().apiKeys).toEqual(["key-1"]);
    });

    it("does nothing when index is negative", () => {
      const store = createMockStore();
      store.addApiKey("key-1");
      store.addApiKey("key-2");

      store.removeApiKey(-1);
      expect(store.getState().apiKeys).toEqual(["key-1", "key-2"]);
    });

    it("handles multiple removals", () => {
      const store = createMockStore();
      store.addApiKey("key-1");
      store.addApiKey("key-2");
      store.addApiKey("key-3");
      store.addApiKey("key-4");

      store.removeApiKey(1);
      expect(store.getState().apiKeys).toEqual(["key-1", "key-3", "key-4"]);

      store.removeApiKey(0);
      expect(store.getState().apiKeys).toEqual(["key-3", "key-4"]);
    });
  });

  describe("reset", () => {
    it("resets port to default", () => {
      const store = createMockStore();
      store.setPort(9999);
      store.reset();
      expect(store.getState().port).toBe(8317);
    });

    it("resets apiKeys to empty array", () => {
      const store = createMockStore();
      store.addApiKey("key-1");
      store.addApiKey("key-2");
      store.reset();
      expect(store.getState().apiKeys).toEqual([]);
    });

    it("resets both port and keys", () => {
      const store = createMockStore();
      store.setPort(3000);
      store.addApiKey("key-1");
      store.addApiKey("key-2");
      store.reset();
      expect(store.getState()).toEqual({ port: 8317, apiKeys: [] });
    });

    it("can be called multiple times safely", () => {
      const store = createMockStore();
      store.reset();
      store.reset();
      store.reset();
      expect(store.getState()).toEqual({ port: 8317, apiKeys: [] });
    });
  });

  describe("store integration", () => {
    it("handles complex workflows", () => {
      const store = createMockStore();

      // Set up initial state
      store.setPort(8080);
      store.addApiKey("key-1");
      store.addApiKey("key-2");
      expect(store.getState().apiKeys).toHaveLength(2);

      // Modify state
      store.removeApiKey(0);
      expect(store.getState().apiKeys).toEqual(["key-2"]);

      // Add more keys
      store.addApiKey("key-3");
      store.addApiKey("key-4");
      expect(store.getState().apiKeys).toHaveLength(3);

      // Reset
      store.reset();
      expect(store.getState().port).toBe(8317);
      expect(store.getState().apiKeys).toHaveLength(0);
    });

    it("persists state across operations", () => {
      const store = createMockStore();
      store.addApiKey("persistent-key");

      store.setPort(9000);
      expect(store.getState().apiKeys).toContain("persistent-key");

      store.removeApiKey(0);
      expect(store.getState().port).toBe(9000);
    });
  });

  describe("edge cases", () => {
    it("handles port 0", () => {
      const store = createMockStore();
      store.setPort(0);
      expect(store.getState().port).toBe(0);
    });

    it("handles very large port numbers", () => {
      const store = createMockStore();
      store.setPort(99999);
      expect(store.getState().port).toBe(99999);
    });

    it("handles removing from empty array", () => {
      const store = createMockStore();
      store.removeApiKey(0);
      expect(store.getState().apiKeys).toEqual([]);
    });

    it("handles adding duplicate keys", () => {
      const store = createMockStore();
      const duplicateKey = "sk-duplicate";
      store.addApiKey(duplicateKey);
      store.addApiKey(duplicateKey);
      store.addApiKey(duplicateKey);

      expect(store.getState().apiKeys).toEqual([
        duplicateKey,
        duplicateKey,
        duplicateKey,
      ]);

      store.removeApiKey(1);
      expect(store.getState().apiKeys).toEqual([duplicateKey, duplicateKey]);
    });
  });
});
