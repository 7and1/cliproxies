import { describe, it, expect } from "vitest";
import yaml from "yaml";
import { generateConfig } from "./config-generator";

describe("generateConfig", () => {
  describe("default values", () => {
    it("builds a valid config with defaults", () => {
      const output = generateConfig({ apiKeys: ["alpha", "beta"] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed.port).toBe(8317);
      expect(parsed["api-keys"]).toEqual(["alpha", "beta"]);
      expect(parsed["auth-dir"]).toBe("~/.cli-proxy-api");
      expect(parsed.debug).toBe(false);
      expect(parsed["request-retry"]).toBe(3);
    });

    it("has empty host string by default", () => {
      const output = generateConfig({ apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed.host).toBe("");
    });

    it("has default routing strategy", () => {
      const output = generateConfig({ apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed.routing).toEqual({ strategy: "round-robin" });
    });
  });

  describe("port configuration", () => {
    it("respects custom port", () => {
      const output = generateConfig({ port: 9999, apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed.port).toBe(9999);
    });

    it("allows port 1 as minimum", () => {
      const output = generateConfig({ port: 1, apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed.port).toBe(1);
    });

    it("allows port 65535 as maximum", () => {
      const output = generateConfig({ port: 65535, apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed.port).toBe(65535);
    });

    it("defaults to 8317 when port is undefined", () => {
      const output = generateConfig({ apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed.port).toBe(8317);
    });
  });

  describe("api keys configuration", () => {
    it("includes provided api keys", () => {
      const keys = ["key1", "key2", "key3"];
      const output = generateConfig({ apiKeys: keys });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed["api-keys"]).toEqual(keys);
    });

    it("handles empty api keys array", () => {
      const output = generateConfig({ apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed["api-keys"]).toEqual([]);
    });

    it("handles single api key", () => {
      const output = generateConfig({ apiKeys: ["single-key"] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed["api-keys"]).toEqual(["single-key"]);
    });

    it("handles api keys with special characters", () => {
      const specialKeys = ["sk-1234abcd!@#$%", "key-with_underscore"];
      const output = generateConfig({ apiKeys: specialKeys });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed["api-keys"]).toEqual(specialKeys);
    });
  });

  describe("providers configuration", () => {
    it("does not include providers when not provided", () => {
      const output = generateConfig({ apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed).not.toHaveProperty("providers");
    });

    it("does not use providers parameter in output (kept for future use)", () => {
      const providers = [
        { type: "openai-compat" as const, baseUrl: "https://api.openai.com" },
      ];
      const output = generateConfig({ apiKeys: [], providers });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      // Providers are not currently included in the output
      expect(parsed).not.toHaveProperty("providers");
    });
  });

  describe("YAML output format", () => {
    it("produces valid YAML", () => {
      const output = generateConfig({ apiKeys: ["test-key"] });

      expect(() => yaml.parse(output)).not.toThrow();
    });

    it("produces readable YAML formatting", () => {
      const output = generateConfig({ port: 3000, apiKeys: ["key1", "key2"] });

      expect(output).toContain("port: 3000");
      expect(output).toContain("api-keys:");
      expect(output).toContain("- key1");
      expect(output).toContain("- key2");
    });

    it("includes all expected top-level keys", () => {
      const output = generateConfig({ apiKeys: ["key"] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(Object.keys(parsed)).toEqual([
        "host",
        "port",
        "api-keys",
        "auth-dir",
        "debug",
        "request-retry",
        "routing",
      ]);
    });

    it("has consistent key naming with hyphens", () => {
      const output = generateConfig({ apiKeys: [] });

      expect(output).toContain("api-keys:");
      expect(output).toContain("auth-dir:");
      expect(output).toContain("request-retry:");
    });
  });

  describe("fixed configuration values", () => {
    it("sets auth-dir to ~/.cli-proxy-api", () => {
      const output = generateConfig({ apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed["auth-dir"]).toBe("~/.cli-proxy-api");
    });

    it("sets debug to false", () => {
      const output = generateConfig({ apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed.debug).toBe(false);
    });

    it("sets request-retry to 3", () => {
      const output = generateConfig({ apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed["request-retry"]).toBe(3);
    });
  });

  describe("routing configuration", () => {
    it("includes routing section with strategy", () => {
      const output = generateConfig({ apiKeys: [] });
      const parsed = yaml.parse(output) as { routing: { strategy: string } };

      expect(parsed.routing).toBeDefined();
      expect(parsed.routing.strategy).toBe("round-robin");
    });
  });

  describe("edge cases", () => {
    it("handles very long API keys", () => {
      const longKey = "a".repeat(1000);
      const output = generateConfig({ apiKeys: [longKey] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed["api-keys"]).toEqual([longKey]);
    });

    it("handles unicode characters in API keys", () => {
      const unicodeKey = "key-日本語-тест";
      const output = generateConfig({ apiKeys: [unicodeKey] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed["api-keys"]).toEqual([unicodeKey]);
    });

    it("handles port 0", () => {
      const output = generateConfig({ port: 0, apiKeys: [] });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed.port).toBe(0);
    });

    it("handles many API keys", () => {
      const manyKeys = Array.from({ length: 100 }, (_, i) => `key-${i}`);
      const output = generateConfig({ apiKeys: manyKeys });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(parsed["api-keys"]).toEqual(manyKeys);
    });
  });

  describe("type safety", () => {
    it("returns string output", () => {
      const output = generateConfig({ apiKeys: [] });

      expect(typeof output).toBe("string");
    });

    it("matches CLIProxyConfig interface structure", () => {
      const output = generateConfig({
        port: 8080,
        apiKeys: ["test"],
        providers: [
          { type: "openai-compat", baseUrl: "https://api.example.com" },
        ],
      });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      expect(typeof parsed.host).toBe("string");
      expect(typeof parsed.port).toBe("number");
      expect(Array.isArray(parsed["api-keys"])).toBe(true);
      expect(typeof parsed["auth-dir"]).toBe("string");
      expect(typeof parsed.debug).toBe("boolean");
      expect(typeof parsed["request-retry"]).toBe("number");
      expect(typeof parsed.routing).toBe("object");
    });
  });

  describe("integration with config types", () => {
    it("produces config compatible with CLIProxyConfig type", () => {
      const output = generateConfig({
        port: 9000,
        apiKeys: ["key1", "key2"],
      });
      const parsed = yaml.parse(output) as Record<string, unknown>;

      // Verify all required fields exist with correct types
      expect(parsed).toHaveProperty("host");
      expect(parsed).toHaveProperty("port");
      expect(parsed).toHaveProperty("api-keys");
      expect(parsed).toHaveProperty("auth-dir");
      expect(parsed).toHaveProperty("debug");
      expect(parsed).toHaveProperty("request-retry");
      expect(parsed).toHaveProperty("routing");
    });
  });
});
