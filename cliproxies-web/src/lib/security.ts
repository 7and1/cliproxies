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
  "X-DNS-Prefetch-Control": "off",
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
 * CSP directives for development (more permissive)
 */
export const CSP_DIRECTIVES_DEV = {
  ...CSP_DIRECTIVES,
  "script-src": "'self' 'unsafe-eval' 'unsafe-inline' localhost:* 127.0.0.1:*",
  "connect-src":
    "'self' https://*.router-for.me https://github.com https://opengraph.githubassets.com ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*",
} as const;

/**
 * Builds CSP header value
 */
export function buildCspHeader(nonce?: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const directives = isDev ? CSP_DIRECTIVES_DEV : CSP_DIRECTIVES;
  const result: string[] = [];

  for (const [directive, value] of Object.entries(directives)) {
    if (nonce && directive === "script-src") {
      result.push(`${directive} 'nonce-${nonce}' ${value}`);
    } else if (value) {
      result.push(`${directive} ${value}`);
    } else {
      result.push(directive);
    }
  }

  return result.join("; ");
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

/**
 * Secure local storage wrapper with encryption warning
 */
export const SecureStorage = {
  /**
   * Store data in localStorage with security considerations
   * WARNING: localStorage is not encrypted. Sensitive data should use encrypted session storage.
   */
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      // Prefix key to avoid collisions
      const prefixedKey = `cliproxies_${key}`;
      localStorage.setItem(prefixedKey, value);
    } catch (e) {
      console.warn("Failed to store in localStorage:", e);
    }
  },

  /**
   * Get data from localStorage
   */
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const prefixedKey = `cliproxies_${key}`;
      return localStorage.getItem(prefixedKey);
    } catch (e) {
      console.warn("Failed to read from localStorage:", e);
      return null;
    }
  },

  /**
   * Remove data from localStorage
   */
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      const prefixedKey = `cliproxies_${key}`;
      localStorage.removeItem(prefixedKey);
    } catch (e) {
      console.warn("Failed to remove from localStorage:", e);
    }
  },

  /**
   * Clear all cliproxies data from localStorage
   */
  clear: (): void => {
    if (typeof window === "undefined") return;
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("cliproxies_")) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }
  },
};

/**
 * Content Security Policy for external scripts (Subresource Integrity helper)
 * @remarks This function is a placeholder for build-time SRI hash generation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateSRIHash(_content: string): string {
  // This would be used at build time to generate SRI hashes
  // For runtime, we use pre-calculated hashes
  return "";
}

/**
 * Validates Subresource Integrity hash format
 */
export function validateSRIHash(hash: string): boolean {
  // SRI hashes are in format: [algorithm]-[base64_hash]
  const sriPattern = /^(sha256|sha384|sha512)-[A-Za-z0-9+/=]+$/;
  return sriPattern.test(hash);
}

/**
 * XSS Prevention: Escape HTML entities
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate and sanitize user-generated content for display
 */
export function sanitizeUserContent(content: string): string {
  // First escape HTML
  let sanitized = escapeHtml(content);

  // Remove any remaining potentially dangerous patterns
  sanitized = sanitized
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/<iframe/gi, "")
    .replace(/<object/gi, "")
    .replace(/<embed/gi, "");

  return sanitized;
}

/**
 * CSRF token generation for client-side
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Validate CSRF token (for use with API calls)
 */
export function validateCSRFToken(token: string): boolean {
  // In a real implementation, this would validate against a server-provided token
  // For now, we check format
  return /^[a-f0-9]{64}$/.test(token);
}

/**
 * Detect if content type is safe for rendering
 */
export function isSafeContentType(contentType: string): boolean {
  const safeTypes = [
    "text/plain",
    "text/html",
    "text/css",
    "text/javascript",
    "application/json",
    "application/javascript",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/svg+xml",
    "image/webp",
  ];

  return safeTypes.some((type) => contentType.startsWith(type));
}

/**
 * Security configuration for the application
 */
export const SECURITY_CONFIG = {
  // Enable/disable features based on environment
  enableStrictMode: process.env.NODE_ENV === "production",
  enableCSP: true,
  enableHSTS: process.env.NODE_ENV === "production",
  enableXSSProtection: true,
  enableClickjackingProtection: true,

  // CORS settings
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:*",
    "http://127.0.0.1:*",
  ],

  // Rate limiting
  rateLimit: {
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS || "60", 10),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || "60000", 10),
  },

  // Session security
  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || "3600000", 10), // 1 hour default
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
} as const;
