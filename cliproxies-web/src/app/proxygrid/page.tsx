import type { Metadata } from "next";
import { ProxyGridSearch } from "@/components/proxygrid-search";
import { ProxyGridYouTube } from "@/components/proxygrid-youtube";
import { ProxyGridHackerNews } from "@/components/proxygrid-hackernews";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

export const metadata: Metadata = {
  title: "Proxy Grid API - Search, Social & Web Content Integration",
  description:
    "Access Google, Bing, YouTube search, Instagram, TikTok, Twitter data extraction, web screenshots, and markdown conversion through a unified Proxy Grid API. All responses cached for optimal performance.",
  keywords: [
    "Proxy Grid API",
    "Google search API",
    "Bing search API",
    "YouTube API",
    "social media scraping",
    "web scraping API",
    "Instagram API",
    "TikTok API",
    "Twitter API",
    "Reddit API",
    "screenshot API",
    "markdown converter",
    "web content extraction",
    "HackerNews API",
    "SimilarWeb API",
    "SEO API",
    "SERP API",
  ],
  openGraph: {
    title: "Proxy Grid API - Search, Social & Web Content Integration",
    description:
      "Access Google, Bing, YouTube search, social media data extraction, web screenshots, and markdown conversion through a unified API.",
    url: `${siteUrl}/proxygrid`,
    siteName: "CLIProxies.com",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "CLIProxies.com - Proxy Grid API",
      },
    ],
  },
  twitter: {
    title: "Proxy Grid API - Search, Social & Web Content Integration",
    description:
      "Access Google, Bing, YouTube search, social media data extraction, web screenshots, and markdown conversion through a unified API.",
    card: "summary_large_image",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/proxygrid",
  },
};

const proxyGridSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Proxy Grid API",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description:
    "Access search engines, social media platforms, and web content through a unified API. Google, Bing, YouTube, Instagram, TikTok, Twitter, Reddit screenshots, markdown conversion, and domain analytics.",
  url: `${siteUrl}/proxygrid`,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Google Search",
    "Bing Search",
    "YouTube Search & Video Info",
    "Instagram Profile Data",
    "TikTok Data Extraction",
    "Twitter/X Data",
    "Reddit Content",
    "HackerNews Stories",
    "Web Screenshots",
    "Markdown Conversion",
    "Domain Analytics (SimilarWeb)",
  ],
};

const proxyGridBreadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Proxy Grid API",
      item: `${siteUrl}/proxygrid`,
    },
  ],
};

