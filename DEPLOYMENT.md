# CLIProxies Deployment Guide

Production-ready deployment automation for the CLIProxyAPI backend and cliproxies-web frontend.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Deployment Modes](#deployment-modes)
- [Environment Configuration](#environment-configuration)
- [Monitoring](#monitoring)
- [Rollback Procedures](#rollback-procedures)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

## Overview

The deployment system includes:

- **Blue-Green Deployment**: Zero-downtime deployments with automatic rollback
- **Health Checks**: Pre and post-deployment service validation
- **Database Backups**: Automated PostgreSQL backups before deployments
- **Monitoring Stack**: Prometheus + Grafana + Alertmanager
- **Nginx Configuration**: Rate limiting, security headers, SSL/TLS
- **CI/CD Integration**: GitHub Actions workflows for automated deployments

## Prerequisites

### Required Software

- Docker 20.10+
- Docker Compose 2.0+
- Bash 4.0+
- curl, wget
- Go 1.24+ (for building from source)
- Node.js 20+ (for frontend)
- pnpm 10+ (for frontend)
- wrangler (for Cloudflare Pages deployment)

### System Requirements

- Minimum 2GB free disk space
- Minimum 2GB RAM
- Open ports: 8317, 8085, 1455, 54545, 51121, 11451

## Quick Start

### 1. Local Development

```bash
# Run pre-deployment checks
./scripts/pre-deploy-check.sh

# Validate environment variables
source config/environment-validation.sh
```

### 2. Deploy Backend (Standard Mode)

```bash
# Build and start
cd CLIProxyAPI
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 3. Deploy Backend (Production)

```bash
# Blue-green deployment
./scripts/deploy.sh blue-green

# Or standard deployment
./scripts/deploy.sh standard
```

### 4. Deploy Frontend

```bash
# Deploy to Cloudflare Pages
./scripts/deploy-frontend.sh
```

## Deployment Modes

### Standard Deployment

Deploys directly with downtime during restart.

```bash
./scripts/deploy.sh standard
# or
./scripts/deploy.sh std
```

### Blue-Green Deployment

Zero-downtime deployment with traffic switching.

```bash
./scripts/deploy.sh blue-green
# or
./scripts/deploy.sh bg
```

**Process:**

1. Build new Docker image
2. Start green container (port 8318)
3. Health check on green
4. Switch traffic via nginx
5. Stop blue container

### Manual Traffic Switch

```bash
# Switch to green
./scripts/switch-color.sh green

# Switch to blue
./scripts/switch-color.sh blue
```

## Environment Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Deployment Environment
DEPLOY_ENV=production

# Database (PostgreSQL)
PGSTORE_DSN=postgres://user:pass@host:port/dbname
PGSTORE_SCHEMA=cliproxies
PGSTORE_LOCAL_PATH=/var/lib/cliproxies

# Management API
MANAGEMENT_SECRET_KEY=your-secret-key-here

# Provider API Keys
GEMINI_API_KEY=your-gemini-key
CLAUDE_API_KEY=your-claude-key
CODEX_API_KEY=your-codex-key
AMP_API_KEY=your-amp-key

# Cloudflare (Frontend)
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
NEXT_PUBLIC_SITE_URL=https://cliproxies.com

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Configuration Files

- **Production**: `config/production.yaml`
- **Staging**: `config/staging.yaml`

Validate your environment:

```bash
./config/environment-validation.sh
```

## Monitoring

### Start Monitoring Stack

```bash
cd monitoring
docker-compose up -d
```

**Services:**

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)
- Alertmanager: http://localhost:9093

### Grafana Dashboards

Import the pre-configured dashboard:

```bash
# Dashboard JSON
monitoring/grafana/dashboards/cliproxies-dashboard.json
```

### Alert Rules

Alerts are configured in `monitoring/prometheus/rules/cliproxies-alerts.yml`:

- **Critical**: API down, high error rate (>20%), slow response (>10s)
- **Warning**: High error rate (>5%), slow response (>2s), high resource usage
- **Info**: Low request volume

### Prometheus Metrics

The application exposes metrics at `/metrics`:

```bash
curl http://localhost:8317/metrics
```

## Rollback Procedures

### Automatic Rollback

The deployment script automatically rolls back on failure.

### Manual Rollback

```bash
# Rollback to previous deployment
./scripts/rollback.sh

# Rollback to specific deployment
./scripts/rollback.sh 20240101120000
```

### GitHub Actions Rollback

1. Go to Actions tab
2. Select "Rollback" workflow
3. Choose environment (production/staging)
4. Optionally specify deployment ID
5. Run workflow

## CI/CD Pipeline

### Workflows

- **ci.yml**: Runs tests on every push/PR
  - Go tests with coverage
  - Go vet and fmt checks
  - Gosec security scanning
  - Frontend lint and type check
  - Docker build tests

- **production-deploy.yml**: Deploys on main branch push
  - Runs all CI checks
  - Security scanning (Gosec, Trivy)
  - Docker image build and push
  - Staging deployment
  - Production deployment (with manual approval)
  - Slack notifications

- **rollback.yml**: Manual rollback workflow

### Required GitHub Secrets

```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
VPS_HOST
VPS_STAGING_HOST (optional)
VPS_USER
VPS_SSH_KEY
SLACK_WEBHOOK_URL (optional)
```

## Nginx Configuration

### Configuration Files

- Main config: `nginx/cliproxies.conf`
- Upstream config: `nginx/upstream.conf`

### Features

- SSL/TLS termination
- Rate limiting (20 req/s per IP)
- Security headers
- WebSocket support
- Blue-green upstream switching

### Rate Limits

| Endpoint                      | Limit | Burst |
| ----------------------------- | ----- | ----- |
| API (`/v1/*`)                 | 20/s  | 50    |
| Management (`/v0/management`) | 10/s  | 5     |
| Auth (`/auth`, `/oauth`)      | 5/s   | 10    |

### Reloading Nginx

```bash
# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

## Database Backups

### Manual Backup

```bash
./scripts/backup-database.sh
```

### Automated Backups

Backups are automatically created before deployments via `scripts/deploy.sh`.

### Backup Location

```
/Volumes/SSD/dev/proxy/cliproxies/backups/database/
```

### Backup Retention

Default: 7 days (configurable via `BACKUP_RETENTION_DAYS`)

## Troubleshooting

### Health Check Failures

```bash
# Check service status
curl http://localhost:8317/health

# Check container logs
docker logs cli-proxy-api-blue

# Check container status
docker ps -a | grep cliproxies
```

### Port Conflicts

```bash
# Check what's using the port
lsof -i :8317

# Or
netstat -tulpn | grep 8317
```

### Docker Issues

```bash
# Remove old images
docker image prune -af --filter "until=24h"

# Rebuild without cache
docker-compose build --no-cache

# Clean restart
docker-compose down -v
docker-compose up -d
```

### Monitoring Issues

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq .

# Check Prometheus logs
docker logs cliproxies-prometheus

# Reload Prometheus config
curl -X POST http://localhost:9090/-/reload
```

### Deployment Failures

```bash
# Check deployment logs
cat logs/deployments/deployment-*.log

# Check for specific deployment
grep "ERROR" logs/deployments/deployment-20240101120000.log
```

## File Structure

```
cliproxies/
├── CLIProxyAPI/
│   ├── Dockerfile                 # Production-optimized Dockerfile
│   ├── Dockerfile.optimized       # Multi-stage build with non-root user
│   ├── docker-compose.yml         # Development compose
│   ├── docker-compose.prod.yml    # Production with blue-green
│   ├── docker-compose.staging.yml # Staging configuration
│   └── config.yaml                # Runtime configuration
├── cliproxies-web/                # Frontend application
├── config/
│   ├── production.yaml            # Production config template
│   ├── staging.yaml               # Staging config template
│   └── environment-validation.sh  # Env var validator
├── scripts/
│   ├── deploy.sh                  # Main deployment script
│   ├── rollback.sh                # Rollback script
│   ├── backup-database.sh         # Database backup
│   ├── pre-deploy-check.sh        # Pre-deployment validation
│   ├── switch-color.sh            # Blue-green traffic switch
│   ├── deploy-frontend.sh         # Frontend deployment
│   └── deploy-local.sh            # Local validation
├── nginx/
│   ├── cliproxies.conf            # Main nginx config
│   └── upstream.conf.template     # Upstream template
├── monitoring/
│   ├── docker-compose.yml         # Monitoring stack
│   ├── prometheus/
│   │   ├── prometheus.yml         # Prometheus config
│   │   └── rules/
│   │       └── cliproxies-alerts.yml
│   ├── grafana/
│   │   └── dashboards/
│   │       └── cliproxies-dashboard.json
│   └── alertmanager/
│       └── alertmanager.yml
└── .github/workflows/
    ├── ci.yml                     # CI pipeline
    ├── production-deploy.yml      # Production deployment
    └── rollback.yml               # Rollback workflow
```

## Support

For issues and questions:

1. Check logs in `logs/deployments/`
2. Review troubleshooting section
3. Check GitHub Issues

## License

See project LICENSE file.
