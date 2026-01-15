# CLIProxies.com Hub Strategy

> Technical Execution Plan for AI Proxy Ecosystem Hub

## Overview

Transform CLIProxies.com into the central hub for AI Proxy ecosystem, focusing on:

- **Documentation Hub** (not App Store)
- **Configuration Generator** (not custom protocol)
- **Ecosystem Directory** (curated, not marketplace)

## Document Index

| Document                                                       | Description                        |
| -------------------------------------------------------------- | ---------------------------------- |
| [01-architecture.md](./01-architecture.md)                     | System architecture and tech stack |
| [02-implementation.md](./02-implementation.md)                 | Implementation phases and tasks    |
| [03-ecosystem-data.md](./03-ecosystem-data.md)                 | Ecosystem apps data spec           |
| [03-sponsors-data.md](./03-sponsors-data.md)                   | Sponsors data spec                 |
| [04-config-generator.md](./04-config-generator.md)             | Config generator spec              |
| [04-config-generator-part2.md](./04-config-generator-part2.md) | Download & component               |
| [05-api-design.md](./05-api-design.md)                         | API endpoints                      |
| [06-os-detection.md](./06-os-detection.md)                     | OS detection hook                  |
| [07-app-card.md](./07-app-card.md)                             | App card component                 |
| [08-apps-page.md](./08-apps-page.md)                           | Apps grid page                     |
| [09-deployment.md](./09-deployment.md)                         | Cloudflare deployment              |

## Core Principles

### 1. Separation of Concerns

```
CLIProxyAPI (Go)          CLIProxies.com (Next.js)
├── Proxy Server    ──→   ├── Documentation
├── SDK             ──→   ├── Config Generator
└── Auth Flows      ──→   └── Ecosystem Directory
```

### 2. No Custom Protocol

**Wrong**: `cliproxy://import?config=base64...`
**Right**: Standardized `config.yaml` download

### 3. Value Proposition

| What We Do            | What We Don't Do           |
| --------------------- | -------------------------- |
| Curate ecosystem apps | Build app marketplace      |
| Generate configs      | Invent new protocols       |
| Aggregate docs        | Replace help.router-for.me |
| Track sponsor deals   | Handle payments            |

## Quick Start

```bash
# Development
cd cliproxies-web
pnpm install
pnpm dev

# Deploy
pnpm build
wrangler pages deploy .next
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deploy**: Cloudflare Pages
- **Analytics**: PostHog (optional)
