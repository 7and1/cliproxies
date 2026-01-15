import { describe, expect, it } from "vitest";
import { getRepoSlug } from "./github";

describe("getRepoSlug", () => {
  it("parses GitHub URLs", () => {
    expect(getRepoSlug("https://github.com/owner/repo")).toBe("owner/repo");
    expect(getRepoSlug("https://github.com/owner/repo/")).toBe("owner/repo");
    expect(getRepoSlug("http://github.com/owner/repo")).toBe("owner/repo");
  });

  it("returns null for non-GitHub URLs", () => {
    expect(getRepoSlug("https://example.com")).toBeNull();
  });
});
