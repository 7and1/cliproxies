#!/usr/bin/env bash
#
# switch-color.sh - Blue-Green Traffic Switch Script
#
# Usage: ./switch-color.sh [blue|green]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"
NGINX_UPSTREAM="${PROJECT_ROOT}/nginx/upstream.conf"
NGINX_DOCKER="/etc/nginx/conf.d/upstream.conf"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
log_info() { echo "[INFO] $*";

# Port mapping
BLUE_PORT=8317
GREEN_PORT=8318

# Validate target color
TARGET_COLOR="${1:-}"

if [ -z "${TARGET_COLOR}" ]; then
    log_error "Please specify target color: blue or green"
    exit 1
fi

if [[ "${TARGET_COLOR}" != "blue" && "${TARGET_COLOR}" != "green" ]]; then
    log_error "Invalid color. Use 'blue' or 'green'"
    exit 1
fi

# Determine target port
if [ "${TARGET_COLOR}" = "blue" ]; then
    TARGET_PORT=${BLUE_PORT}
    CURRENT_COLOR="green"
    CURRENT_PORT=${GREEN_PORT}
else
    TARGET_PORT=${GREEN_PORT}
    CURRENT_COLOR="blue"
    CURRENT_PORT=${BLUE_PORT}
fi

log_info "Switching traffic from ${CURRENT_COLOR} (${CURRENT_PORT}) to ${TARGET_COLOR} (${TARGET_PORT})..."

# Health check on target
log_info "Running health check on target (${TARGET_COLOR})..."
if ! curl -sf "http://localhost:${TARGET_PORT}/health" >/dev/null 2>&1; then
    log_error "Target container (${TARGET_COLOR}) is not healthy!"
    exit 1
fi
log_success "Target container is healthy"

# Update local nginx config
if [ -f "${NGINX_UPSTREAM}" ]; then
    cat > "${NGINX_UPSTREAM}" <<EOF
upstream cliproxies_backend {
    server 127.0.0.1:${TARGET_PORT} max_fails=3 fail_timeout=30s;
    keepalive 32;
}
EOF
    log_success "Local nginx config updated"
fi

# Update docker nginx config
if docker ps --format '{{.Names}}' | grep -q 'cliproxies-nginx'; then
    docker exec cliproxies-nginx sh -c "cat > ${NGINX_DOCKER}" <<EOF
upstream cliproxies_backend {
    server 127.0.0.1:${TARGET_PORT} max_fails=3 fail_timeout=30s;
    keepalive 32;
}
EOF

    # Test and reload nginx
    if docker exec cliproxies-nginx nginx -t; then
        docker exec cliproxies-nginx nginx -s reload
        log_success "Docker nginx reloaded"
    else
        log_error "Nginx config test failed"
        exit 1
    fi
elif command -v nginx >/dev/null 2>&1; then
    # System nginx
    if sudo nginx -t; then
        sudo systemctl reload nginx
        log_success "System nginx reloaded"
    else
        log_error "Nginx config test failed"
        exit 1
    fi
else
    log_warning "No nginx found, skipping reload"
fi

# Verify switch
sleep 3
log_info "Verifying traffic switch..."
if curl -sf "http://localhost:${TARGET_PORT}/health" >/dev/null 2>&1; then
    log_success "Traffic successfully switched to ${TARGET_COLOR}!"

    # Optional: Stop old container after successful switch
    read -p "Stop old container (${CURRENT_COLOR})? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker stop "cli-proxy-api-${CURRENT_COLOR}" 2>/dev/null || true
        log_success "Old container stopped"
    fi

    exit 0
else
    log_error "Traffic switch verification failed!"
    exit 1
fi
