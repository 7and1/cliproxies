# Deployment Guide

## Prerequisites

1. VPS access (107.174.42.198)
2. GitHub repository
3. Cloudflare account with Pages configured

## GitHub Secrets Configuration

### Required Secrets

Go to repository Settings > Secrets and variables > Actions

| Secret Name             | Description                                     | Example                           |
| ----------------------- | ----------------------------------------------- | --------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token with Pages edit permission | `your_cloudflare_api_token_here`  |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID                           | `your_cloudflare_account_id_here` |
| `VPS_HOST`              | VPS hostname                                    | `107.174.42.198`                  |
| `VPS_USER`              | VPS username                                    | `root`                            |
| `VPS_SSH_KEY`           | VPS SSH private key                             | (paste private key content)       |

### Optional Variables

| Variable Name          | Description         | Default                  |
| ---------------------- | ------------------- | ------------------------ |
| `NEXT_PUBLIC_SITE_URL` | Production site URL | `https://cliproxies.com` |

## Initial VPS Setup

### 1. Create directory structure

```bash
ssh root@107.174.42.198
mkdir -p /opt/docker-projects/standalone-apps/cliproxies
```

### 2. Create config.yaml on VPS

```bash
cd /opt/docker-projects/standalone-apps/cliproxies
cat > config.yaml << 'EOF'
host: ""
port: 8317
cors:
  allowed-origins:
    - "http://localhost:*"
    - "http://127.0.0.1:*"
    - "https://cliproxies.com"
remote-management:
  allow-remote: false
  secret-key: ""  # Set a strong password here
auth-dir: "/root/.cli-proxy-api"
api-keys: []  # Add your API keys here
debug: false
EOF
```

### 3. Set proper permissions

```bash
chmod 600 config.yaml
mkdir -p auths logs
```

## Deployment Workflow

### Automated Deployment (Recommended)

1. Push to `main` branch
2. GitHub Actions will:
   - Build and deploy frontend to Cloudflare Pages
   - Build and deploy backend to VPS

### Manual Backend Deployment

```bash
cd CLIProxyAPI/deploy
./deploy.sh
```

### Manual Frontend Deployment

```bash
cd cliproxies-web
pnpm build
pnpm upload
```

## Monitoring

### Check backend status

```bash
ssh root@107.174.42.198 "docker ps | grep cliproxies"
ssh root@107.174.42.198 "docker logs cliproxies-api -f"
```

### Health check

```bash
curl https://api.cliproxies.com/health
```

## Port Registry

| Service     | Port | External URL      |
| ----------- | ---- | ----------------- |
| Backend API | 8005 | (via nginx-proxy) |

## Troubleshooting

### Backend not starting

```bash
ssh root@107.174.42.198
cd /opt/docker-projects/standalone-apps/cliproxies
docker-compose -f docker-compose.prod.yml logs
```

### Frontend build issues

Check Cloudflare Pages dashboard for build logs.
