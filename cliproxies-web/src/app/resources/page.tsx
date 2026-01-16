import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { JsonLd } from "@/components/json-ld";
import { CommunityFeed } from "@/components/community-feed";
import {
  BookOpen,
  Youtube,
  Github,
  FileText,
  Terminal,
  Zap,
} from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resources - AI Proxy CLI Documentation, Guides & Community",
  description:
    "Comprehensive resources for CLIProxyAPI and AI proxy CLI tools. Documentation, guides, tutorials, community discussions, and real-time updates from the ecosystem.",
  keywords: [
    "CLIProxyAPI resources",
    "AI proxy CLI documentation",
    "Claude Code proxy guide",
    "OpenAI proxy tutorial",
    "AI proxy CLI resources",
    "self-hosted AI proxy docs",
    "CLIProxyAPI tutorials",
  ],
  openGraph: {
    title: "Resources - CLIProxyAPI",
    description:
      "Comprehensive resources for CLIProxyAPI and AI proxy CLI tools.",
    url: `${siteUrl}/resources`,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "CLIProxies.com - Resources",
      },
    ],
  },
  alternates: {
    canonical: "/resources",
  },
};

const resourceSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "CLIProxyAPI Resources",
  description:
    "Comprehensive resources for CLIProxyAPI and AI proxy CLI tools including documentation, guides, tutorials, and community content.",
  url: `${siteUrl}/resources`,
};

const quickLinks = [
  {
    title: "Getting Started",
    description: "New to CLIProxyAPI? Start here with our quick start guide.",
    icon: Terminal,
    href: "/blog/complete-guide-to-claude-code-proxy",
    color: "text-blue-500",
  },
  {
    title: "Documentation",
    description: "Comprehensive reference guides for all CLIProxyAPI features.",
    icon: BookOpen,
    href: "https://help.router-for.me",
    color: "text-emerald-500",
  },
  {
    title: "Blog",
    description: "In-depth guides, tutorials, and news about AI proxy tools.",
    icon: FileText,
    href: "/blog",
    color: "text-purple-500",
  },
  {
    title: "FAQ",
    description: "Find answers to frequently asked questions.",
    icon: Zap,
    href: "/faq",
    color: "text-amber-500",
  },
];

const guides = [
  {
    slug: "complete-guide-to-claude-code-proxy",
    title: "Complete Guide to Claude Code Proxy",
    description:
      "Learn how to set up a Claude Code proxy using CLIProxyAPI with OAuth authentication.",
    category: "Tutorial",
    readTime: "8 min",
  },
  {
    slug: "self-hosted-ai-proxy-best-practices",
    title: "Self-Hosted AI Proxy Best Practices",
    description:
      "Production-ready strategies for deploying self-hosted AI proxies.",
    category: "Guide",
    readTime: "12 min",
  },
  {
    slug: "multi-provider-ai-fallback-strategies",
    title: "Multi-Provider AI Fallback Strategies",
    description:
      "Implement intelligent failover between AI providers for high availability.",
    category: "Guide",
    readTime: "10 min",
  },
];

const ecosystemTools = [
  {
    name: "VibeProxy",
    description:
      "Native macOS menu bar app for Claude Code and ChatGPT subscriptions.",
    platform: "macOS",
    url: "https://github.com/automazeio/vibeproxy",
  },
  {
    name: "ProxyPal",
    description: "macOS GUI for configuring providers and routing.",
    platform: "macOS",
    url: "https://github.com/heyhuynhgiabuu/proxypal",
  },
  {
    name: "CodMate",
    description: "SwiftUI session manager for Claude Code workflows.",
    platform: "macOS",
    url: "https://github.com/loocor/CodMate",
  },
  {
    name: "ProxyPilot",
    description: "Windows CLIProxyAPI fork with TUI and system tray.",
    platform: "Windows",
    url: "https://github.com/Finesssee/ProxyPilot",
  },
];

const videoTutorials = [
  {
    title: "Introduction to CLIProxyAPI",
    description: "Learn the basics of setting up and using CLIProxyAPI",
    duration: "10:24",
    searchQuery: "CLIProxyAPI tutorial",
  },
  {
    title: "Claude Code Proxy Setup",
    description: "Step-by-step guide to setting up Claude Code with OAuth",
    duration: "15:30",
    searchQuery: "Claude Code proxy setup",
  },
  {
    title: "Multi-Provider Configuration",
    description: "Configure multiple AI providers with automatic failover",
    duration: "12:45",
    searchQuery: "AI proxy multi provider",
  },
];

