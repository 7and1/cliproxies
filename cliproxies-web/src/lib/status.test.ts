import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PROVIDERS,
  fetchProviderStatus,
  getOverallStatus,
  getIndicatorStyles,
  mockIncidents,
  type ProviderStatus,
} from "./status";

// Mock fetch
global.fetch = vi.fn();

describe("status module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("PROVIDERS constant", () => {
    it("contains all expected providers", () => {
      expect(PROVIDERS).toHaveLength(3);
      expect(PROVIDERS.map((p) => p.id)).toContain("openai");
      expect(PROVIDERS.map((p) => p.id)).toContain("anthropic");
      expect(PROVIDERS.map((p) => p.id)).toContain("google");
    });

    it("has correct provider structure", () => {
      PROVIDERS.forEach((provider) => {
        expect(provider).toHaveProperty("id");
        expect(provider).toHaveProperty("name");
        expect(provider).toHaveProperty("url");
        expect(provider).toHaveProperty("statusPage");
        expect(provider.url).toMatch(/^https?:\/\//);
      });
    });
  });

  describe("fetchProviderStatus", () => {
    it("fetches and returns provider status successfully", async () => {
      const mockResponse = {
        status: {
          indicator: "none",
          description: "All systems operational",
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const provider = PROVIDERS[0];
      const result = await fetchProviderStatus(provider);

      expect(result).toEqual({
        id: provider.id,
        name: provider.name,
        indicator: "none",
        description: "All systems operational",
        statusPage: provider.statusPage,
        checkedAt: expect.any(Date),
      });
    });

    it("returns unknown status on non-ok response", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response);

      const provider = PROVIDERS[0];
      const result = await fetchProviderStatus(provider);

      expect(result.indicator).toBe("unknown");
      expect(result.description).toBe("Status page unavailable");
    });

    it("returns unknown status on fetch error", async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

      const provider = PROVIDERS[0];
      const result = await fetchProviderStatus(provider);

      expect(result.indicator).toBe("unknown");
      expect(result.description).toBe("Status page unavailable");
    });

    it("handles missing status data in response", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const provider = PROVIDERS[0];
      const result = await fetchProviderStatus(provider);

      expect(result.indicator).toBe("unknown");
      expect(result.description).toBe("Unknown");
    });

    it("includes checkedAt timestamp", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: {
            indicator: "minor",
            description: "Some issues",
          },
        }),
      } as Response);

      const before = Date.now();
      const result = await fetchProviderStatus(PROVIDERS[0]);
      const after = Date.now();

      expect(result.checkedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.checkedAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe("getOverallStatus", () => {
    it("returns critical when any provider is critical", () => {
      const statuses: ProviderStatus[] = [
        {
          id: "1",
          name: "A",
          indicator: "none",
          description: "",
          checkedAt: new Date(),
        },
        {
          id: "2",
          name: "B",
          indicator: "critical",
          description: "",
          checkedAt: new Date(),
        },
        {
          id: "3",
          name: "C",
          indicator: "none",
          description: "",
          checkedAt: new Date(),
        },
      ];

      const result = getOverallStatus(statuses);
      expect(result).toEqual({
        indicator: "critical",
        description: "System outage detected",
      });
    });

    it("returns major when any provider is major (no critical)", () => {
      const statuses: ProviderStatus[] = [
        {
          id: "1",
          name: "A",
          indicator: "none",
          description: "",
          checkedAt: new Date(),
        },
        {
          id: "2",
          name: "B",
          indicator: "major",
          description: "",
          checkedAt: new Date(),
        },
      ];

      const result = getOverallStatus(statuses);
      expect(result).toEqual({
        indicator: "major",
        description: "Major service issues",
      });
    });

    it("returns minor when any provider is minor (no major/critical)", () => {
      const statuses: ProviderStatus[] = [
        {
          id: "1",
          name: "A",
          indicator: "none",
          description: "",
          checkedAt: new Date(),
        },
        {
          id: "2",
          name: "B",
          indicator: "minor",
          description: "",
          checkedAt: new Date(),
        },
      ];

      const result = getOverallStatus(statuses);
      expect(result).toEqual({
        indicator: "minor",
        description: "Some service issues",
      });
    });

    it("returns unknown when any provider is unknown (no issues)", () => {
      const statuses: ProviderStatus[] = [
        {
          id: "1",
          name: "A",
          indicator: "none",
          description: "",
          checkedAt: new Date(),
        },
        {
          id: "2",
          name: "B",
          indicator: "unknown",
          description: "",
          checkedAt: new Date(),
        },
      ];

      const result = getOverallStatus(statuses);
      expect(result).toEqual({
        indicator: "unknown",
        description: "Unable to verify status",
      });
    });

    it("returns none when all providers are operational", () => {
      const statuses: ProviderStatus[] = [
        {
          id: "1",
          name: "A",
          indicator: "none",
          description: "",
          checkedAt: new Date(),
        },
        {
          id: "2",
          name: "B",
          indicator: "none",
          description: "",
          checkedAt: new Date(),
        },
      ];

      const result = getOverallStatus(statuses);
      expect(result).toEqual({
        indicator: "none",
        description: "All systems operational",
      });
    });

    it("handles empty array", () => {
      const result = getOverallStatus([]);
      expect(result).toEqual({
        indicator: "none",
        description: "All systems operational",
      });
    });

    it("prioritizes critical over all other statuses", () => {
      const statuses: ProviderStatus[] = [
        {
          id: "1",
          name: "A",
          indicator: "minor",
          description: "",
          checkedAt: new Date(),
        },
        {
          id: "2",
          name: "B",
          indicator: "major",
          description: "",
          checkedAt: new Date(),
        },
        {
          id: "3",
          name: "C",
          indicator: "critical",
          description: "",
          checkedAt: new Date(),
        },
      ];

      const result = getOverallStatus(statuses);
      expect(result.indicator).toBe("critical");
    });
  });

  describe("getIndicatorStyles", () => {
    it("returns correct styles for none indicator", () => {
      const styles = getIndicatorStyles("none");
      expect(styles).toContain("bg-emerald-500/20");
      expect(styles).toContain("text-emerald-200");
      expect(styles).toContain("border-emerald-500/30");
    });

    it("returns correct styles for minor indicator", () => {
      const styles = getIndicatorStyles("minor");
      expect(styles).toContain("bg-amber-500/20");
      expect(styles).toContain("text-amber-200");
    });

    it("returns correct styles for major indicator", () => {
      const styles = getIndicatorStyles("major");
      expect(styles).toContain("bg-orange-500/20");
      expect(styles).toContain("text-orange-200");
    });

    it("returns correct styles for critical indicator", () => {
      const styles = getIndicatorStyles("critical");
      expect(styles).toContain("bg-red-500/20");
      expect(styles).toContain("text-red-200");
    });

    it("returns unknown styles for unknown indicator", () => {
      const styles = getIndicatorStyles("unknown");
      expect(styles).toContain("bg-slate-500/20");
      expect(styles).toContain("text-slate-200");
    });

    it("returns unknown styles for invalid indicator", () => {
      const styles = getIndicatorStyles("invalid" as any);
      expect(styles).toContain("bg-slate-500/20");
    });
  });

  describe("mockIncidents", () => {
    it("contains expected incident structure", () => {
      expect(mockIncidents).toBeInstanceOf(Array);
      expect(mockIncidents.length).toBeGreaterThan(0);

      mockIncidents.forEach((incident) => {
        expect(incident).toHaveProperty("id");
        expect(incident).toHaveProperty("providerId");
        expect(incident).toHaveProperty("providerName");
        expect(incident).toHaveProperty("title");
        expect(incident).toHaveProperty("status");
        expect(incident).toHaveProperty("createdAt");
        expect(incident).toHaveProperty("updatedAt");
      });
    });

    it("has valid status values", () => {
      const validStatuses = [
        "monitoring",
        "investigating",
        "resolved",
        "scheduled",
      ];

      mockIncidents.forEach((incident) => {
        expect(validStatuses).toContain(incident.status);
      });
    });
  });
});
