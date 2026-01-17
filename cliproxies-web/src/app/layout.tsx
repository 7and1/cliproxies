import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RootJsonLd } from "@/components/json-ld";
import { SkipLink } from "@/components/skip-link";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Dynamically import WebVitals to avoid blocking initial render
const WebVitals = dynamic(() =>
  import("@/components/web-vitals").then((mod) => ({ default: mod.WebVitals })),
);

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "sans-serif"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
  fallback: ["monospace"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CLIProxies.com - AI Proxy CLI Hub for OpenAI, Claude & Gemini",
    template: "%s | CLIProxies.com",
  },
  description:
    "Unified AI proxy CLI gateway for OpenAI, Claude, Gemini, and more. Generate config.yaml in seconds, explore ecosystem apps, and monitor provider status. Free & open source.",
  keywords: [
    "AI proxy CLI",
    "CLIProxyAPI",
    "OpenAI proxy",
    "Claude proxy",
    "Gemini proxy",
    "AI API gateway",
    "multi-provider AI proxy",
    "self-hosted AI proxy",
    "Claude Code proxy",
    "ChatGPT proxy",
    "Qwen proxy",
    "Vertex AI proxy",
    "CLI tooling",
    "developer tools",
    "API proxy server",
    "OAuth AI proxy",
    "Anthropic proxy",
    "Google AI proxy",
    "Alibaba Qwen proxy",
  ],
  applicationName: "CLIProxies.com",
  creator: "CLIProxyAPI",
  publisher: "CLIProxyAPI",
  authors: [{ name: "CLIProxyAPI", url: siteUrl }],
  category: "Developer Tools",
  classification: "Developer Application",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { title: "CLIProxies RSS Feed", url: `${siteUrl}/rss.xml` },
      ],
    },
  },
  openGraph: {
    title: "CLIProxies.com - AI Proxy CLI Hub for OpenAI, Claude & Gemini",
    description:
      "Unified AI proxy CLI gateway. Generate config.yaml, explore ecosystem apps, and monitor provider status. OpenAI, Claude, Gemini, and more.",
    url: siteUrl,
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
      {
        url: "/opengraph-image-square.png",
        width: 1200,
        height: 1200,
        alt: "CLIProxies.com - AI Proxy CLI Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CLIProxies.com - AI Proxy CLI Hub for OpenAI, Claude & Gemini",
    description:
      "Unified AI proxy CLI gateway. Generate config.yaml, explore ecosystem apps, and monitor provider status. Free & open source.",
    images: ["/opengraph-image.png", "/twitter-image.png"],
    creator: "@CLIProxyAPI",
    site: "@CLIProxyAPI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
  other: {
    "application/ld+json": "structured-data",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="dns-prefetch" href="//assets.router-for.me" />
        <link
          rel="preconnect"
          href="https://assets.router-for.me"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${plexMono.variable} font-sans antialiased`}
      >
        <RootJsonLd />
        <SkipLink />
        <WebVitals />
        <ErrorBoundary>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
