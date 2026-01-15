# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIProxies.com (Frontend)                   │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15 App Router                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Home   │ │   Apps   │ │   Docs   │ │  Status  │           │
│  │  (Hero)  │ │  (Grid)  │ │ (Embed)  │ │ (Agg)    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                      │                                          │
│              ┌───────▼───────┐                                  │
│              │ Config        │                                  │
│              │ Generator     │                                  │
│              └───────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Downloads config.yaml
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLIProxyAPI (Backend)                         │
├─────────────────────────────────────────────────────────────────┤
│  Go v6 SDK                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Proxy    │ │ Auth     │ │Translator│ │ Watcher  │           │
│  │ Server   │ │ Manager  │ │ Layer    │ │ (Hot)    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack Decision

| Layer     | Choice               | Rationale                       |
| --------- | -------------------- | ------------------------------- |
| Framework | Next.js 15           | App Router, RSC, Edge-ready     |
| Styling   | Tailwind + shadcn/ui | Rapid dev, dark theme           |
| Deploy    | Cloudflare Pages     | Global edge, free tier          |
| State     | Zustand              | Config generator state          |
| Analytics | PostHog              | Privacy-first, self-host option |

## Directory Structure

```
cliproxies-web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Home with OS detection
│   ├── apps/
│   │   └── page.tsx          # Ecosystem grid
│   ├── docs/
│   │   └── page.tsx          # Embedded docs
│   ├── status/
│   │   └── page.tsx          # Status aggregation
│   └── api/
│       └── github-stars/
│           └── route.ts      # ISR for stars
├── components/
│   ├── ui/                   # shadcn components
│   ├── hero-section.tsx
│   ├── app-card.tsx
│   ├── config-generator.tsx
│   └── sponsor-card.tsx
├── lib/
│   ├── config-generator.ts
│   └── utils.ts
├── hooks/
│   └── use-os.ts
└── data/
    ├── ecosystem.ts
    └── sponsors.ts
```
