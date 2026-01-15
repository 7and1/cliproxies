# Deployment Configuration

## Cloudflare Pages

```bash
# Install adapter
pnpm add -D @cloudflare/next-on-pages

# Build
pnpm build

# Deploy
wrangler pages deploy .vercel/output/static
```

## wrangler.toml

```toml
name = "cliproxies-web"
compatibility_date = "2024-01-01"

[vars]
NEXT_PUBLIC_SITE_URL = "https://cliproxies.com"
```

## Environment Variables

| Variable               | Description                |
| ---------------------- | -------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Site URL                   |
| `POSTHOG_KEY`          | PostHog API key (optional) |
