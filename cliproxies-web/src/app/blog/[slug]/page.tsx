import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import {
  ArrowLeft,
  Clock,
  Calendar,
  ExternalLink,
  Github,
  BookOpen,
} from "lucide-react";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

interface BlogSection {
  id: string;
  title: string;
  content: string;
  code?: string;
  codeLanguage?: string;
}

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  date: string;
  content: string;
  sections: BlogSection[];
  relatedPosts?: Array<{ slug: string; title: string }>;
}

const blogPosts: Record<string, BlogPost> = {
  "complete-guide-to-claude-code-proxy": {
    slug: "complete-guide-to-claude-code-proxy",
    title: "Complete Guide to Claude Code Proxy with CLIProxyAPI",
    description:
      "Learn how to set up a Claude Code proxy using CLIProxyAPI. Enable OAuth authentication, manage quotas, and use your Claude subscription without API keys.",
    category: "Tutorial",
    readTime: "8 min read",
    date: "2024-12-15",
    content:
      "Claude Code is Anthropic's powerful AI coding assistant. With CLIProxyAPI, you can use your Claude Code subscription through a local proxy without managing API keys.",
    sections: [
      {
        id: "introduction",
        title: "Introduction to Claude Code Proxy",
        content:
          "Claude Code is Anthropic's powerful AI coding assistant. With CLIProxyAPI, you can use your Claude Code subscription through a local proxy without managing API keys. This approach provides better security, automatic failover, and centralized credential management.",
      },
      {
        id: "prerequisites",
        title: "Prerequisites",
        content:
          "Before setting up your Claude Code proxy, ensure you have: A Claude Code subscription, CLIProxyAPI installed, Go 1.21+ (for building from source), and Basic terminal knowledge.",
      },
      {
        id: "installation",
        title: "Installing CLIProxyAPI",
        content: "Install CLIProxyAPI using Go",
        code: "go install github.com/CLIProxyAPI/CLIProxyAPI@latest",
        codeLanguage: "bash",
      },
      {
        id: "configuration",
        title: "Configuring the Claude Provider",
        content:
          "Create a config.yaml file with the Claude provider configuration",
        code: `providers:
  - name: anthropic
    type: anthropic
    enabled: true

server:
  port: 8317
  host: localhost

auth:
  enabled: true
  type: oauth`,
        codeLanguage: "yaml",
      },
      {
        id: "running-the-proxy",
        title: "Running the Proxy",
        content:
          "Start the CLIProxyAPI server. The proxy will start on http://localhost:8317. You can now make requests to Claude's API through this endpoint.",
        code: "cliproxyapi serve --config config.yaml",
        codeLanguage: "bash",
      },
      {
        id: "using-with-claude-code",
        title: "Using with Claude Code",
        content:
          "Once your proxy is running, configure Claude Code to use it by setting the appropriate environment variable or configuration option",
        code: `export ANTHROPIC_API_URL="http://localhost:8317/v1"
export ANTHROPIC_API_KEY="proxy"`,
        codeLanguage: "bash",
      },
      {
        id: "macos-apps",
        title: "macOS Apps Integration",
        content:
          "Several macOS apps integrate seamlessly with CLIProxyAPI for Claude Code: VibeProxy (menu bar app), ProxyPal (GUI configuration), Quotio (quota tracking), and CodMate (session manager).",
      },
      {
        id: "troubleshooting",
        title: "Troubleshooting",
        content:
          "Common solutions: OAuth Token Expired - Re-authenticate, Connection Refused - Ensure CLIProxyAPI is running, 401 Unauthorized - Check OAuth session, Rate Limiting - Check subscription tier.",
      },
    ],
    relatedPosts: [
      {
        slug: "oauth-vs-api-keys-for-ai-proxies",
        title: "OAuth vs API Keys: Securing Your AI Proxy Infrastructure",
      },
      {
        slug: "multi-provider-ai-fallback-strategies",
        title: "Multi-Provider AI Fallback Strategies",
      },
    ],
  },
  "openai-proxy-cli-vs-direct-api": {
    slug: "openai-proxy-cli-vs-direct-api",
    title: "OpenAI Proxy CLI vs Direct API: Which Approach is Right for You?",
    description:
      "Compare using an OpenAI proxy CLI like CLIProxyAPI versus direct API calls. Understand the trade-offs in security, cost, and functionality for your AI-powered applications.",
    category: "Comparison",
    readTime: "6 min read",
    date: "2024-12-10",
    content:
      "When building AI-powered applications, one of the first decisions you'll face is how to connect to OpenAI's API.",
    sections: [
      {
        id: "direct-api-approach",
        title: "Direct API Approach",
        content:
          "Calling OpenAI's API directly is the simplest approach initially. Advantages: Simple to implement, no additional infrastructure, direct control. Disadvantages: API keys exposed, difficult to rotate credentials, no built-in failover.",
      },
      {
        id: "proxy-cli-approach",
        title: "Proxy CLI Approach",
        content:
          "Using a proxy CLI like CLIProxyAPI adds an intermediary layer. Advantages: Centralized credential management, OAuth support, multi-provider failover, request caching. Disadvantages: Additional infrastructure, slight latency increase.",
      },
      {
        id: "comparison-table",
        title: "Feature Comparison",
        content:
          "| Feature | Direct API | CLIProxyAPI | |---------|-----------|-------------| | Setup Complexity | Low | Medium | | Security | Manual | OAuth + centralized | | Multi-Provider | No | Yes | | Failover | Manual | Automatic |",
      },
      {
        id: "when-to-use-direct-api",
        title: "When to Use Direct API",
        content:
          "Direct API calls are best when: Building a simple prototype, only need one AI provider, minimal security requirements, want to minimize infrastructure complexity.",
        code: `import openai

client = openai.OpenAI(api_key="your-api-key")
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)`,
        codeLanguage: "python",
      },
      {
        id: "when-to-use-proxy-cli",
        title: "When to Use CLIProxyAPI",
        content:
          "CLIProxyAPI is ideal when: You need multiple AI providers, want automatic failover, security is a concern, building production applications.",
        code: `providers:
  - name: openai
    type: openai
    enabled: true
    priority: 1

  - name: anthropic
    type: anthropic
    enabled: true
    priority: 2

failover:
  enabled: true
  retry_on_failure: true`,
        codeLanguage: "yaml",
      },
    ],
    relatedPosts: [
      {
        slug: "self-hosted-ai-proxy-best-practices",
        title: "Self-Hosted AI Proxy: Best Practices",
      },
      {
        slug: "multi-provider-ai-fallback-strategies",
        title: "Multi-Provider AI Fallback Strategies",
      },
    ],
  },
  "self-hosted-ai-proxy-best-practices": {
    slug: "self-hosted-ai-proxy-best-practices",
    title: "Self-Hosted AI Proxy: Best Practices for Production Deployments",
    description:
      "Discover production-ready strategies for deploying self-hosted AI proxies. Covering security, scaling, monitoring, and failover for multi-provider AI architectures.",
    category: "Guide",
    readTime: "12 min read",
    date: "2024-12-05",
    content:
      "Self-hosting an AI proxy gives you complete control over your AI infrastructure.",
    sections: [
      {
        id: "deployment-options",
        title: "Deployment Options",
        content:
          "CLIProxyAPI can be deployed in several ways: Docker Container (most common), Kubernetes (for large-scale), Systemd Service (single-server Linux), macOS LaunchAgent, Windows Service.",
      },
      {
        id: "docker-deployment",
        title: "Docker Deployment",
        content:
          "The recommended way to deploy CLIProxyAPI in production is using Docker with docker-compose for easy deployment and health checks.",
        code: `version: '3.8'
services:
  cliproxyapi:
    build: .
    ports:
      - "8317:8317"
    environment:
      - PROXYGRID_SECRET=your-secret-here
    volumes:
      - ./config.yaml:/root/config.yaml:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8317/health"]
      interval: 30s`,
        codeLanguage: "yaml",
      },
      {
        id: "security-hardening",
        title: "Security Hardening",
        content:
          "Security is critical: Use environment variables for secrets, enable HTTPS with a reverse proxy, implement rate limiting, use OAuth instead of API keys.",
        code: `rate_limit:
  enabled: true
  requests_per_minute: 60
  burst: 10`,
        codeLanguage: "yaml",
      },
      {
        id: "monitoring-and-logging",
        title: "Monitoring and Logging",
        content:
          "Production deployments need proper observability with structured logging, metrics export (Prometheus), and health checks.",
        code: `metrics:
  enabled: true
  path: /metrics
  include_provider_metrics: true`,
        codeLanguage: "yaml",
      },
    ],
    relatedPosts: [
      {
        slug: "multi-provider-ai-fallback-strategies",
        title: "Multi-Provider AI Fallback Strategies",
      },
      {
        slug: "monitoring-ai-provider-status-with-cliproxyapi",
        title: "Monitoring AI Provider Status",
      },
    ],
  },
  "multi-provider-ai-fallback-strategies": {
    slug: "multi-provider-ai-fallback-strategies",
    title: "Multi-Provider AI Fallback Strategies for High Availability",
    description:
      "Implement intelligent failover between OpenAI, Claude, Gemini, and other providers. Build resilient AI applications that automatically route around outages.",
    category: "Guide",
    readTime: "10 min read",
    date: "2024-11-28",
    content:
      "AI provider outages can disrupt your applications. Multi-provider fallback strategies ensure your AI features remain available.",
    sections: [
      {
        id: "why-multi-provider",
        title: "Why Multi-Provider Fallback?",
        content:
          "Relying on a single AI provider creates a single point of failure. Multi-provider fallback gives you: Higher Availability (99.9%+ uptime), Cost Optimization, Feature Coverage, Geographic Distribution.",
      },
      {
        id: "failover-strategies",
        title: "Failover Strategies",
        content:
          "CLIProxyAPI supports multiple failover strategies: Priority-Based (try in order), Round-Robin (distribute evenly), Cost-Based (route to cheapest).",
        code: `providers:
  - name: anthropic
    type: anthropic
    priority: 1
    enabled: true

  - name: openai
    type: openai
    priority: 2
    enabled: true

failover:
  enabled: true
  strategy: priority
  retry_on_failure: true
  max_retries: 2`,
        codeLanguage: "yaml",
      },
      {
        id: "health-checks",
        title: "Provider Health Checks",
        content:
          "Configure health checks to detect provider issues early with configurable intervals and thresholds.",
      },
      {
        id: "circuit-breaker-pattern",
        title: "Circuit Breaker Pattern",
        content:
          "Prevent cascading failures with circuit breakers that have three states: Closed (normal), Open (failing immediately), Half-Open (testing recovery).",
      },
    ],
    relatedPosts: [
      {
        slug: "self-hosted-ai-proxy-best-practices",
        title: "Self-Hosted AI Proxy: Best Practices",
      },
      {
        slug: "monitoring-ai-provider-status-with-cliproxyapi",
        title: "Monitoring AI Provider Status",
      },
    ],
  },
  "gemini-proxy-setup-with-cliproxyapi": {
    slug: "gemini-proxy-setup-with-cliproxyapi",
    title: "Setting Up Gemini Proxy with CLIProxyAPI: A Step-by-Step Tutorial",
    description:
      "Complete walkthrough for configuring Google Gemini as a proxy target. Enable OAuth-based authentication and use Gemini Pro through CLIProxyAPI.",
    category: "Tutorial",
    readTime: "7 min read",
    date: "2024-11-20",
    content:
      "Google's Gemini API offers powerful AI capabilities at competitive prices. CLIProxyAPI makes it easy to set up a Gemini proxy.",
    sections: [
      {
        id: "introduction",
        title: "Introduction to Gemini Proxy",
        content:
          "Gemini is Google's flagship AI model family. Using CLIProxyAPI as a Gemini proxy gives you: OAuth authentication, unified API interface, automatic failover, request caching.",
      },
      {
        id: "configuration",
        title: "Configuring Gemini Provider",
        content:
          "Create a config.yaml file with the Gemini provider configuration",
        code: `providers:
  - name: gemini
    type: gemini
    enabled: true
    models:
      - gemini-pro
      - gemini-ultra

server:
  port: 8317
  host: localhost`,
        codeLanguage: "yaml",
      },
      {
        id: "using-gemini",
        title: "Using Gemini Through the Proxy",
        content: "You can now use the OpenAI-compatible API to access Gemini",
        code: `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8317/v1",
    api_key="proxy"
)

response = client.chat.completions.create(
    model="gemini-pro",
    messages=[{"role": "user", "content": "Hello!"}]
)`,
        codeLanguage: "python",
      },
    ],
    relatedPosts: [
      {
        slug: "complete-guide-to-claude-code-proxy",
        title: "Complete Guide to Claude Code Proxy",
      },
      {
        slug: "multi-provider-ai-fallback-strategies",
        title: "Multi-Provider AI Fallback Strategies",
      },
    ],
  },
  "oauth-vs-api-keys-for-ai-proxies": {
    slug: "oauth-vs-api-keys-for-ai-proxies",
    title: "OAuth vs API Keys: Securing Your AI Proxy Infrastructure",
    description:
      "Deep dive into authentication methods for AI proxies. Compare OAuth-based flows with traditional API keys from security and usability perspectives.",
    category: "Security",
    readTime: "9 min read",
    date: "2024-11-15",
    content:
      "Authentication is a critical aspect of any AI proxy infrastructure. This guide compares OAuth 2.0 flows with traditional API key authentication.",
    sections: [
      {
        id: "api-keys",
        title: "API Key Authentication",
        content:
          "API keys are simple to implement but come with significant drawbacks: Manual rotation required, difficult to revoke, no built-in expiration, security risk if leaked.",
      },
      {
        id: "oauth",
        title: "OAuth 2.0 Authentication",
        content:
          "OAuth provides a more robust authentication mechanism: Automatic token refresh, scoped permissions, easier revocation, better audit trail, industry standard.",
      },
      {
        id: "security-comparison",
        title: "Security Comparison",
        content:
          "| Aspect | API Keys | OAuth | |--------|----------|-------| | Rotation | Manual | Automatic | | Expiration | Optional | Built-in | | Revocation | Difficult | Easy |",
      },
    ],
    relatedPosts: [
      {
        slug: "complete-guide-to-claude-code-proxy",
        title: "Complete Guide to Claude Code Proxy",
      },
      {
        slug: "self-hosted-ai-proxy-best-practices",
        title: "Self-Hosted AI Proxy: Best Practices",
      },
    ],
  },
  "quotio-quotio-and-other-cliproxyapi-clients": {
    slug: "quotio-quotio-and-other-cliproxyapi-clients",
    title:
      "Exploring CLIProxyAPI Clients: VibeProxy, ProxyPal, Quotio, and More",
    description:
      "Tour the ecosystem of CLIProxyAPI-powered applications. From macOS menu bar apps to Windows TUI tools, find the right client for your workflow.",
    category: "Ecosystem",
    readTime: "8 min read",
    date: "2024-11-10",
    content:
      "The CLIProxyAPI ecosystem has grown rapidly, with numerous client applications built on top of the proxy.",
    sections: [
      {
        id: "ecosystem-overview",
        title: "Ecosystem Overview",
        content:
          "CLIProxyAPI's modular design has enabled a thriving ecosystem of client applications: macOS Menu Bar Apps, GUI Applications, CLI Tools, Windows Tools, Web Applications.",
      },
      {
        id: "vibeproxy",
        title: "VibeProxy (macOS)",
        content:
          "VibeProxy is a native macOS menu bar application that provides seamless access to Claude Code and ChatGPT subscriptions with menu bar integration, OAuth authentication, and quota tracking.",
      },
      {
        id: "proxypal",
        title: "ProxyPal (macOS)",
        content:
          "ProxyPal offers a comprehensive GUI for configuring CLIProxyAPI on macOS with provider management, model mapping, and real-time status monitoring.",
      },
      {
        id: "quotio",
        title: "Quotio (macOS)",
        content:
          "Quotio focuses on quota tracking and smart failover for AI coding tools with menu bar quota display and usage analytics.",
      },
      {
        id: "proxypilot",
        title: "ProxyPilot (Windows)",
        content:
          "ProxyPilot brings CLIProxyAPI to Windows with a TUI and system tray integration.",
      },
    ],
    relatedPosts: [
      {
        slug: "complete-guide-to-claude-code-proxy",
        title: "Complete Guide to Claude Code Proxy",
      },
      { slug: "compare", title: "Compare AI Proxy Tools" },
    ],
  },
  "monitoring-ai-provider-status-with-cliproxyapi": {
    slug: "monitoring-ai-provider-status-with-cliproxyapi",
    title: "Monitoring AI Provider Status: Building Reliable AI Workflows",
    description:
      "Learn how to monitor OpenAI, Anthropic, and Google service status. Implement health checks and automatic failover in your AI proxy setup.",
    category: "Operations",
    readTime: "6 min read",
    date: "2024-11-05",
    content:
      "Building reliable AI applications requires monitoring your providers' health. This guide shows you how to implement comprehensive monitoring.",
    sections: [
      {
        id: "importance",
        title: "Why Monitor Provider Status?",
        content:
          "Proactive monitoring helps you: Detect issues before users do, trigger automatic failover, maintain high availability, track provider performance over time.",
      },
      {
        id: "health-checks",
        title: "Configuring Health Checks",
        content:
          "Set up health checks for each provider with configurable intervals and thresholds for early detection of issues.",
      },
      {
        id: "metrics",
        title: "Metrics and Observability",
        content:
          "Enable Prometheus metrics for monitoring: provider_request_count, provider_latency, provider_error_rate, cache_hit_rate, failover_count.",
      },
      {
        id: "alerts",
        title: "Setting Up Alerts",
        content:
          "Configure alerts for: Provider Down, High Error Rate (>5%), Slow Response (P95 > 2s), Failover Events, OAuth Token Expiry.",
      },
    ],
    relatedPosts: [
      {
        slug: "self-hosted-ai-proxy-best-practices",
        title: "Self-Hosted AI Proxy: Best Practices",
      },
      {
        slug: "multi-provider-ai-fallback-strategies",
        title: "Multi-Provider AI Fallback Strategies",
      },
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} | CLIProxies Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${siteUrl}/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: ["CLIProxyAPI"],
      tags: [post.category, "AI proxy", "CLIProxyAPI"],
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: `${siteUrl}/opengraph-image.png`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "CLIProxyAPI",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "CLIProxyAPI",
      url: siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${slug}`,
    },
  };

  return (
    <>
      <JsonLd data={articleSchema} />
      <main className="container mx-auto max-w-4xl px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <span>/</span>
          <span className="text-foreground">{post.title}</span>
        </nav>

        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/blog" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </Button>

        {/* Article Header */}
        <article className="space-y-8">
          <header className="space-y-4">
            <Badge variant="secondary">{post.category}</Badge>
            <h1 className="text-3xl font-semibold md:text-4xl">{post.title}</h1>
            <p className="text-lg text-muted-foreground">{post.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {post.content}
            </p>

            {/* Table of Contents */}
            {post.sections.length > 0 && (
              <nav className="my-8 rounded-xl border border-border/60 bg-card/40 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Table of Contents
                </h3>
                <ul className="space-y-2">
                  {post.sections.map((section, index) => (
                    <li key={index}>
                      <a
                        href={`#${section.id}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {/* Sections */}
            {post.sections.map((section, index) => (
              <section
                key={index}
                id={section.id}
                className="scroll-mt-20 space-y-4"
              >
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <div className="space-y-4 text-muted-foreground">
                  {section.content.split("\n\n").map((paragraph, pIndex) => {
                    // Check if paragraph is a code block
                    if (paragraph.trim().startsWith("```")) {
                      const lines = paragraph.trim().split("\n");
                      const language =
                        lines[0].replace("```", "").trim() || "text";
                      const code = lines.slice(1, -1).join("\n");
                      return (
                        <div key={pIndex} className="relative group">
                          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                            <code>{code}</code>
                          </pre>
                        </div>
                      );
                    }
                    // Check for markdown table
                    if (paragraph.includes("|")) {
                      const lines = paragraph.trim().split("\n");
                      if (lines.length > 1 && lines[0].startsWith("|")) {
                        return (
                          <div key={pIndex} className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <tbody>
                                {lines.map((line, lineIndex) => {
                                  if (line.includes("---")) return null;
                                  const cells = line.split("|").filter(Boolean);
                                  return (
                                    <tr
                                      key={lineIndex}
                                      className="border-t border-border/60"
                                    >
                                      {cells.map((cell, cellIndex) => (
                                        <td
                                          key={cellIndex}
                                          className="px-4 py-2"
                                        >
                                          {cell.trim()}
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                    }
                    // Handle bullet points
                    if (paragraph.trim().startsWith("-")) {
                      const items = paragraph
                        .trim()
                        .split("\n")
                        .filter(Boolean);
                      return (
                        <ul
                          key={pIndex}
                          className="space-y-2 list-disc list-inside"
                        >
                          {items.map((item, i) => (
                            <li key={i}>{item.replace(/^-\s*/, "")}</li>
                          ))}
                        </ul>
                      );
                    }
                    // Handle numbered lists
                    if (/^\d+\./.test(paragraph.trim())) {
                      const items = paragraph
                        .trim()
                        .split("\n")
                        .filter(Boolean);
                      return (
                        <ol
                          key={pIndex}
                          className="space-y-2 list-decimal list-inside"
                        >
                          {items.map((item, i) => (
                            <li key={i}>{item.replace(/^\d+\.\s*/, "")}</li>
                          ))}
                        </ol>
                      );
                    }
                    // Regular paragraph
                    return (
                      <p key={pIndex} className="leading-relaxed">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>

                {section.code && (
                  <div className="relative group">
                    <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                      <code className={`language-${section.codeLanguage}`}>
                        {section.code}
                      </code>
                    </pre>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Article Footer */}
          <footer className="border-t border-border/60 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Published by the CLIProxyAPI team
                </p>
                <a
                  href="https://github.com/CLIProxyAPI/CLIProxyAPI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/blog">
                    <BookOpen className="mr-2 h-4 w-4" />
                    More Articles
                  </Link>
                </Button>
              </div>
            </div>
          </footer>
        </article>

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <section className="mt-12 space-y-6">
            <h2 className="text-xl font-semibold">Related Articles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {post.relatedPosts.map((related) => {
                const relatedPost = blogPosts[related.slug];
                if (!relatedPost) return null;
                return (
                  <Card
                    key={related.slug}
                    className="hover:border-primary/50 transition-colors"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        <Link
                          href={`/blog/${related.slug}`}
                          className="hover:text-primary hover:underline"
                        >
                          {related.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {relatedPost.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/blog/${related.slug}`}>
                          Read More
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
