import type { App, Sponsor } from "@/data/types";

export const mockApp: App = {
  id: "test-app",
  name: "Test App",
  description: "A test application for unit testing",
  platforms: ["mac", "windows"],
  tags: ["CLI", "Test"],
  repo: "https://github.com/test/repo",
  downloadUrl: "https://example.com/download",
  featured: true,
  isPort: false,
};

export const mockApps: App[] = [
  mockApp,
  {
    id: "another-app",
    name: "Another App",
    description: "Another test application",
    platforms: ["linux"],
    tags: ["TUI", "Terminal"],
    repo: "https://github.com/test/another",
    featured: false,
    isPort: true,
  },
  {
    id: "web-app",
    name: "Web App",
    description: "A web-based application",
    platforms: ["web"],
    tags: ["Browser", "Dashboard"],
    repo: "https://github.com/test/webapp",
  },
];

export const mockSponsor: Sponsor = {
  id: "test-sponsor",
  name: "Test Sponsor",
  description: "A test sponsor company",
  logo: "/sponsors/test.png",
  url: "https://example.com",
  coupon: "TESTCODE",
  discount: "20%",
  tier: "gold",
};

export const mockSponsors: Sponsor[] = [
  mockSponsor,
  {
    id: "silver-sponsor",
    name: "Silver Sponsor",
    description: "A silver tier sponsor",
    logo: "/sponsors/silver.png",
    url: "https://example.com/silver",
    coupon: "SILVER",
    discount: "10%",
    tier: "silver",
  },
  {
    id: "bronze-sponsor",
    name: "Bronze Sponsor",
    description: "A bronze tier sponsor",
    logo: "/sponsors/bronze.png",
    url: "https://example.com/bronze",
    tier: "bronze",
  },
];

export const mockProviderStatus = {
  id: "openai",
  name: "OpenAI",
  indicator: "none",
  description: "All systems operational",
  statusPage: "https://status.openai.com",
  checkedAt: new Date("2024-01-15T10:00:00Z"),
};

export const mockGitHubStarsResponse = {
  stars: 1234,
};

export const mockProxyGridResponse = {
  data: [
    {
      title: "Test Result",
      url: "https://example.com",
      snippet: "A test search result",
    },
  ],
  service: "google" as const,
  cached: false,
};

export const mockYouTubeVideoInfo = {
  id: "dQw4w9WgXcQ",
  title: "Test Video",
  description: "A test video description",
  thumbnail: "https://example.com/thumb.jpg",
  duration: 240,
  viewCount: 1000000,
  publishDate: "2024-01-01",
  channel: {
    name: "Test Channel",
    id: "test-channel",
  },
};

export const mockHackerNewsStory = {
  id: 12345,
  title: "Test HN Story",
  url: "https://example.com",
  score: 100,
  by: "testuser",
  time: 1705305600,
  descendants: 50,
  kids: [12346, 12347],
};

export const mockRedditPost = {
  id: "abc123",
  title: "Test Reddit Post",
  url: "https://reddit.com/r/test",
  author: "testuser",
  subreddit: "test",
  score: 500,
  numComments: 100,
  created: 1705305600,
  selftext: "Test post content",
};
