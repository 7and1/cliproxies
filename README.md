# CLIProxies

CLIProxy API + Web Dashboard

## Structure

- **CLIProxyAPI/** - Go backend proxy server
- **cliproxies-web/** - Next.js web frontend (Cloudflare Pages)
- **docs/** - Documentation

## Quick Start

### Frontend (Local)

```bash
cd cliproxies-web
pnpm install
pnpm dev
```

### Backend (Local)

```bash
cd CLIProxyAPI
cp config.example.yaml config.yaml
# Edit config.yaml with your settings
go run cmd/server/main.go
```

## Deployment

### Frontend - Cloudflare Pages

Automatically deployed via GitHub Actions on push to `main`.

Manual deployment:

```bash
cd cliproxies-web
pnpm build
pnpm upload
```

### Backend - VPS

Use the deploy script:

```bash
cd CLIProxyAPI/deploy
./deploy.sh
```

## Environment Variables

### GitHub Secrets Required

```
CLOUDFLARE_API_TOKEN     # Cloudflare API token
CLOUDFLARE_ACCOUNT_ID    # Cloudflare account ID
VPS_HOST                 # VPS hostname (107.174.42.198)
VPS_USER                 # VPS username (root)
VPS_SSH_KEY              # VPS SSH private key
```

### GitHub Variables (Optional)

```
NEXT_PUBLIC_SITE_URL     # Site URL (default: https://cliproxies.com)
```

## License

MIT
