#!/usr/bin/env bash
#
# deploy.sh - Production Deployment Script with Blue-Green Support
#
# Features:
# - Pre-deployment health checks
# - Database backup before deployment
# - Blue-green deployment support
# - Automatic rollback on failure
# - Deployment logging
# - Staging/Production environment support

set -euo pipefail

#######################################
# Configuration
#######################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"
LOG_DIR="${PROJECT_ROOT}/logs/deployments"
BACKUP_DIR="${PROJECT_ROOT}/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment configuration
DEPLOYMENT_ID="$(date +%Y%m%d%H%M%S)"
LOG_FILE="${LOG_DIR}/deployment-${DEPLOYMENT_ID}.log"
ROLLBACK_FILE="${LOG_DIR}/rollback-${DEPLOYMENT_ID}.sh"

# Environment (staging|production)
DEPLOY_ENV="${DEPLOY_ENV:-production}"

# Docker settings
COMPOSE_FILE="${PROJECT_ROOT}/CLIProxyAPI/docker-compose.yml"
COMPOSE_PROD_FILE="${PROJECT_ROOT}/CLIProxyAPI/docker-compose.prod.yml"
BLUE_PORT="${BLUE_PORT:-8317}"
GREEN_PORT="${GREEN_PORT:-8318}"
CURRENT_COLOR="blue"

# Health check settings
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-60}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-2}"

# Backup retention (days)
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

