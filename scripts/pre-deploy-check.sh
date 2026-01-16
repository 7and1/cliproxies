#!/usr/bin/env bash
#
# pre-deploy-check.sh - Pre-Deployment Health and Readiness Checks
#
# This script runs before deployment to ensure system is ready

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

error() {
    echo -e "${RED}[ERROR]${NC} $*"
    ERRORS=$((ERRORS + 1))
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
    WARNINGS=$((WARNINGS + 1))
}

success() {
    echo -e "${GREEN}[OK]${NC} $*"
}

info() {
    echo "[INFO] $*"
}

echo "=========================================="
echo "Pre-Deployment Readiness Check"
echo "=========================================="
echo ""

# Check required files
info "Checking required files..."
[ -f "${PROJECT_ROOT}/CLIProxyAPI/Dockerfile" ] && success "Dockerfile exists" || error "Dockerfile not found"
[ -f "${PROJECT_ROOT}/CLIProxyAPI/config.yaml" ] && success "config.yaml exists" || warn "config.yaml not found (will be created)"
[ -f "${PROJECT_ROOT}/CLIProxyAPI/docker-compose.prod.yml" ] && success "Production compose file exists" || error "Production compose file not found"
echo ""

# Check disk space
info "Checking disk space..."
AVAILABLE_GB=$(df -BG "${PROJECT_ROOT}" | tail -1 | awk '{print $4}' | tr -d 'G')
if [ "${AVAILABLE_GB}" -lt 2 ]; then
    error "Insufficient disk space: ${AVAILABLE_GB}G available (min: 2G)"
else
    success "Disk space OK: ${AVAILABLE_GB}G available"
fi
echo ""

# Check Docker
info "Checking Docker..."
if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        DOCKER_VERSION=$(docker --version | awk '{print $3}' | tr -d ',')
        success "Docker is running: ${DOCKER_VERSION}"
    else
        error "Docker daemon is not running"
    fi
else
    error "Docker is not installed"
fi
echo ""

# Check docker-compose
info "Checking docker-compose..."
if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $4}' | tr -d ',')
    success "docker-compose available: ${COMPOSE_VERSION}"
elif docker compose version >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version --short)
    success "docker compose available: ${COMPOSE_VERSION}"
else
    error "docker-compose not found"
fi
echo ""

# Check current deployment health
info "Checking current deployment health..."
if curl -sf http://localhost:8317/health >/dev/null 2>&1; then
    success "Current deployment (blue) is healthy"
elif curl -sf http://localhost:8318/health >/dev/null 2>&1; then
    success "Current deployment (green) is healthy"
else
    warn "No running deployment found (first deployment?)"
fi
echo ""

# Check environment variables
info "Checking environment variables..."
if [ -f "${PROJECT_ROOT}/.env" ]; then
    success ".env file exists"
    source "${PROJECT_ROOT}/.env" 2>/dev/null || true

    # Check critical variables
    [ -n "${DEPLOY_ENV:-}" ] && success "DEPLOY_ENV set" || warn "DEPLOY_ENV not set"
else
    warn ".env file not found"
fi
echo ""

# Check network ports
info "Checking required ports..."
PORTS=(8317 8085 1455 54545 51121 11451)
for PORT in "${PORTS[@]}"; do
    if lsof -i ":${PORT}" >/dev/null 2>&1 || netstat -an 2>/dev/null | grep ":${PORT} " | grep -q LISTEN; then
        warn "Port ${PORT} is in use"
    else
        success "Port ${PORT} is available"
    fi
done
echo ""

# Check backup directory
info "Checking backup directory..."
BACKUP_DIR="${PROJECT_ROOT}/backups"
if [ -d "${BACKUP_DIR}" ]; then
    BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "*.sql.gz" 2>/dev/null | wc -l)
    success "Backup directory exists (${BACKUP_COUNT} backups)"
else
    warn "Backup directory not found (will create during deployment)"
fi
echo ""

# Check git status (if in git repo)
info "Checking git status..."
if git -C "${PROJECT_ROOT}" rev-parse --git-dir >/dev/null 2>&1; then
    if [ -n "$(git -C "${PROJECT_ROOT}" status --porcelain)" ]; then
        warn "Uncommitted changes detected"
        git -C "${PROJECT_ROOT}" status --short
    else
        success "Working directory is clean"
    fi

    CURRENT_BRANCH=$(git -C "${PROJECT_ROOT}" branch --show-current)
    LATEST_TAG=$(git -C "${PROJECT_ROOT}" describe --tags --abbrev=0 2>/dev/null || echo "none")
    info "Branch: ${CURRENT_BRANCH}, Latest tag: ${LATEST_TAG}"
fi
echo ""

# Summary
echo "=========================================="
echo "Check Summary"
echo "=========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    success "All checks passed! Ready for deployment."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    success "Checks passed with ${WARNINGS} warning(s). Deployment can proceed."
    exit 0
else
    error "${ERRORS} error(s), ${WARNINGS} warning(s) found. Please fix before deploying."
    exit 1
fi
