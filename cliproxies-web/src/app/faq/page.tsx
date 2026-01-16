import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { JsonLd } from "@/components/json-ld";
import {
  ChevronDown,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Github,
} from "lucide-react";

// ISR: Revalidate this page every 6 hours
export const revalidate = 21600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions about CLIProxyAPI",
  description:
    "Find answers to common questions about CLIProxyAPI, AI proxy CLI tools, OpenAI proxy, Claude proxy, Gemini proxy, and self-hosted AI infrastructure.",
  keywords: [
    "CLIProxyAPI FAQ",
    "AI proxy CLI FAQ",
    "OpenAI proxy questions",
    "Claude proxy FAQ",
    "Gemini proxy help",
    "self-hosted AI proxy FAQ",
    "AI API gateway questions",
    "Claude Code proxy FAQ",
  ],
  openGraph: {
    title: "FAQ - CLIProxyAPI",
    description:
      "Find answers to common questions about CLIProxyAPI and AI proxy CLI tools.",
    url: `${siteUrl}/faq`,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "CLIProxies.com - FAQ",
      },
    ],
  },
  alternates: {
    canonical: "/faq",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is CLIProxyAPI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CLIProxyAPI is an open-source AI proxy CLI gateway that provides unified access to multiple AI providers including OpenAI, Claude (Anthropic), Gemini, and more. It handles OAuth authentication, request routing, caching, and failover so you can use your AI subscriptions without managing API keys directly.",
      },
    },
    {
      "@type": "Question",
      name: "How does OAuth authentication work with CLIProxyAPI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CLIProxyAPI implements OAuth flows for each supported provider. When you first use a provider, you'll be directed to authenticate through the provider's OAuth interface. Once authenticated, CLIProxyAPI stores an OAuth token that it uses for subsequent requests. This is more secure than API keys and allows you to use your existing subscriptions.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use CLIProxyAPI with Claude Code?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! CLIProxyAPI is one of the best ways to use Claude Code through a proxy. Several ecosystem apps like VibeProxy, ProxyPal, and CodMate integrate CLIProxyAPI to enable Claude Code usage with OAuth authentication instead of API keys.",
      },
    },
  ],
};

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  code?: string;
  links?: Array<{ label: string; href: string }>;
}

