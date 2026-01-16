#!/usr/bin/env bash
#
# rollback.sh - Rollback Script for Failed Deployments
#
# Usage: ./rollback.sh [deployment_id]
# If no deployment_id is provided, rolls back to the previous deployment

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"
LOG_DIR="${PROJECT_ROOT}/logs/deployments"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $*"; }

find_latest_deployment() {
    find "${LOG_DIR}" -name "deployment-*.log" -type f | sort -r | head -1
}

find_rollback_script() {
    local deployment_id="$1"

    if [ -z "${deployment_id}" ]; then
        local latest_log
        latest_log="$(find_latest_deployment)"
        if [ -z "${latest_log}" ]; then
            log_error "No deployment logs found"
            exit 1
        fi
        deployment_id="$(basename "${latest_log}" | sed 's/deployment-\(.*\)\.log/\1/')"
    fi

    local rollback_script="${LOG_DIR}/rollback-${deployment_id}.sh"

    if [ ! -f "${rollback_script}" ]; then
        log_error "Rollback script not found: ${rollback_script}"
        exit 1
    fi

    echo "${rollback_script}"
}

main() {
    local deployment_id="${1:-}"
    local rollback_script

    log_warning "Initiating rollback..."
    if [ -n "${deployment_id}" ]; then
        echo "Rolling back to deployment: ${deployment_id}"
    else
        echo "Rolling back to previous deployment..."
    fi

    rollback_script="$(find_rollback_script "${deployment_id}")"
    log_success "Found rollback script: ${rollback_script}"

    # Confirm rollback
    read -p "Are you sure you want to rollback? This cannot be undone. [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Rollback cancelled"
        exit 0
    fi

    # Execute rollback
    bash "${rollback_script}"

    # Additional cleanup
    cd "${PROJECT_ROOT}/CLIProxyAPI"

    # Restore using docker-compose
    if [ -f "docker-compose.prod.yml" ]; then
        docker-compose -f docker-compose.prod.yml up -d --force-recreate
    elif [ -f "docker-compose.yml" ]; then
        docker-compose up -d --force-recreate
    fi

    # Health check
    sleep 5
    if curl -sf http://localhost:8317/health >/dev/null 2>&1; then
        log_success "Rollback completed successfully! Service is healthy."
    else
        log_warning "Rollback completed, but service health check failed. Manual intervention may be required."
    fi
}

main "$@"
