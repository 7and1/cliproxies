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

  // Add CSP header with nonce
  headers.set("Content-Security-Policy", buildCspHeader(nonce));

  // Add HSTS in production (only on HTTPS)
  if (process.env.NODE_ENV === "production" && url.protocol === "https:") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
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

  // Remove X-Powered-By header if present
  response.headers.delete("x-powered-by");

  return response;
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
