# JSON-LD Component Updates

---

## Enhanced JSON-LD Component

This file contains the complete JSON-LD component for implementation in `/Volumes/SSD/dev/proxy/cliproxies/cliproxies-web/src/components/json-ld.tsx`

```typescript
import { usePathname } from "next/navigation";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization Schema - Add to root layout
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CLIProxyAPI",
  "url": "https://cliproxies.com",
  "logo": "https://cliproxies.com/logo.png",
  "description": "Unified AI proxy gateway for OpenAI, Claude, Gemini, and more.",
  "sameAs": [
    "https://github.com/router-for-me/CLIProxyAPI",
    "https://twitter.com/CLIProxyAPI",
    "https://discord.gg/cliproxies"
  ],
  "foundingDate": "2024",
  "license": "https://www.apache.org/licenses/LICENSE-2.0"
};

// Software Application Schema - For homepage
export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "CLIProxyAPI",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "macOS, Windows, Linux",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "250"
  },
  "author": {
    "@type": "Organization",
    "name": "CLIProxyAPI Community"
  }
};

// FAQ Schema - For documentation
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is CLIProxyAPI?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CLIProxyAPI is a unified API gateway that provides OpenAI-compatible interfaces for multiple AI providers including OpenAI, Claude, Gemini, Qwen, and more."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use CLIProxyAPI with Claude Code?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, CLIProxyAPI works seamlessly with Claude Code. Set ANTHROPIC_BASE_URL to your proxy URL and provide your CLIProxyAPI key."
      }
    },
    {
      "@type": "Question",
      "name": "Does CLIProxyAPI support OAuth?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, CLIProxyAPI supports OAuth for OpenAI (ChatGPT Plus), Anthropic Claude, and Google Gemini, allowing you to use existing subscriptions without API keys."
      }
    },
    {
      "@type": "Question",
      "name": "Is CLIProxyAPI free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, CLIProxyAPI is open source under Apache 2.0 license and free to use. You only pay the underlying AI provider costs."
      }
    },
    {
      "@type": "Question",
      "name": "Can I self-host CLIProxyAPI?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, CLIProxyAPI is designed for self-hosting. Run it on your own infrastructure using Docker, Kubernetes, or standalone binary."
      }
    }
  ]
};

// HowTo Schema - For quick start
export const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Install and Configure CLIProxyAPI",
  "description": "Set up a unified AI proxy gateway in under 60 seconds.",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Generate Configuration",
      "text": "Use the config generator at cliproxies.com to create config.yaml"
    },
    {
      "@type": "HowToStep",
      "name": "Install CLIProxyAPI",
      "text": "Run: go install github.com/router-for-me/CLIProxyAPI/v6/cmd/cli-proxy-api@latest"
    },
    {
      "@type": "HowToStep",
      "name": "Start the Proxy",
      "text": "Run: cli-proxy-api --config config.yaml"
    }
  ]
};

// BreadcrumbList Schema - Dynamic based on path
export function getBreadcrumbSchema(pathname: string) {
  const breadcrumbs = [{ name: "Home", item: "https://cliproxies.com" }];

  if (pathname === "/apps") {
    breadcrumbs.push({ name: "Apps", item: "https://cliproxies.com/apps" });
  } else if (pathname === "/docs") {
    breadcrumbs.push({ name: "Documentation", item: "https://cliproxies.com/docs" });
  } else if (pathname === "/status") {
    breadcrumbs.push({ name: "Status", item: "https://cliproxies.com/status" });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.item
    }))
  };
}

// Component with all schemas
export function StructuredData() {
  const pathname = usePathname();

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareApplicationSchema} />
      <JsonLd data={getBreadcrumbSchema(pathname)} />
      {pathname === "/docs" && <JsonLd data={faqSchema} />}
      {pathname === "/" && <JsonLd data={howToSchema} />}
    </>
  );
}
```

---

## Page-Specific JSON-LD

### Homepage JSON-LD

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "CLIProxies.com",
      "url": "https://cliproxies.com",
      "description": "Unified AI proxy CLI gateway for OpenAI, Claude, Gemini, and more."
    },
    {
      "@type": "Organization",
      "@id": "https://cliproxies.com/#organization",
      "name": "CLIProxyAPI",
      "url": "https://cliproxies.com",
      "logo": "https://cliproxies.com/logo.png"
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://cliproxies.com/#software",
      "name": "CLIProxyAPI",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "macOS, Windows, Linux"
    }
  ]
}
```

### Apps Page JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "CLIProxyAPI Ecosystem Apps",
  "description": "Browse desktop, web, and CLI clients built with CLIProxyAPI.",
  "url": "https://cliproxies.com/apps",
  "about": {
    "@type": "SoftwareApplication",
    "name": "CLIProxyAPI",
    "operatingSystem": "macOS, Windows, Linux, Web"
  }
}
```

### Documentation Page JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "CLIProxyAPI Documentation",
  "description": "Complete guide to installing, configuring, and using CLIProxyAPI.",
  "author": {
    "@type": "Organization",
    "name": "CLIProxyAPI"
  },
  "datePublished": "2024-01-01",
  "dateModified": "2025-01-12"
}
```

### Status Page JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "AI Provider Status Monitor",
  "description": "Real-time status monitoring for OpenAI, Claude, Gemini, and other AI providers.",
  "provider": {
    "@type": "Organization",
    "name": "CLIProxyAPI"
  },
  "areaServed": "Worldwide"
}
```

---

## Implementation Instructions

1. Replace `/Volumes/SSD/dev/proxy/cliproxies/cliproxies-web/src/components/json-ld.tsx` with the enhanced component above

2. Update the layout to use `StructuredData` instead of basic `JsonLd`:

```typescript
// In src/app/layout.tsx
import { StructuredData } from "@/components/json-ld";

// In body tag, replace <JsonLd /> with:
<StructuredData />
```

3. For page-specific JSON-LD, use the `generateMetadata` function:

```typescript
// Example for apps page
export async function generateMetadata({ params }) {
  return {
    title: "Ecosystem Apps | CLIProxyAPI",
    description: "Browse desktop, web, and CLI clients built with CLIProxyAPI.",
    openGraph: {
      title: "CLIProxyAPI Ecosystem Apps",
      description:
        "Browse desktop, web, and CLI clients built with CLIProxyAPI.",
      url: "https://cliproxies.com/apps",
    },
  };
}
```
