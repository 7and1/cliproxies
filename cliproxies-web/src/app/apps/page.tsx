import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, cache } from "react";
import { AppCard } from "@/components/app-card";
import { AppCardSkeleton } from "@/components/app-card-skeleton";
import { SponsorCard } from "@/components/sponsor-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apps } from "@/data/ecosystem";
import { sponsors } from "@/data/sponsors";
import { fetchRepoStars } from "@/lib/github";
import { JsonLd } from "@/components/json-ld";
import { Search, Filter } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

export const metadata: Metadata = {
  title: "Ecosystem Apps - CLIProxyAPI Clients Directory",
  description:
    "Browse desktop, web, and CLI clients built with CLIProxyAPI. Find macOS menu bar apps, Windows tools, Linux CLI utilities, and web-based AI proxy clients. Filter by platform or search by tag.",
  keywords: [
    "CLIProxyAPI apps",
    "AI proxy clients",
    "macOS AI proxy",
    "Windows AI proxy",
    "Linux AI proxy",
    "Claude Code apps",
    "AI proxy GUI",
    "menu bar AI proxy",
    "VibeProxy",
    "ProxyPal",
    "Quotio",
    "AI proxy tools",
    "desktop AI apps",
    "CLI tools",
  ],
  openGraph: {
    title: "Ecosystem Apps - CLIProxyAPI Clients Directory",
    description:
      "Browse desktop, web, and CLI clients built with CLIProxyAPI. Find macOS menu bar apps, Windows tools, Linux CLI utilities, and web-based AI proxy clients.",
    url: `${siteUrl}/apps`,
    siteName: "CLIProxies.com",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "CLIProxies.com - Ecosystem Apps Directory",
      },
    ],
  },
  twitter: {
    title: "Ecosystem Apps - CLIProxyAPI Clients Directory",
    description:
      "Browse desktop, web, and CLI clients built with CLIProxyAPI. Find macOS menu bar apps, Windows tools, and Linux CLI utilities.",
    card: "summary_large_image",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/apps",
  },
};

const platformOptions = [
  { label: "All", value: "all" },
  { label: "mac", value: "mac" },
  { label: "windows", value: "windows" },
  { label: "linux", value: "linux" },
  { label: "web", value: "web" },
];

const platformValues = ["mac", "windows", "linux", "web"] as const;

const getParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

// Cache fetchRepoStars to prevent duplicate requests during the same render
const cachedFetchRepoStars = cache(fetchRepoStars);

async function AppCardAsync({ app }: { app: (typeof apps)[0] }) {
  const stars = await cachedFetchRepoStars(app.repo);
  return <AppCard app={app} stars={stars ?? undefined} />;
}

