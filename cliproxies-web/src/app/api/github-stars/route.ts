import { NextResponse } from "next/server";
import { fetchRepoStars } from "@/lib/github";
import {
  validateGitHubRepo,
  sanitizeInput,
  checkRateLimit,
  createErrorResponse,
} from "@/lib/security";

export const revalidate = 86_400;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");

  if (!repo) {
    return createErrorResponse("Repository parameter is required", 400);
  }

  // Sanitize and validate input
  const sanitizedRepo = sanitizeInput(repo);

  if (!validateGitHubRepo(sanitizedRepo)) {
    return createErrorResponse("Invalid repository format", 400);
  }

  // Apply rate limiting by IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  const rateLimit = checkRateLimit(`github-stars:${ip}`, {
    requests: 30,
    window: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimit.resetAt?.toString() || "",
        },
      },
    );
  }

  const repoUrl = sanitizedRepo.includes("github.com")
    ? sanitizedRepo
    : `https://github.com/${sanitizedRepo}`;

  try {
    const stars = await fetchRepoStars(repoUrl);

    return NextResponse.json(
      { stars: stars ?? 0 },
      {
        headers: {
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": rateLimit.remaining?.toString() || "0",
          "X-RateLimit-Reset": rateLimit.resetAt?.toString() || "",
        },
      },
    );
  } catch {
    return createErrorResponse("Failed to fetch repository data", 502);
  }
}
