import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { HeroSection } from "@/components/hero-section";
import { AppCard } from "@/components/app-card";
import { SponsorCard } from "@/components/sponsor-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apps } from "@/data/ecosystem";
import { sponsors } from "@/data/sponsors";
import { JsonLd } from "@/components/json-ld";

// Dynamically import the ConfigGenerator to reduce initial bundle size
const ConfigGenerator = dynamic(
  () =>
    import("@/components/config-generator").then((mod) => ({
      default: mod.ConfigGenerator,
    })),
  {
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 rounded-2xl border border-border/70 glass animate-pulse" />
        <div className="h-96 rounded-2xl border border-border/70 glass animate-pulse" />
      </div>
    ),
  },
);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

export const metadata: Metadata = {
  title: "AI Proxy CLI Hub - OpenAI, Claude & Gemini Gateway",
  description:
    "Unified AI proxy CLI gateway for OpenAI, Claude, Gemini, Qwen, and more. Generate config.yaml in seconds, explore ecosystem apps, and monitor provider status. Free and open source.",
  keywords: [
    "AI proxy CLI",
    "CLIProxyAPI",
    "OpenAI proxy",
    "Claude proxy",
    "Claude Code proxy",
    "Gemini proxy",
    "multi-provider AI proxy",
    "self-hosted AI proxy",
    "ChatGPT proxy",
    "AI API gateway",
    "config.yaml generator",
    "OAuth AI proxy",
    "Anthropic proxy",
    "Google AI proxy",
  ],
  openGraph: {
    title: "AI Proxy CLI Hub - OpenAI, Claude & Gemini Gateway",
    description:
      "Unified AI proxy CLI gateway. Generate config.yaml, explore ecosystem apps, and monitor provider status. Free and open source.",
    url: `${siteUrl}/`,
    siteName: "CLIProxies.com",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "CLIProxies.com - AI Proxy CLI Hub",
      },
    ],
  },
  twitter: {
    title: "AI Proxy CLI Hub - OpenAI, Claude & Gemini Gateway",
    description:
      "Unified AI proxy CLI gateway. Generate config.yaml, explore ecosystem apps, and monitor provider status. Free and open source.",
    card: "summary_large_image",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/",
  },
};

const homePageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "CLIProxies.com - AI Proxy CLI Hub",
  description:
    "Unified AI proxy CLI gateway for OpenAI, Claude, Gemini, and more. Generate config.yaml in seconds, explore ecosystem apps, and monitor provider status.",
  url: siteUrl,
  mainEntity: {
    "@type": "ItemList",
    itemListElement: apps
      .filter((app) => app.featured)
      .slice(0, 3)
      .map((app, index) => ({
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

const homePageBreadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
  ],
};

const StatCard = ({
  value,
  label,
  icon: Icon,
  delay,
}: {
  value: string | number;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  delay?: number;
}) => (
  <div
    className="group rounded-2xl border border-border/60 glass p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gradient">{value}</p>
      </div>
      {Icon && (
        <Icon className="h-5 w-5 text-primary/50 group-hover:text-primary transition-colors" />
      )}
    </div>
  </div>
);

export default function Home() {
  const featuredApps = apps.filter((app) => app.featured).slice(0, 3);
  const goldSponsors = sponsors.filter((sponsor) => sponsor.tier === "gold");

  return (
    <>
      <JsonLd data={homePageSchema} />
      <JsonLd data={homePageBreadcrumbSchema} />
      <div className="space-y-20 pb-20">
        <section className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
          <HeroSection />
          <div className="mt-10 grid gap-4 sm:grid-cols-3 animate-slide-up">
            <StatCard value={apps.length} label="Ecosystem apps" delay={0} />
            <StatCard value="4" label="Platforms covered" delay={100} />
            <StatCard value={sponsors.length} label="Sponsors" delay={200} />
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-semibold">
                Ecosystem spotlight
              </p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold">
                Featured CLIProxyAPI clients
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
                Community-built apps across desktop, CLI, and web. Explore the
                full directory for platform-specific tooling.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="shadow-sm hover:shadow-md transition-all min-h-[44px]"
            >
              <Link href="/apps">View all apps</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>

        <section
          id="config"
          className="container mx-auto grid gap-8 px-4 sm:px-6"
        >
          <div className="space-y-4">
            <Badge variant="secondary" className="gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Config generator
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Generate a clean config.yaml in seconds
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Keep setup consistent across tools. Download a ready-to-run
              config.yaml that plugs directly into CLIProxyAPI without custom
              protocols.
            </p>
          </div>
          <ConfigGenerator />
        </section>

        <section className="container mx-auto grid gap-8 px-4 sm:px-6">
          <div className="space-y-4">
            <Badge variant="secondary">Sponsors</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Partners supporting the CLIProxyAPI community
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Special offers for power users building multi-provider proxy
              stacks.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {goldSponsors.map((sponsor) => (
              <SponsorCard key={sponsor.id} sponsor={sponsor} />
            ))}
            {sponsors
              .filter((sponsor) => sponsor.tier !== "gold")
              .map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} />
              ))}
          </div>
        </section>
      </div>
    </>
  );
}