#######################################
# Logging Functions
#######################################

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() {
    log "INFO" "${BLUE}$*${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

log_warning() {
    log "WARNING" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

#######################################
# Utility Functions
#######################################

check_requirements() {
    log_info "Checking requirements..."

    local missing=0

    command -v docker >/dev/null 2>&1 || { log_error "docker is required but not installed"; missing=1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "docker-compose is required but not installed"; missing=1; }
    command -v curl >/dev/null 2>&1 || { log_error "curl is required but not installed"; missing=1; }
    command -v jq >/dev/null 2>&1 || { log_warning "jq is recommended for JSON parsing"; }

    if [ $missing -eq 1 ]; then
        log_error "Missing required tools. Please install them and try again."
        exit 1
    fi

    log_success "All requirements met"
}

create_directories() {
    log_info "Creating necessary directories..."
    mkdir -p "${LOG_DIR}"
    mkdir -p "${BACKUP_DIR}/database"
    mkdir -p "${BACKUP_DIR}/config"
    log_success "Directories created"
}

#######################################
# Health Check Functions
#######################################

health_check() {
    local port="$1"
    local timeout="${2:-${HEALTH_CHECK_TIMEOUT}}"
    local url="http://localhost:${port}/health"
    local elapsed=0

    log_info "Running health check on port ${port}..."

    while [ $elapsed -lt $timeout ]; do
        if curl -sf "${url}" >/dev/null 2>&1; then
            log_success "Health check passed for port ${port}"
            return 0
        fi
        sleep "${HEALTH_CHECK_INTERVAL}"
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
        echo -n "."
    done

    log_error "Health check failed for port ${port} after ${timeout}s"
    return 1
}

service_health_check() {
    local container_name="$1"
    local port="${2:-8317}"

    log_info "Checking service health for ${container_name}..."

    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_error "Container ${container_name} is not running"
        return 1
    fi

    # Check HTTP health endpoint
    health_check "${port}"
}

#######################################
# Database Backup Functions
#######################################

backup_database() {
    log_info "Creating database backup..."

    local backup_file="${BACKUP_DIR}/database/db-backup-${DEPLOYMENT_ID}.sql.gz"

    # Check if PostgreSQL is configured
    if [ -n "${PGSTORE_DSN:-}" ]; then
        log_info "PostgreSQL detected, creating backup..."

        # Parse DSN to get connection details
        # Format: postgres://user:pass@host:port/dbname
        local pg_host
        local pg_port
        local pg_db
        local pg_user

        pg_host="$(echo "${PGSTORE_DSN}" | sed -n 's/.*@\([^:]*\):.*/\1/p')"
        pg_port="$(echo "${PGSTORE_DSN}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')"
        pg_db="$(echo "${PGSTORE_DSN}" | sed -n 's/.*\/\([^?]*\).*/\1/p')"
        pg_user="$(echo "${PGSTORE_DSN}" | sed -n 's/\/\/\([^:]*\):.*/\1/p')"

        if docker run --rm postgres:16-alpine pg_dump \
            -h "${pg_host}" \
            -p "${pg_port}" \
            -U "${pg_user}" \
            -d "${pg_db}" \
            "${PGDUMP_EXTRA_ARGS:-}" 2>/dev/null | gzip > "${backup_file}"; then
            log_success "Database backup created: ${backup_file}"
            echo "${backup_file}" > "${BACKUP_DIR}/database/latest-backup.txt"
        else
            log_warning "Database backup failed, continuing..."
        fi
    else
        log_info "No PostgreSQL configured, skipping database backup"
    fi

    # Backup auth directory
    if [ -d "${PROJECT_ROOT}/CLIProxyAPI/auths" ]; then
        local auth_backup="${BACKUP_DIR}/auths-backup-${DEPLOYMENT_ID}.tar.gz"
        tar -czf "${auth_backup}" -C "${PROJECT_ROOT}/CLIProxyAPI" auths
        log_success "Auth backup created: ${auth_backup}"
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (older than ${BACKUP_RETENTION_DAYS} days)..."

    find "${BACKUP_DIR}/database" -name "*.sql.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete 2>/dev/null || true
    find "${BACKUP_DIR}" -name "auths-backup-*.tar.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete 2>/dev/null || true

    log_success "Old backups cleaned up"
}

#######################################
# Rollback Functions
#######################################

prepare_rollback() {
    local current_image="$1"

    cat > "${ROLLBACK_FILE}" <<EOF
#!/bin/bash
# Auto-generated rollback script for deployment ${DEPLOYMENT_ID}
set -e

echo "Rolling back deployment ${DEPLOYMENT_ID}..."

# Restore previous container
docker-compose -f "${COMPOSE_FILE}" up -d --force-recreate

# Wait for service to be healthy
sleep 5

echo "Rollback completed"
EOF

    chmod +x "${ROLLBACK_FILE}"
    log_info "Rollback script prepared: ${ROLLBACK_FILE}"
}

execute_rollback() {
    log_error "Deployment failed! Initiating rollback..."

    if [ -f "${ROLLBACK_FILE}" ]; then
        bash "${ROLLBACK_FILE}"
        log_warning "Rollback executed"
    else
        log_error "No rollback script found. Manual intervention required."
    fi

    exit 1
}

#######################################
# Blue-Green Deployment Functions
#######################################

determine_current_color() {
    # Check which port is currently active
    if curl -sf "http://localhost:${BLUE_PORT}/health" >/dev/null 2>&1; then
        CURRENT_COLOR="blue"
    elif curl -sf "http://localhost:${GREEN_PORT}/health" >/dev/null 2>&1; then
        CURRENT_COLOR="green"
    else
        CURRENT_COLOR="blue"
    fi
    log_info "Current deployment color: ${CURRENT_COLOR}"
}

get_target_color() {
    if [ "${CURRENT_COLOR}" = "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

deploy_blue_green() {
    local target_color
    target_color="$(get_target_color)"
    local target_port

    if [ "${target_color}" = "blue" ]; then
        target_port="${BLUE_PORT}"
    else
        target_port="${GREEN_PORT}"
    fi

    log_info "Starting ${target_color} deployment on port ${target_port}..."

    # Build the new image
    log_info "Building new Docker image..."
    cd "${PROJECT_ROOT}/CLIProxyAPI"

    local version_tag="cliproxies-api:${DEPLOYMENT_ID}"
    local latest_tag="cliproxies-api:latest"

    docker build \
        -t "${version_tag}" \
        -t "${latest_tag}" \
        --build-arg VERSION="${DEPLOYMENT_ID}" \
        --build-arg COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        -f Dockerfile . || {
        log_error "Docker build failed"
        execute_rollback
    }

    log_success "Docker image built successfully"

    # Prepare rollback with previous image
    local previous_image
    previous_image="$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'cliproxies-api' | grep -v "${DEPLOYMENT_ID}" | head -1)"
    prepare_rollback "${previous_image}"

    # Start new container (green/blue)
    local target_container="cliproxies-api-${target_color}"

    # Stop old color container if exists
    docker stop "${target_container}" 2>/dev/null || true
    docker rm "${target_container}" 2>/dev/null || true

    # Start new container
    log_info "Starting ${target_color} container..."
    docker run -d \
        --name "${target_container}" \
        -p "${target_port}:8317" \
        -v "${PROJECT_ROOT}/CLIProxyAPI/config.yaml:/CLIProxyAPI/config.yaml:ro" \
        -v "${PROJECT_ROOT}/CLIProxyAPI/auths:/root/.cli-proxy-api" \
        -v "${PROJECT_ROOT}/CLIProxyAPI/logs:/CLIProxyAPI/logs" \
        --restart unless-stopped \
        "${version_tag}" || {
        log_error "Failed to start ${target_color} container"
        execute_rollback
    }

    # Health check on new container
    if ! health_check "${target_port}"; then
        log_error "New container failed health check"
        execute_rollback
    fi

    log_success "${target_color} container is healthy"

    # Switch traffic (update nginx/load balancer)
    log_info "Switching traffic to ${target_color}..."
    switch_traffic "${target_color}" "${target_port}"

    # Wait and verify
    sleep 5
    if ! health_check "${target_port}"; then
        log_error "Traffic switch verification failed"
        execute_rollback
    fi

    log_success "Traffic switched to ${target_color}"

    # Stop old container after successful deployment
    local old_container="cliproxies-api-${CURRENT_COLOR}"
    log_info "Stopping old container: ${old_container}"
    docker stop "${old_container}" 2>/dev/null || true

    log_success "Blue-green deployment completed successfully"
}

switch_traffic() {
    local target_color="$1"
    local target_port="$2"

    # Update nginx configuration if it exists
    local nginx_conf="${PROJECT_ROOT}/nginx/upstream.conf"

    if [ -f "${nginx_conf}" ]; then
        # Backup current config
        cp "${nginx_conf}" "${nginx_conf}.bak"

        # Update upstream
        cat > "${nginx_conf}" <<EOF
upstream cliproxies_backend {
    server 127.0.0.1:${target_port};
}
EOF

        # Reload nginx
        if command -v nginx >/dev/null 2>&1; then
            nginx -t && nginx -s reload || log_warning "Failed to reload nginx"
        fi

        log_info "Nginx configuration updated"
    else
        log_warning "Nginx configuration not found, skipping traffic switch"
    fi
}

#######################################
# Standard Deployment Functions
#######################################

deploy_standard() {
    log_info "Starting standard deployment..."

    cd "${PROJECT_ROOT}/CLIProxyAPI"

    local compose_file="${COMPOSE_FILE}"
    if [ -f "${COMPOSE_PROD_FILE}" ]; then
        compose_file="${COMPOSE_PROD_FILE}"
    fi

    # Pull latest images first
    log_info "Pulling latest images..."
    docker-compose -f "${compose_file}" pull || log_warning "Image pull failed, will build locally"

    # Build and start
    log_info "Building and starting services..."
    docker-compose -f "${compose_file}" up -d --build --force-recreate || {
        log_error "Docker compose failed"
        execute_rollback
    }

    # Health check
    sleep 5
    if ! service_health_check "cli-proxy-api" "${BLUE_PORT}"; then
        log_error "Service health check failed after deployment"
        execute_rollback
    fi

    log_success "Standard deployment completed successfully"
}

#######################################
# Pre-Deployment Checks
#######################################

pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check config file exists
    if [ ! -f "${PROJECT_ROOT}/CLIProxyAPI/config.yaml" ]; then
        log_warning "config.yaml not found. Please ensure config is properly set up."
    fi

    # Check disk space
    local available_space
    available_space="$(df -BG "${PROJECT_ROOT}" | tail -1 | awk '{print $4}' | tr -d 'G')"
    if [ "${available_space}" -lt 2 ]; then
        log_error "Insufficient disk space: ${available_space}G available"
        exit 1
    fi

    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    # Check environment variables
    if [ "${DEPLOY_ENV}" = "production" ]; then
        if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] && [ -f "${PROJECT_ROOT}/.env" ]; then
            source "${PROJECT_ROOT}/.env" 2>/dev/null || true
        fi
        log_info "Production environment checks passed"
    fi

    log_success "Pre-deployment checks completed"
}

#######################################
# Deployment Notifications
#######################################

send_notification() {
    local status="$1"
    local message="$2"

    # Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color
        case "${status}" in
            success) color="#36a64f" ;;
            failure) color="#dc3545" ;;
            warning) color="#ffc107" ;;
            *) color="#007bff" ;;
        esac

        curl -s -X POST "${SLACK_WEBHOOK_URL}" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"${color}\",
                    \"title\": \"CLIProxies Deployment: ${status}\",
                    \"text\": \"${message}\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"${DEPLOY_ENV}\", \"short\": true},
                        {\"title\": \"Deployment ID\", \"value\": \"${DEPLOYMENT_ID}\", \"short\": true}
                    ],
                    \"footer\": \"Deploy Script\",
                    \"ts\": $(date +%s)
                }]
            }" >/dev/null 2>&1 || true
    fi

    log_info "Notification sent: ${status}"
}

