# CLIProxies.com Development Prompt

> Copy this prompt to start a new Claude Code session

---

## System Context

You are building **CLIProxies.com** - a documentation hub and ecosystem directory for the CLIProxyAPI project.

### Reference Materials

```
SPEC_DIR="/Volumes/SSD/dev/proxy/cliproxies/CLIProxyAPI/docs/hub-strategy"
SOURCE_DIR="/Volumes/SSD/dev/proxy/cliproxies/CLIProxyAPI"
```

**Before writing any code, read these files:**

1. `$SPEC_DIR/README.md` - Project overview
2. `$SPEC_DIR/01-architecture.md` - Tech stack decisions
3. `$SPEC_DIR/03-ecosystem-data.md` - App data structure
4. `$SOURCE_DIR/README.md` - Ecosystem apps list (source of truth)

---

## Task

Build a Next.js 15 website with these pages:

| Route     | Purpose                        |
| --------- | ------------------------------ |
| `/`       | Home with OS-aware hero CTA    |
| `/apps`   | Ecosystem grid with filters    |
| `/docs`   | Redirect to help.router-for.me |
| `/status` | Provider status aggregation    |

---

## Execution Steps

### Phase 1: Initialize

```bash
cd /Volumes/SSD/dev/proxy/cliproxies
pnpm create next-app@latest cliproxies-web --typescript --tailwind --app --src-dir --import-alias "@/*"
cd cliproxies-web
```

### Phase 2: Setup shadcn/ui

```bash
npx shadcn@latest init -d
npx shadcn@latest add button card badge tabs input
```

### Phase 3: Implement (in order)

1. **Dark theme** - Geek black-gold style in `globals.css`
2. **Data layer** - `src/data/ecosystem.ts` from spec
3. **useOS hook** - `src/hooks/use-os.ts` from spec
4. **Components** - AppCard, SponsorCard, HeroSection
5. **Pages** - Home, Apps grid
6. **Config generator** - Optional, Phase 2

---

## Code Style

- TypeScript strict mode
- Server Components by default, `'use client'` only when needed
- Tailwind only, no CSS modules
- No comments unless logic is non-obvious

---

## Design Tokens

```css
/* globals.css */
:root {
  --gold: 45 100% 50%;
  --gold-muted: 45 80% 40%;
}

.dark {
  --background: 0 0% 4%;
  --foreground: 0 0% 95%;
  --card: 0 0% 6%;
  --border: 0 0% 15%;
  --accent: var(--gold);
}
```

---

## Constraints

- NO mock data - use real GitHub repos from CLIProxyAPI README
- NO custom protocols - config.yaml download only
- NO backend - static site + ISR for GitHub stars
- Deploy target: Cloudflare Pages

---

## Start Command

After reading specs, begin with:

```
I'll build CLIProxies.com based on the hub-strategy specs. Starting with project initialization.
```
