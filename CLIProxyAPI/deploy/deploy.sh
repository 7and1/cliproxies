#!/bin/bash
set -e

# Load config
source "$(dirname "$0")/config.env"

echo "=== CLIProxyAPI Deploy Script ==="
echo ""

# Phase 1: Pre-flight
echo "=== Phase 1: Pre-flight Checks ==="
echo "Checking port availability..."
ssh $SERVER "ss -tlnp | grep -E ':${API_PORT}' && exit 1 || echo 'Port ${API_PORT} available'"
echo "Port OK"
echo ""

# Phase 2: Sync files
echo "=== Phase 2: Syncing Files ==="
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'config.yaml' \
  --exclude 'logs' \
  --exclude 'auths' \
  --exclude 'deploy' \
  ../ ${SERVER}:${REMOTE_PATH}/

echo "Files synced"
echo ""

# Phase 3: Setup environment
echo "=== Phase 3: Setup Environment ==="
ssh $SERVER "cd ${REMOTE_PATH} && mkdir -p logs auths"
echo "Environment ready"
echo ""

# Phase 4: Deploy
echo "=== Phase 4: Deploying ==="
ssh $SERVER "cd ${REMOTE_PATH} && docker-compose -f docker-compose.prod.yml pull"
ssh $SERVER "cd ${REMOTE_PATH} && docker-compose -f docker-compose.prod.yml up -d --build"
echo ""

# Phase 5: Verify
echo "=== Phase 5: Verification ==="
sleep 3
ssh $SERVER "docker ps | grep cliproxies-api"
echo ""
ssh $SERVER "curl -sf http://127.0.0.1:${API_PORT}/health || echo 'Health check failed'"
echo ""
echo "=== Deploy Complete ==="
