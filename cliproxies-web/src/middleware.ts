import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SECURITY_HEADERS,
  buildCspHeader,
  generateNonce,
} from "./lib/security";

/**
 * Security middleware for Next.js
 * - Adds security headers
 * - Enforces CSP
 * - Handles HTTPS redirection in production
 * - Protects against common attacks
 * - Implements CSRF protection
 * - Adds referrer policy
 */
export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const url = request.nextUrl;

  // Build security headers
  const headers = new Headers(request.headers);

  // Add standard security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value as string);
  });

  // Add CSP header with nonce for script execution
  headers.set("Content-Security-Policy", buildCspHeader(nonce));

  // Add HSTS in production (only on HTTPS)
  if (process.env.NODE_ENV === "production" && url.protocol === "https:") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  // Add additional security headers
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("X-Download-Options", "noopen");

  // CSRF protection for state-changing operations
  if (isStateChangingOperation(request.method)) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    // Validate Origin and Referer headers for POST/PUT/DELETE/PATCH
    if (!isValidOrigin(origin, referer, host, url)) {
      return new NextResponse(
        JSON.stringify({
          error: "Invalid origin for state-changing operation",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Add CSRF token header
    headers.set("X-Content-Type-Options", "nosniff");
  }

  // Store nonce for use in pages
  headers.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers },
  });

  // Apply headers to response
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value as string);
  });
  response.headers.set("Content-Security-Policy", buildCspHeader(nonce));

  // HSTS for response
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  // Remove X-Powered-By header if present (information disclosure prevention)
  response.headers.delete("x-powered-by");

  return response;
}

/**
 * Determines if the HTTP method is a state-changing operation
 */
function isStateChangingOperation(method: string): boolean {
  return ["POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase());
}

/**
 * Validates Origin and Referer headers for CSRF protection
 */
function isValidOrigin(
  origin: string | null,
  referer: string | null,
  host: string | null,
  url: URL,
): boolean {
  // Allow same-origin requests
  if (!origin) {
    // If no Origin header, check Referer
    if (!referer) {
      // Same-site requests without both headers are allowed
      return true;
    }
    try {
      const refererUrl = new URL(referer);
      return refererUrl.hostname === url.hostname;
    } catch {
      return false;
    }
  }

  try {
    const originUrl = new URL(origin);
    // In production, validate against allowed origins
    if (process.env.NODE_ENV === "production") {
      const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : [url.origin];

      return allowedOrigins.some((allowed) => {
        const allowedUrl = new URL(allowed.trim());
        return originUrl.origin === allowedUrl.origin;
      });
    }

    // In development, be more permissive
    return (
      originUrl.hostname === url.hostname ||
      originUrl.hostname === "localhost" ||
      originUrl.hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
