import { NextRequest, NextResponse } from "next/server";
import {
  sanitizeInput,
  sanitizeUrl,
  validateSearchQuery,
  checkRateLimit,
  validateDomain,
  validateYouTubeId,
  createErrorResponse,
} from "@/lib/security";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.CLIProxyAPI_URL ||
  "http://localhost:8317";
const PROXYGRID_SECRET = process.env.PROXYGRID_SECRET || "";

// Allowed endpoints for additional validation
const SEARCH_ENDPOINTS = ["/search/google", "/search/bing", "/search/youtube"];
const URL_PARAM_ENDPOINTS = [
  "/content/screenshot",
  "/content/markdown",
  "/social/reddit",
];
const DOMAIN_ENDPOINTS = ["/content/similarweb"];
const YOUTUBE_ENDPOINTS = ["/video/youtube"];

/**
 * Proxy Grid API proxy route
 *
 * This route forwards requests to the CLIProxyAPI backend which handles
 * the actual Proxy Grid API integration.
 *
 * Routes:
 * - /api/proxygrid/search/google?q=query
 * - /api/proxygrid/search/bing?q=query
 * - /api/proxygrid/search/youtube?q=query
 * - /api/proxygrid/video/youtube/:id
 * - /api/proxygrid/video/youtube/:id/info
 * - /api/proxygrid/social/twitter/:id
 * - /api/proxygrid/social/instagram/:username
 * - /api/proxygrid/social/tiktok/:username
 * - /api/proxygrid/social/reddit?url=...
 * - /api/proxygrid/content/screenshot?url=...
 * - /api/proxygrid/content/markdown?url=...
 * - /api/proxygrid/content/similarweb/:domain
 * - /api/proxygrid/content/hackernews?type=top
 * - /api/proxygrid/commerce/amazon/:asin
 * - /api/proxygrid/commerce/crunchbase/:slug
 */
export const runtime = "edge";

/**
 * Validates the request based on the endpoint
 */
function validateRequest(
  pathname: string,
  searchParams: URLSearchParams,
): { valid: boolean; error?: string } {
  // Check search queries
  for (const endpoint of SEARCH_ENDPOINTS) {
    if (pathname.startsWith(endpoint)) {
      const query = searchParams.get("q");
      if (!query) {
        return { valid: false, error: "Query parameter is required" };
      }
      const validation = validateSearchQuery(query);
      if (!validation.valid) {
        return { valid: false, error: validation.error };
      }
      return { valid: true };
    }
  }

  // Check URL parameters
  for (const endpoint of URL_PARAM_ENDPOINTS) {
    if (pathname.startsWith(endpoint)) {
      const url = searchParams.get("url");
      if (!url) {
        return { valid: false, error: "URL parameter is required" };
      }
      const sanitized = sanitizeUrl(url);
      if (!sanitized) {
        return { valid: false, error: "Invalid URL format" };
      }
      return { valid: true };
    }
  }

  // Check domain parameters
  for (const endpoint of DOMAIN_ENDPOINTS) {
    if (pathname.startsWith(endpoint)) {
      const parts = pathname.split("/");
      const domain = parts[parts.length - 1];
      if (domain && domain !== "similarweb" && !validateDomain(domain)) {
        return { valid: false, error: "Invalid domain format" };
      }
      return { valid: true };
    }
  }

  // Check YouTube endpoints
  for (const endpoint of YOUTUBE_ENDPOINTS) {
    if (pathname.startsWith(endpoint)) {
      const parts = pathname.split("/");
      const videoId = parts[parts.length - 1];
      // Skip validation for "info" suffix
      const actualId = videoId === "info" ? parts[parts.length - 2] : videoId;
      if (actualId && !validateYouTubeId(actualId)) {
        return { valid: false, error: "Invalid YouTube video ID" };
      }
      return { valid: true };
    }
  }

  return { valid: true };
}