const faqItems: FAQItem[] = [
  {
    id: "what-is-cliproxyapi",
    question: "What is CLIProxyAPI?",
    answer:
      "CLIProxyAPI is an open-source AI proxy CLI gateway that provides unified access to multiple AI providers including OpenAI, Claude (Anthropic), Gemini, Qwen, and more. It handles OAuth authentication, request routing, caching, and automatic failover so you can use your AI subscriptions without managing API keys directly.",
    category: "General",
  },
  {
    id: "how-does-oauth-work",
    question: "How does OAuth authentication work?",
    answer:
      "CLIProxyAPI implements OAuth 2.0 flows for each supported provider. When you first use a provider, you'll be directed to authenticate through the provider's OAuth interface (similar to logging into a website). Once authenticated, CLIProxyAPI securely stores an OAuth token that it uses for subsequent requests. This approach is more secure than storing API keys and allows you to use your existing consumer subscriptions.",
    category: "Authentication",
  },
  {
    id: "claude-code-support",
    question: "Can I use CLIProxyAPI with Claude Code?",
    answer:
      "Yes! CLIProxyAPI is one of the best ways to use Claude Code through a proxy. Several ecosystem apps integrate CLIProxyAPI to enable Claude Code usage with OAuth authentication instead of API keys. Popular options include VibeProxy (macOS menu bar app), ProxyPal (macOS GUI), and CodMate (session manager).",
    category: "Claude Code",
    links: [
      {
        label: "VibeProxy on GitHub",
        href: "https://github.com/automazeio/vibeproxy",
      },
      { label: "Ecosystem Apps", href: "/apps" },
    ],
  },
  {
    id: "providers-supported",
    question: "Which AI providers are supported?",
    answer:
      "CLIProxyAPI supports multiple providers including OpenAI (GPT-4, GPT-3.5), Anthropic (Claude 3 Opus, Sonnet, Haiku), Google (Gemini Pro), Alibaba (Qwen), and more. The modular architecture makes it easy to add new providers. Each provider can be enabled/disabled individually and configured with specific settings.",
    category: "General",
  },
  {
    id: "installation",
    question: "How do I install CLIProxyAPI?",
    answer:
      "CLIProxyAPI can be installed in several ways: 1) Using Go: 'go install github.com/CLIProxyAPI/CLIProxyAPI@latest', 2) Download pre-built binaries from GitHub releases, 3) Using Docker: 'docker pull ghcr.io/cliproxyapi/cliproxyapi:latest'. Choose the method that best fits your workflow.",
    code: "go install github.com/CLIProxyAPI/CLIProxyAPI@latest",
    category: "Installation",
  },
  {
    id: "configuration",
    question: "How do I configure CLIProxyAPI?",
    answer:
      "CLIProxyAPI uses a YAML configuration file. You can generate a config using the built-in config generator on this website. The configuration specifies which providers to enable, server settings, authentication options, caching behavior, and failover strategies. Save your config as 'config.yaml' in the same directory where you run CLIProxyAPI.",
    category: "Configuration",
    links: [{ label: "Config Generator", href: "/#config" }],
  },
  {
    id: "failover",
    question: "Does CLIProxyAPI support automatic failover?",
    answer:
      "Yes! CLIProxyAPI has built-in failover support. You can configure multiple providers and specify priority order. If a provider fails or times out, CLIProxyAPI automatically retries with the next available provider. This ensures high availability for your AI applications. You can also configure health checks to proactively detect provider issues.",
    category: "Features",
  },
  {
    id: "rate-limiting",
    question: "How does rate limiting work?",
    answer:
      "CLIProxyAPI supports configurable rate limiting to protect against abuse and manage costs. You can set request limits per minute, burst capacity, and per-provider limits. The proxy tracks requests and can return 429 (Too Many Requests) responses when limits are exceeded. Rate limiting can be configured globally or per-provider.",
    category: "Features",
  },
  {
    id: "caching",
    question: "Does CLIProxyAPI cache responses?",
    answer:
      "Yes, CLIProxyAPI includes intelligent caching to reduce latency and API costs. Identical requests within a configurable time window return cached responses. You can configure cache duration per provider and per-endpoint. Cache can be stored in memory or in Redis for distributed deployments.",
    category: "Features",
  },
  {
    id: "deployment",
    question: "How do I deploy CLIProxyAPI in production?",
    answer:
      "CLIProxyAPI is production-ready and can be deployed using Docker, Kubernetes, or as a system service. For production deployments, we recommend: 1) Using Docker with health checks, 2) Running behind a reverse proxy (nginx/Caddy) with HTTPS, 3) Using environment variables for secrets, 4) Setting up monitoring and logging. See our deployment guide for detailed instructions.",
    category: "Deployment",
    links: [
      {
        label: "Deployment Guide",
        href: "/blog/self-hosted-ai-proxy-best-practices",
      },
    ],
  },
  {
    id: "security",
    question: "Is CLIProxyAPI secure?",
    answer:
      "CLIProxyAPI is designed with security in mind. It uses OAuth for authentication instead of API keys, supports HTTPS/TLS, includes rate limiting, and has no known vulnerabilities. The code is open source for security auditing. For production deployments, we recommend running behind a reverse proxy, using environment variables for secrets, and following security best practices.",
    category: "Security",
  },
  {
    id: "cost",
    question: "How much does CLIProxyAPI cost?",
    answer:
      "CLIProxyAPI is completely free and open source (MIT license). You only pay the AI providers for their API usage. The proxy itself has no licensing fees, subscription costs, or usage limits. You can deploy it on your own infrastructure without any payment to the CLIProxyAPI project.",
    category: "General",
  },
  {
    id: "multi-platform",
    question: "What platforms are supported?",
    answer:
      "CLIProxyAPI runs on macOS, Linux, and Windows. It's written in Go and compiles to a single binary with no external dependencies. The ecosystem apps include platform-specific clients like VibeProxy (macOS), ProxyPilot (Windows), and various CLI tools for all platforms.",
    category: "General",
  },
  {
    id: "troubleshooting",
    question: "Why am I getting authentication errors?",
    answer:
      "Authentication errors usually occur for these reasons: 1) OAuth token expired - re-authenticate by visiting the OAuth URL, 2) Provider account issue - check your subscription is active, 3) Configuration error - verify your config.yaml has correct provider settings, 4) Network issue - check you can reach the provider's API. The logs will show specific error details to help diagnose the issue.",
    category: "Troubleshooting",
  },
  {
    id: "comparison",
    question: "How does CLIProxyAPI compare to other AI proxies?",
    answer:
      "CLIProxyAPI is unique in its multi-provider support, OAuth authentication, and zero licensing cost. Unlike commercial alternatives, CLIProxyAPI is open source with no vendor lock-in. It's specifically designed for CLI and self-hosted use cases, with a growing ecosystem of client applications. Compare with other solutions to find the best fit for your needs.",
    category: "Comparison",
    links: [
      {
        label: "Comparison Guide",
        href: "/blog/openai-proxy-cli-vs-direct-api",
      },
    ],
  },
  {
    id: "contributing",
    question: "How can I contribute to CLIProxyAPI?",
    answer:
      "We welcome contributions! You can: 1) Report bugs or request features on GitHub, 2) Submit pull requests for code improvements, 3) Add your app to the ecosystem directory, 4) Write documentation or blog posts, 5) Help other users in discussions. Join our community to contribute.",
    category: "Community",
    links: [
      {
        label: "GitHub Repository",
        href: "https://github.com/CLIProxyAPI/CLIProxyAPI",
      },
    ],
  },
  {
    id: "commercial-use",
    question: "Can I use CLIProxyAPI commercially?",
    answer:
      "Yes! CLIProxyAPI is released under the MIT license, which permits commercial use without restriction. You can use it in commercial products, internal tools, or customer-facing applications. There are no licensing fees or commercial restrictions. Many companies use CLIProxyAPI in production today.",
    category: "Legal",
  },
  {
    id: "support",
    question: "Where can I get help?",
    answer:
      "For help, you can: 1) Check our documentation and blog posts, 2) Search existing GitHub issues, 3) Open a new issue if your problem isn't addressed, 4) Join community discussions on GitHub. For enterprise support, contact us directly.",
    category: "Support",
    links: [
      { label: "Documentation", href: "https://help.router-for.me" },
      {
        label: "GitHub Issues",
        href: "https://github.com/CLIProxyAPI/CLIProxyAPI/issues",
      },
    ],
  },
];