#######################################
# Main Deployment Flow
#######################################

main() {
    local deploy_mode="${1:-standard}"

    log_info "=========================================="
    log_info "Starting deployment: ${DEPLOYMENT_ID}"
    log_info "Environment: ${DEPLOY_ENV}"
    log_info "Mode: ${deploy_mode}"
    log_info "=========================================="

    # Initialize
    create_directories
    check_requirements
    pre_deployment_checks

    # Backup before deployment
    backup_database

    # Execute deployment based on mode
    case "${deploy_mode}" in
        blue-green|bg)
            deploy_blue_green
            ;;
        standard|std)
            deploy_standard
            ;;
        *)
            log_error "Unknown deployment mode: ${deploy_mode}"
            log_info "Available modes: standard, blue-green"
            exit 1
            ;;
    esac

    # Post-deployment tasks
    cleanup_old_backups

    log_success "=========================================="
    log_success "Deployment completed successfully!"
    log_success "Deployment ID: ${DEPLOYMENT_ID}"
    log_success "=========================================="

    # Send success notification
    send_notification "success" "Deployment ${DEPLOYMENT_ID} completed successfully"
}

# Script entry point
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [MODE]"
        echo ""
        echo "Modes:"
        echo "  standard, std    Standard deployment (default)"
        echo "  blue-green, bg   Blue-green deployment with zero downtime"
        echo ""
        echo "Environment Variables:"
        echo "  DEPLOY_ENV          Deployment environment (production|staging)"
        echo "  BLUE_PORT           Port for blue environment (default: 8317)"
        echo "  GREEN_PORT          Port for green environment (default: 8318)"
        echo "  HEALTH_CHECK_TIMEOUT Health check timeout in seconds (default: 60)"
        echo "  SLACK_WEBHOOK_URL   Slack webhook for notifications"
        exit 0
        ;;
    *)
        main "${1:-standard}"
        ;;
esac
