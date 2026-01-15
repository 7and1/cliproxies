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
import { BookOpen, TrendingUp, Code, Zap } from "lucide-react";

export const runtime = "edge";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

export const metadata: Metadata = {
  title: "Blog - AI Proxy CLI Guides, Tutorials & News",
  description:
    "Expert guides, tutorials, and news about AI proxy CLI tools. Learn how to use CLIProxyAPI with OpenAI, Claude, Gemini, and more. Discover best practices for self-hosted AI proxies.",
  keywords: [
    "AI proxy CLI tutorial",
    "CLIProxyAPI guide",
    "OpenAI proxy tutorial",
    "Claude Code proxy guide",
    "self-hosted AI proxy",
    "AI API gateway tutorial",
    "Claude proxy setup",
    "Gemini proxy configuration",
    "AI CLI tools guide",
  ],
  openGraph: {
    title: "Blog - AI Proxy CLI Guides & Tutorials",
    description:
      "Expert guides and tutorials about AI proxy CLI tools. Learn how to use CLIProxyAPI with OpenAI, Claude, Gemini, and more.",
    url: `${siteUrl}/blog`,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "CLIProxies.com - Blog",
      },
    ],
  },
  alternates: {
    canonical: "/blog",
  },
};

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "CLIProxies Blog",
  description:
    "Expert guides, tutorials, and news about AI proxy CLI tools, CLIProxyAPI, and self-hosted AI infrastructure.",
  url: `${siteUrl}/blog`,
  publisher: {
    "@type": "Organization",
    name: "CLIProxyAPI",
    url: siteUrl,
  },
};

const blogPosts = [
  {
    slug: "complete-guide-to-claude-code-proxy",
    title: "Complete Guide to Claude Code Proxy with CLIProxyAPI",
    description:
      "Learn how to set up a Claude Code proxy using CLIProxyAPI. Enable OAuth authentication, manage quotas, and use your Claude subscription without API keys.",
    category: "Tutorial",
    readTime: "8 min read",
    date: "2024-12-15",
    featured: true,
    icon: Code,
  },
  {
    slug: "openai-proxy-cli-vs-direct-api",
    title: "OpenAI Proxy CLI vs Direct API: Which Approach is Right for You?",
    description:
      "Compare using an OpenAI proxy CLI like CLIProxyAPI versus direct API calls. Understand the trade-offs in security, cost, and functionality for your AI-powered applications.",
    category: "Comparison",
    readTime: "6 min read",
    date: "2024-12-10",
    featured: true,
    icon: TrendingUp,
  },
  {
    slug: "self-hosted-ai-proxy-best-practices",
    title: "Self-Hosted AI Proxy: Best Practices for Production Deployments",
    description:
      "Discover production-ready strategies for deploying self-hosted AI proxies. Covering security, scaling, monitoring, and failover for multi-provider AI architectures.",
    category: "Guide",
    readTime: "12 min read",
    date: "2024-12-05",
    featured: true,
    icon: Zap,
  },
  {
    slug: "multi-provider-ai-fallback-strategies",
    title: "Multi-Provider AI Fallback Strategies for High Availability",
    description:
      "Implement intelligent failover between OpenAI, Claude, Gemini, and other providers. Build resilient AI applications that automatically route around outages.",
    category: "Guide",
    readTime: "10 min read",
    date: "2024-11-28",
    featured: false,
    icon: BookOpen,
  },
  {
    slug: "gemini-proxy-setup-with-cliproxyapi",
    title: "Setting Up Gemini Proxy with CLIProxyAPI: A Step-by-Step Tutorial",
    description:
      "Complete walkthrough for configuring Google Gemini as a proxy target. Enable OAuth-based authentication and use Gemini Pro through CLIProxyAPI.",
    category: "Tutorial",
    readTime: "7 min read",
    date: "2024-11-20",
    featured: false,
    icon: Code,
  },
  {
    slug: "oauth-vs-api-keys-for-ai-proxies",
    title: "OAuth vs API Keys: Securing Your AI Proxy Infrastructure",
    description:
      "Deep dive into authentication methods for AI proxies. Compare OAuth-based flows with traditional API keys from security and usability perspectives.",
    category: "Security",
    readTime: "9 min read",
    date: "2024-11-15",
    featured: false,
    icon: Zap,
  },
  {
    slug: "quotio-quotio-and-other-cliproxyapi-clients",
    title:
      "Exploring CLIProxyAPI Clients: VibeProxy, ProxyPal, Quotio, and More",
    description:
      "Tour the ecosystem of CLIProxyAPI-powered applications. From macOS menu bar apps to Windows TUI tools, find the right client for your workflow.",
    category: "Ecosystem",
    readTime: "8 min read",
    date: "2024-11-10",
    featured: false,
    icon: BookOpen,
  },
  {
    slug: "monitoring-ai-provider-status-with-cliproxyapi",
    title: "Monitoring AI Provider Status: Building Reliable AI Workflows",
    description:
      "Learn how to monitor OpenAI, Anthropic, and Google service status. Implement health checks and automatic failover in your AI proxy setup.",
    category: "Operations",
    readTime: "6 min read",
    date: "2024-11-05",
    featured: false,
    icon: TrendingUp,
  },
];

