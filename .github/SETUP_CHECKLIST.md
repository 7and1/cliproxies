# GitHub Repository Setup Checklist

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `cliproxies`
3. Description: `CLIProxy API + Web Dashboard - Open source proxy for AI CLI tools`
4. Public repository
5. Don't initialize with README (we already have files)

## Step 2: Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/cliproxies.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 3: Configure GitHub Secrets

Go to: https://github.com/YOUR_USERNAME/cliproxies/settings/secrets/actions

### Required Secrets

| Secret Name             | Value                                      |
| ----------------------- | ------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`  | `zXwKNqnaEQruZ_1qYRDFltQYiDDZipNiTaDm7ttD` |
| `CLOUDFLARE_ACCOUNT_ID` | `873cd683fb162639ab3732a3a995b64b`         |
| `VPS_HOST`              | `107.174.42.198`                           |
| `VPS_USER`              | `root`                                     |
| `VPS_SSH_KEY`           | _(see below)_                              |

### VPS_SSH_KEY Generation

```bash
# On your local machine, generate SSH key if not exists
ssh-keygen -t ed25519 -f ~/.ssh/cliproxies_deploy -C "cliproxies-deploy"

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/cliproxies_deploy.pub root@107.174.42.198

# Copy private key content for GitHub Secret
cat ~/.ssh/cliproxies_deploy
```

Paste the entire private key content (including `-----BEGIN` and `-----END` lines) into `VPS_SSH_KEY` secret.

### Optional Variables

| Variable Name          | Value                    |
| ---------------------- | ------------------------ |
| `NEXT_PUBLIC_SITE_URL` | `https://cliproxies.com` |

## Step 4: Initial VPS Setup

```bash
# SSH to VPS
ssh root@107.174.42.198

# Create directory
mkdir -p /opt/docker-projects/standalone-apps/cliproxies

# Create config.yaml
cd /opt/docker-projects/standalone-apps/cliproxies
cat > config.yaml << 'EOF'
host: ""
port: 8317
cors:
  allowed-origins:
    - "http://localhost:*"
    - "http://127.0.0.1:*"
    - "https://cliproxies.com"
remote-management:
  allow-remote: false
  secret-key: ""  # Set a strong password here
auth-dir: "/root/.cli-proxy-api"
api-keys: []
debug: false
EOF

# Set permissions
chmod 600 config.yaml
mkdir -p auths logs
```

## Step 5: Cloudflare Pages Setup (One-time)

1. Go to Cloudflare Dashboard > Pages
2. Create new project > Connect to Git
3. Select `cliproxies` repository
4. Build settings:
   - Build command: `cd cliproxies-web && pnpm install && pnpm build`
   - Build output directory: `cliproxies-web/.open-next`
   - Root directory: `/`

Or use wrangler directly (already configured in `cliproxies-web/wrangler.jsonc`).

## Step 6: Deploy

Push to `main` branch and GitHub Actions will automatically deploy.

```bash
# Make a small change to trigger deployment
echo "# Test" >> README.md
git add README.md
git commit -m "Test deployment"
git push
```

## Verification

### Check GitHub Actions

- Go to https://github.com/YOUR_USERNAME/cliproxies/actions
- Verify workflow runs successfully

### Check Frontend

- Visit https://cliproxies.com (or your Cloudflare Pages URL)

### Check Backend

```bash
ssh root@107.174.42.198
docker ps | grep cliproxies
docker logs cliproxies-api -f
```

## Troubleshooting

### GitHub Actions Fails

1. Check Actions logs for specific error
2. Verify all secrets are set correctly
3. For SSH errors, verify `VPS_SSH_KEY` format

### Backend Not Starting

```bash
ssh root@107.174.42.198
cd /opt/docker-projects/standalone-apps/cliproxies
docker-compose -f docker-compose.prod.yml logs
```

### Frontend Build Issues

- Check Cloudflare Pages build logs
- Verify `pnpm-lock.yaml` is committed
- Check Node.js version compatibility
