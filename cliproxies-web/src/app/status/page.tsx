import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PROVIDERS,
  fetchProviderStatus,
  getIndicatorStyles,
  getOverallStatus,
  mockIncidents,
} from "@/lib/status";
import {
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { JsonLd } from "@/components/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

export const metadata: Metadata = {
  title: "Provider Status - CLIProxyAPI Health Monitor",
  description:
    "Real-time health status for OpenAI, Claude (Anthropic), Gemini, and other AI providers powering CLIProxyAPI. Check service availability and incident history. Updates every 5 minutes.",
  keywords: [
    "AI provider status",
    "OpenAI status",
    "Claude status",
    "Anthropic status",
    "Gemini status",
    "AI proxy status",
    "CLIProxyAPI status",
    "provider health",
    "service availability",
    "AI service status",
    "API uptime",
    "service health monitor",
  ],
  openGraph: {
    title: "Provider Status - CLIProxyAPI Health Monitor",
    description:
      "Real-time health status for OpenAI, Claude, Gemini, and other AI providers powering CLIProxyAPI. Updates every 5 minutes.",
    url: `${siteUrl}/status`,
    siteName: "CLIProxies.com",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "CLIProxies.com - Provider Status",
      },
    ],
  },
  twitter: {
    title: "Provider Status - CLIProxyAPI Health Monitor",
    description:
      "Real-time health status for OpenAI, Claude, Gemini, and other AI providers. Updates every 5 minutes.",
    card: "summary_large_image",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/status",
  },
};

const statusIcons: Record<string, React.ElementType> = {
  none: CheckCircle2,
  minor: AlertTriangle,
  major: AlertTriangle,
  critical: XCircle,
  unknown: HelpCircle,
};

const incidentStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  resolved: {
    label: "Resolved",
    className: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  },
  monitoring: {
    label: "Monitoring",
    className: "bg-blue-500/20 text-blue-200 border-blue-500/30",
  },
  investigating: {
    label: "Investigating",
    className: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-purple-500/20 text-purple-200 border-purple-500/30",
  },
};

const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default async function StatusPage() {
  const statuses = await Promise.all(
    PROVIDERS.map((provider) => fetchProviderStatus(provider)),
  );
  const overall = getOverallStatus(statuses);
  const OverallIcon = statusIcons[overall.indicator];

  const statusPageSchema = {
    "@context": "https://schema.org",
    "@type": "SpecialAnnouncement",
    name: "CLIProxyAPI Provider Status",
    description:
      "Real-time health status for OpenAI, Claude, Gemini, and other AI providers powering CLIProxyAPI. Updates every 5 minutes.",
    url: `${siteUrl}/status`,
    category: "Service Status",
    datePosted: new Date().toISOString(),
    announcementLocation: {
      "@type": "VirtualLocation",
      url: `${siteUrl}/status`,
    },
  };

  const statusPageBreadcrumbSchema = {
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
        name: "Provider Status",
        item: `${siteUrl}/status`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={statusPageSchema} />
      <JsonLd data={statusPageBreadcrumbSchema} />
      <main className="container mx-auto space-y-10 px-6 py-12">
        {/* Header with Overall Status */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold">Provider status</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Aggregated health signals from the providers powering CLIProxyAPI
              OAuth flows. Data refreshes every 5 minutes.
            </p>
          </div>

          {/* Overall Status Banner */}
          <div
            className={`flex items-center gap-4 rounded-2xl border ${getIndicatorStyles(overall.indicator)} p-6`}
          >
            <div
              className={`rounded-full p-3 ${overall.indicator === "none" ? "bg-emerald-500/30" : overall.indicator === "critical" ? "bg-red-500/30" : "bg-amber-500/30"}`}
            >
              <OverallIcon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold">{overall.description}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden="true" />
                Last checked:{" "}
                <time dateTime={new Date().toISOString()}>
                  {new Date().toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </p>
            </div>
          </div>
        </div>

        {/* Provider Status Cards */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">Provider status</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statuses.map((status) => {
              const StatusIcon = statusIcons[status.indicator];
              return (
                <div
                  key={status.id}
                  className="group relative rounded-2xl border border-border/60 bg-card/60 p-5 transition-all hover:border-border/80"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${status.indicator === "none" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}
                      >
                        <StatusIcon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{status.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {status.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border ${getIndicatorStyles(status.indicator)}`}
                    >
                      {status.indicator}
                    </Badge>
                  </div>
                  {status.statusPage && (
                    <Link
                      href={status.statusPage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`View ${status.name} status page`}
                    >
                      <span>View status page</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Incidents */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">Recent incidents</h2>
          <div className="rounded-2xl border border-border/60 bg-card/60">
            {mockIncidents.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No incidents reported in the last 30 days.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {mockIncidents.map((incident) => {
                  const config = incidentStatusConfig[incident.status];
                  return (
                    <article
                      key={incident.id}
                      className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${config.className}`}
                          >
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {incident.providerName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ·
                          </span>
                          <time
                            className="text-xs text-muted-foreground"
                            dateTime={incident.createdAt.toISOString()}
                          >
                            {formatDate(incident.createdAt)}
                          </time>
                        </div>
                        <h3 className="font-medium">{incident.title}</h3>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* CTA for monitoring */}
          <div className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold">Stay informed</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Subscribe to status updates via RSS feed for real-time
                  notifications.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/status/rss.xml">
                    <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
                    RSS Feed
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
