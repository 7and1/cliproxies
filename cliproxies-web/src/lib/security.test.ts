/**
 * Security utilities tests
 */
import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  sanitizeUrl,
  validateGitHubRepo,
  validateSearchQuery,
  validateYouTubeId,
  extractAndValidateYouTubeId,
  validateDomain,
  validatePort,
  checkRateLimit,
  createErrorResponse,
  buildCspHeader,
  validateApiKey,
} from "./security";

describe("sanitizeInput", () => {
  it("removes HTML tags", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe(
      "scriptalert('xss')/script",
    );
  });

  it("removes javascript: protocol", () => {
    expect(sanitizeInput("javascript:alert(1)")).toBe("alert(1)");
  });

  it("removes event handlers", () => {
    expect(sanitizeInput("onclick=alert(1)")).toBe("alert(1)");
  });

  it("trims whitespace", () => {
    expect(sanitizeInput("  test  ")).toBe("test");
  });

  it("limits length to 1000 chars", () => {
    const long = "a".repeat(2000);
    expect(sanitizeInput(long)).toHaveLength(1000);
  });
});

describe("sanitizeUrl", () => {
  it("accepts valid HTTP URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("accepts valid HTTPS URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
  });

  it("rejects javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects data: URLs", () => {
    expect(sanitizeUrl("data:text/html,<script>")).toBeNull();
  });

  it("rejects vbscript: URLs", () => {
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("rejects non-http protocols", () => {
    expect(sanitizeUrl("ftp://example.com")).toBeNull();
  });

  it("rejects URLs with invalid hostnames", () => {
    expect(sanitizeUrl("https://" + "a".repeat(254) + ".com")).toBeNull();
  });
});

describe("validateGitHubRepo", () => {
  it("accepts owner/repo format", () => {
    expect(validateGitHubRepo("facebook/react")).toBe(true);
  });

  it("accepts full GitHub URLs", () => {
    expect(validateGitHubRepo("https://github.com/facebook/react")).toBe(true);
    expect(validateGitHubRepo("http://github.com/facebook/react")).toBe(true);
  });

  it("rejects invalid format", () => {
    expect(validateGitHubRepo("invalid")).toBe(false);
    expect(validateGitHubRepo("facebook/react/extra")).toBe(false);
  });
});

describe("validateSearchQuery", () => {
  it("accepts valid queries", () => {
    const result = validateSearchQuery("test query");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("test query");
  });

  it("rejects empty queries", () => {
    const result = validateSearchQuery("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Query cannot be empty");
  });

  it("rejects short queries", () => {
    const result = validateSearchQuery("a");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Query must be at least 2 characters");
  });

  it("rejects long queries", () => {
    const result = validateSearchQuery("a".repeat(501));
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Query is too long");
  });
});

describe("validateYouTubeId", () => {
  it("accepts valid 11-character IDs", () => {
    expect(validateYouTubeId("dQw4w9WgXcQ")).toBe(true);
  });

  it("rejects short IDs", () => {
    expect(validateYouTubeId("abc")).toBe(false);
  });

  it("rejects long IDs", () => {
    expect(validateYouTubeId("a".repeat(12))).toBe(false);
  });

  it("rejects IDs with invalid characters", () => {
    expect(validateYouTubeId("invalid@id!")).toBe(false);
  });
});

describe("extractAndValidateYouTubeId", () => {
  it("extracts from youtube.com URLs", () => {
    expect(
      extractAndValidateYouTubeId("https://youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts from youtu.be URLs", () => {
    expect(extractAndValidateYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("accepts direct IDs", () => {
    expect(extractAndValidateYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for invalid inputs", () => {
    expect(extractAndValidateYouTubeId("invalid")).toBeNull();
  });
});

describe("validateDomain", () => {
  it("accepts valid domains", () => {
    expect(validateDomain("example.com")).toBe(true);
    expect(validateDomain("sub.example.com")).toBe(true);
    expect(validateDomain("example.co.uk")).toBe(true);
  });

  it("rejects invalid domains", () => {
    expect(validateDomain("invalid")).toBe(false);
    expect(validateDomain("-example.com")).toBe(false);
  });
});

describe("validatePort", () => {
  it("accepts valid ports", () => {
    expect(validatePort(1024)).toEqual({ valid: true });
    expect(validatePort(8080)).toEqual({ valid: true });
    expect(validatePort(65535)).toEqual({ valid: true });
  });

  it("rejects privileged ports", () => {
    expect(validatePort(1023)).toEqual({
      valid: false,
      error: "Port must be 1024 or higher",
    });
  });

  it("rejects out of range ports", () => {
    expect(validatePort(65536)).toEqual({
      valid: false,
      error: "Port must be 65535 or lower",
    });
  });
});

describe("checkRateLimit", () => {
  it("allows requests within limit", () => {
    const result = checkRateLimit("test-user", { requests: 5, window: 1000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding limit", () => {
    const identifier = "rate-limit-test";
    const config = { requests: 2, window: 1000 };

    expect(checkRateLimit(identifier, config).allowed).toBe(true);
    expect(checkRateLimit(identifier, config).allowed).toBe(true);
    expect(checkRateLimit(identifier, config).allowed).toBe(false);
  });
});

describe("validateApiKey", () => {
  it("accepts valid API keys", () => {
    expect(validateApiKey("sk-1234567890abcdef")).toBe(true);
    expect(validateApiKey("a".repeat(256))).toBe(true);
  });

  it("rejects short keys", () => {
    expect(validateApiKey("short")).toBe(false);
  });

  it("rejects keys with whitespace", () => {
    expect(validateApiKey("key with spaces")).toBe(false);
  });
});

describe("buildCspHeader", () => {
  it("builds CSP without nonce", () => {
    const csp = buildCspHeader();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it("includes nonce when provided", () => {
    const nonce = "abc123";
    const csp = buildCspHeader(nonce);
    expect(csp).toContain(`'nonce-${nonce}'`);
  });
});

describe("createErrorResponse", () => {
  it("creates error response", () => {
    const response = createErrorResponse("Test error", 400);
    expect(response.status).toBe(400);

    return response.json().then((json) => {
      expect(json.error).toBe("Test error");
    });
  });
});
