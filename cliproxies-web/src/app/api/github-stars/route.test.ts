import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./github-stars/route";
import { fetchRepoStars } from "@/lib/github";
import * as security from "@/lib/security";

// Mock the fetchRepoStars function
vi.mock("@/lib/github", () => ({
  fetchRepoStars: vi.fn(),
}));

// Mock security functions
vi.mock("@/lib/security", () => ({
  validateGitHubRepo: vi.fn(() => true),
  sanitizeInput: vi.fn((input: string) => input),
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    remaining: 29,
    resetAt: Date.now() + 60000,
  })),
  createErrorResponse: vi.fn((message: string, status: number) => {
    return Response.json({ error: message }, { status });
  }),
}));

describe("GitHub Stars API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET handler", () => {
    it("returns 400 when repo parameter is missing", async () => {
      const request = new Request("http://localhost/api/github-stars");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Missing repo" });
    });

    it("returns 400 when repo parameter is empty", async () => {
      const request = new Request("http://localhost/api/github-stars?repo=");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Missing repo" });
    });

    it("accepts full GitHub URL", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(1000);

      const request = new Request(
        "http://localhost/api/github-stars?repo=https://github.com/owner/repo",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(fetchRepoStars).toHaveBeenCalledWith(
        "https://github.com/owner/repo",
      );
      expect(data).toEqual({ stars: 1000 });
    });

    it("accepts owner/repo format", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(500);

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(fetchRepoStars).toHaveBeenCalledWith(
        "https://github.com/owner/repo",
      );
      expect(data).toEqual({ stars: 500 });
    });

    it("returns 0 when fetchRepoStars returns null", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(null);

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ stars: 0 });
    });

    it("returns 200 with stars count on success", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(1234);

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.stars).toBe(1234);
    });

    it("handles URL encoding in repo parameter", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(100);

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner%2Frepo",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(fetchRepoStars).toHaveBeenCalledWith(
        "https://github.com/owner/repo",
      );
    });

    it("preserves original URL format when passed", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(50);

      const request = new Request(
        "http://localhost/api/github-stars?repo=http://github.com/owner/repo",
      );
      const response = await GET(request);

      expect(fetchRepoStars).toHaveBeenCalledWith(
        "http://github.com/owner/repo",
      );
    });
  });

  describe("revalidation", () => {
    it("has revalidate set to 86_400 seconds (24 hours)", () => {
      // The revalidate is set at the module level
      const routeModule = require("./github-stars/route");
      expect(routeModule.revalidate).toBe(86_400);
    });
  });

  describe("error handling", () => {
    it("handles fetchRepoStars errors gracefully", async () => {
      vi.mocked(fetchRepoStars).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo",
      );
      const response = await GET(request);
      const data = await response.json();

      // Should return 0 when fetch fails
      expect(data).toEqual({ stars: 0 });
    });

    it("handles timeout from fetchRepoStars", async () => {
      vi.mocked(fetchRepoStars).mockRejectedValueOnce(
        new Error("Request timeout"),
      );

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.stars).toBe(0);
    });
  });

  describe("input validation", () => {
    it("handles repo with trailing slash", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(100);

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo/",
      );
      const response = await GET(request);

      expect(fetchRepoStars).toHaveBeenCalledWith(
        "https://github.com/owner/repo/",
      );
    });

    it("handles repo with .git suffix", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(100);

      const request = new Request(
        "http://localhost/api/github-stars?repo=https://github.com/owner/repo.git",
      );
      const response = await GET(request);

      // The function should be called with the exact URL provided
      expect(fetchRepoStars).toHaveBeenCalledWith(
        "https://github.com/owner/repo.git",
      );
    });

    it("handles uppercase characters in repo", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(100);

      const request = new Request(
        "http://localhost/api/github-stars?repo=Owner/Repo",
      );
      const response = await GET(request);

      expect(fetchRepoStars).toHaveBeenCalledWith(
        "https://github.com/Owner/Repo",
      );
    });
  });

  describe("edge cases", () => {
    it("handles very long repo names", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(100);

      const longRepo = "a".repeat(100) + "/" + "b".repeat(100);
      const request = new Request(
        `http://localhost/api/github-stars?repo=${longRepo}`,
      );
      const response = await GET(request);

      expect(fetchRepoStars).toHaveBeenCalledWith(
        `https://github.com/${longRepo}`,
      );
    });

    it("handles special characters in repo name", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(100);

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo-name-123",
      );
      const response = await GET(request);

      expect(fetchRepoStars).toHaveBeenCalledWith(
        "https://github.com/owner/repo-name-123",
      );
    });

    it("handles repo with only owner (no slash)", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(null);

      const request = new Request(
        "http://localhost/api/github-stars?repo=owneronly",
      );
      const response = await GET(request);

      expect(fetchRepoStars).toHaveBeenCalledWith(
        "https://github.com/owneronly",
      );
      // fetchRepoStars should return null for invalid repo format
      const data = await response.json();
      expect(data.stars).toBe(0);
    });
  });

  describe("response format", () => {
    it("returns JSON response", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(100);

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo",
      );
      const response = await GET(request);

      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
    });

    it("returns correct response structure", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(999);

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty("stars");
      expect(typeof data.stars).toBe("number");
    });
  });

  describe("security and rate limiting", () => {
    it("applies rate limiting", async () => {
      vi.spyOn(security, "checkRateLimit").mockReturnValue({
        allowed: false,
        resetAt: Date.now() + 60000,
      });

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo",
      );
      const response = await GET(request);

      expect(response.status).toBe(429);
    });

    it("includes rate limit headers on success", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(100);
      vi.spyOn(security, "checkRateLimit").mockReturnValue({
        allowed: true,
        remaining: 25,
        resetAt: Date.now() + 60000,
      });

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo",
      );
      const response = await GET(request);

      expect(response.headers.get("X-RateLimit-Limit")).toBeTruthy();
      expect(response.headers.get("X-RateLimit-Remaining")).toBeTruthy();
    });

    it("validates repo format", async () => {
      vi.spyOn(security, "validateGitHubRepo").mockReturnValue(false);

      const request = new Request(
        "http://localhost/api/github-stars?repo=invalid-format",
      );
      const response = await GET(request);

      expect(security.validateGitHubRepo).toHaveBeenCalled();
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("sanitizes input to prevent XSS", async () => {
      vi.spyOn(security, "sanitizeInput").mockImplementation((input) => {
        return input.replace(/<[^>]*>/g, "");
      });

      const request = new Request(
        "http://localhost/api/github-stars?repo=<script>alert('xss')</script>",
      );
      await GET(request);

      expect(security.sanitizeInput).toHaveBeenCalled();
    });

    it("extracts IP from x-forwarded-for header", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValueOnce(100);

      const request = new Request(
        "http://localhost/api/github-stars?repo=owner/repo",
      );
      request.headers.set("x-forwarded-for", "203.0.113.1, 70.41.3.18");

      await GET(request);

      const rateLimitCall = vi.mocked(security.checkRateLimit).mock.calls[0];
      expect(rateLimitCall[0]).toContain("203.0.113.1");
    });
  });

  describe("concurrency handling", () => {
    it("handles concurrent requests safely", async () => {
      vi.mocked(fetchRepoStars).mockResolvedValue(100);

      const requests = [
        new Request("http://localhost/api/github-stars?repo=owner/repo"),
        new Request("http://localhost/api/github-stars?repo=owner/repo"),
        new Request("http://localhost/api/github-stars?repo=owner/repo"),
      ];

      const responses = await Promise.all(requests.map((req) => GET(req)));

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
