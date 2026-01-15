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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CLIProxyAPI",
  url: siteUrl,
  logo: {
    "@type": "ImageObject",
    url: `${siteUrl}/logo.png`,
    width: 512,
    height: 512,
    caption: "CLIProxyAPI Logo",
  },
  description:
    "CLIProxyAPI is a unified AI proxy CLI gateway for OpenAI, Claude, Gemini, and more. Generate config.yaml, explore ecosystem apps, and monitor provider status.",
  sameAs: [
    "https://github.com/router-for-me/CLIProxyAPI",
    "https://github.com/CLIProxyAPI/CLIProxyAPI",
    "https://twitter.com/CLIProxyAPI",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "technical support",
    url: `${siteUrl}/docs`,
    availableLanguage: "English",
  },
  foundingDate: "2024",
  founders: [
    {
      "@type": "Person",
      name: "CLIProxyAPI Contributors",
    },
  ],
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CLIProxyAPI",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Windows, Linux, Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Unified AI proxy CLI gateway supporting OpenAI, Claude, Gemini, Qwen, iFlow, and custom OpenAI-compatible providers with OAuth authentication.",
  author: {
    "@type": "Organization",
    name: "CLIProxyAPI",
    url: siteUrl,
  },
  license: "https://opensource.org/licenses/MIT",
  keywords:
    "AI proxy, OpenAI proxy, Claude proxy, Gemini proxy, CLI tool, API gateway, OAuth",
  softwareVersion: "1.0",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "150",
    bestRating: "5",
    worstRating: "1",
  },
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CLIProxies.com",
  alternateName: "CLIProxyAPI Hub",
  url: siteUrl,
  description:
    "Documentation hub, ecosystem directory, and status board for CLIProxyAPI - the unified AI proxy CLI gateway for OpenAI, Claude, and Gemini.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/apps?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "CLIProxyAPI",
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logo.png`,
    },
  },
};

const breadcrumbSchema = {
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
      name: "Apps",
      item: `${siteUrl}/apps`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Documentation",
      item: `${siteUrl}/docs`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Status",
      item: `${siteUrl}/status`,
    },
    {
      "@type": "ListItem",
      position: 5,
      name: "Proxy Grid",
      item: `${siteUrl}/proxygrid`,
    },
  ],
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
        text: "CLIProxyAPI is a unified AI proxy CLI gateway that allows you to use multiple AI providers (OpenAI, Claude, Gemini, Qwen, and more) through a single interface with OAuth authentication.",
      },
    },
    {
      "@type": "Question",
      name: "How do I generate a config.yaml?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use the config generator on CLIProxies.com to generate a ready-to-run config.yaml. Select your providers, add your API keys or configure OAuth, and download the file.",
      },
    },
    {
      "@type": "Question",
      name: "Which AI providers are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CLIProxyAPI supports OpenAI (Codex), Claude (Anthropic), Gemini (Google), Qwen (Alibaba), iFlow, custom OpenAI-compatible providers, and Vertex AI.",
      },
    },
    {
      "@type": "Question",
      name: "Is CLIProxyAPI free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CLIProxyAPI is open source and free to use. You only need to provide your own API keys or configure OAuth for each AI provider you want to use.",
      },
    },
    {
      "@type": "Question",
      name: "What is OAuth for AI proxies?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OAuth allows you to authenticate with AI providers like OpenAI and Anthropic without exposing your API keys. CLIProxyAPI handles the OAuth flow and stores tokens securely.",
      },
    },
    {
      "@type": "Question",
      name: "Can I self-host CLIProxyAPI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, CLIProxyAPI is open source and can be self-hosted on your own infrastructure. Check the GitHub repository for deployment instructions.",
      },
    },
    {
      "@type": "Question",
      name: "What apps work with CLIProxyAPI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There are many ecosystem apps including VibeProxy, ProxyPal, and Quotio for macOS, Windows, Linux, and web. Browse the apps directory to find one that fits your workflow.",
      },
    },
  ],
};

const techArticleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "CLIProxyAPI - Unified AI Proxy CLI Gateway",
  description:
    "Learn how to use CLIProxyAPI to unify your AI provider access through a single CLI tool with OAuth support.",
  image: `${siteUrl}/opengraph-image.png`,
  author: {
    "@type": "Organization",
    name: "CLIProxyAPI",
  },
  publisher: {
    "@type": "Organization",
    name: "CLIProxyAPI",
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logo.png`,
    },
  },
  datePublished: "2024-01-01",
  dateModified: new Date().toISOString(),
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": siteUrl,
  },
};

export function RootJsonLd() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareApplicationSchema} />
      <JsonLd data={webSiteSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={techArticleSchema} />
    </>
  );
}
