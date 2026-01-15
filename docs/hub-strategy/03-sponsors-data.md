# Sponsors Data

## Sponsor Interface

```typescript
// data/types.ts
export interface Sponsor {
  id: string;
  name: string;
  description: string;
  logo: string;
  url: string;
  coupon?: string;
  discount?: string;
  tier: "gold" | "silver" | "bronze";
}
```

## Sponsors Data

```typescript
// data/sponsors.ts
import { Sponsor } from "./types";

export const sponsors: Sponsor[] = [
  {
    id: "zai",
    name: "Z.ai",
    description: "GLM CODING PLAN - Starting at $3/month",
    logo: "https://assets.router-for.me/english-4.7.png",
    url: "https://z.ai/subscribe?ic=8JVLJQFSKB",
    coupon: "8JVLJQFSKB",
    discount: "10%",
    tier: "gold",
  },
  {
    id: "packycode",
    name: "PackyCode",
    description: "Reliable API relay for Claude Code, Codex, Gemini",
    logo: "/sponsors/packycode.png",
    url: "https://www.packyapi.com/register?aff=cliproxyapi",
    coupon: "cliproxyapi",
    discount: "10%",
    tier: "silver",
  },
  {
    id: "cubence",
    name: "Cubence",
    description: "Efficient API relay service provider",
    logo: "/sponsors/cubence.png",
    url: "https://cubence.com/signup?code=CLIPROXYAPI&source=cpa",
    coupon: "CLIPROXYAPI",
    discount: "10%",
    tier: "silver",
  },
];
```

## Usage in Components

```tsx
// components/sponsor-card.tsx
import { Sponsor } from "@/data/types";
import { Badge } from "@/components/ui/badge";

export function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(sponsor.coupon || "");
  };

  return (
    <div className="relative border border-amber-500/30 rounded-lg p-4">
      <Badge className="absolute -top-2 right-2 bg-amber-500">Sponsored</Badge>
      {/* Card content */}
    </div>
  );
}
```
