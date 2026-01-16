# Troubleshooting Guide

**Last Updated:** 2025-01-16

This guide helps you diagnose and resolve common issues with CLIProxies.

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Authentication Problems](#authentication-problems)
3. [Connection Issues](#connection-issues)
4. [Performance Issues](#performance-issues)
5. [Deployment Issues](#deployment-issues)
6. [Error Codes](#error-codes)
7. [Debug Mode](#debug-mode)
8. [Getting Help](#getting-help)

---

## Installation Issues

### Binary Not Found

**Problem:** `command not found: cliproxyapi`

**Solutions:**

1. **Verify installation:**

   ```bash
   which cliproxyapi
   ```

2. **Check PATH:**

   ```bash
   echo $PATH | grep "$HOME/go/bin"
   ```

3. **Add Go bin to PATH** (if missing):

   ```bash
   export PATH=$PATH:$(go env GOPATH)/bin
   echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc  # or ~/.zshrc
   source ~/.bashrc  # or ~/.zshrc
   ```

4. **Reinstall:**
   ```bash
   go install github.com/router-for-me/CLIProxyAPI/v6@latest
   ```

### Docker Issues

**Problem:** Docker build fails

**Solutions:**

1. **Check Docker daemon:**

   ```bash
   docker info
   ```

2. **Clear Docker cache:**

   ```bash
   docker system prune -af
   ```

3. **Build with no cache:**

   ```bash
   docker build --no-cache -t cliproxies-api ./CLIProxyAPI
   ```

4. **Verify Dockerfile location:**
   ```bash
   ls -la CLIProxyAPI/Dockerfile
   ```

---

## Authentication Problems

### OAuth Login Fails

**Problem:** OAuth login returns error or doesn't complete

**Solutions:**

1. **Check network connectivity:**

   ```bash
   curl -I https://accounts.google.com
   curl -I https://anthropic.com
   ```

2. **Verify browser access** (if using web OAuth):
   - Ensure OAuth callback URL is reachable
   - Check firewall/proxy settings

3. **Clear existing tokens:**

   ```bash
   rm -rf ~/.cli-proxy-api/auths
   cliproxyapi -login  # Re-authenticate
   ```

4. **Check auth directory permissions:**
   ```bash
   ls -la ~/.cli-proxy-api/auths
   chmod 700 ~/.cli-proxy-api/auths
   ```

### API Key Authentication Fails

**Problem:** `401 Unauthorized` when using API keys

**Solutions:**

1. **Verify API key in config:**

   ```bash
   grep api-keys config.yaml
   ```

2. **Check API key format:**
   - Must be at least 10 characters
   - No newlines or special characters
   - Not wrapped in quotes

3. **Restart server after config change:**
   ```bash
   cliproxyapi -config config.yaml
   ```

---

## Connection Issues

### Port Already in Use

**Problem:** `bind: address already in use`

**Solutions:**

1. **Find process using port:**

   ```bash
   lsof -i :8317  # macOS/Linux
   netstat -ano | findstr :8317  # Windows
   ```

2. **Kill the process:**

   ```bash
   kill -9 <PID>
   ```

3. **Use different port:**
   ```yaml
   port: 8318 # In config.yaml
   ```

### Connection Refused

**Problem:** Client cannot connect to proxy

**Solutions:**

1. **Check server is running:**

   ```bash
   curl http://localhost:8317/health
   ```

2. **Verify host binding:**

   ```yaml
   host: "" # Bind all interfaces (default)
   # host: "127.0.0.1"  # Localhost only
   ```

3. **Check firewall:**

   ```bash
   # Linux
   sudo ufw status
   sudo ufw allow 8317

   # macOS
   sudo pfctl -s rules | grep 8317
   ```

4. **Verify CORS settings:**
   ```yaml
   cors:
     allowed-origins:
       - "http://localhost:*"
       - "https://yourdomain.com"
   ```

---

## Performance Issues

### Slow Response Times

**Problem:** Requests take too long

**Solutions:**

1. **Enable caching:**

   ```yaml
   # In config.yaml
   caching:
     enabled: true
     ttl: 300 # 5 minutes
   ```

2. **Check rate limiting:**

   ```yaml
   rate-limit:
     enabled: true
     requests-per-minute: 60
   ```

3. **Enable debug mode** to identify bottlenecks:

   ```yaml
   debug: true
   ```

4. **Monitor metrics:**
   ```bash
   curl http://localhost:8317/metrics
   ```

### High Memory Usage

**Problem:** Proxy consumes too much memory

**Solutions:**

1. **Enable commercial mode** (reduces overhead):

   ```yaml
   commercial-mode: true
   ```

2. **Disable usage statistics:**

   ```yaml
   usage-statistics-enabled: false
   ```

3. **Adjust connection pool:**
   ```yaml
   database:
     max-conns: 10 # Reduce from default 20
     min-conns: 2 # Reduce from default 5
   ```

---

## Deployment Issues

### Docker Container Crashes

**Problem:** Container exits immediately

**Solutions:**

1. **Check logs:**

   ```bash
   docker logs <container_id>
   ```

2. **Verify config volume mount:**

   ```yaml
   volumes:
     - ./config.yaml:/CLIProxyAPI/config.yaml:ro
   ```

3. **Run in foreground** to see errors:

   ```bash
   docker run -it --rm cliproxies-api:latest
   ```

4. **Check environment variables:**
   ```bash
   docker run -e MANAGEMENT_PASSWORD=xxx cliproxies-api:latest
   ```

### Health Check Fails

**Problem:** `/health` endpoint returns error

**Solutions:**

1. **Check health endpoint directly:**

   ```bash
   curl -v http://localhost:8317/health
   ```

2. **Verify database connectivity** (if using PostgreSQL):

   ```bash
   psql "$PGSTORE_DSN" -c "SELECT 1"
   ```

3. **Check auth providers:**
   ```bash
   curl http://localhost:8317/v0/management/config \
     -H "Authorization: Bearer $MANAGEMENT_PASSWORD"
   ```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning             | Solution                          |
| ---- | ------------------- | --------------------------------- |
| 400  | Bad Request         | Check request body format         |
| 401  | Unauthorized        | Verify API key or OAuth token     |
| 403  | Forbidden           | Check IP whitelist or rate limits |
| 404  | Not Found           | Verify endpoint path              |
| 429  | Rate Limited        | Wait and retry with backoff       |
| 500  | Server Error        | Check logs for stack trace        |
| 502  | Upstream Error      | Verify provider API status        |
| 503  | Service Unavailable | Check server resources            |
| 504  | Timeout             | Increase timeout or retry         |

### Common Error Messages

#### "no authentication providers configured"

**Cause:** No API keys or OAuth tokens configured

**Solution:**

```bash
# Add API keys to config.yaml
api-keys:
  - "your-api-key"

# Or authenticate via OAuth
cliproxyapi -login
```

#### "quota exceeded"

**Cause:** Provider rate limit reached

**Solution:**

1. Wait for quota reset
2. Enable auto-switch:
   ```yaml
   quota-exceeded:
     switch-project: true
   ```
3. Add more API keys

#### "invalid model"

**Cause:** Model not found or not allowed

**Solution:**

1. Check model spelling
2. Verify provider supports this model
3. Check excluded-models in config

---

## Debug Mode

Enable verbose logging to diagnose issues:

### CLI Debug Mode

```bash
# Enable debug logging
cliproxyapi -config config.yaml -debug

# Or set in config.yaml
debug: true
```

### Docker Debug Mode

```bash
docker run -e DEBUG=true cliproxies-api:latest
```

### Log Levels

```yaml
logging:
  level: "debug" # debug, info, warn, error
  format: "json" # json, text
  enable-stack-trace: true
```

---

## Getting Help

### Check Documentation

- [API Documentation](./API.md)
- [Configuration Reference](./CONFIGURATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [GitHub Issues](https://github.com/router-for-me/CLIProxyAPI/issues)

### Enable Debug Logging

Before asking for help, enable debug mode and capture logs:

```bash
# Run with debug output
cliproxyapi -config config.yaml -debug 2>&1 | tee debug.log

# Or check existing logs
tail -f logs/cli-proxy-api.log
```

### Gather System Information

```bash
# System info
uname -a

# Go version
go version

# Docker version
docker --version

# Network check
curl -I https://api.openai.com
curl -I https://api.anthropic.com
```

### Create Bug Report

When filing an issue, include:

1. **CLIProxyAPI version:**

   ```bash
   cliproxyapi --version
   ```

2. **Configuration** (sanitized):

   ```bash
   cliproxyapi -config config.yaml -debug 2>&1 | head -50
   ```

3. **Error message** (full stack trace)

4. **Steps to reproduce**

5. **Expected vs actual behavior**

6. **Environment:**
   - OS and version
   - Go version
   - Docker version (if applicable)

---

## Recovery Procedures

### Reset Configuration

```bash
# Backup existing config
cp config.yaml config.yaml.backup

# Generate fresh config
cliproxyapi -config config.yaml -init > config.yaml.new

# Edit and restart
vim config.yaml.new
mv config.yaml.new config.yaml
```

### Clear All Data

```bash
# Stop server first
cliproxyapi -stop

# Remove auth directory
rm -rf ~/.cli-proxy-api

# Remove logs
rm -rf logs/

# Restart (will re-initialize)
cliproxyapi -config config.yaml
```

### Restore from Backup

```bash
# Database backup
gunzip -c backups/database/db-backup-YYYYMMDDHHMMSS.sql.gz | psql "$PGSTORE_DSN"

# Auth directory backup
tar -xzf backups/auths-backup-YYYYMMDDHHMMSS.tar.gz -C ~/
```

---

## Advanced Troubleshooting

### Enable Prometheus Metrics

```yaml
metrics:
  enabled: true
  path: "/metrics"
```

Then monitor:

```bash
curl http://localhost:8317/metrics
```

### Check Circuit Breaker Status

```yaml
circuit-breaker:
  enabled: true
```

View breaker status in logs or metrics.

### Verify TLS Configuration

```bash
# Test TLS connection
openssl s_client -connect localhost:8317 -servername localhost

# Check certificate
openssl x509 -in /path/to/cert.pem -text -noout
```

---

## Quick Reference

### Essential Commands

```bash
# Check health
curl http://localhost:8317/health

# List models
curl http://localhost:8317/v1/models -H "Authorization: Bearer YOUR_KEY"

# View config
curl http://localhost:8317/v0/management/config -H "Authorization: Bearer MGMT_KEY"

# View logs
tail -f logs/cli-proxy-api.log

# Test authentication
curl http://localhost:8317/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"hi"}],"max_tokens":10}'
```

### Default Ports

| Service      | Default Port         |
| ------------ | -------------------- |
| CLIProxyAPI  | 8317                 |
| PostgreSQL   | 5432                 |
| Metrics      | 8317 (at `/metrics`) |
| Health Check | 8317 (at `/health`)  |

### Default Paths

| Item           | Path                                              |
| -------------- | ------------------------------------------------- |
| Config file    | `./config.yaml` or `~/.cli-proxy-api/config.yaml` |
| Auth directory | `~/.cli-proxy-api/auths`                          |
| Logs           | `./logs/` or `/var/log/cli-proxy-api/`            |
| Database       | PostgreSQL via `$PGSTORE_DSN`                     |

---

**Last Updated:** 2025-01-16

**Still having issues?** [Open an issue on GitHub](https://github.com/router-for-me/CLIProxyAPI/issues)
