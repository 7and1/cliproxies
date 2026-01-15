# CLIProxyAPI Documentation

Complete guide to installing, configuring, and using CLIProxyAPI.

---

## Table of Contents

1. [What is CLIProxyAPI?](#what-is-cliproxyapi)
2. [Quick Start](#quick-start)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Authentication](#authentication)
6. [Usage](#usage)
7. [API Reference](#api-reference)
8. [Management API](#management-api)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Topics](#advanced-topics)

---

## What is CLIProxyAPI?

CLIProxyAPI is a unified API gateway that provides OpenAI-compatible interfaces for multiple AI providers. Route requests to OpenAI, Claude, Gemini, Qwen, and more through a single endpoint.

### Key Features

- **Unified Interface**: One OpenAI-compatible API for all providers
- **OAuth Support**: Use existing ChatGPT, Claude, or Gemini accounts
- **Load Balancing**: Distribute requests across multiple credentials
- **Self-Hosted**: Run on your own infrastructure
- **Open Source**: Apache 2.0 licensed

### Use Cases

- Use ChatGPT Plus subscription with Claude Code or Cursor
- Combine multiple AI providers in a single application
- Implement intelligent failover between providers
- Simplify AI API integration across services

---

## Quick Start

### Prerequisites

- Go 1.24+ (for installing from source)
- Docker (optional, for containerized deployment)
- API keys or OAuth credentials for your chosen providers

### 30-Second Setup

```bash
# 1. Install CLIProxyAPI
go install github.com/router-for-me/CLIProxyAPI/v6/cmd/cli-proxy-api@latest

# 2. Generate a config (or use the generator on this site)
# See Configuration section below

# 3. Run the proxy
cli-proxy-api --config config.yaml
```

Your proxy is now running at `http://localhost:8317`

### Test Your Setup

```bash
curl http://localhost:8317/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Installation

### macOS

**Homebrew (recommended):**

```bash
brew tap cli-proxy-api/tap
brew install cli-proxy-api
```

**Go install:**

```bash
go install github.com/router-for-me/CLIProxyAPI/v6/cmd/cli-proxy-api@latest
```

**Docker:**

```bash
docker pull ghcr.io/router-for-me/CLIProxyAPI:latest
docker run -p 8317:8317 -v $(pwd)/config.yaml:/app/config.yaml ghcr.io/router-for-me/CLIProxyAPI:latest
```

### Linux

**Go install:**

```bash
go install github.com/router-for-me/CLIProxyAPI/v6/cmd/cli-proxy-api@latest
```

**Docker:**

```bash
docker pull ghcr.io/router-for-me/CLIProxyAPI:latest
docker run -p 8317:8317 -v $(pwd)/config.yaml:/app/config.yaml ghcr.io/router-for-me/CLIProxyAPI:latest
```

**Systemd service:**

```bash
# Create service file
sudo nano /etc/systemd/system/cli-proxy-api.service
```

```ini
[Unit]
Description=CLIProxyAPI Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/cli-proxy-api
ExecStart=/usr/local/bin/cli-proxy-api --config /path/to/config.yaml
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable cli-proxy-api
sudo systemctl start cli-proxy-api
```

### Windows

**Go install:**

```powershell
go install github.com/router-for-me/CLIProxyAPI/v6/cmd/cli-proxy-api@latest
```

**Docker:**

```powershell
docker pull ghcr.io/router-for-me/CLIProxyAPI:latest
docker run -p 8317:8317 -v ${PWD}/config.yaml:/app/config.yaml ghcr.io/router-for-me/CLIProxyAPI:latest
```

**Windows Service (using NSSM):**

```powershell
nssm install CLIProxyAPI "C:\path\to\cli-proxy-api.exe" --config "C:\path\to\config.yaml"
nssm start CLIProxyAPI
```

### From Source

```bash
git clone https://github.com/router-for-me/CLIProxyAPI.git
cd CLIProxyAPI
go build -o cli-proxy-api ./cmd/cli-proxy-api
./cli-proxy-api --config config.yaml
```

---

## Configuration

### Minimal Configuration

Create a `config.yaml` file:

```yaml
port: 8317

auth:
  api-keys:
    - "sk-your-api-key-here"

openai:
  api-key: "${OPENAI_API_KEY}"
```

### Full Configuration Example

```yaml
# Server configuration
port: 8317
host: "0.0.0.0"

# Authentication
auth:
  dir: "~/.cli-proxy-api/auths"
  api-keys:
    - "sk-primary-key"
    - "sk-secondary-key"

# Provider configurations
openai:
  api-key: "${OPENAI_API_KEY}"
  base-url: "https://api.openai.com/v1"

anthropic:
  api-key: "${ANTHROPIC_API_KEY}"
  base-url: "https://api.anthropic.com"

gemini:
  api-key: "${GEMINI_API_KEY}"

qwen:
  api-key: "${QWEN_API_KEY}"

iflow:
  base-url: "https://api.iflow.com"

# Model routing
routes:
  - pattern: "^gpt-"
    provider: "openai"
  - pattern: "^claude-"
    provider: "anthropic"
  - pattern: "^gemini-"
    provider: "gemini"

# Load balancing
load-balance:
  strategy: "round-robin" # or "fill-first", "least-connections"
  credentials:
    openai:
      - key: "${OPENAI_KEY_1}"
        quota: 1000000
      - key: "${OPENAI_KEY_2}"
        quota: 500000

# Logging
logging:
  level: "info"
  file: "logs/cli-proxy-api.log"
  request-log: "logs/requests.log"

# Management API (optional)
remote-management:
  allow-remote: false
  secret-key: "${MANAGEMENT_PASSWORD}"
```

### Configuration Options Reference

| Option                  | Type    | Default                  | Description                          |
| ----------------------- | ------- | ------------------------ | ------------------------------------ |
| `port`                  | integer | 8317                     | Port to listen on                    |
| `host`                  | string  | "localhost"              | Host to bind to                      |
| `auth.dir`              | string  | "~/.cli-proxy-api/auths" | OAuth tokens directory               |
| `auth.api-keys`         | array   | []                       | Accepted API keys                    |
| `logging.level`         | string  | "info"                   | Log level (debug, info, warn, error) |
| `logging.file`          | string  | ""                       | Log file path                        |
| `load-balance.strategy` | string  | "round-robin"            | Load balancing strategy              |

---

## Authentication

### API Key Authentication

Set API keys in your config or use the `Authorization` header:

```bash
curl http://localhost:8317/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'
```

### OAuth Authentication

CLIProxyAPI supports OAuth for several providers, allowing you to use existing subscriptions without API keys.

#### Supported OAuth Providers

- **ChatGPT Plus**: Use your Plus subscription with OpenAI API
- **Claude**: Use your Claude account
- **Gemini**: Use your Google account

#### Setting Up OAuth

1. Run the CLI with OAuth enabled:

```bash
cli-proxy-api --config config.yaml --enable-oauth
```

2. Visit the OAuth URL in your browser to authenticate

3. Tokens are stored locally in `~/.cli-proxy-api/auths/`

#### OAuth Directory Structure

```
~/.cli-proxy-api/auths/
├── openai_token.json
├── anthropic_token.json
└── gemini_token.json
```

### API Key Management

Generate secure API keys:

```bash
# Generate a random API key
openssl rand -hex 32

# Or use the built-in generator
cli-proxy-api generate-key
```

---

## Usage

### With Claude Code

Configure Claude Code to use CLIProxyAPI:

```bash
# Set environment variable
export ANTHROPIC_API_KEY="your-api-key"
export ANTHROPIC_BASE_URL="http://localhost:8317"
```

Or in `.env` file:

```
ANTHROPIC_API_KEY=your-api-key
ANTHROPIC_BASE_URL=http://localhost:8317
```

### With Cursor

1. Open Cursor Settings
2. Navigate to API Providers
3. Set Custom Base URL to `http://localhost:8317`
4. Enter your CLIProxyAPI API key

### With Cline

```bash
# In Cline settings, set:
API Base URL: http://localhost:8317
API Key: your-api-key
```

### cURL Examples

**List models:**

```bash
curl http://localhost:8317/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Chat completion:**

```bash
curl http://localhost:8317/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Streaming:**

```bash
curl http://localhost:8317/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-opus",
    "messages": [{"role": "user", "content": "Count to 10"}],
    "stream": true
  }'
```

**Multi-provider routing:**

```bash
# Routes to OpenAI (gpt- prefix)
curl http://localhost:8317/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[...]}'

# Routes to Anthropic (claude- prefix)
curl http://localhost:8317/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-3-opus","messages":[...]}'

# Routes to Gemini (gemini- prefix)
curl http://localhost:8317/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-pro","messages":[...]}'
```

---

## API Reference

### Endpoints

#### POST /v1/chat/completions

Create a chat completion.

**Request:**

```json
{
  "model": "gpt-4",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

**Response:**

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
```

#### GET /v1/models

List available models.

**Response:**

```json
{
  "object": "list",
  "data": [
    { "id": "gpt-4", "object": "model", "owned_by": "openai" },
    { "id": "gpt-3.5-turbo", "object": "model", "owned_by": "openai" },
    { "id": "claude-3-opus", "object": "model", "owned_by": "anthropic" },
    { "id": "gemini-pro", "object": "model", "owned_by": "google" }
  ]
}
```

#### POST /v1/completions

Create a completion (legacy endpoint).

#### POST /v1/messages

Anthropic-style messages endpoint.

### Model Routing

Use model prefixes to route requests to specific providers:

| Prefix    | Provider  | Example Models                 |
| --------- | --------- | ------------------------------ |
| `gpt-`    | OpenAI    | gpt-4, gpt-3.5-turbo           |
| `claude-` | Anthropic | claude-3-opus, claude-3-sonnet |
| `gemini-` | Google    | gemini-pro, gemini-ultra       |
| `qwen-`   | Alibaba   | qwen-turbo, qwen-plus          |
| `vertex-` | Vertex AI | vertex-claude, vertex-gemini   |

---

## Management API

The Management API provides runtime control over CLIProxyAPI.

### Enabling Management API

```yaml
remote-management:
  allow-remote: true
  secret-key: "${MANAGEMENT_PASSWORD}"
```

### Endpoints

#### GET /v0/management/config

Get current configuration.

```bash
curl http://localhost:8317/v0/management/config \
  -H "X-Management-Key: YOUR_MANAGEMENT_KEY"
```

#### PUT /v0/management/config

Update configuration at runtime.

```bash
curl -X PUT http://localhost:8317/v0/management/config \
  -H "X-Management-Key: YOUR_MANAGEMENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"logging": {"level": "debug"}}'
```

#### GET /v0/management/usage

Get usage statistics.

```bash
curl http://localhost:8317/v0/management/usage \
  -H "X-Management-Key: YOUR_MANAGEMENT_KEY"
```

**Response:**

```json
{
  "total_requests": 12543,
  "requests_by_provider": {
    "openai": 8234,
    "anthropic": 3210,
    "gemini": 1099
  },
  "tokens_used": {
    "prompt": 1567890,
    "completion": 234567
  }
}
```

#### GET /v0/management/logs

Get recent request logs.

```bash
curl http://localhost:8317/v0/management/logs \
  -H "X-Management-Key: YOUR_MANAGEMENT_KEY"
```

#### DELETE /v0/management/logs

Clear log files.

```bash
curl -X DELETE http://localhost:8317/v0/management/logs \
  -H "X-Management-Key: YOUR_MANAGEMENT_KEY"
```

#### GET /v0/management/health

Health check endpoint.

```bash
curl http://localhost:8317/v0/management/health
```

**Response:**

```json
{
  "status": "healthy",
  "uptime": 86400,
  "providers": {
    "openai": "connected",
    "anthropic": "connected",
    "gemini": "connected"
  }
}
```

---

## Troubleshooting

### Common Issues

#### "Connection refused" error

**Problem:** Cannot connect to CLIProxyAPI

**Solutions:**

- Verify CLIProxyAPI is running: `ps aux | grep cli-proxy-api`
- Check the port is not in use: `lsof -i :8317`
- Ensure your config file is valid

#### "401 Unauthorized" error

**Problem:** API key rejection

**Solutions:**

- Verify your API key is in the `auth.api-keys` array
- Check the Authorization header format: `Bearer YOUR_KEY`
- Regenerate your API key if needed

#### OAuth authentication fails

**Problem:** OAuth token not working

**Solutions:**

- Check token file exists in `~/.cli-proxy-api/auths/`
- Verify token hasn't expired
- Re-run OAuth flow

#### Provider returns errors

**Problem:** Specific provider failing

**Solutions:**

- Check provider API key is valid
- Verify provider base URL is correct
- Check provider status page for outages
- Enable debug logging: `logging.level: "debug"`

#### Slow response times

**Problem:** Requests taking too long

**Solutions:**

- Check your network connection
- Try a different provider endpoint
- Enable caching if available
- Check provider rate limits

### Debug Mode

Enable detailed logging:

```yaml
logging:
  level: "debug"
  file: "logs/debug.log"
```

Or via command line:

```bash
cli-proxy-api --config config.yaml --log-level debug
```

### Getting Help

- **Documentation**: https://help.router-for.me
- **GitHub Issues**: https://github.com/router-for-me/CLIProxyAPI/issues
- **Community**: Join our Discord

---

## Advanced Topics

### Docker Deployment

**Dockerfile:**

```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o cli-proxy-api ./cmd/cli-proxy-api

FROM alpine:latest
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/cli-proxy-api .
COPY config.yaml .
EXPOSE 8317
CMD ["./cli-proxy-api", "--config", "config.yaml"]
```

**docker-compose.yml:**

```yaml
version: "3.8"
services:
  cli-proxy-api:
    build: .
    ports:
      - "8317:8317"
    volumes:
      - ./config.yaml:/app/config.yaml
      - ./logs:/app/logs
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cli-proxy-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cli-proxy-api
  template:
    metadata:
      labels:
        app: cli-proxy-api
    spec:
      containers:
        - name: cli-proxy-api
          image: ghcr.io/router-for-me/CLIProxyAPI:latest
          ports:
            - containerPort: 8317
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: api-keys
                  key: openai
          volumeMounts:
            - name: config
              mountPath: /app/config.yaml
              subPath: config.yaml
      volumes:
        - name: config
          configMap:
            name: cli-proxy-config
---
apiVersion: v1
kind: Service
metadata:
  name: cli-proxy-api
spec:
  selector:
    app: cli-proxy-api
  ports:
    - port: 80
      targetPort: 8317
  type: LoadBalancer
```

### Custom Provider Endpoints

Configure custom OpenAI-compatible endpoints:

```yaml
routes:
  - pattern: "^local-"
    provider: "custom"
    base-url: "http://localhost:8000/v1"
    api-key: "local-key"

custom-providers:
  local-llama:
    base-url: "http://localhost:8000/v1"
    api-key: "local-key"
    models:
      - "local-llama-2-7b"
      - "local-llama-2-13b"
```

### TLS/SSL Configuration

```yaml
tls:
  enabled: true
  cert-file: "/path/to/cert.pem"
  key-file: "/path/to/key.pem"
```

### Rate Limiting

```yaml
rate-limit:
  enabled: true
  requests-per-minute: 100
  burst: 20
```

### Webhook Configuration

```yaml
webhooks:
  - url: "https://your-endpoint.com/webhook"
    events:
      - "request.completed"
      - "request.failed"
      - "quota.exceeded"
```

---

## Appendix

### Environment Variables

| Variable              | Description             |
| --------------------- | ----------------------- |
| `OPENAI_API_KEY`      | OpenAI API key          |
| `ANTHROPIC_API_KEY`   | Anthropic API key       |
| `GEMINI_API_KEY`      | Google Gemini API key   |
| `QWEN_API_KEY`        | Alibaba Qwen API key    |
| `MANAGEMENT_PASSWORD` | Management API password |
| `CONFIG_FILE`         | Path to config file     |

### Default Ports

| Service        | Default Port     |
| -------------- | ---------------- |
| CLIProxyAPI    | 8317             |
| Management API | 8317 (same port) |

### File Locations

| Platform    | Config Location                            | Auth Location                         |
| ----------- | ------------------------------------------ | ------------------------------------- |
| macOS/Linux | `~/.cli-proxy-api/config.yaml`             | `~/.cli-proxy-api/auths/`             |
| Windows     | `%USERPROFILE%\.cli-proxy-api\config.yaml` | `%USERPROFILE%\.cli-proxy-api\auths\` |

### License

Apache License 2.0 - see LICENSE file for details.
