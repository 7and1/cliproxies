#!/usr/bin/env bash
#
# backup-database.sh - Database Backup Script
#
# Usage: ./backup-database.sh [output_directory]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"
BACKUP_DIR="${1:-${PROJECT_ROOT}/backups/database}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
log_info() { echo "[INFO] $*"; }

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Generate backup filename with timestamp
BACKUP_TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/cliproxies_backup_${BACKUP_TIMESTAMP}.sql.gz"

log_info "Starting database backup..."

# Check if PostgreSQL DSN is configured
if [ -z "${PGSTORE_DSN:-}" ]; then
    log_warning "PGSTORE_DSN not set. Skipping database backup."
    exit 0
fi

# Parse DSN (format: postgres://user:pass@host:port/dbname)
DB_HOST="$(echo "${PGSTORE_DSN}" | sed -n 's/.*@\([^:]*\):.*/\1/p')"
DB_PORT="$(echo "${PGSTORE_DSN}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')"
DB_NAME="$(echo "${PGSTORE_DSN}" | sed -n 's/.*\/\([^?]*\).*/\1/p')"
DB_USER="$(echo "${PGSTORE_DSN}" | sed -n 's/\/\/\([^:]*\):.*/\1/p')"
DB_PASS="$(echo "${PGSTORE_DSN}" | sed -n 's/://; s/.*:\([^@]*\)@.*/\1/p')"

log_info "Connecting to database: ${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Run backup using docker
if docker run --rm \
    -e PGPASSWORD="${DB_PASS}" \
    postgres:16-alpine \
    pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-acl \
    2>/dev/null | gzip > "${BACKUP_FILE}"; then

    BACKUP_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
    log_success "Database backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

    # Update latest backup symlink
    ln -sf "${BACKUP_FILE}" "${BACKUP_DIR}/latest_backup.sql.gz"

    # Cleanup old backups (keep last 7)
    log_info "Cleaning up old backups..."
    ls -t "${BACKUP_DIR}"/cliproxies_backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm -f

    log_success "Backup completed successfully"
else
    log_error "Database backup failed"
    exit 1
fi
