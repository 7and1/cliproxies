import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  search,
  video,
  social,
  content,
  commerce,
  cacheManager,
  ProxyGridError,
  CACHE_TTL,
  type SearchResult,
  type YouTubeVideoInfo,
  type HackerNewsStory,
  type RedditPost,
  type SimilarWebData,
} from "./proxygrid";

// Mock fetch
global.fetch = vi.fn();

describe("proxygrid module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache between tests
    cacheManager.invalidate("*");
  });

  describe("CACHE_TTL", () => {
    it("has TTL values for all services", () => {
      expect(CACHE_TTL.youtube).toBeGreaterThan(0);
      expect(CACHE_TTL.google).toBeGreaterThan(0);
      expect(CACHE_TTL.bing).toBeGreaterThan(0);
      expect(CACHE_TTL.hackernews).toBeGreaterThan(0);
      expect(CACHE_TTL.reddit).toBeGreaterThan(0);
      expect(CACHE_TTL.amazon).toBeGreaterThan(0);
    });

    it("has appropriate TTL ranges", () => {
      // YouTube should have longer cache
      expect(CACHE_TTL.youtube).toBeGreaterThan(CACHE_TTL.reddit);
      // Static data like similarweb should have longer cache
      expect(CACHE_TTL.similarweb).toBeGreaterThan(CACHE_TTL.reddit);
    });
  });

  describe("ProxyGridError", () => {
    it("creates error with message and service", () => {
      const error = new ProxyGridError("Test error", "google");
      expect(error.message).toBe("Test error");
      expect(error.service).toBe("google");
      expect(error.name).toBe("ProxyGridError");
    });

    it("includes status code when provided", () => {
      const error = new ProxyGridError("Not found", "youtube", 404);
      expect(error.statusCode).toBe(404);
    });
  });

  describe("search services", () => {
    describe("search.google", () => {
      it("fetches Google search results", async () => {
        const mockResults: SearchResult[] = [
          {
            title: "Test Result",
            url: "https://example.com",
            snippet: "A test result",
            position: 1,
          },
        ];

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockResults,
        } as Response);

        const result = await search.google("test query");

        expect(result).toEqual(mockResults);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/search/google"),
          expect.any(Object),
        );
      });

      it("skips cache when skipCache is true", async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => [],
        } as Response);

        await search.google("test", { skipCache: true });

        expect(global.fetch).toHaveBeenCalled();
      });
    });

    describe("search.bing", () => {
      it("fetches Bing search results", async () => {
        const mockResults: SearchResult[] = [
          {
            title: "Bing Result",
            url: "https://example.com",
            snippet: "A Bing result",
          },
        ];

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockResults,
        } as Response);

        const result = await search.bing("test query");

        expect(result).toEqual(mockResults);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/search/bing"),
          expect.any(Object),
        );
      });
    });

    describe("search.youtube", () => {
      it("fetches YouTube search results", async () => {
        const mockResults: SearchResult[] = [
          {
            title: "Video Title",
            url: "https://youtube.com/watch?v=test",
            snippet: "Video description",
          },
        ];

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockResults,
        } as Response);

        const result = await search.youtube("test query");

        expect(result).toEqual(mockResults);
      });
    });
  });

  describe("video services", () => {
    describe("video.youtube", () => {
      it("fetches YouTube transcript", async () => {
        const mockTranscript = {
          transcript: "This is the transcript text",
          captions: [
            { text: "Hello", offset: 0, duration: 1000 },
            { text: "World", offset: 1000, duration: 1000 },
          ],
        };

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockTranscript,
        } as Response);

        const result = await video.youtube("testVideoId");

        expect(result).toEqual(mockTranscript);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/video/youtube/testVideoId"),
          expect.any(Object),
        );
      });
    });

    describe("video.youtubeInfo", () => {
      it("fetches YouTube video info", async () => {
        const mockInfo: YouTubeVideoInfo = {
          id: "dQw4w9WgXcQ",
          title: "Test Video",
          description: "Test description",
          thumbnail: "https://example.com/thumb.jpg",
          duration: 240,
          viewCount: 1000000,
          publishDate: "2024-01-01",
          channel: {
            name: "Test Channel",
            id: "test-channel",
          },
        };

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockInfo,
        } as Response);

        const result = await video.youtubeInfo("testVideoId");

        expect(result).toEqual(mockInfo);
      });
    });
  });

  describe("social services", () => {
    describe("social.twitter", () => {
      it("fetches Twitter tweet data", async () => {
        const mockTweet = {
          id: "123456789",
          text: "Test tweet",
          author: { username: "testuser", name: "Test User" },
          likes: 100,
          retweets: 10,
        };

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockTweet,
        } as Response);

        const result = await social.twitter("123456789");

        expect(result).toEqual(mockTweet);
      });
    });

    describe("social.instagram", () => {
      it("fetches Instagram profile data", async () => {
        const mockProfile = {
          username: "testuser",
          fullName: "Test User",
          bio: "Test bio",
          profilePic: "https://example.com/pic.jpg",
          followers: 10000,
          following: 500,
          isVerified: true,
        };

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockProfile,
        } as Response);

        const result = await social.instagram("testuser");

        expect(result).toEqual(mockProfile);
      });
    });

    describe("social.tiktok", () => {
      it("fetches TikTok profile data", async () => {
        const mockProfile = {
          username: "testuser",
          displayName: "Test User",
          bio: "Test bio",
          stats: {
            followers: 50000,
            following: 200,
            likes: 1000000,
            videos: 100,
          },
          isVerified: false,
        };

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockProfile,
        } as Response);

        const result = await social.tiktok("testuser");

        expect(result).toEqual(mockProfile);
      });
    });

    describe("social.reddit", () => {
      it("fetches Reddit post data", async () => {
        const mockPost: RedditPost = {
          id: "abc123",
          title: "Test Post",
          url: "https://reddit.com/r/test",
          author: "testuser",
          subreddit: "test",
          score: 500,
          numComments: 100,
          created: 1705305600,
          selftext: "Test content",
        };

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockPost,
        } as Response);

        const result = await social.reddit(
          "https://reddit.com/r/test/comments/abc",
        );

        expect(result).toEqual(mockPost);
      });
    });
  });

  describe("content services", () => {
    describe("content.markdown", () => {
      it("fetches markdown content from URL", async () => {
        const mockMarkdown = "# Test Heading\n\nTest content";

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "text/markdown" }),
          text: async () => mockMarkdown,
        } as Response);

        const result = await content.markdown("https://example.com");

        expect(result).toBe(mockMarkdown);
      });

      it("caches markdown responses", async () => {
        const mockMarkdown = "# Test";
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "text/markdown" }),
          text: async () => mockMarkdown,
        } as Response);

        // First call
        await content.markdown("https://example.com");
        // Second call should use cache
        await content.markdown("https://example.com");

        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    describe("content.screenshot", () => {
      it("fetches screenshot of URL", async () => {
        const mockBlob = new Blob(["fake image"], { type: "image/png" });

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "image/png" }),
          blob: async () => mockBlob,
        } as Response);

        const result = await content.screenshot("https://example.com");

        expect(result).toBeTruthy();
      });
    });

    describe("content.similarweb", () => {
      it("fetches SimilarWeb domain analytics", async () => {
        const mockData: SimilarWebData = {
          domain: "example.com",
          rank: 1000,
          visits: 1000000,
          bounceRate: 45.5,
          pagesPerVisit: 2.5,
          visitDuration: 180,
          sources: { organic: 60, direct: 20, social: 10, referral: 10 },
        };

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockData,
        } as Response);

        const result = await content.similarweb("example.com");

        expect(result).toEqual(mockData);
      });
    });

    describe("content.hackernews", () => {
      it("fetches top HackerNews stories by default", async () => {
        const mockStories: HackerNewsStory[] = [
          {
            id: 1,
            title: "Story 1",
            url: "https://example.com/1",
            score: 100,
            by: "user1",
            time: 1705305600,
          },
          {
            id: 2,
            title: "Story 2",
            url: "https://example.com/2",
            score: 50,
            by: "user2",
            time: 1705305601,
          },
        ];

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockStories,
        } as Response);

        const result = await content.hackernews();

        expect(result).toEqual(mockStories);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("type=top"),
          expect.any(Object),
        );
      });

      it("fetches different story types", async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => [],
        } as Response);

        await content.hackernews("new");

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("type=new"),
          expect.any(Object),
        );
      });
    });
  });

  describe("commerce services", () => {
    describe("commerce.amazon", () => {
      it("fetches Amazon product data", async () => {
        const mockProduct = {
          asin: "B08N5WRWNW",
          title: "Test Product",
          price: 29.99,
          rating: 4.5,
          reviewsCount: 1000,
          availability: "In Stock",
        };

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockProduct,
        } as Response);

        const result = await commerce.amazon("B08N5WRWNW");

        expect(result).toEqual(mockProduct);
      });
    });

    describe("commerce.crunchbase", () => {
      it("fetches Crunchbase organization data", async () => {
        const mockOrg = {
          identifier: {
            uuid: "abc123",
            value: "test-company",
          },
          properties: {
            name: "Test Company",
            short_description: "A test company",
            website: "https://testcompany.com",
            founded_on: "2020-01-01",
            total_funding_usd: 1000000,
            employee_count: 50,
            category: "Software",
          },
        };

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockOrg,
        } as Response);

        const result = await commerce.crunchbase("test-company");

        expect(result).toEqual(mockOrg);
      });
    });
  });

  describe("cache management", () => {
    describe("cacheManager.invalidate", () => {
      it("clears all cache when pattern is not provided", () => {
        cacheManager.invalidate();
        const stats = cacheManager.stats();
        expect(stats.size).toBe(0);
      });

      it("clears all cache when pattern is asterisk", () => {
        cacheManager.invalidate("*");
        const stats = cacheManager.stats();
        expect(stats.size).toBe(0);
      });

      it("clears matching cache entries by pattern", async () => {
        vi.mocked(global.fetch).mockResolvedValue({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => [],
        } as Response);

        await search.google("query1");
        await search.google("query2");

        expect(cacheManager.stats().size).toBeGreaterThan(0);

        cacheManager.invalidate("proxygrid:google:");

        const stats = cacheManager.stats();
        expect(stats.size).toBe(0);
      });
    });

    describe("cacheManager.stats", () => {
      it("returns cache size", () => {
        const stats = cacheManager.stats();
        expect(stats).toHaveProperty("size");
        expect(typeof stats.size).toBe("number");
      });
    });
  });

  describe("error handling", () => {
    it("throws ProxyGridError on non-ok response", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal Server Error" }),
      } as Response);

      await expect(search.google("test")).rejects.toThrow(ProxyGridError);
    });

    it("includes status code in error", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: "Rate limited" }),
      } as Response);

      try {
        await search.google("test");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ProxyGridError);
        if (error instanceof ProxyGridError) {
          expect(error.statusCode).toBe(429);
        }
      }
    });

    it("handles malformed JSON response", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as Response);

      await expect(search.google("test")).rejects.toThrow();
    });
  });

  describe("revalidation options", () => {
    it("passes revalidate option to fetch", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => [],
      } as Response);

      await search.google("test", { skipCache: true, revalidate: 3600 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          next: { revalidate: 3600 },
        }),
      );
    });
  });
});
