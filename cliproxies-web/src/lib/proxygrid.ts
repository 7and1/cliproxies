/**
 * Proxy Grid API Client Library
 *
 * This module provides a TypeScript client for interacting with the Proxy Grid API
 * through the CLIProxyAPI backend.
 */

// Use the API route for edge runtime, or direct backend URL if configured
const API_BASE = process.env.NEXT_PUBLIC_PROXYGRID_API_URL || "/api/proxygrid";

/**
 * Service types supported by the Proxy Grid API
 */
export type ProxyGridService =
  | "google"
  | "bing"
  | "youtube"
  | "youtube_info"
  | "youtube_serp"
  | "similarweb"
  | "web2md"
  | "screenshot"
  | "hackernews"
  | "reddit"
  | "twitter"
  | "instagram"
  | "tiktok"
  | "amazon"
  | "crunchbase";

/**
 * Response wrapper for Proxy Grid API responses
 */
export interface ProxyGridResponse<T = unknown> {
  data?: T;
  error?: string;
  cached?: boolean;
  service: ProxyGridService;
}

/**
 * Search result types
 */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position?: number;
}

/**
 * YouTube video info
 */
export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration?: number;
  viewCount?: number;
  publishDate?: string;
  channel?: {
    name: string;
    id: string;
  };
}

/**
 * HackerNews story types
 */
export type HackerNewsStoryType =
  | "top"
  | "new"
  | "best"
  | "ask"
  | "show"
  | "jobs";

export interface HackerNewsStory {
  id: number;
  title: string;
  url: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
  kids?: number[];
}

/**
 * Reddit post data
 */
export interface RedditPost {
  id: string;
  title: string;
  url: string;
  author: string;
  subreddit: string;
  score: number;
  numComments: number;
  created: number;
  selftext?: string;
}

/**
 * SimilarWeb domain analytics
 */
export interface SimilarWebData {
  domain: string;
  rank: number;
  visits?: number;
  bounceRate?: number;
  pagesPerVisit?: number;
  visitDuration?: number;
  sources?: Record<string, number>;
}

/**
 * Social media profile data
 */
export interface InstagramProfile {
  username: string;
  fullName?: string;
  bio?: string;
  profilePic?: string;
  posts?: number;
  followers?: number;
  following?: number;
  isPrivate?: boolean;
  isVerified?: boolean;
}

export interface TikTokProfile {
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  stats?: {
    followers: number;
    following: number;
    likes: number;
    videos: number;
  };
  isVerified?: boolean;
}

/**
 * Amazon product data
 */
export interface AmazonProduct {
  asin: string;
  title: string;
  price?: number;
  rating?: number;
  reviewsCount?: number;
  availability?: string;
  images?: string[];
  features?: string[];
}

/**
 * Crunchbase organization data
 */
export interface CrunchbaseOrganization {
  identifier: {
    uuid: string;
    value: string;
  };
  properties: {
    name: string;
    short_description?: string;
    website?: string;
    founded_on?: string;
    total_funding_usd?: number;
    employee_count?: number;
    category?: string;
  };
}

/**
 * Error types
 */
export class ProxyGridError extends Error {
  constructor(
    message: string,
    public readonly service: ProxyGridService,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "ProxyGridError";
  }
}

/**
 * Cache TTL configuration (in seconds) for frontend caching
 */
export const CACHE_TTL: Record<ProxyGridService, number> = {
  youtube: 30 * 24 * 60 * 60, // 30 days
  youtube_info: 7 * 24 * 60 * 60, // 7 days
  youtube_serp: 4 * 60 * 60, // 4 hours
  google: 4 * 60 * 60, // 4 hours
  bing: 4 * 60 * 60, // 4 hours
  similarweb: 7 * 24 * 60 * 60, // 7 days
  web2md: 24 * 60 * 60, // 24 hours
  screenshot: 60 * 60, // 1 hour
  reddit: 15 * 60, // 15 minutes
  twitter: 60 * 60, // 1 hour
  instagram: 24 * 60 * 60, // 24 hours
  tiktok: 24 * 60 * 60, // 24 hours
  amazon: 24 * 60 * 60, // 24 hours
  hackernews: 15 * 60, // 15 minutes
  crunchbase: 7 * 24 * 60 * 60, // 7 days
};

/**
 * Frontend in-memory cache for Proxy Grid responses
 */
class ProxyGridCache {
  private cache = new Map<string, { data: unknown; expiresAt: number }>();