/**
 * Gets client IP for rate limiting
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const realIp = request.headers.get("x-real-ip");

  return (
    cfConnectingIp ||
    (forwarded ? forwarded.split(",")[0] : realIp || "unknown")
  );
}

export async function GET(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Rate limiting by IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`proxygrid:${clientIp}`, {
    requests: 100,
    window: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimit.resetAt?.toString() || "",
        },
      },
    );
  }

  // Validate request based on endpoint
  const validation = validateRequest(pathname, searchParams);
  if (!validation.valid) {
    return createErrorResponse(validation.error || "Invalid request", 400);
  }

  // Sanitize search parameters
  const sanitizedParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    const sanitized = sanitizeInput(value);
    sanitizedParams.set(key, sanitized);
  });

  // Build the backend URL - prepend /v1/proxygrid to the path
  const backendPath = "/v1/proxygrid" + pathname.replace("/api/proxygrid", "");
  const backendUrl = new URL(backendPath, BACKEND_URL);

  // Forward sanitized query parameters
  sanitizedParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "cliproxies-web/1.0",
    };

    // Only forward Authorization header if explicitly allowed
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      headers.Authorization = authHeader;
    }

    if (PROXYGRID_SECRET) {
      headers["x-grid-secret"] = PROXYGRID_SECRET;
    }

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers,
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30_000),
    });

    // Handle different content types
    const contentType = response.headers.get("content-type");

    // Handle image responses (screenshots)
    if (contentType?.includes("image/")) {
      const imageBuffer = await response.arrayBuffer();
      return new NextResponse(imageBuffer, {
        status: response.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": rateLimit.remaining?.toString() || "0",
          "X-RateLimit-Reset": rateLimit.resetAt?.toString() || "",
        },
      });
    }

    // Handle markdown responses
    if (contentType?.includes("text/markdown")) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
          "X-Content-Type-Options": "nosniff",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": rateLimit.remaining?.toString() || "0",
          "X-RateLimit-Reset": rateLimit.resetAt?.toString() || "",
        },
      });
    }

    // Handle JSON responses
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": getCacheControlForPath(pathname),
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": rateLimit.remaining?.toString() || "0",
        "X-RateLimit-Reset": rateLimit.resetAt?.toString() || "",
      },
    });
  } catch {
    // Don't expose internal errors in production
    return createErrorResponse("Service temporarily unavailable", 503);
  }
}

/**
 * Determine appropriate cache control header based on the path
 */
function getCacheControlForPath(pathname: string): string {
  // Public long-term cache for video info
  if (pathname.includes("/video/youtube/") && pathname.includes("/info")) {
    return "public, max-age=604800, stale-while-revalidate=86400"; // 7 days
  }

  // Public cache for videos
  if (pathname.includes("/video/youtube/")) {
    return "public, max-age=2592000, stale-while-revalidate=432000"; // 30 days
  }

  // Short cache for search results
  if (pathname.includes("/search/")) {
    return "public, max-age=14400, stale-while-revalidate=3600"; // 4 hours
  }

  // Social media cache
  if (
    pathname.includes("/social/instagram/") ||
    pathname.includes("/social/tiktok/")
  ) {
    return "public, max-age=86400, stale-while-revalidate=14400"; // 24 hours
  }

  // Short cache for Reddit/Twitter
  if (
    pathname.includes("/social/reddit") ||
    pathname.includes("/social/twitter")
  ) {
    return "public, max-age=900, stale-while-revalidate=300"; // 15 minutes
  }

  // Web content cache
  if (pathname.includes("/content/markdown")) {
    return "public, max-age=86400, stale-while-revalidate=14400"; // 24 hours
  }

  // Screenshot cache
  if (pathname.includes("/content/screenshot")) {
    return "public, max-age=3600, stale-while-revalidate=600"; // 1 hour
  }

  // SimilarWeb cache
  if (pathname.includes("/content/similarweb")) {
    return "public, max-age=604800, stale-while-revalidate=86400"; // 7 days
  }

  // HackerNews cache
  if (pathname.includes("/content/hackernews")) {
    return "public, max-age=900, stale-while-revalidate=300"; // 15 minutes
  }

  // Amazon/Crunchbase cache
  if (pathname.includes("/commerce/")) {
    return "public, max-age=86400, stale-while-revalidate=14400"; // 24 hours
  }

  return "public, max-age=300"; // Default 5 minutes
}
