/**
 * Security utilities and validation functions
 * @module lib/security
 */

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "") // Remove event handlers like onclick=
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Validates and sanitizes a URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    // Remove any whitespace
    const trimmed = url.trim();

    // Block javascript: and data: URLs
    if (/^(javascript|data|vbscript):/i.test(trimmed)) {
      return null;
    }

    const parsed = new URL(trimmed);

    // Only allow http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    // Ensure the URL has a valid hostname
    if (!parsed.hostname || parsed.hostname.length > 253) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validates GitHub repo format
 */
export function validateGitHubRepo(repo: string): boolean {
  // Allow formats: "owner/repo" or full GitHub URL
  const slugPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
  const urlPattern = /github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+/;

  return slugPattern.test(repo) || urlPattern.test(repo);
}

/**
 * Validates search query input
 */
export function validateSearchQuery(query: string): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  const sanitized = sanitizeInput(query);

  if (!sanitized) {
    return { valid: false, error: "Query cannot be empty" };
  }

  if (sanitized.length < 2) {
    return { valid: false, error: "Query must be at least 2 characters" };
  }

  if (sanitized.length > 500) {
    return { valid: false, error: "Query is too long" };
  }

  return { valid: true, sanitized };
}

/**
 * Validates YouTube video ID
 */
export function validateYouTubeId(id: string): boolean {
  // YouTube video IDs are exactly 11 characters of specific chars
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/**
 * Extracts and validates YouTube video ID from URL or direct ID
 */
export function extractAndValidateYouTubeId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validates a domain name
 */
export function validateDomain(domain: string): boolean {
  const domainPattern =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainPattern.test(domain);
}

/**
 * Rate limiting storage (in-memory for edge runtime)
 * In production, use a proper rate limiting service like Cloudflare's
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  requests: number;
  window: number; // in milliseconds
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { requests: 60, window: 60_000 },
): { allowed: boolean; resetAt?: number; remaining?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.window,
    });
    return {
      allowed: true,
      resetAt: now + config.window,
      remaining: config.requests - 1,
    };
  }

  if (record.count >= config.requests) {
    return { allowed: false, resetAt: record.resetTime, remaining: 0 };
  }

  record.count++;
  return {
    allowed: true,
    resetAt: record.resetTime,
    remaining: config.requests - record.count,
  };
}

/**
 * Validates API key format (basic check)
 */
export function validateApiKey(key: string): boolean {
  // Basic validation: non-empty, reasonable length, no whitespace
  return (
    typeof key === "string" &&
    key.length > 10 &&
    key.length < 256 &&
    !/\s/.test(key)
  );
}

/**
 * Generates a nonce for CSP
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  "X-DNS-Prefetch-Control": "on",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
} as const;

/**
 * CSP directives for production
 */
export const CSP_DIRECTIVES = {
  "default-src": "'self'",
  "script-src": "'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src": "'self' 'unsafe-inline'",
  "img-src": "'self' data: https: blob:",
  "font-src": "'self' data:",
  "connect-src":
    "'self' https://*.router-for.me https://github.com https://opengraph.githubassets.com",
  "frame-src": "'none'",
  "object-src": "'none'",
  "base-uri": "'self'",
  "form-action": "'self'",
  "frame-ancestors": "'none'",
  "navigate-to": "'self'",
  "upgrade-insecure-requests": "",
} as const;

/**
 * Builds CSP header value
 */
export function buildCspHeader(nonce?: string): string {
  const directives: string[] = [];

  for (const [directive, value] of Object.entries(CSP_DIRECTIVES)) {
    if (nonce && directive === "script-src") {
      directives.push(`${directive} 'nonce-${nonce}' ${value}`);
    } else if (value) {
      directives.push(`${directive} ${value}`);
    } else {
      directives.push(directive);
    }
  }

  return directives.join("; ");
}

/**
 * Error responses that don't leak sensitive information
 */
export class SecurityError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "SecurityError";
  }
}

/**
 * Generic error response for API routes (hides internal details)
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
): Response {
  const isDevelopment = process.env.NODE_ENV === "development";

  return Response.json(
    {
      error: message,
      ...(isDevelopment && { timestamp: Date.now() }),
    },
    { status },
  );
}

/**
 * Validates port number for config generator
 */
export function validatePort(port: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(port)) {
    return { valid: false, error: "Port must be an integer" };
  }

  if (port < 1024) {
    return { valid: false, error: "Port must be 1024 or higher" };
  }

  if (port > 65535) {
    return { valid: false, error: "Port must be 65535 or lower" };
  }

  return { valid: true };
}
