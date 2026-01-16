# CLIProxies Configuration Reference

**Version:** 1.0.0
**Last Updated:** 2025-01-16

---

## Table of Contents

1. [Configuration File Overview](#configuration-file-overview)
2. [YAML Configuration Options](#yaml-configuration-options)
3. [Environment Variables](#environment-variables)
4. [Default Values](#default-values)
5. [Example Configurations](#example-configurations)

---

## Configuration File Overview

CLIProxies uses a YAML configuration file (`config.yaml`) for most settings. The configuration file location can be specified via:

- Command line flag: `-config /path/to/config.yaml`
- Default location: `./config.yaml` (current working directory)
- Environment variable: `CONFIG_PATH`

### Configuration Loading Order

1. Explicit `-config` flag
2. `CONFIG_PATH` environment variable
3. `config.yaml` in current directory
4. `config.yaml` in home directory (`~/.cli-proxy-api/`)

---

## YAML Configuration Options

### Server Settings

```yaml
# Server host/interface to bind to
# Empty string ("") binds all interfaces (IPv4 + IPv6)
# Use "127.0.0.1" or "localhost" to restrict to local only
host: ""

# Server port (default: 8317)
port: 8317

# TLS/HTTPS configuration
tls:
  enable: false # Enable TLS
  cert: "" # Path to certificate file
  key: "" # Path to private key file
```

### CORS Configuration

```yaml
cors:
  # Allowed origins for API requests
  # Supports wildcard patterns: "http://localhost:*"
  allowed-origins:
    - "http://localhost:*"
    - "http://127.0.0.1:*"
    - "https://your-domain.com"
```

### Management API

```yaml
remote-management:
  # Allow remote (non-localhost) management access
  # When false, only localhost can access management endpoints
  allow-remote: false

  # Management API secret key
  # Leave empty to disable management API entirely
  # Hash on startup; plaintext will be converted to hash
  secret-key: ""

  # Disable bundled management control panel
  disable-control-panel: false

  # GitHub repository for management panel updates
  panel-github-repository: "https://github.com/router-for-me/Cli-Proxy-API-Management-Center"
```

### Authentication

```yaml
# Authentication directory (supports ~ for home directory)
auth-dir: "~/.cli-proxy-api"

# API keys for client authentication
api-keys:
  - "your-api-key-1"
  - "your-api-key-2"
  - "your-api-key-3"
```

### Logging

```yaml
# Enable debug logging
debug: false

# Enable request/response logging
request-log: false

# Write logs to rotating files instead of stdout
logging-to-file: false

# Maximum total size of log files in MB
# When exceeded, oldest files are deleted
# Set to 0 to disable
logs-max-total-size-mb: 0
```

### Performance

```yaml
# Disable high-overhead HTTP middleware for high concurrency
commercial-mode: false

# Disable in-memory usage statistics
usage-statistics-enabled: false
```

### Proxy Settings

```yaml
# Upstream proxy URL for all outgoing requests
# Supports: socks5://, http://, https://
# Example: socks5://user:pass@192.168.1.1:1080/
proxy-url: ""
```

### Routing

```yaml
# When true, unprefixed model requests only use credentials
# without a prefix (except when prefix == model name)
force-model-prefix: false

# Load balancing strategy for credential selection
routing:
  strategy: "round-robin" # Options: round-robin, fill-first
```

### Retry Configuration

```yaml
# Number of retries for failed requests
# Retries on: 403, 408, 500, 502, 503, 504
request-retry: 3

# Maximum wait time (seconds) before retry
max-retry-interval: 30
```

### Quota Handling

```yaml
quota-exceeded:
  # Automatically switch to another project/account
  switch-project: true

  # Switch to preview model on quota exceeded
  switch-preview-model: true
```

### WebSocket

```yaml
# Enable authentication for WebSocket API (/v1/ws)
ws-auth: false
```

### Database Configuration

```yaml
database:
  # Maximum connections in pool
  max-conns: 20

  # Minimum idle connections
  min-conns: 5

  # Maximum connection lifetime
  max-conn-lifetime: "1h"

  # Maximum idle time before closing connection
  max-conn-idle-time: "30m"

  # Health check interval
  health-check: "1m"
```

### Rate Limiting

```yaml
rate-limit:
  # Enable rate limiting (per API key/IP)
  enabled: false

  # Requests allowed per minute
  requests-per-minute: 60

  # Maximum burst size
  burst: 10
```

### Proxy Grid Integration

```yaml
proxygrid:
  # Enable Proxy Grid API integration
  enabled: false

  # Base URL for Proxy Grid API
  base-url: "https://your-proxygrid-endpoint.example.com"

  # Secret key for Proxy Grid authentication
  secret: ""

  # Request timeout in seconds
  timeout: 30

  # Rate limiting for Proxy Grid requests
  rate-limit:
    requests-per-minute: 100
    burst: 20
```

### Streaming Configuration

```yaml
# Optional: Streaming behavior configuration
# streaming:
#   keepalive-seconds: 15    # SSE keep-alive interval (0 = disabled)
#   bootstrap-retries: 1     # Retries before first byte sent
```

### Gemini API Keys

```yaml
gemini-api-key:
  # API key entry
  - api-key: "AIzaSy...01"

    # Optional: Require prefix in model name
    # Example: "test/gemini-2.5-flash"
    prefix: "test"

    # Custom base URL
    base-url: "https://generativelanguage.googleapis.com"

    # Custom headers
    headers:
      X-Custom-Header: "custom-value"

    # Per-key proxy override
    proxy-url: "socks5://proxy.example.com:1080"

    # Model aliases
    models:
      - name: "gemini-2.5-flash" # Upstream model name
        alias: "gemini-flash" # Client alias

    # Excluded models (wildcard supported)
    excluded-models:
      - "gemini-2.5-pro" # Exact match
      - "gemini-2.5-*" # Prefix wildcard
      - "*-preview" # Suffix wildcard
      - "*flash*" # Substring wildcard
```

### Codex API Keys

```yaml
codex-api-key:
  - api-key: "sk-atSM..."
    prefix: "test"
    base-url: "https://www.example.com"
    headers:
      X-Custom-Header: "custom-value"
    proxy-url: "socks5://proxy.example.com:1080"
    models:
      - name: "gpt-5-codex"
        alias: "codex-latest"
    excluded-models:
      - "gpt-5.1"
      - "gpt-5-*"
      - "*-mini"
      - "*codex*"
```

### Claude API Keys

```yaml
claude-api-key:
  # Official Claude API key
  - api-key: "sk-atSM..."

  # With custom prefix
  - api-key: "sk-atSM..."
    prefix: "test"
    base-url: "https://www.example.com"
    headers:
      X-Custom-Header: "custom-value"
    proxy-url: "socks5://proxy.example.com:1080"
    models:
      - name: "claude-3-5-sonnet-20241022"
        alias: "claude-sonnet-latest"
    excluded-models:
      - "claude-opus-4-5-20251101"
      - "claude-3-*"
      - "*-thinking"
      - "*haiku*"
```

### OpenAI Compatibility Providers

```yaml
openai-compatibility:
  - name: "openrouter" # Provider identifier
    prefix: "test" # Optional prefix
    base-url: "https://openrouter.ai/api/v1"
    headers:
      X-Custom-Header: "custom-value"
    api-key-entries:
      # API key with proxy override
      - api-key: "sk-or-v1-...b780"
        proxy-url: "socks5://proxy.example.com:1080"

      # API key without proxy
      - api-key: "sk-or-v1-...b781"

    # Model mappings
    models:
      - name: "moonshotai/kimi-k2:free"
        alias: "kimi-k2"
```

### Vertex API Keys

```yaml
vertex-api-key:
  - api-key: "vk-123..." # x-goog-api-key header
    prefix: "test"
    base-url: "https://example.com/api"
    proxy-url: "socks5://proxy.example.com:1080"
    headers:
      X-Custom-Header: "custom-value"
    models:
      - name: "gemini-2.5-flash"
        alias: "vertex-flash"
      - name: "gemini-2.5-pro"
        alias: "vertex-pro"
```

### Amp Integration

```yaml
ampcode:
  # Amp CLI upstream URL
  upstream-url: "https://ampcode.com"

  # Optional: Override API key for Amp upstream
  upstream-api-key: ""

  # Per-client upstream API key mapping
  upstream-api-keys:
    - upstream-api-key: "amp_key_for_team_a"
      api-keys:
        - "your-api-key-1"
        - "your-api-key-2"

    - upstream-api-key: "amp_key_for_team_b"
      api-keys:
        - "your-api-key-3"

  # Restrict Amp management routes to localhost
  restrict-management-to-localhost: false

  # Force model mappings before checking local keys
  force-model-mappings: false

  # Model mappings for unavailable models
  model-mappings:
    - from: "claude-opus-4-5-20251101"
      to: "gemini-claude-opus-4-5-thinking"
    - from: "claude-sonnet-4-5-20250929"
      to: "gemini-claude-sonnet-4-5-thinking"
    - from: "claude-haiku-4-5-20251001"
      to: "gemini-2.5-flash"
```

### OAuth Model Mappings

```yaml
# Global OAuth model name mappings (per channel)
# Supported channels: gemini-cli, vertex, aistudio, antigravity,
# claude, codex, qwen, iflow
oauth-model-mappings:
  gemini-cli:
    - name: "gemini-2.5-pro"
      alias: "g2.5p"
      fork: true # Keep original + add alias

  vertex:
    - name: "gemini-2.5-pro"
      alias: "g2.5p"

  aistudio:
    - name: "gemini-2.5-pro"
      alias: "g2.5p"

  antigravity:
    - name: "gemini-3-pro-preview"
      alias: "g3p"

  claude:
    - name: "claude-sonnet-4-5-20250929"
      alias: "cs4.5"

  codex:
    - name: "gpt-5"
      alias: "g5"

  qwen:
    - name: "qwen3-coder-plus"
      alias: "qwen-plus"

  iflow:
    - name: "glm-4.7"
      alias: "glm-god"
```

### OAuth Excluded Models

```yaml
oauth-excluded-models:
  gemini-cli:
    - "gemini-2.5-pro" # Exact match
    - "gemini-2.5-*" # Prefix wildcard
    - "*-preview" # Suffix wildcard
    - "*flash*" # Substring wildcard

  vertex:
    - "gemini-3-pro-preview"

  aistudio:
    - "gemini-3-pro-preview"

  antigravity:
    - "gemini-3-pro-preview"

  claude:
    - "claude-3-5-haiku-20241022"

  codex:
    - "gpt-5-codex-mini"

  qwen:
    - "vision-model"

  iflow:
    - "tstars2.0"
```

### Payload Configuration

```yaml
payload:
  # Default rules: only set parameters when missing
  default:
    - models:
        - name: "gemini-2.5-pro" # Supports wildcards
          protocol: "gemini" # openai, gemini, claude, codex
      params: # JSON path -> value
        "generationConfig.thinkingConfig.thinkingBudget": 32768

  # Override rules: always set parameters
  override:
    - models:
        - name: "gpt-*"
          protocol: "codex"
      params:
        "reasoning.effort": "high"
```

---

## Environment Variables

### Management API

| Variable              | Description               | Default |
| --------------------- | ------------------------- | ------- |
| `MANAGEMENT_PASSWORD` | Management API secret key | (none)  |

### PostgreSQL Store

| Variable             | Description                  | Default  |
| -------------------- | ---------------------------- | -------- |
| `PGSTORE_DSN`        | PostgreSQL connection string | (none)   |
| `PGSTORE_SCHEMA`     | Database schema name         | `public` |
| `PGSTORE_LOCAL_PATH` | Local cache directory        | (auto)   |

### Git Store

| Variable                | Description              | Default |
| ----------------------- | ------------------------ | ------- |
| `GITSTORE_GIT_URL`      | Git repository URL       | (none)  |
| `GITSTORE_GIT_USERNAME` | Git username             | (none)  |
| `GITSTORE_GIT_TOKEN`    | Git access token         | (none)  |
| `GITSTORE_LOCAL_PATH`   | Local checkout directory | (auto)  |

### Object Store

| Variable                 | Description            | Default |
| ------------------------ | ---------------------- | ------- |
| `OBJECTSTORE_ENDPOINT`   | S3-compatible endpoint | (none)  |
| `OBJECTSTORE_BUCKET`     | Bucket name            | (none)  |
| `OBJECTSTORE_ACCESS_KEY` | Access key             | (none)  |
| `OBJECTSTORE_SECRET_KEY` | Secret key             | (none)  |
| `OBJECTSTORE_LOCAL_PATH` | Local cache directory  | (auto)  |

### Deployment

| Variable | Description                         | Default |
| -------- | ----------------------------------- | ------- |
| `DEPLOY` | Deployment mode (`docker`, `cloud`) | (none)  |

### Frontend (cliproxies-web)

| Variable                        | Description                  | Default                  |
| ------------------------------- | ---------------------------- | ------------------------ |
| `NEXT_PUBLIC_SITE_URL`          | Public site URL              | `https://cliproxies.com` |
| `NEXT_PUBLIC_BACKEND_URL`       | Backend API URL              | (none)                   |
| `NEXT_PUBLIC_PROXYGRID_API_URL` | ProxyGrid API URL            | (none)                   |
| `PROXYGRID_SECRET`              | ProxyGrid authentication     | (none)                   |
| `GITHUB_TOKEN`                  | GitHub personal access token | (none)                   |
| `NEXT_PUBLIC_CSP_REPORT_URI`    | CSP report endpoint          | (none)                   |

---

## Default Values

| Configuration                         | Default Value         |
| ------------------------------------- | --------------------- |
| `host`                                | `""` (all interfaces) |
| `port`                                | `8317`                |
| `tls.enable`                          | `false`               |
| `debug`                               | `false`               |
| `request-log`                         | `false`               |
| `logging-to-file`                     | `false`               |
| `logs-max-total-size-mb`              | `0` (disabled)        |
| `usage-statistics-enabled`            | `false`               |
| `commercial-mode`                     | `false`               |
| `force-model-prefix`                  | `false`               |
| `request-retry`                       | `3`                   |
| `max-retry-interval`                  | `30`                  |
| `quota-exceeded.switch-project`       | `true`                |
| `quota-exceeded.switch-preview-model` | `true`                |
| `routing.strategy`                    | `round-robin`         |
| `ws-auth`                             | `false`               |
| `database.max-conns`                  | `20`                  |
| `database.min-conns`                  | `5`                   |
| `database.max-conn-lifetime`          | `1h`                  |
| `database.max-conn-idle-time`         | `30m`                 |
| `database.health-check`               | `1m`                  |
| `rate-limit.enabled`                  | `false`               |
| `rate-limit.requests-per-minute`      | `60`                  |
| `rate-limit.burst`                    | `10`                  |
| `proxygrid.enabled`                   | `false`               |
| `proxygrid.timeout`                   | `30`                  |

---

## Example Configurations

### Minimal Development Setup

```yaml
# Minimal config for local development
host: "127.0.0.1"
port: 8317
debug: true

api-keys:
  - "dev-key-123"

auth-dir: "~/.cli-proxy-api"
```

### Production Setup with OAuth

```yaml
# Production configuration
host: ""
port: 8317
debug: false

# Management API (remote access disabled)
remote-management:
  allow-remote: false
  secret-key: ""

# CORS for production domain
cors:
  allowed-origins:
    - "https://api.example.com"
    - "https://app.example.com"

# Client API keys
api-keys:
  - "prod-key-abc123"
  - "prod-key-def456"

auth-dir: "/var/lib/cliproxy/auth"

# Logging
logging-to-file: true
logs-max-total-size-mb: 100

# Performance
commercial-mode: true

# Routing strategy
routing:
  strategy: "round-robin"

# Rate limiting
rate-limit:
  enabled: true
  requests-per-minute: 60
  burst: 10
```

### High-Availability Setup with PostgreSQL

```yaml
host: ""
port: 8317
debug: false

# Management with remote access
remote-management:
  allow-remote: true
  secret-key: "${MANAGEMENT_PASSWORD}"

api-keys:
  - "key-1"
  - "key-2"

auth-dir: "/var/lib/cliproxy/auth"

# Database connection pooling
database:
  max-conns: 50
  min-conns: 10
  max-conn-lifetime: "2h"
  max-conn-idle-time: "15m"
  health-check: "30s"

# Usage statistics enabled
usage-statistics-enabled: true

# Request logging for debugging
request-log: true
logging-to-file: true
logs-max-total-size-mb: 500

# Rate limiting
rate-limit:
  enabled: true
  requests-per-minute: 120
  burst: 20

# Provider configuration
claude-api-key:
  - api-key: "${CLAUDE_API_KEY_1}"
  - api-key: "${CLAUDE_API_KEY_2}"

gemini-api-key:
  - api-key: "${GEMINI_API_KEY_1}"
  - api-key: "${GEMINI_API_KEY_2}"
```

### OpenRouter Integration

```yaml
host: ""
port: 8317

api-keys:
  - "your-api-key"

openai-compatibility:
  - name: "openrouter"
    base-url: "https://openrouter.ai/api/v1"
    api-key-entries:
      - api-key: "sk-or-v1-your-key"
    models:
      - name: "anthropic/claude-3.5-sonnet"
        alias: "claude-sonnet"
      - name: "google/gemini-pro-1.5"
        alias: "gemini-pro"
      - name: "openai/gpt-4-turbo"
        alias: "gpt-4-turbo"
```

### Amp CLI Integration

```yaml
host: ""
port: 8317

api-keys:
  - "app-client-key-1"
  - "app-client-key-2"

ampcode:
  upstream-url: "https://ampcode.com"
  upstream-api-key: "${AMP_API_KEY}"

  # Per-client key mapping
  upstream-api-keys:
    - upstream-api-key: "${AMP_TEAM_A_KEY}"
      api-keys:
        - "app-client-key-1"

    - upstream-api-key: "${AMP_TEAM_B_KEY}"
      api-keys:
        - "app-client-key-2"

  # Model mappings for unavailable models
  model-mappings:
    - from: "claude-opus-4-5-20251101"
      to: "claude-sonnet-4-5-20250929"
    - from: "claude-haiku-4-5-20251001"
      to: "gemini-2.5-flash"
```

### Proxy Grid Integration

```yaml
host: ""
port: 8317

api-keys:
  - "your-api-key"

proxygrid:
  enabled: true
  base-url: "https://your-proxygrid.example.com"
  secret: "${PROXYGRID_SECRET}"
  timeout: 60

  rate-limit:
    requests-per-minute: 50
    burst: 10
```

### Custom Provider with Proxy

```yaml
host: ""
port: 8317

# Global proxy for all requests
proxy-url: "socks5://proxy.example.com:1080"

api-keys:
  - "your-api-key"

# Per-key proxy override
claude-api-key:
  - api-key: "${CLAUDE_KEY_1}"
    proxy-url: "socks5://proxy1.example.com:1080"

  - api-key: "${CLAUDE_KEY_2}"
    proxy-url: "socks5://proxy2.example.com:1080"
```

---

## Configuration Validation

CLIProxies validates configuration on startup. Common validation errors:

### Invalid YAML

```
Error: failed to load config: yaml: line 15: mapping values are not allowed in this context
```

**Solution:** Check YAML syntax using a linter or online validator.

### Missing Required Fields

```
Error: validation error: api-keys is required
```

**Solution:** Add at least one API key or configure OAuth.

### Invalid Port

```
Error: invalid port: 83170 (out of range)
```

**Solution:** Use port between 1-65535.

### Invalid Certificate Path

```
Error: failed to start HTTPS server: certificate file not found
```

**Solution:** Verify `tls.cert` and `tls.key` paths exist.

---

## Additional Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
