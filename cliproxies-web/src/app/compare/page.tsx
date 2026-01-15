import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { JsonLd } from "@/components/json-ld";
import { Check, X, ArrowRight, BookOpen } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

export const metadata: Metadata = {
  title: "Compare - AI Proxy CLI Tools & OpenAI Proxy Alternatives",
  description:
    "Compare CLIProxyAPI with other AI proxy solutions, OpenAI direct API, Claude proxy alternatives, and Gemini proxy options. Find the best AI API gateway for your needs.",
  keywords: [
    "AI proxy comparison",
    "CLIProxyAPI vs OpenAI proxy",
    "Claude proxy alternatives",
    "Gemini proxy comparison",
    "AI API gateway comparison",
    "self-hosted AI proxy vs managed",
    "OpenAI proxy vs direct API",
  ],
  openGraph: {
    title: "Compare AI Proxy CLI Tools",
    description:
      "Compare CLIProxyAPI with other AI proxy solutions. Find the best AI API gateway for your needs.",
    url: `${siteUrl}/compare`,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "CLIProxies.com - Compare",
      },
    ],
  },
  alternates: {
    canonical: "/compare",
  },
};

const comparisonSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "AI Proxy CLI Tools Comparison",
  description:
    "Compare CLIProxyAPI with other AI proxy solutions and direct API access.",
  itemListElement: [
    {
      "@type": "SoftwareApplication",
      name: "CLIProxyAPI",
      applicationCategory: "DeveloperApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

// Comparison data for different approaches
const comparisonData = {
  proxyVsDirect: {
    title: "Proxy API vs Direct API Access",
    description:
      "Compare using an AI proxy like CLIProxyAPI versus calling provider APIs directly.",
    headers: ["Feature", "Direct API", "CLIProxyAPI", "Commercial Proxy"],
    rows: [
      {
        feature: "Setup Complexity",
        direct: "Low",
        cliproxies: "Medium",
        commercial: "Low",
      },
      {
        feature: "API Key Management",
        direct: "Manual",
        cliproxies: "OAuth/Auto",
        commercial: "Managed",
      },
      {
        feature: "Multi-Provider Support",
        direct: "No",
        cliproxies: "Yes",
        commercial: "Partial",
      },
      {
        feature: "Automatic Failover",
        direct: "No",
        cliproxies: "Yes",
        commercial: "Partial",
      },
      {
        feature: "Request Caching",
        direct: "Manual",
        cliproxies: "Built-in",
        commercial: "Yes",
      },
      {
        feature: "Rate Limiting",
        direct: "Per Key",
        cliproxies: "Configurable",
        commercial: "Managed",
      },
      {
        feature: "Cost",
        direct: "API Only",
        cliproxies: "Free + API",
        commercial: "Premium + API",
      },
      {
        feature: "Open Source",
        direct: "N/A",
        cliproxies: "Yes",
        commercial: "No",
      },
      {
        feature: "Self-Hostable",
        direct: "N/A",
        cliproxies: "Yes",
        commercial: "No",
      },
      {
        feature: "OAuth Support",
        direct: "No",
        cliproxies: "Yes",
        commercial: "Partial",
      },
    ],
  },
  providers: {
    title: "AI Provider Comparison",
    description:
      "Compare the major AI providers you can use through CLIProxyAPI.",
    headers: [
      "Feature",
      "OpenAI",
      "Anthropic/Claude",
      "Google/Gemini",
      "Alibaba/Qwen",
    ],
    rows: [
      {
        feature: "Best Model",
        openai: "GPT-4o",
        claude: "Claude 3.5 Sonnet",
        gemini: "Gemini 2.0",
        qwen: "Qwen 2.5",
      },
      {
        feature: "Code Quality",
        openai: "Excellent",
        claude: "Excellent",
        gemini: "Good",
        qwen: "Good",
      },
      {
        feature: "Context Window",
        openai: "128K",
        claude: "200K",
        gemini: "1M+",
        qwen: "128K",
      },
      {
        feature: "OAuth Support",
        openai: "No",
        claude: "Yes",
        gemini: "Partial",
        qwen: "No",
      },
      {
        feature: "Pricing (per 1M tokens)",
        openai: "$2.50-30",
        claude: "$3-15",
        gemini: "$0.075-1.25",
        qwen: "$0.25-3",
      },
      {
        feature: "Speed",
        openai: "Fast",
        claude: "Fast",
        gemini: "Very Fast",
        qwen: "Fast",
      },
    ],
  },
  clients: {
    title: "CLIProxyAPI Client Comparison",
    description: "Compare ecosystem clients built on top of CLIProxyAPI.",
    headers: ["Feature", "VibeProxy", "ProxyPal", "CodMate", "ProxyPilot"],
    rows: [
      {
        feature: "Platform",
        vibeproxy: "macOS",
        proxypal: "macOS",
        codmate: "macOS",
        proxypilot: "Windows",
      },
      {
        feature: "UI Type",
        vibeproxy: "Menu Bar",
        proxypal: "GUI",
        codmate: "SwiftUI",
        proxypilot: "TUI + Tray",
      },
      {
        feature: "OAuth Flow",
        vibeproxy: "Built-in",
        proxypal: "Built-in",
        codmate: "Built-in",
        proxypilot: "Built-in",
      },
      {
        feature: "Multi-Provider",
        vibeproxy: "Yes",
        proxypal: "Yes",
        codmate: "Yes",
        proxypilot: "Yes",
      },
      {
        feature: "Quota Tracking",
        vibeproxy: "Yes",
        proxypal: "No",
        codmate: "No",
        proxypilot: "No",
      },
      {
        feature: "Auto-Failover",
        vibeproxy: "Yes",
        proxypal: "Yes",
        codmate: "Yes",
        proxypilot: "Yes",
      },
      {
        feature: "Config Generator",
        vibeproxy: "No",
        proxypal: "Yes",
        codmate: "No",
        proxypilot: "Yes",
      },
    ],
  },
};

const recommendations = [
  {
    category: "Individual Developers",
    description: "Best choice for solo developers and hobbyists",
    recommendation: "CLIProxyAPI with VibeProxy (macOS) or CLI tools",
    reason: "Free, open source, easy setup, OAuth authentication",
  },
  {
    category: "Startups",
    description: "Best choice for growing teams",
    recommendation: "CLIProxyAPI with Docker deployment",
    reason: "No licensing costs, self-hosted control, multi-provider failover",
  },
  {
    category: "Enterprise",
    description: "Best choice for large organizations",
    recommendation: "CLIProxyAPI with Kubernetes + Redis",
    reason: "Scalable, auditable, no vendor lock-in, enterprise-ready features",
  },
  {
    category: "Mac Power Users",
    description: "Best choice for macOS workflow integration",
    recommendation: "VibeProxy or ProxyPal",
    reason:
      "Native macOS UI, menu bar integration, seamless Claude Code support",
  },
];

export default function ComparePage() {
  return (
    <>
      <JsonLd data={comparisonSchema} />
      <main className="container mx-auto max-w-6xl px-6 py-12 space-y-16">
        {/* Header */}
        <section className="space-y-4">
          <Badge variant="secondary">Comparison</Badge>
          <h1 className="text-3xl font-semibold md:text-4xl">
            AI Proxy CLI Tools Comparison
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Compare CLIProxyAPI with other AI proxy solutions, direct API
            access, and ecosystem clients. Find the best approach for your use
            case.
          </p>
        </section>

        {/* Proxy vs Direct API */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">
              {comparisonData.proxyVsDirect.title}
            </h2>
            <p className="text-muted-foreground">
              {comparisonData.proxyVsDirect.description}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/50">
                  {comparisonData.proxyVsDirect.headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {comparisonData.proxyVsDirect.rows.map((row, index) => (
                  <tr key={index} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{row.feature}</td>
                    <td className="px-4 py-3">{row.direct}</td>
                    <td className="px-4 py-3 text-primary font-medium">
                      {row.cliproxies}
                    </td>
                    <td className="px-4 py-3">{row.commercial}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Direct API</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Best for simple prototypes and MVPs. No infrastructure overhead
                but requires manual API key management.
              </CardContent>
            </Card>
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="text-lg">CLIProxyAPI</CardTitle>
                <Badge variant="default" className="w-fit">
                  Recommended
                </Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Best for production applications. Free, open source, with OAuth,
                failover, caching, and multi-provider support.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commercial Proxy</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Managed service with support. Higher costs and vendor lock-in,
                but less operational overhead.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Provider Comparison */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">
              {comparisonData.providers.title}
            </h2>
            <p className="text-muted-foreground">
              {comparisonData.providers.description}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/50">
                  {comparisonData.providers.headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {comparisonData.providers.rows.map((row, index) => (
                  <tr key={index} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{row.feature}</td>
                    <td className="px-4 py-3">{row.openai}</td>
                    <td className="px-4 py-3">{row.claude}</td>
                    <td className="px-4 py-3">{row.gemini}</td>
                    <td className="px-4 py-3">{row.qwen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Pro Tip: Use All Providers</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              CLIProxyAPI lets you configure multiple providers simultaneously.
              Use automatic failover to switch between providers, or route
              specific requests to the best model for each task. GPT-4o for
              code, Claude for writing, Gemini for research, and Qwen for
              cost-sensitive operations.
            </CardContent>
          </Card>
        </section>

        {/* Client Comparison */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">
              {comparisonData.clients.title}
            </h2>
            <p className="text-muted-foreground">
              {comparisonData.clients.description}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/50">
                  {comparisonData.clients.headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {comparisonData.clients.rows.map((row, index) => (
                  <tr key={index} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{row.feature}</td>
                    <td className="px-4 py-3">{row.vibeproxy}</td>
                    <td className="px-4 py-3">{row.proxypal}</td>
                    <td className="px-4 py-3">{row.codmate}</td>
                    <td className="px-4 py-3">{row.proxypilot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center">
            <Button asChild>
              <Link href="/apps">
                View All Ecosystem Apps
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">
              Feature Comparison Matrix
            </h2>
            <p className="text-muted-foreground">
              Detailed breakdown of CLIProxyAPI features compared to
              alternatives.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Authentication",
                features: [
                  { name: "OAuth Support", cliproxies: true, direct: false },
                  { name: "API Key Support", cliproxies: true, direct: true },
                  {
                    name: "Session Management",
                    cliproxies: true,
                    direct: false,
                  },
                  {
                    name: "Token Auto-Refresh",
                    cliproxies: true,
                    direct: false,
                  },
                ],
              },
              {
                title: "Reliability",
                features: [
                  { name: "Auto Failover", cliproxies: true, direct: false },
                  { name: "Health Checks", cliproxies: true, direct: false },
                  { name: "Retry Logic", cliproxies: true, direct: false },
                  { name: "Circuit Breaker", cliproxies: true, direct: false },
                ],
              },
              {
                title: "Performance",
                features: [
                  { name: "Response Caching", cliproxies: true, direct: false },
                  {
                    name: "Connection Pooling",
                    cliproxies: true,
                    direct: false,
                  },
                  { name: "Request Batching", cliproxies: true, direct: false },
                  { name: "Rate Limiting", cliproxies: true, direct: false },
                ],
              },
              {
                title: "Operations",
                features: [
                  { name: "Metrics Export", cliproxies: true, direct: false },
                  {
                    name: "Structured Logging",
                    cliproxies: true,
                    direct: false,
                  },
                  {
                    name: "Config Hot-Reload",
                    cliproxies: true,
                    direct: false,
                  },
                  { name: "Web Dashboard", cliproxies: false, direct: false },
                ],
              },
            ].map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.features.map((feature) => (
                      <div
                        key={feature.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{feature.name}</span>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1">
                            {feature.cliproxies ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-primary font-medium">
                              CLIProxyAPI
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {feature.direct ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>Direct API</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Recommendations</h2>
            <p className="text-muted-foreground">
              Not sure which approach to take? Here are our recommendations
              based on your use case.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {recommendations.map((rec) => (
              <Card key={rec.category} className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">{rec.category}</CardTitle>
                  <CardDescription>{rec.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">
                      Recommended
                    </p>
                    <p className="font-medium text-primary">
                      {rec.recommendation}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">
                      Why
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {rec.reason}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-primary/40 bg-card/70 p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Ready to Get Started?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Generate a config.yaml in seconds and start using CLIProxyAPI with
            your favorite AI providers.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/#config">
                Generate Config
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/blog">
                <BookOpen className="mr-2 h-4 w-4" />
                Read Guides
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
