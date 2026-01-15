# Implementation Plan

## Phase 1: Foundation

### Tasks

1. **Initialize Next.js Project**

   ```bash
   pnpm create next-app@latest cliproxies-web --typescript --tailwind --app
   cd cliproxies-web
   pnpm add @radix-ui/react-icons lucide-react
   npx shadcn@latest init
   ```

2. **Setup shadcn/ui Components**

   ```bash
   npx shadcn@latest add button card badge tabs
   npx shadcn@latest add dialog select input
   ```

3. **Configure Dark Theme**
   - Geek black-gold style
   - CSS variables in `globals.css`

4. **Deploy to Cloudflare Pages**
   ```bash
   pnpm add -D @cloudflare/next-on-pages
   ```

### Deliverables

- [ ] Next.js project initialized
- [ ] shadcn/ui configured
- [ ] Dark theme applied
- [ ] Cloudflare Pages deployed

---

## Phase 2: Core Pages

### Home Page

- OS detection hook
- Dynamic CTA based on platform
- Hero section with gradient

### Apps Page

- Grid layout for ecosystem apps
- Filter by platform (Mac/Win/Web)
- GitHub stars badge (ISR)

### Docs Page

- Embed help.router-for.me
- Or redirect to official docs

### Status Page

- Aggregate provider status
- Community reports (optional)

---

## Phase 3: Config Generator

### Features

- Provider selection (Gemini/Claude/Codex)
- Port configuration
- API key input
- Generate & download `config.yaml`

### Implementation

- Zustand store for form state
- YAML generation library
- Download trigger

---

## Phase 4: Monetization

### Sponsor Integration

- Sponsored cards in grid
- Affiliate links with UTM
- Coupon code copy-to-clipboard

### Tracking

- PostHog events for downloads
- UTM parameter tracking
