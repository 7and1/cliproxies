import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

const blogSlugs = [
  "complete-guide-to-claude-code-proxy",
  "openai-proxy-cli-vs-direct-api",
  "self-hosted-ai-proxy-best-practices",
  "multi-provider-ai-fallback-strategies",
  "gemini-proxy-setup-with-cliproxyapi",
  "oauth-vs-api-keys-for-ai-proxies",
  "quotio-quotio-and-other-cliproxyapi-clients",
  "monitoring-ai-provider-status-with-cliproxyapi",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/apps`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/status`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/proxygrid`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    // Blog posts
    ...blogSlugs.map((slug) => ({
      url: `${siteUrl}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  const platformFilters = ["mac", "windows", "linux", "web"];
  const filterPages: MetadataRoute.Sitemap = platformFilters.map(
    (platform) => ({
      url: `${siteUrl}/apps?platform=${platform}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
  );

  return [...staticPages, ...filterPages];
}
