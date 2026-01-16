#!/bin/bash
#
# Environment Variable Validation Script
# Validates that all required environment variables are set before deployment

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Required environment variables by environment
REQUIRED_VARS_COMMON=(
    "DEPLOY_ENV"
)

REQUIRED_VARS_PRODUCTION=(
    "MANAGEMENT_SECRET_KEY"
    "API_KEY_1"
    "CLOUDFLARE_API_TOKEN"
    "CLOUDFLARE_ACCOUNT_ID"
    "NEXT_PUBLIC_SITE_URL"
)

REQUIRED_VARS_STAGING=(
    "STAGING_MANAGEMENT_KEY"
)

OPTIONAL_VARS=(
    "PROXY_URL"
    "GEMINI_API_KEY"
    "CLAUDE_API_KEY"
    "CODEX_API_KEY"
    "AMP_API_KEY"
    "PGSTORE_DSN"
    "SLACK_WEBHOOK_URL"
)

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

check_var() {
    local var_name="$1"
    local is_required="$2"

    if [ -z "${!var_name:-}" ]; then
        if [ "${is_required}" = "required" ]; then
            log_error "Missing required variable: ${var_name}"
            return 1
        else
            log_warning "Optional variable not set: ${var_name}"
            return 0
        fi
    else
        log_success "${var_name} is set"
        return 0
    fi
}

validate_management_key() {
    local key="${1:-}"

    if [ -z "${key}" ]; then
        log_error "Management key is empty"
        return 1
    fi

    if [ ${#key} -lt 16 ]; then
        log_error "Management key is too short (minimum 16 characters)"
        return 1
    fi

    log_success "Management key length is adequate"
    return 0
}

validate_database_url() {
    local dsn="${1:-}"

    if [ -n "${dsn}" ]; then
        if [[ ! "${dsn}" =~ ^postgres:// ]]; then
            log_error "Invalid PostgreSQL DSN format"
            return 1
        fi
        log_success "Database DSN format is valid"
    fi
    return 0
}

main() {
    local deploy_env="${DEPLOY_ENV:-production}"
    local missing_required=0

    echo "=========================================="
    echo "Environment Variable Validation"
    echo "Environment: ${deploy_env}"
    echo "=========================================="
    echo ""

    # Check common variables
    echo "Checking common variables..."
    for var in "${REQUIRED_VARS_COMMON[@]}"; do
        check_var "${var}" "required" || missing_required=$((missing_required + 1))
    done
    echo ""

    # Check environment-specific variables
    if [ "${deploy_env}" = "production" ]; then
        echo "Checking production variables..."
        for var in "${REQUIRED_VARS_PRODUCTION[@]}"; do
            check_var "${var}" "required" || missing_required=$((missing_required + 1))
        done
    elif [ "${deploy_env}" = "staging" ]; then
        echo "Checking staging variables..."
        for var in "${REQUIRED_VARS_STAGING[@]}"; do
            check_var "${var}" "required" || missing_required=$((missing_required + 1))
        done
    fi
    echo ""

    # Check optional variables
    echo "Checking optional variables (warnings only)..."
    for var in "${OPTIONAL_VARS[@]}"; do
        check_var "${var}" "optional" || true
    done
    echo ""

    # Validate specific formats
    echo "Validating variable formats..."

    if [ "${deploy_env}" = "production" ]; then
        validate_management_key "${MANAGEMENT_SECRET_KEY:-}" || missing_required=$((missing_required + 1))
    else
        validate_management_key "${STAGING_MANAGEMENT_KEY:-}" || missing_required=$((missing_required + 1))
    fi

    validate_database_url "${PGSTORE_DSN:-}"
    echo ""

    # Summary
    echo "=========================================="
    if [ $missing_required -eq 0 ]; then
        log_success "All required environment variables are set!"
        return 0
    else
        log_error "${missing_required} required variable(s) are missing"
        return 1
    fi
}

# Run validation
main "$@"