  set(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
    });

    // Clean up expired entries periodically
    this.cleanup();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(pattern?: string): void {
    if (!pattern || pattern === "*") {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new ProxyGridCache();

/**
 * Build cache key for a request
 */
function buildCacheKey(
  service: ProxyGridService,
  params: Record<string, string>,
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return `proxygrid:${service}:${sortedParams}`;
}

/**
 * Make a request to the Proxy Grid API via the backend
 */
async function fetchFromProxyGrid<T>(
  service: ProxyGridService,
  endpoint: string,
  params: Record<string, string>,
  options?: {
    skipCache?: boolean;
    revalidate?: number | false;
  },
): Promise<T> {
  const cacheKey = buildCacheKey(service, params);
  const ttl = CACHE_TTL[service];

  // Check cache first (unless skipped)
  if (!options?.skipCache) {
    const cached = cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Build query string
  const queryString = new URLSearchParams(params).toString();
  // Use the endpoint directly - the API route handles the /v1/proxygrid prefix
  const url = `${API_BASE}${endpoint}${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await fetch(url, {
      next:
        options?.revalidate !== undefined
          ? { revalidate: options.revalidate }
          : undefined,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new ProxyGridError(
        error.error || `HTTP ${response.status}`,
        service,
        response.status,
      );
    }

    // Handle different response types
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const data = await response.json();

      // Cache successful responses
      if (!options?.skipCache && data) {
        cache.set(cacheKey, data, ttl);
      }

      return data;
    }

    if (contentType?.includes("text/markdown")) {
      const text = await response.text();

      // Cache markdown responses
      if (!options?.skipCache) {
        cache.set(cacheKey, text, ttl);
      }

      return text as T;
    }

    if (contentType?.includes("image/")) {
      const blob = await response.blob();
      // Don't cache binary responses in memory
      return URL.createObjectURL(blob) as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ProxyGridError) {
      throw error;
    }

    // Return stale cache if available on error
    const stale = cache.get<T>(cacheKey);
    if (stale) {
      console.warn(
        `ProxyGrid API error, returning stale cache for ${service}:`,
        error,
      );
      return stale;
    }

    throw new ProxyGridError(
      error instanceof Error ? error.message : "Unknown error",
      service,
    );
  }
}

/**
 * Search services
 */
export const search = {
  /**
   * Perform a Google search
   */
  google: (query: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<SearchResult[]>(
      "google",
      "/search/google",
      { q: query },
      options,
    ),

  /**
   * Perform a Bing search
   */
  bing: (query: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<SearchResult[]>(
      "bing",
      "/search/bing",
      { q: query },
      options,
    ),

  /**
   * Perform a YouTube search
   */
  youtube: (query: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<SearchResult[]>(
      "youtube_serp",
      "/search/youtube",
      { q: query },
      options,
    ),
};

/**
 * Video services
 */
export const video = {
  /**
   * Get YouTube video transcript/captions
   */
  youtube: (videoId: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<{
      transcript?: string;
      captions?: Array<{ text: string; offset: number; duration: number }>;
    }>("youtube", `/video/youtube/${videoId}`, {}, options),

  /**
   * Get YouTube video info
   */
  youtubeInfo: (videoId: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<YouTubeVideoInfo>(
      "youtube_info",
      `/video/youtube/${videoId}/info`,
      {},
      options,
    ),
};

/**
 * Social media services
 */
export const social = {
  /**
   * Get Twitter/X tweet data
   */
  twitter: (tweetIdOrUrl: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<{
      id: string;
      text: string;
      author: { username: string; name: string };
      likes: number;
      retweets: number;
    }>("twitter", `/social/twitter/${tweetIdOrUrl}`, {}, options),

  /**
   * Get Instagram profile data
   */
  instagram: (username: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<InstagramProfile>(
      "instagram",
      `/social/instagram/${username}`,
      {},
      options,
    ),

  /**
   * Get TikTok profile data
   */
  tiktok: (username: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<TikTokProfile>(
      "tiktok",
      `/social/tiktok/${username}`,
      {},
      options,
    ),

  /**
   * Get Reddit post data
   */
  reddit: (postUrl: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<RedditPost>(
      "reddit",
      "/social/reddit",
      { url: postUrl },
      options,
    ),
};

/**
 * Web content services
 */
export const content = {
  /**
   * Get a screenshot of a URL
   * Returns a blob URL
   */
  screenshot: (url: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<string>(
      "screenshot",
      "/content/screenshot",
      { url },
      options,
    ),

  /**
   * Convert a webpage to Markdown
   */
  markdown: (url: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<string>("web2md", "/content/markdown", { url }, options),

  /**
   * Get SimilarWeb domain analytics
   */
  similarweb: (domain: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<SimilarWebData>(
      "similarweb",
      `/content/similarweb/${domain}`,
      {},
      options,
    ),

  /**
   * Get HackerNews stories
   */
  hackernews: (
    type: HackerNewsStoryType = "top",
    options?: { skipCache?: boolean },
  ) =>
    fetchFromProxyGrid<HackerNewsStory[]>(
      "hackernews",
      "/content/hackernews",
      { type },
      options,
    ),
};

/**
 * Commerce services
 */
export const commerce = {
  /**
   * Get Amazon product data
   */
  amazon: (asinOrUrl: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<AmazonProduct>(
      "amazon",
      `/commerce/amazon/${asinOrUrl}`,
      {},
      options,
    ),

  /**
   * Get Crunchbase organization data
   */
  crunchbase: (slug: string, options?: { skipCache?: boolean }) =>
    fetchFromProxyGrid<CrunchbaseOrganization>(
      "crunchbase",
      `/commerce/crunchbase/${slug}`,
      {},
      options,
    ),
};

/**
 * Cache management
 */
export const cacheManager = {
  /**
   * Invalidate cache entries
   */
  invalidate: (pattern?: string) => {
    cache.invalidate(pattern);
  },

  /**
   * Get cache stats
   */
  stats: () => {
    return {
      size: (cache as unknown as { cache: Map<string, unknown> }).cache.size,
    };
  },
};

/**
 * Default export with all services
 */
const proxygridServices = {
  search,
  video,
  social,
  content,
  commerce,
  cache: cacheManager,
};
export default proxygridServices;
