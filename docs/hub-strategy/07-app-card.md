# App Card Component

## Interface

```typescript
// components/app-card.tsx
import { App } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

interface AppCardProps {
  app: App;
  stars?: number;
}
```

## Component

```tsx
export function AppCard({ app, stars }: AppCardProps) {
  return (
    <Card className="p-4 hover:border-amber-500/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{app.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {app.description}
          </p>
        </div>
        {stars !== undefined && (
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4" />
            <span className="text-sm">{stars}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {app.platforms.map((p) => (
          <Badge key={p} variant="secondary">
            {p}
          </Badge>
        ))}
        {app.tags.map((t) => (
          <Badge key={t} variant="outline">
            {t}
          </Badge>
        ))}
      </div>

      <div className="mt-4">
        <a
          href={app.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-amber-500 hover:underline"
        >
          View on GitHub
        </a>
      </div>
    </Card>
  );
}
```
