import { describe, it, expect } from "vitest";
import { apps } from "./ecosystem";
import type { App } from "./types";

describe("ecosystem data", () => {
  describe("apps array", () => {
    it("is not empty", () => {
      expect(apps.length).toBeGreaterThan(0);
    });

    it("has all required properties", () => {
      apps.forEach((app) => {
        expect(app).toHaveProperty("id");
        expect(app).toHaveProperty("name");
        expect(app).toHaveProperty("description");
        expect(app).toHaveProperty("platforms");
        expect(app).toHaveProperty("tags");
        expect(app).toHaveProperty("repo");
      });
    });

    it("has unique IDs", () => {
      const ids = apps.map((app) => app.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("has valid GitHub repo URLs", () => {
      apps.forEach((app) => {
        expect(app.repo).toMatch(/^https:\/\/github\.com\//);
      });
    });

    it("has non-empty arrays for platforms and tags", () => {
      apps.forEach((app) => {
        expect(app.platforms.length).toBeGreaterThan(0);
        expect(app.tags.length).toBeGreaterThan(0);
      });
    });

    it("has valid platform values", () => {
      const validPlatforms = ["mac", "windows", "linux", "web"];

      apps.forEach((app) => {
        app.platforms.forEach((platform) => {
          expect(validPlatforms).toContain(platform);
        });
      });
    });

    it("has valid featured flags", () => {
      apps.forEach((app) => {
        if (app.featured !== undefined) {
          expect(typeof app.featured).toBe("boolean");
        }
      });
    });

    it("has valid isPort flags", () => {
      apps.forEach((app) => {
        if (app.isPort !== undefined) {
          expect(typeof app.isPort).toBe("boolean");
        }
      });
    });
  });

  describe("specific app validations", () => {
    it("VibeProxy exists and has correct structure", () => {
      const vibeproxy = apps.find((app) => app.id === "vibeproxy");
      expect(vibeproxy).toBeDefined();
      expect(vibeproxy?.name).toBe("VibeProxy");
      expect(vibeproxy?.platforms).toContain("mac");
      expect(vibeproxy?.featured).toBe(true);
    });

    it("Subtitle Translator exists and is web platform", () => {
      const subtitleTranslator = apps.find(
        (app) => app.id === "subtitle-translator",
      );
      expect(subtitleTranslator).toBeDefined();
      expect(subtitleTranslator?.platforms).toContain("web");
    });

    it("ProxyPal exists and is featured", () => {
      const proxypal = apps.find((app) => app.id === "proxypal");
      expect(proxypal).toBeDefined();
      expect(proxypal?.featured).toBe(true);
    });

    it("CodMate exists and is featured", () => {
      const codmate = apps.find((app) => app.id === "codmate");
      expect(codmate).toBeDefined();
      expect(codmate?.featured).toBe(true);
    });

    it("9Router exists and is marked as a port", () => {
      const router9 = apps.find((app) => app.id === "9router");
      expect(router9).toBeDefined();
      expect(router9?.isPort).toBe(true);
    });
  });

  describe("platform distribution", () => {
    it("has apps for each major platform", () => {
      const allPlatforms = new Set<string>();
      apps.forEach((app) => {
        app.platforms.forEach((p) => allPlatforms.add(p));
      });

      expect(allPlatforms.has("mac")).toBe(true);
      expect(allPlatforms.has("windows")).toBe(true);
      expect(allPlatforms.has("linux")).toBe(true);
      expect(allPlatforms.has("web")).toBe(true);
    });

    it("has multi-platform apps", () => {
      const multiPlatformApps = apps.filter((app) => app.platforms.length > 1);
      expect(multiPlatformApps.length).toBeGreaterThan(0);
    });
  });

  describe("featured apps", () => {
    it("has at least one featured app", () => {
      const featuredApps = apps.filter((app) => app.featured);
      expect(featuredApps.length).toBeGreaterThan(0);
    });

    it("featured apps have complete information", () => {
      const featuredApps = apps.filter((app) => app.featured);

      featuredApps.forEach((app) => {
        expect(app.description.length).toBeGreaterThan(20);
        expect(app.tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe("data integrity", () => {
    it("all descriptions are non-empty strings", () => {
      apps.forEach((app) => {
        expect(app.description.trim().length).toBeGreaterThan(0);
      });
    });

    it("all names are non-empty strings", () => {
      apps.forEach((app) => {
        expect(app.name.trim().length).toBeGreaterThan(0);
      });
    });

    it("all tags are non-empty strings", () => {
      apps.forEach((app) => {
        app.tags.forEach((tag) => {
          expect(tag.trim().length).toBeGreaterThan(0);
        });
      });
    });

    it("no duplicate tags within an app", () => {
      apps.forEach((app) => {
        const uniqueTags = new Set(app.tags);
        expect(uniqueTags.size).toBe(app.tags.length);
      });
    });

    it("downloadUrl is valid when present", () => {
      apps.forEach((app) => {
        if (app.downloadUrl) {
          expect(app.downloadUrl).toMatch(/^https?:\/\//);
        }
      });
    });
  });

  describe("type safety", () => {
    it("apps array matches App type", () => {
      apps.forEach((app) => {
        const typedApp: App = app;
        expect(typedApp).toBeDefined();
      });
    });
  });
});