const categories = Array.from(new Set(faqItems.map((item) => item.category)));

export default function FAQPage() {
  return (
    <>
      <JsonLd data={faqSchema} />
      <main className="container mx-auto space-y-12 px-6 py-12">
        {/* Header */}
        <section className="space-y-4">
          <Badge variant="secondary">FAQ</Badge>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Find answers to common questions about CLIProxyAPI, AI proxy CLI
            tools, OpenAI proxy, Claude proxy, and self-hosted AI
            infrastructure.
          </p>
        </section>

        {/* Quick Links */}
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Comprehensive guides for setup, configuration, and deployment.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="https://help.router-for.me" target="_blank">
                  View Docs
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <MessageCircle className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Join discussions, ask questions, and share your projects.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href="https://github.com/CLIProxyAPI/CLIProxyAPI"
                  target="_blank"
                >
                  Join Community
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <Github className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">GitHub</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Report issues, request features, or contribute code.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href="https://github.com/CLIProxyAPI/CLIProxyAPI"
                  target="_blank"
                >
                  View Repository
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Category Navigation */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Browse by Category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                asChild
              >
                <Link href={`#${category.toLowerCase()}`}>{category}</Link>
              </Badge>
            ))}
          </div>
        </section>

        {/* FAQ Items by Category */}
        <section className="space-y-12">
          {categories.map((category) => (
            <div
              key={category}
              id={category.toLowerCase()}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {category}
              </h2>
              <div className="space-y-4">
                {faqItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <details
                      key={item.id}
                      className="group rounded-xl border border-border/60 bg-card/40 overflow-hidden"
                    >
                      <summary className="flex cursor-pointer items-center justify-between p-5 font-medium hover:bg-accent/50 transition-colors list-none">
                        <span className="flex items-center gap-3">
                          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                          {item.question}
                        </span>
                      </summary>
                      <div className="px-5 pb-5 pl-14 text-muted-foreground space-y-4">
                        <p className="leading-relaxed">{item.answer}</p>
                        {item.code && (
                          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                            <code>{item.code}</code>
                          </pre>
                        )}
                        {item.links && item.links.length > 0 && (
                          <div className="flex flex-wrap gap-3 pt-2">
                            {item.links.map((link) => (
                              <Button
                                key={link.href}
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link href={link.href}>
                                  {link.label}
                                  <svg
                                    className="ml-1 h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                                    />
                                  </svg>
                                </Link>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
              </div>
            </div>
          ))}
        </section>

        {/* Still Need Help */}
        <section className="rounded-2xl border border-primary/40 bg-card/70 p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Can&apos;t find the answer you&apos;re looking for? Reach out to the
            community or check the documentation for more information.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="https://github.com/CLIProxyAPI/CLIProxyAPI/issues">
                <Github className="mr-2 h-4 w-4" />
                Open an Issue
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
