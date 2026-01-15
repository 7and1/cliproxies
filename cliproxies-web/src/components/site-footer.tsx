import Link from "next/link";
import { Github, Twitter, Rss, Heart } from "lucide-react";
import { memo } from "react";

const footerLinks = [
  { label: "Home", href: "/", description: "Go to homepage" },
  { label: "Ecosystem", href: "/apps", description: "Browse apps" },
  { label: "Resources", href: "/resources", description: "View resources" },
  { label: "Docs", href: "/docs", description: "View documentation" },
  { label: "Status", href: "/status", description: "Check provider status" },
  { label: "Blog", href: "/blog", description: "Read blog posts" },
  { label: "FAQ", href: "/faq", description: "View FAQ" },
  { label: "Compare", href: "/compare", description: "Compare tools" },
] as const;

const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/CLIProxyAPI/CLIProxyAPI",
    icon: Github,
    description: "View source code on GitHub",
  },
  {
    label: "Twitter",
    href: "https://twitter.com/CLIProxyAPI",
    icon: Twitter,
    description: "Follow us on Twitter",
  },
  {
    label: "RSS",
    href: "/rss.xml",
    icon: Rss,
    description: "Subscribe to RSS feed",
  },
] as const;

const legalLinks = [
  { label: "Privacy", href: "/privacy", description: "Privacy policy" },
  { label: "Terms", href: "/terms", description: "Terms of service" },
] as const;

function SiteFooterInner() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background/80 mt-auto">
      <div className="container mx-auto flex flex-col gap-8 px-4 sm:px-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3 max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md transition-opacity hover:opacity-80"
            aria-label="CLIProxies home"
          >
            <span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              CLIProxies.com
            </span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Documentation hub and ecosystem directory for CLIProxyAPI-powered
            tooling. The unified AI proxy CLI gateway.
          </p>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-destructive fill-destructive animate-pulse-slow" />
            <span>for the developer community</span>
          </div>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap gap-2 text-sm"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
              aria-label={link.description}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg p-2.5 text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={social.description}
              >
                <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
              </a>
            );
          })}
        </div>
      </div>

      <div className="container mx-auto border-t border-border/40 px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-1">
            © {currentYear} CLIProxyAPI.
            <span className="hidden sm:inline">Open source under MIT.</span>
          </p>
          <div className="flex flex-wrap gap-4 md:gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                aria-label={link.description}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export const SiteFooter = memo(SiteFooterInner);
