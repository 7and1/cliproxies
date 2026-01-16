# CLIProxies Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2025-01-16

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [VPS Setup](#vps-setup)
4. [Database Setup](#database-setup)
5. [Reverse Proxy Configuration](#reverse-proxy-configuration)
6. [SSL/TLS Setup](#ssltls-setup)
7. [Environment Configuration](#environment-configuration)
8. [Production Deployment](#production-deployment)
9. [Frontend Deployment](#frontend-deployment)
10. [First-Run Verification](#first-run-verification)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

| Requirement | Minimum                              | Recommended       |
| ----------- | ------------------------------------ | ----------------- |
| **OS**      | Ubuntu 20.04+, Debian 11+, CentOS 8+ | Ubuntu 22.04 LTS  |
| **CPU**     | 1 core                               | 2+ cores          |
| **Memory**  | 512 MB RAM                           | 1 GB RAM          |
| **Disk**    | 100 MB free space                    | 500 MB free space |
| **Network** | 1 Mbps                               | 100 Mbps          |

### Software Requirements

- **Go**: 1.24+ (for building from source)
- **Docker**: 20.10+ (for container deployment)
- **Docker Compose**: 2.0+ (for multi-container setup)
- **Git**: 2.0+ (for cloning repository)
- **PostgreSQL**: 14+ (optional, for distributed deployments)

### Hardware Requirements

For small deployments (< 100 concurrent users):

```
CPU:    1-2 cores
RAM:    512 MB - 1 GB
Disk:   20 GB SSD
```

For medium deployments (100-1000 concurrent users):

```
CPU:    2-4 cores
RAM:    2-4 GB
Disk:   50 GB SSD
```

For large deployments (> 1000 concurrent users):

```
CPU:    4+ cores
RAM:    4+ GB
Disk:   100 GB SSD
```

---

## Quick Start

### Docker Deployment (Recommended)

1. **Clone the repository:**

```bash
git clone https://github.com/router-for-me/CLIProxyAPI.git cliproxies
cd cliproxies/CLIProxyAPI
```

2. **Create configuration file:**

```bash
cp config.example.yaml config.yaml
```

Edit `config.yaml` with your settings:

```yaml
host: ""
port: 8317

# Add your API keys
api-keys:
  - "your-api-key-1"
  - "your-api-key-2"
```

3. **Start the server:**

```bash
docker-compose up -d
```

4. **Verify the deployment:**

```bash
curl http://localhost:8317/health
```

### Binary Deployment

1. **Download the latest release:**

```bash
# Linux AMD64
wget https://github.com/router-for-me/CLIProxyAPI/releases/latest/download/CLIProxyAPI-linux-amd64

# Linux ARM64
wget https://github.com/router-for-me/CLIProxyAPI/releases/latest/download/CLIProxyAPI-linux-arm64

# macOS AMD64
wget https://github.com/router-for-me/CLIProxyAPI/releases/latest/download/CLIProxyAPI-darwin-amd64

# macOS ARM64 (Apple Silicon)
wget https://github.com/router-for-me/CLIProxyAPI/releases/latest/download/CLIProxyAPI-darwin-arm64
```

2. **Make the binary executable:**

```bash
chmod +x CLIProxyAPI-*
mv CLIProxyAPI-* CLIProxyAPI
```

3. **Create configuration:**

```bash
./CLIProxyAPI -config config.example.yaml
# Edit the generated config.yaml
```

4. **Run the server:**

```bash
./CLIProxyAPI
```

---

## VPS Setup

### Initial Server Preparation

1. **Update the system:**

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

2. **Create a dedicated user:**

```bash
sudo useradd -r -s /bin/bash cliproxies
sudo mkdir -p /opt/cliproxies
sudo chown cliproxies:cliproxies /opt/cliproxies
```

3. **Install Docker:**

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker cliproxies
```

4. **Install Git:**

```bash
# Ubuntu/Debian
sudo apt install -y git

# CentOS/RHEL
sudo yum install -y git
```

### Clone and Setup

```bash
# Switch to cliproxies user
sudo -u cliproxies -i

# Clone repository
cd /opt/cliproxies
git clone https://github.com/router-for-me/CLIProxyAPI.git
cd CLIProxyAPI

# Copy example configuration
cp config.example.yaml config.yaml

# Edit configuration
nano config.yaml
```

---

## Database Setup

CLIProxies supports PostgreSQL for distributed deployments. This is optional for single-instance deployments.

### PostgreSQL Installation

```bash
# Ubuntu/Debian
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Execute SQL commands
CREATE DATABASE cliproxies;
CREATE USER cliproxies WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE cliproxies TO cliproxies;
\q
```

### Configure CLIProxies for PostgreSQL

Create or edit `.env` file:

```bash
# PostgreSQL Store
PGSTORE_DSN=postgresql://cliproxies:your-secure-password@localhost:5432/cliproxies?sslmode=disable
PGSTORE_SCHEMA=public
PGSTORE_LOCAL_PATH=/var/lib/cliproxy
```

### Run Migrations

```bash
# The application will auto-migrate on first start
docker-compose --env-file .env up -d
```

### Connection Pooling

Configure connection pool in `config.yaml`:

```yaml
database:
  max-conns: 20
  min-conns: 5
  max-conn-lifetime: "1h"
  max-conn-idle-time: "30m"
  health-check: "1m"
```

### Backup Strategy

Create a backup script `/opt/cliproxies/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/cliproxies"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Database backup
pg_dump -h localhost -U cliproxies cliproxies | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Config backup
cp /opt/cliproxies/CLIProxyAPI/config.yaml "$BACKUP_DIR/config_$DATE.yaml"

# Keep last 7 days
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.yaml" -mtime +7 -delete
```

Add to crontab:

```bash
crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/cliproxies/backup.sh
```

---

## Reverse Proxy Configuration

### Nginx Configuration

Install Nginx:

```bash
sudo apt install -y nginx
```

Create configuration file `/etc/nginx/sites-available/cliproxies`:

```nginx
upstream cliproxies_backend {
    server 127.0.0.1:8317 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.example.com;

    # SSL configuration (see SSL section)
    ssl_certificate /etc/ssl/certs/cliproxies.crt;
    ssl_certificate_key /etc/ssl/private/cliproxies.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logging
    access_log /var/log/nginx/cliproxies_access.log;
    error_log /var/log/nginx/cliproxies_error.log;

    # Maximum upload size
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://cliproxies_backend;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Disable buffering for streaming
        proxy_buffering off;
        proxy_cache off;
    }

    # Health check endpoint (no auth required)
    location /health {
        proxy_pass http://cliproxies_backend/health;
        access_log off;
    }

    # Ready check endpoint
    location /ready {
        proxy_pass http://cliproxies_backend/ready;
        access_log off;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/cliproxies /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Traefik Configuration (Alternative)

Create `traefik.yml`:

```yaml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"
    http:
      tls:
        certResolver: letsencrypt

certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    exposedByDefault: false
  file:
    filename: /etc/traefik/dynamic.yml
```

Create dynamic configuration `/etc/traefik/dynamic.yml`:

```yaml
http:
  routers:
    cliproxies:
      rule: "Host(`api.example.com`)"
      service: cliproxies
      tls:
        certResolver: letsencrypt
  services:
    cliproxies:
      loadBalancer:
        servers:
          - url: "http://host.docker.internal:8317"
```

---

## SSL/TLS Setup

### Using Certbot (Let's Encrypt)

1. **Install Certbot:**

```bash
sudo apt install -y certbot python3-certbot-nginx
```

2. **Obtain certificate:**

```bash
sudo certbot --nginx -d api.example.com
```

3. **Auto-renewal:**

Certbot automatically sets up a cron job for renewal. Verify:

```bash
sudo certbot renew --dry-run
```

### Manual Certificate Generation

For self-signed certificates (development only):

```bash
# Create directory
sudo mkdir -p /etc/ssl/private

# Generate private key
sudo openssl genrsa -out /etc/ssl/private/cliproxies.key 2048

# Generate certificate
sudo openssl req -new -key /etc/ssl/private/cliproxies.key \
  -out /etc/ssl/certs/cliproxies.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=api.example.com"

# Sign certificate
sudo openssl x509 -req -days 365 -in /etc/ssl/certs/cliproxies.csr \
  -signkey /etc/ssl/private/cliproxies.key \
  -out /etc/ssl/certs/cliproxies.crt

# Set permissions
sudo chmod 600 /etc/ssl/private/cliproxies.key
sudo chmod 644 /etc/ssl/certs/cliproxies.crt
```

### TLS Configuration in CLIProxies

Configure TLS in `config.yaml`:

```yaml
tls:
  enable: true
  cert: "/path/to/certificate.crt"
  key: "/path/to/private.key"
```

Or use environment variables:

```bash
TLS_ENABLE=true
TLS_CERT=/path/to/certificate.crt
TLS_KEY=/path/to/private.key
```

---

## Environment Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Management API
MANAGEMENT_PASSWORD=your-secure-management-password

# Database (PostgreSQL Store)
PGSTORE_DSN=postgresql://cliproxies:password@localhost:5432/cliproxies
PGSTORE_SCHEMA=public
PGSTORE_LOCAL_PATH=/var/lib/cliproxy

# Git Store (optional)
GITSTORE_GIT_URL=https://github.com/your-org/cli-proxy-config.git
GITSTORE_GIT_USERNAME=git-user
GITSTORE_GIT_TOKEN=ghp_your_token_here
GITSTORE_LOCAL_PATH=/data/cliproxy/gitstore

# Object Store (optional)
OBJECTSTORE_ENDPOINT=s3.your-cloud.example.com
OBJECTSTORE_BUCKET=cli-proxy-config
OBJECTSTORE_ACCESS_KEY=your_access_key
OBJECTSTORE_SECRET_KEY=your_secret_key
OBJECTSTORE_LOCAL_PATH=/data/cliproxy/objectstore

# Deployment mode
DEPLOY=docker
```

### Docker Compose Environment

Create `docker-compose.prod.yml`:

```yaml
services:
  cliproxies-api:
    image: ${CLI_PROXY_IMAGE:-cli-proxy-api:latest}
    container_name: cliproxies-api
    ports:
      - "8005:8317"
    volumes:
      - ./config.yaml:/CLIProxyAPI/config.yaml:ro
      - ./auths:/root/.cli-proxy-api
      - ./logs:/CLIProxyAPI/logs
    environment:
      - DEPLOY=docker
      - MANAGEMENT_PASSWORD=${MANAGEMENT_PASSWORD}
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8317/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - cliproxies-network

networks:
  cliproxies-network:
    driver: bridge
```

---

## Production Deployment

### Production Dockerfile

```dockerfile
# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy source
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build arguments
ARG VERSION=dev
ARG COMMIT=none
ARG BUILD_DATE=unknown

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build \
  -ldflags="-s -w \
  -X 'main.Version=${VERSION}' \
  -X 'main.Commit=${COMMIT}' \
  -X 'main.BuildDate=${BUILD_DATE}'" \
  -o ./CLIProxyAPI ./cmd/server/

# Final stage
FROM alpine:3.19

RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    wget

WORKDIR /CLIProxyAPI

# Copy binary
COPY --from=builder /app/CLIProxyAPI /CLIProxyAPI/CLIProxyAPI

# Copy configuration template
COPY config.example.yaml /CLIProxyAPI/

# Create directories
RUN mkdir -p /CLIProxyAPI/logs /CLIProxyAPI/auths

# Expose port
EXPOSE 8317

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --spider -q http://localhost:8317/health || exit 1

# Run as non-root
RUN addgroup -g 1000 cliproxies && \
    adduser -D -u 1000 -G cliproxies cliproxies && \
    chown -R cliproxies:cliproxies /CLIProxyAPI

USER cliproxies

CMD ["./CLIProxyAPI"]
```

### Build and Deploy

```bash
# Build image
docker build -t cliproxies-api:latest .

# Or with build args
docker build \
  --build-arg VERSION=1.0.0 \
  --build-arg COMMIT=$(git rev-parse --short HEAD) \
  --build-arg BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%S) \
  -t cliproxies-api:latest .

# Run container
docker run -d \
  --name cliproxies-api \
  --restart unless-stopped \
  -p 8317:8317 \
  -v $(pwd)/config.yaml:/CLIProxyAPI/config.yaml \
  -v $(pwd)/auths:/CLIProxyAPI/auths \
  -v $(pwd)/logs:/CLIProxyAPI/logs \
  cliproxies-api:latest
```

### Systemd Service

Create `/etc/systemd/system/cliproxies.service`:

```ini
[Unit]
Description=CLIProxies API Server
After=network.target

[Service]
Type=simple
User=cliproxies
Group=cliproxies
WorkingDirectory=/opt/cliproxies/CLIProxyAPI
Environment="DEPLOY=docker"
ExecStart=/opt/cliproxies/CLIProxyAPI/CLIProxyAPI
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cliproxies
sudo systemctl start cliproxies
sudo systemctl status cliproxies
```

---

## Frontend Deployment

### Cloudflare Workers Deployment

The cliproxies-web frontend is designed for Cloudflare Workers deployment.

1. **Install dependencies:**

```bash
cd cliproxies-web
pnpm install
```

2. **Build the application:**

```bash
pnpm build
```

3. **Configure Wrangler:**

Copy `wrangler.toml.example` to `wrangler.toml`:

```toml
name = "cliproxies-web"
main = ".open-next/worker.js"
compatibility_date = "2024-01-01"

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[[routes]]
pattern = "cliproxies.com/*"
zone_name = "cliproxies.com"

[vars]
NEXT_PUBLIC_SITE_URL = "https://cliproxies.com"
```

4. **Deploy:**

```bash
pnpm wrangler deploy
```

### Environment Variables

Create `.env.production`:

```bash
# Public
NEXT_PUBLIC_SITE_URL=https://cliproxies.com

# Private
PROXYGRID_SECRET=your-secret-key
GITHUB_TOKEN=ghp_your_token
```

---

## First-Run Verification

### Health Check

```bash
curl http://localhost:8317/health
```

Expected response:

```json
{ "status": "healthy" }
```

### Readiness Check

```bash
curl http://localhost:8317/ready
```

### API Test

```bash
curl -H "Authorization: Bearer your-api-key" \
  http://localhost:8317/v1/models
```

### Management API Test

```bash
curl -H "Authorization: Bearer your-management-key" \
  http://localhost:8317/v0/management/config
```

### Check Logs

```bash
# Docker logs
docker-compose logs -f cliproxies-api

# Or if running directly
tail -f logs/main.log
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 8317
sudo lsof -i :8317

# Kill the process
sudo kill -9 <PID>
```

### Permission Denied

```bash
# Check file permissions
ls -la config.yaml auths/

# Fix permissions
chmod 600 config.yaml
chmod 700 auths/
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U cliproxies -d cliproxies

# Check connection string
echo $PGSTORE_DSN
```

### High Memory Usage

```bash
# Check container stats
docker stats cliproxies-api

# Limit memory in docker-compose
services:
  cliproxies-api:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Slow Response Times

1. Check database connection pool settings
2. Verify network latency to upstream providers
3. Enable commercial mode to reduce overhead:

```yaml
commercial-mode: true
```

### Logs Not Rotating

Check log rotation configuration:

```bash
# Check current log size
du -sh logs/

# Manually rotate
rm logs/main.log.*
```

Configure automatic rotation in `config.yaml`:

```yaml
logging-to-file: true
logs-max-total-size-mb: 100
```

---

## Additional Resources

- [Configuration Reference](./CONFIGURATION.md)
- [API Documentation](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Main Repository](https://github.com/router-for-me/CLIProxyAPI)