const categories = [
  { label: "All", value: "all", count: blogPosts.length },
  {
    label: "Tutorial",
    value: "Tutorial",
    count: blogPosts.filter((p) => p.category === "Tutorial").length,
  },
  {
    label: "Guide",
    value: "Guide",
    count: blogPosts.filter((p) => p.category === "Guide").length,
  },
  {
    label: "Comparison",
    value: "Comparison",
    count: blogPosts.filter((p) => p.category === "Comparison").length,
  },
  {
    label: "Security",
    value: "Security",
    count: blogPosts.filter((p) => p.category === "Security").length,
  },
  {
    label: "Ecosystem",
    value: "Ecosystem",
    count: blogPosts.filter((p) => p.category === "Ecosystem").length,
  },
  {
    label: "Operations",
    value: "Operations",
    count: blogPosts.filter((p) => p.category === "Operations").length,
  },
];

export default function BlogPage() {
  const featuredPosts = blogPosts.filter((post) => post.featured);
  const recentPosts = blogPosts.filter((post) => !post.featured);

  return (
    <>
      <JsonLd data={blogSchema} />
      <main className="container mx-auto space-y-16 px-6 py-12">
        {/* Header */}
        <section className="space-y-4">
          <Badge variant="secondary">Blog & Resources</Badge>
          <h1 className="text-3xl font-semibold md:text-4xl">
            AI Proxy CLI Guides, Tutorials & News
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Expert content on building with CLIProxyAPI, self-hosted AI proxies,
            and the broader AI tooling ecosystem. Stay updated with best
            practices and new developments.
          </p>
        </section>

        {/* Featured Posts */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Featured Articles</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post) => {
              const Icon = post.icon;
              return (
                <Card
                  key={post.slug}
                  className="group hover:border-primary/50 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {post.readTime}
                      </span>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="hover:underline"
                      >
                        {post.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>{post.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/blog/${post.slug}`}>Read</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Recent Posts */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Recent Articles</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recentPosts.map((post) => {
              const Icon = post.icon;
              return (
                <Card
                  key={post.slug}
                  className="group hover:border-primary/50 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {post.readTime}
                      </span>
                    </div>
                    <CardTitle className="text-lg">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group-hover:text-primary transition-colors hover:underline"
                      >
                        {post.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {post.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={post.date}
                    >
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Categories */}
        <section className="rounded-2xl border border-border/60 bg-card/60 p-6">
          <h2 className="text-lg font-semibold mb-4">Browse by Category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.value}
                variant={category.value === "all" ? "default" : "outline"}
                className="cursor-pointer"
                asChild
              >
                <Link
                  href={
                    category.value === "all"
                      ? "/blog"
                      : `/blog?category=${category.value}`
                  }
                >
                  {category.label}
                  <span className="ml-1 opacity-70">({category.count})</span>
                </Link>
              </Badge>
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="rounded-2xl border border-primary/40 bg-card/70 p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Stay Updated</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Get the latest articles, tutorials, and news about AI proxy CLI
            tools delivered to your inbox.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link
                href="https://github.com/CLIProxyAPI/CLIProxyAPI"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Code className="mr-2 h-4 w-4" />
                Star on GitHub
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/rss.xml">
                <BookOpen className="mr-2 h-4 w-4" />
                RSS Feed
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