const codeSnippets = [
  {
    title: "Basic Configuration",
    description: "Minimal config.yaml to get started with CLIProxyAPI",
    language: "yaml",
    code: `providers:
  - name: anthropic
    type: anthropic
    enabled: true

server:
  port: 8317
  host: localhost`,
  },
  {
    title: "Multi-Provider Setup",
    description: "Configure OpenAI, Claude, and Gemini with failover",
    language: "yaml",
    code: `providers:
  - name: openai
    type: openai
    enabled: true
    priority: 1

  - name: anthropic
    type: anthropic
    enabled: true
    priority: 2

  - name: gemini
    type: gemini
    enabled: true
    priority: 3

failover:
  enabled: true
  strategy: priority`,
  },
  {
    title: "Using with cURL",
    description: "Make requests through CLIProxyAPI from the command line",
    language: "bash",
    code: `export CLI_PROXY_API="http://localhost:8317/v1"

curl -X POST "$CLI_PROXY_API/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer proxy" \\
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
  },
  {
    title: "Using with Python",
    description: "Use CLIProxyAPI with the OpenAI Python client",
    language: "python",
    code: `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8317/v1",
    api_key="proxy"  # Handled by CLIProxyAPI OAuth
)

response = client.chat.completions.create(
    model="claude-3-5-sonnet-20241022",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`,
  },
];

function CodeSnippetCard({ snippet }: { snippet: (typeof codeSnippets)[0] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">{snippet.title}</CardTitle>
        <CardDescription>{snippet.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative group">
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            <code className="language-{snippet.language}">{snippet.code}</code>
          </pre>
          <CopyButton
            text={snippet.code}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
        <Badge variant="outline" className="mt-3 text-xs">
          {snippet.language}
        </Badge>
      </CardContent>
    </Card>
  );
}

export default function ResourcesPage() {
  return (
    <>
      <JsonLd data={resourceSchema} />
      <main className="container mx-auto space-y-16 px-6 py-12">
        {/* Header */}
        <section className="space-y-4">
          <Badge variant="secondary">Resources</Badge>
          <h1 className="text-3xl font-semibold md:text-4xl">
            AI Proxy CLI Resources
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Comprehensive documentation, guides, tutorials, and community
            resources for CLIProxyAPI and the AI proxy ecosystem.
          </p>
        </section>

        {/* Quick Links */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.href}
                className="group hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <Icon className={`h-8 w-8 ${link.color} mb-2`} />
                  <CardTitle className="text-lg">
                    <Link
                      href={link.href}
                      className="group-hover:text-primary hover:underline"
                      target={
                        link.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        link.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      {link.title}
                    </Link>
                  </CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        {/* Featured Guides */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Featured Guides</h2>
              <p className="text-sm text-muted-foreground">
                Hand-picked tutorials to help you get started
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/blog">View All Guides</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {guides.map((guide) => (
              <Card
                key={guide.slug}
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2">
                    {guide.category}
                  </Badge>
                  <CardTitle>
                    <Link
                      href={`/blog/${guide.slug}`}
                      className="hover:text-primary hover:underline"
                    >
                      {guide.title}
                    </Link>
                  </CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-muted-foreground">
                    {guide.readTime} read
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Code Snippets */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Code Snippets</h2>
            <p className="text-sm text-muted-foreground">
              Copy and paste examples for common configurations
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {codeSnippets.map((snippet) => (
              <CodeSnippetCard key={snippet.title} snippet={snippet} />
            ))}
          </div>
        </section>

        {/* Ecosystem Tools */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Ecosystem Tools</h2>
              <p className="text-sm text-muted-foreground">
                Client applications built on top of CLIProxyAPI
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/apps">View All Apps</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {ecosystemTools.map((tool) => (
              <Card
                key={tool.name}
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary hover:underline"
                        >
                          {tool.name}
                        </a>
                      </CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{tool.platform}</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Video Tutorials */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              Video Tutorials
            </h2>
            <p className="text-sm text-muted-foreground">
              Learn by watching video guides from the community
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {videoTutorials.map((video) => (
              <Card key={video.title} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{video.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {video.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Watch on YouTube
                  </a>
                  <span className="mx-2 text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {video.duration}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Community Feed */}
        <section className="space-y-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">
                  Loading community feed...
                </div>
              </div>
            }
          >
            <CommunityFeed />
          </Suspense>
        </section>

        {/* GitHub CTA */}
        <section className="rounded-2xl border border-primary/40 bg-card/70 p-8">
          <div className="flex flex-col items-center text-center gap-4 md:flex-row md:text-left">
            <div className="rounded-full bg-primary/10 p-4">
              <Github className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Star us on GitHub</h2>
              <p className="text-sm text-muted-foreground">
                CLIProxyAPI is open source. Star us on GitHub to show your
                support and stay updated with new releases.
              </p>
            </div>
            <Button asChild>
              <Link
                href="https://github.com/CLIProxyAPI/CLIProxyAPI"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                Star on GitHub
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
