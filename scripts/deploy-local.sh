#!/bin/bash
# Local pre-deployment validation script

set -e

echo "=== CLIProxies Pre-Deployment Validation ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Checks
check_count=0
pass_count=0

check() {
    local name=$1
    local command=$2
    check_count=$((check_count + 1))

    echo -n "[$check_count] Checking $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        pass_count=$((pass_count + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        return 1
    fi
}

warn() {
    local name=$1
    check_count=$((check_count + 1))
    echo -n "[$check_count] Checking $name... "
    echo -e "${YELLOW}WARN${NC}"
}

# File existence checks
check "Dockerfile exists" "[ -f CLIProxyAPI/Dockerfile ]"
check "Production compose file" "[ -f CLIProxyAPI/docker-compose.prod.yml ]"
check "Deploy script exists" "[ -f CLIProxyAPI/deploy/deploy.sh ]"
check "Deploy config template" "[ -f CLIProxyAPI/deploy/config.env.example ]"
check "Frontend wrangler config" "[ -f cliproxies-web/wrangler.jsonc ]"
check "GitHub Actions workflow" "[ -f .github/workflows/deploy.yml ]"
check ".gitignore configured" "[ -f .gitignore ]"

# Security checks
warn "Sensitive files not committed" "grep -q 'config.yaml' .gitignore"

echo ""
echo "=== Summary: $pass_count/$check_count checks passed ==="

if [ $pass_count -eq $check_count ]; then
    echo -e "${GREEN}All checks passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${YELLOW}Some checks failed. Please review.${NC}"
    exit 1
fi
