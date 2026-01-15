# OS Detection Hook

## useOS Hook

```typescript
// hooks/use-os.ts
"use client";

import { useState, useEffect } from "react";

export type OS = "mac" | "windows" | "linux" | "other";

export function useOS(): OS {
  const [os, setOS] = useState<OS>("other");

  useEffect(() => {
    const ua = window.navigator.userAgent;
    if (ua.includes("Mac")) setOS("mac");
    else if (ua.includes("Win")) setOS("windows");
    else if (ua.includes("Linux")) setOS("linux");
  }, []);

  return os;
}
```

## Hero Section Usage

```tsx
// components/hero-section.tsx
"use client";

import { useOS } from "@/hooks/use-os";
import { Button } from "@/components/ui/button";

const CTA_MAP = {
  mac: {
    primary: { label: "Download CodMate", href: "/apps/codmate" },
    secondary: { label: "View Mac Apps", href: "/apps?platform=mac" },
  },
  windows: {
    primary: { label: "Download ProxyPilot", href: "/apps/proxypilot" },
    secondary: { label: "View Windows Apps", href: "/apps?platform=windows" },
  },
  linux: {
    primary: { label: "Install CLI", href: "/docs/cli" },
    secondary: { label: "View All Apps", href: "/apps" },
  },
  other: {
    primary: { label: "Get Started", href: "/docs" },
    secondary: { label: "View All Apps", href: "/apps" },
  },
};

export function HeroSection() {
  const os = useOS();
  const cta = CTA_MAP[os];

  return (
    <section className="py-20">
      <h1>The Hub for AI Proxy Ecosystem</h1>
      <div className="flex gap-4 mt-8">
        <Button asChild>
          <a href={cta.primary.href}>{cta.primary.label}</a>
        </Button>
        <Button variant="outline" asChild>
          <a href={cta.secondary.href}>{cta.secondary.label}</a>
        </Button>
      </div>
    </section>
  );
}
```