export default function ProxyGridPage() {
  return (
    <>
      <JsonLd data={proxyGridSchema} />
      <JsonLd data={proxyGridBreadcrumbSchema} />
      <div className="container mx-auto px-6 py-12 space-y-16">
        {/* Header */}
        <section className="space-y-4">
          <div className="space-y-3">
            <Badge variant="secondary">API Integration</Badge>
            <h1 className="text-3xl font-bold">Proxy Grid API</h1>
            <p className="max-w-2xl text-muted-foreground">
              Access search engines, social media platforms, and web content
              through a unified API. All responses are cached for optimal
              performance.
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-card/40 p-4">
              <h3 className="font-semibold mb-2">Search Engines</h3>
              <p className="text-sm text-muted-foreground">
                Google, Bing, and YouTube search with real-time results.
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card/40 p-4">
              <h3 className="font-semibold mb-2">Social Media</h3>
              <p className="text-sm text-muted-foreground">
                Instagram, TikTok, Twitter, and Reddit data extraction.
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card/40 p-4">
              <h3 className="font-semibold mb-2">Web Content</h3>
              <p className="text-sm text-muted-foreground">
                Screenshots, markdown conversion, and domain analytics.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
              <h3 className="font-semibold">Connection</h3>
              <p className="text-sm text-muted-foreground">
                Backend base URL (HTTPS): set <code>CLIProxyAPI_URL</code> or{" "}
                <code>NEXT_PUBLIC_BACKEND_URL</code> to your deployed host.
              </p>
              <p className="text-sm text-muted-foreground">
                Auth header: <code>x-grid-secret: {"{YOUR_SECRET}"}</code> via{" "}
                <code>PROXYGRID_SECRET</code> (kept server-side).
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
              <h3 className="font-semibold">Operational Notes</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  HTTPS-only Proxy Grid endpoints; rotate secrets regularly.
                </li>
                <li>Browser calls limited to configured CORS origins.</li>
                <li>
                  Use <code>force=true</code> to bypass caches when needed.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Search</h2>
            <p className="text-muted-foreground">
              Search across Google, Bing, and YouTube from a single interface.
            </p>
          </div>
          <ProxyGridSearch />
        </section>

        {/* YouTube Section */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">YouTube Video Info</h2>
            <p className="text-muted-foreground">
              Get detailed information about any YouTube video including title,
              description, view count, and more.
            </p>
          </div>
          <ProxyGridYouTube />
        </section>

        {/* HackerNews Section */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">HackerNews</h2>
            <p className="text-muted-foreground">
              Browse top, new, and best stories from HackerNews with real-time
              updates.
            </p>
          </div>
          <ProxyGridHackerNews />
        </section>

        {/* API Documentation */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">API Documentation</h2>
            <p className="text-muted-foreground">
              Integrate Proxy Grid services into your applications using our
              REST API.
            </p>
          </div>

          <div className="space-y-4">
            <ApiEndpointCard
              method="GET"
              path="/v1/proxygrid/search/bing"
              description="Perform a Bing search"
              parameters={[
                { name: "q", description: "Search query", required: true },
              ]}
            />

            <ApiEndpointCard
              method="GET"
              path="/v1/proxygrid/search/google"
              description="Perform a Google search"
              parameters={[
                { name: "q", description: "Search query", required: true },
              ]}
            />

            <ApiEndpointCard
              method="GET"
              path="/v1/proxygrid/video/youtube/:id/info"
              description="Get YouTube video information"
              parameters={[
                { name: "id", description: "YouTube video ID", required: true },
              ]}
            />

            <ApiEndpointCard
              method="GET"
              path="/v1/proxygrid/content/hackernews"
              description="Get HackerNews stories"
              parameters={[
                {
                  name: "type",
                  description: "Story type (top, new, best, ask, show, jobs)",
                  required: false,
                },
              ]}
            />

            <ApiEndpointCard
              method="GET"
              path="/v1/proxygrid/content/markdown"
              description="Convert webpage to Markdown"
              parameters={[
                { name: "url", description: "Target URL", required: true },
              ]}
            />

            <ApiEndpointCard
              method="GET"
              path="/v1/proxygrid/content/screenshot"
              description="Capture a full-page screenshot"
              parameters={[
                { name: "url", description: "Target URL", required: true },
              ]}
            />

            <ApiEndpointCard
              method="GET"
              path="/v1/proxygrid/content/markdown?force=true"
              description="Bypass cache for a fresh markdown scrape"
              parameters={[
                { name: "url", description: "Target URL", required: true },
                {
                  name: "force",
                  description: "true to skip cache",
                  required: false,
                },
              ]}
            />

            <ApiEndpointCard
              method="GET"
              path="/v1/proxygrid/social/instagram/:username"
              description="Get Instagram profile data"
              parameters={[
                {
                  name: "username",
                  description: "Instagram username",
                  required: true,
                },
              ]}
            />
          </div>
        </section>

        {/* Cache Info */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Caching Strategy</h2>
            <p className="text-muted-foreground">
              All Proxy Grid responses are cached with appropriate TTLs for
              optimal performance.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CacheTTLCard service="YouTube Video" ttl="30 days" />
            <CacheTTLCard service="YouTube Info" ttl="7 days" />
            <CacheTTLCard service="Google/Bing Search" ttl="4 hours" />
            <CacheTTLCard service="SimilarWeb" ttl="7 days" />
            <CacheTTLCard service="Web to Markdown" ttl="24 hours" />
            <CacheTTLCard service="Screenshot" ttl="1 hour" />
            <CacheTTLCard service="Reddit/Twitter" ttl="15 minutes" />
            <CacheTTLCard service="HackerNews" ttl="15 minutes" />
          </div>
        </section>
      </div>
    </>
  );
}

function ApiEndpointCard({
  method,
  path,
  description,
  parameters,
}: {
  method: string;
  path: string;
  description: string;
  parameters: { name: string; description: string; required: boolean }[];
}) {
  const methodColor =
    method === "GET" ? "text-green-600 dark:text-green-400" : "";

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <code className={`text-sm font-semibold ${methodColor}`}>{method}</code>
        <code className="text-sm text-muted-foreground">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {parameters.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium">Parameters:</p>
          {parameters.map((param) => (
            <div key={param.name} className="flex gap-2 text-xs">
              <code className="font-medium">{param.name}</code>
              <span className="text-muted-foreground">{param.description}</span>
              {param.required && (
                <Badge variant="destructive" className="text-xs px-1">
                  required
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CacheTTLCard({ service, ttl }: { service: string; ttl: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3 flex items-center justify-between">
      <span className="text-sm font-medium">{service}</span>
      <Badge variant="outline">{ttl}</Badge>
    </div>
  );
}
