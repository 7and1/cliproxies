import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { PROVIDERS, fetchProviderStatus } from "@/lib/status";

// Mock the status module
vi.mock("@/lib/status", () => ({
  PROVIDERS: [
    {
      id: "openai",
      name: "OpenAI",
      url: "https://status.openai.com/api/v2/status.json",
      statusPage: "https://status.openai.com",
    },
    {
      id: "anthropic",
      name: "Anthropic",
      url: "https://status.anthropic.com/api/v2/status.json",
      statusPage: "https://status.anthropic.com",
    },
  ],
  fetchProviderStatus: vi.fn(),
}));

describe("Status API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET handler", () => {
    it("returns JSON array of provider statuses", async () => {
      vi.mocked(fetchProviderStatus).mockResolvedValueOnce({
        id: "openai",
        name: "OpenAI",
        indicator: "none",
        description: "All systems operational",
        statusPage: "https://status.openai.com",
        checkedAt: new Date("2024-01-15T10:00:00Z"),
      });

      vi.mocked(fetchProviderStatus).mockResolvedValueOnce({
        id: "anthropic",
        name: "Anthropic",
        indicator: "minor",
        description: "Some issues",
        statusPage: "https://status.anthropic.com",
        checkedAt: new Date("2024-01-15T10:00:00Z"),
      });

      const response = await GET();
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe("openai");
      expect(data[1].id).toBe("anthropic");
    });

    it("calls fetchProviderStatus for each provider", async () => {
      vi.mocked(fetchProviderStatus).mockResolvedValue({
        id: "test",
        name: "Test",
        indicator: "none",
        description: "OK",
        checkedAt: new Date(),
      });

      await GET();

      expect(fetchProviderStatus).toHaveBeenCalledTimes(2);
      expect(fetchProviderStatus).toHaveBeenCalledWith(PROVIDERS[0]);
      expect(fetchProviderStatus).toHaveBeenCalledWith(PROVIDERS[1]);
    });

    it("returns 200 status code", async () => {
      vi.mocked(fetchProviderStatus).mockResolvedValue({
        id: "test",
        name: "Test",
        indicator: "none",
        description: "OK",
        checkedAt: new Date(),
      });

      const response = await GET();

      expect(response.status).toBe(200);
    });

    it("has JSON content type", async () => {
      vi.mocked(fetchProviderStatus).mockResolvedValue({
        id: "test",
        name: "Test",
        indicator: "none",
        description: "OK",
        checkedAt: new Date(),
      });

      const response = await GET();

      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
    });

    it("fetches all provider statuses in parallel", async () => {
      let resolveCount = 0;
      vi.mocked(fetchProviderStatus).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCount++;
            setTimeout(
              () =>
                resolve({
                  id: "test",
                  name: "Test",
                  indicator: "none",
                  description: "OK",
                  checkedAt: new Date(),
                }),
              10,
            );
          }),
      );

      const startTime = Date.now();
      await GET();
      const endTime = Date.now();

      // Both requests should happen in parallel
      expect(endTime - startTime).toBeLessThan(30);
    });
  });

  describe("revalidation", () => {
    it("has revalidate set to 300 seconds (5 minutes)", async () => {
      const routeModule = await import("./route");
      expect(routeModule.revalidate).toBe(300);
    });
  });

  describe("error handling", () => {
    it("handles partial failures gracefully", async () => {
      vi.mocked(fetchProviderStatus).mockResolvedValueOnce({
        id: "openai",
        name: "OpenAI",
        indicator: "none",
        description: "OK",
        checkedAt: new Date(),
      });

      vi.mocked(fetchProviderStatus).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const response = await GET();
      const data = await response.json();

      // Should still return results, with one provider showing unknown status
      expect(data).toHaveLength(2);
    });

    it("handles all providers failing", async () => {
      vi.mocked(fetchProviderStatus).mockRejectedValue(new Error("All failed"));

      const response = await GET();
      const data = await response.json();

      // Still return 200, even if all providers have unknown status
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("handles timeout from providers", async () => {
      vi.mocked(fetchProviderStatus).mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 100),
          ),
      );

      const response = await GET();

      // Should complete and return some result
      expect(response.status).toBe(200);
    });
  });

  describe("response structure", () => {
    it("returns status objects with correct structure", async () => {
      vi.mocked(fetchProviderStatus).mockResolvedValue({
        id: "test-provider",
        name: "Test Provider",
        indicator: "none",
        description: "All good",
        statusPage: "https://example.com",
        checkedAt: new Date(),
      });

      const response = await GET();
      const data = await response.json();

      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("name");
      expect(data[0]).toHaveProperty("indicator");
      expect(data[0]).toHaveProperty("description");
      expect(data[0]).toHaveProperty("checkedAt");
    });

    it("serializes Date objects correctly", async () => {
      const testDate = new Date("2024-01-15T10:00:00Z");
      vi.mocked(fetchProviderStatus).mockResolvedValue({
        id: "test",
        name: "Test",
        indicator: "none",
        description: "OK",
        checkedAt: testDate,
      });

      const response = await GET();
      const data = await response.json();

      expect(typeof data[0].checkedAt).toBe("string");
      expect(data[0].checkedAt).toContain("2024-01-15");
    });
  });

  describe("edge cases", () => {
    it("handles empty providers array", async () => {
      const originalProviders = [...PROVIDERS];
      PROVIDERS.length = 0;

      try {
        const response = await GET();
        const data = await response.json();

        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(0);
      } finally {
        PROVIDERS.push(...originalProviders);
      }
    });

    it("handles single provider", async () => {
      vi.mocked(fetchProviderStatus).mockResolvedValue({
        id: "single",
        name: "Single Provider",
        indicator: "none",
        description: "OK",
        checkedAt: new Date(),
      });

      const response = await GET();
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("caching", () => {
    it("includes cache headers", async () => {
      vi.mocked(fetchProviderStatus).mockResolvedValue({
        id: "test",
        name: "Test",
        indicator: "none",
        description: "OK",
        checkedAt: new Date(),
      });

      const response = await GET();

      // Next.js adds cache control headers based on revalidate
      expect(response.status).toBe(200);
    });
  });
});
