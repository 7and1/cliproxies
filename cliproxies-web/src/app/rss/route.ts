import { NextResponse } from "next/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

// Escape XML special characters to prevent XXE attacks
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  // Validate site URL to prevent header injection
  const validatedSiteUrl = escapeXml(siteUrl);

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CLIProxies.com - AI Proxy CLI Hub</title>
    <description>Unified AI proxy CLI gateway for OpenAI, Claude, Gemini, and more. Generate config.yaml, explore ecosystem apps, and monitor provider status.</description>
    <link>${validatedSiteUrl}/</link>
    <atom:link href="${validatedSiteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <item>
      <title>CLIProxyAPI - Unified AI Proxy CLI Gateway</title>
      <description>CLIProxyAPI is a unified AI proxy CLI gateway that allows you to use multiple AI providers (OpenAI, Claude, Gemini, Qwen, and more) through a single interface with OAuth authentication.</description>
      <link>${validatedSiteUrl}/</link>
      <guid>${validatedSiteUrl}/</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
    <item>
      <title>Ecosystem Apps Directory</title>
      <description>Browse desktop, web, and CLI clients built with CLIProxyAPI. Find macOS menu bar apps, Windows tools, Linux CLI utilities, and web-based AI proxy clients.</description>
      <link>${validatedSiteUrl}/apps</link>
      <guid>${validatedSiteUrl}/apps</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
    <item>
      <title>Provider Status Monitor</title>
      <description>Real-time health status for OpenAI, Claude (Anthropic), Gemini, and other AI providers powering CLIProxyAPI.</description>
      <link>${validatedSiteUrl}/status</link>
      <guid>${validatedSiteUrl}/status</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

  return new NextResponse(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