export default async function AppsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    platform?: string | string[];
    tag?: string | string[];
    q?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawPlatform = getParam(resolvedSearchParams?.platform) ?? "all";
  const platform = platformValues.includes(
    rawPlatform as (typeof platformValues)[number],
  )
    ? rawPlatform
    : "all";
  const tag = getParam(resolvedSearchParams?.tag);
  const query = (getParam(resolvedSearchParams?.q) ?? "").trim().toLowerCase();

  const filteredApps = apps.filter((app) => {
    const matchesPlatform =
      platform === "all" ||
      app.platforms.includes(platform as (typeof platformValues)[number]);
    const matchesTag = tag ? app.tags.includes(tag) : true;
    const matchesQuery = query
      ? `${app.name} ${app.description}`.toLowerCase().includes(query)
      : true;
    return matchesPlatform && matchesTag && matchesQuery;
  });

  const goldSponsors = sponsors.filter((sponsor) => sponsor.tier === "gold");
  const tags = Array.from(new Set(apps.flatMap((app) => app.tags))).sort();

  const appsPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "CLIProxies Ecosystem Apps",
    description:
      "Browse desktop, web, and CLI clients built with CLIProxyAPI. Find macOS menu bar apps, Windows tools, Linux CLI utilities, and web-based AI proxy clients.",
    url: `${siteUrl}/apps`,
    numberOfItems: filteredApps.length,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: filteredApps.map((app, index) => ({
        "@type": "SoftwareApplication",
        position: index + 1,
        name: app.name,
        description: app.description,
        url: app.repo,
        operatingSystem: app.platforms.join(", "),
        applicationCategory: "DeveloperApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      })),
    },
  };

  const appsPageBreadcrumbSchema = {
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
        name: "Ecosystem Apps",
        item: `${siteUrl}/apps`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={appsPageSchema} />
      <JsonLd data={appsPageBreadcrumbSchema} />
      <main className="container mx-auto space-y-8 px-6 py-12">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">Ecosystem apps</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Curated clients, dashboards, and CLI tools built on top of
            CLIProxyAPI. Filter by platform, tag, or search to find your next
            workflow.
          </p>
        </div>

        {/* Filter Bar */}
        <section className="rounded-2xl border border-border/60 bg-card/60 p-4 md:p-6">
          {/* Platform Filters */}
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {platformOptions.map((option) => {
                const isActive = option.value === platform;
                const href =
                  option.value === "all"
                    ? `/apps`
                    : `/apps?platform=${option.value}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
                return (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    asChild
                  >
                    <Link href={href}>{option.label}</Link>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col gap-3 md:flex-row">
            <form className="relative flex-1" action="/apps">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search apps..."
                defaultValue={query}
                className="pl-9"
                aria-label="Search apps"
              />
            </form>
          </div>

          {/* Tag Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant={!tag ? "default" : "secondary"}
              className="cursor-pointer"
              asChild
            >
              <Link href={`/apps?platform=${platform}`}>All tags</Link>
            </Badge>
            {tags.slice(0, 12).map((item) => (
              <Badge
                key={item}
                variant={tag === item ? "default" : "outline"}
                className="cursor-pointer transition-colors hover:bg-accent/50"
                asChild
              >
                <Link
                  href={`/apps?platform=${platform}&tag=${encodeURIComponent(item)}`}
                >
                  {item}
                </Link>
              </Badge>
            ))}
            {tags.length > 12 && (
              <Badge variant="outline" className="cursor-pointer" asChild>
                <Link href={`/apps?platform=${platform}`}>
                  +{tags.length - 12} more
                </Link>
              </Badge>
            )}
          </div>
        </section>

        {/* Results Summary */}
        {filteredApps.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {filteredApps.length}
              </span>{" "}
              app
              {filteredApps.length !== 1 ? "s" : ""}
              {platform !== "all" && (
                <>
                  {" "}
                  on{" "}
                  <span className="font-medium text-foreground capitalize">
                    {platform}
                  </span>
                </>
              )}
              {tag && (
                <>
                  {" "}
                  tagged{" "}
                  <span className="font-medium text-foreground">
                    &ldquo;{tag}&rdquo;
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Apps Grid */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Gold Sponsors */}
          {goldSponsors.map((sponsor) => (
            <SponsorCard key={sponsor.id} sponsor={sponsor} />
          ))}

          {/* App Cards with Suspense */}
          {filteredApps.map((app) => (
            <Suspense key={app.id} fallback={<AppCardSkeleton />}>
              <AppCardAsync app={app} />
            </Suspense>
          ))}

          {/* Empty State */}
          {filteredApps.length === 0 && (
            <div className="col-span-full rounded-2xl border border-border/60 bg-card/60 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No apps found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/apps">Clear all filters</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Submit Your App CTA */}
        <section className="rounded-2xl border border-primary/40 bg-card/70 p-8 text-center shadow-lg shadow-black/20">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <Filter className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">
            Built something with CLIProxyAPI?
          </h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
            Add your app to the ecosystem directory. Open a PR on GitHub to get
            listed.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link
                href="https://github.com/CLIProxyAPI/CLIProxyAPI"
                target="_blank"
                rel="noopener noreferrer"
              >
                Submit your app
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
