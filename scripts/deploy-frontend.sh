#!/usr/bin/env bash
#
# deploy-frontend.sh - Frontend Deployment Script for Cloudflare Pages
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"
WEB_DIR="${PROJECT_ROOT}/cliproxies-web"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
log_info() { echo "[INFO] $*"; }

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v pnpm >/dev/null 2>&1; then
    log_error "pnpm is not installed"
    exit 1
fi

if ! command -v wrangler >/dev/null 2>&1; then
    log_error "wrangler is not installed"
    exit 1
fi

cd "${WEB_DIR}"

# Install dependencies
log_info "Installing dependencies..."
pnpm install --frozen-lockfile

# Build
log_info "Building frontend..."
pnpm build

# Deploy to Cloudflare Pages
log_info "Deploying to Cloudflare Pages..."
if wrangler pages deploy .open-next --project-name=cliproxies-web; then
    log_success "Frontend deployed successfully!"
else
    log_error "Frontend deployment failed"
    exit 1
fi
