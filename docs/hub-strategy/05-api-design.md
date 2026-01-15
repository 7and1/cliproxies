# API Design

## GitHub Stars API (ISR)

```typescript
// app/api/github-stars/route.ts
import { NextResponse } from "next/server";

export const revalidate = 86400; // 24 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");

  if (!repo) {
    return NextResponse.json({ error: "Missing repo" }, { status: 400 });
  }

  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ stars: 0 });
  }

  const data = await res.json();
  return NextResponse.json({ stars: data.stargazers_count });
}
```

## Status Aggregation

```typescript
// app/api/status/route.ts
const PROVIDERS = [
  { name: "OpenAI", url: "https://status.openai.com/api/v2/status.json" },
  { name: "Anthropic", url: "https://status.anthropic.com/api/v2/status.json" },
];

export async function GET() {
  const results = await Promise.all(
    PROVIDERS.map(async (p) => {
      try {
        const res = await fetch(p.url, { next: { revalidate: 300 } });
        const data = await res.json();
        return { name: p.name, status: data.status?.indicator || "unknown" };
      } catch {
        return { name: p.name, status: "unknown" };
      }
    }),
  );

  return Response.json(results);
}
```
