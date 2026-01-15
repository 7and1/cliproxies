import { describe, it, expect } from "vitest";
import { sponsors } from "./sponsors";
import type { Sponsor } from "./types";

describe("sponsors data", () => {
  describe("sponsors array", () => {
    it("is not empty", () => {
      expect(sponsors.length).toBeGreaterThan(0);
    });

    it("has all required properties", () => {
      sponsors.forEach((sponsor) => {
        expect(sponsor).toHaveProperty("id");
        expect(sponsor).toHaveProperty("name");
        expect(sponsor).toHaveProperty("description");
        expect(sponsor).toHaveProperty("logo");
        expect(sponsor).toHaveProperty("url");
        expect(sponsor).toHaveProperty("tier");
      });
    });

    it("has unique IDs", () => {
      const ids = sponsors.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("has valid URLs", () => {
      sponsors.forEach((sponsor) => {
        expect(sponsor.url).toMatch(/^https?:\/\//);
      });
    });
  });

  describe("tier validations", () => {
    it("has valid tier values", () => {
      const validTiers = ["gold", "silver", "bronze"];

      sponsors.forEach((sponsor) => {
        expect(validTiers).toContain(sponsor.tier);
      });
    });

    it("has at least one gold sponsor", () => {
      const goldSponsors = sponsors.filter((s) => s.tier === "gold");
      expect(goldSponsors.length).toBeGreaterThan(0);
    });

    it("sponsors are ordered by tier (gold first)", () => {
      let prevTierValue = 4;
      const tierValues = { gold: 3, silver: 2, bronze: 1 };

      sponsors.forEach((sponsor) => {
        const currentTierValue = tierValues[sponsor.tier];
        expect(currentTierValue).toBeLessThanOrEqual(prevTierValue);
        prevTierValue = currentTierValue;
      });
    });
  });

  describe("coupon and discount", () => {
    it("has discount when coupon is present", () => {
      sponsors.forEach((sponsor) => {
        if (sponsor.coupon) {
          expect(sponsor.discount).toBeDefined();
          expect(sponsor.discount?.length).toBeGreaterThan(0);
        }
      });
    });

    it("has valid coupon format when present", () => {
      sponsors.forEach((sponsor) => {
        if (sponsor.coupon) {
          expect(sponsor.coupon.trim().length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("logo paths", () => {
    it("has valid logo paths", () => {
      sponsors.forEach((sponsor) => {
        expect(sponsor.logo.length).toBeGreaterThan(0);
      });
    });

    it("logos are either external URLs or relative paths", () => {
      sponsors.forEach((sponsor) => {
        const isExternal = sponsor.logo.match(/^https?:\/\//);
        const isRelative = sponsor.logo.match(/^\//);
        expect(isExternal || isRelative).toBe(true);
      });
    });
  });

  describe("specific sponsor validations", () => {
    it("Z.ai exists and is gold tier", () => {
      const zai = sponsors.find((s) => s.id === "zai");
      expect(zai).toBeDefined();
      expect(zai?.tier).toBe("gold");
      expect(zai?.coupon).toBe("8JVLJQFSKB");
      expect(zai?.discount).toBe("10%");
    });

    it("PackyCode exists and is silver tier", () => {
      const packycode = sponsors.find((s) => s.id === "packycode");
      expect(packycode).toBeDefined();
      expect(packycode?.tier).toBe("silver");
      expect(packycode?.logo).toBe("/sponsors/packycode.png");
    });

    it("Cubence exists and is silver tier", () => {
      const cubence = sponsors.find((s) => s.id === "cubence");
      expect(cubence).toBeDefined();
      expect(cubence?.tier).toBe("silver");
    });
  });

  describe("data integrity", () => {
    it("all names are non-empty strings", () => {
      sponsors.forEach((sponsor) => {
        expect(sponsor.name.trim().length).toBeGreaterThan(0);
      });
    });

    it("all descriptions are non-empty strings", () => {
      sponsors.forEach((sponsor) => {
        expect(sponsor.description.trim().length).toBeGreaterThan(0);
      });
    });

    it("descriptions provide meaningful information", () => {
      sponsors.forEach((sponsor) => {
        expect(sponsor.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe("type safety", () => {
    it("sponsors array matches Sponsor type", () => {
      sponsors.forEach((sponsor) => {
        const typedSponsor: Sponsor = sponsor;
        expect(typedSponsor).toBeDefined();
      });
    });
  });
});
