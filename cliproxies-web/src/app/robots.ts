import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/static/"],
        crawlDelay: 1,
      },
      // Block AI crawlers from using content for training
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "ChatGPT-User",
        disallow: ["/"],
      },
      {
        userAgent: "CCBot",
        disallow: ["/"],
      },
      {
        userAgent: "Google-Extended",
        disallow: ["/"],
      },
      {
        userAgent: "anthropic-ai",
        disallow: ["/"],
      },
      {
        userAgent: "Claude-Web",
        disallow: ["/"],
      },
      {
        userAgent: "Claude-Web/*",
        disallow: ["/"],
      },
      {
        userAgent: "PerplexityBot",
        disallow: ["/"],
      },
      {
        userAgent: "Bytespider",
        disallow: ["/"],
      },
      // Allow specific bots for indexing
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "Slurp",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "DuckDuckBot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
