# Database Layer Design

## Overview

The database layer (`internal/db`) provides a production-ready PostgreSQL interface with connection pooling, read replica support, migrations, and optimized queries.

## Architecture

```
internal/db/
├── pool.go         # Connection pooling and cluster management
├── models.go       # Data models for all tables
├── schema.go       # Schema creation and management
├── queries.go      # Prepared SQL statements
├── migrations.go   # Migration system
├── repo.go         # High-level repository operations
├── plugin.go       # Usage tracking plugins
├── init.go         # Environment-based initialization
└── doc.go          # Package documentation
```

## Tables

### oauth_tokens

Stores OAuth access/refresh tokens for multi-provider authentication.

| Column        | Type        | Description                            |
| ------------- | ----------- | -------------------------------------- |
| id            | UUID        | Primary key                            |
| provider      | TEXT        | Provider (claude, gemini, codex, etc.) |
| user_id       | TEXT        | User identifier                        |
| email         | TEXT        | User email                             |
| access_token  | TEXT        | Encrypted access token                 |
| refresh_token | TEXT        | Encrypted refresh token                |
| expires_at    | TIMESTAMPTZ | Token expiration                       |
| metadata      | JSONB       | Provider-specific data                 |
| is_active     | BOOLEAN     | Token status                           |
| deleted_at    | TIMESTAMPTZ | Soft delete support                    |

### usage_stats

Aggregated usage statistics by provider, model, and day.

| Column        | Type   | Description                |
| ------------- | ------ | -------------------------- |
| id            | UUID   | Primary key                |
| provider      | TEXT   | AI provider                |
| model         | TEXT   | Model identifier           |
| auth_id       | TEXT   | Authentication reference   |
| date          | DATE   | Aggregation date           |
| request_count | BIGINT | Total requests             |
| input_tokens  | BIGINT | Input tokens used          |
| output_tokens | BIGINT | Output tokens generated    |
| total_tokens  | BIGINT | Computed sum of all tokens |

### api_keys

API key management with rate limiting support.

| Column     | Type        | Description                      |
| ---------- | ----------- | -------------------------------- |
| id         | UUID        | Primary key                      |
| key_hash   | TEXT        | SHA-256 hash                     |
| key_prefix | TEXT        | First 8 chars for identification |
| rate_limit | INTEGER     | Requests per minute              |
| is_active  | BOOLEAN     | Key status                       |
| expires_at | TIMESTAMPTZ | Optional expiration              |

### configs

Configuration versioning with YAML storage.

| Column      | Type    | Description             |
| ----------- | ------- | ----------------------- |
| id          | UUID    | Primary key             |
| name        | TEXT    | Config name (unique)    |
| yaml_config | TEXT    | Full YAML configuration |
| version     | INTEGER | Version number          |
| is_active   | BOOLEAN | Currently active flag   |

### cache

Key-value cache with TTL support.

| Column     | Type        | Description                    |
| ---------- | ----------- | ------------------------------ |
| key        | TEXT        | Cache key (primary)            |
| value      | BYTEA       | Cached value                   |
| expires_at | TIMESTAMPTZ | Expiration time                |
| tags       | TEXT[]      | Optional tags for invalidation |

### request_logs

Request/response logging for analytics.

| Column        | Type    | Description       |
| ------------- | ------- | ----------------- |
| id            | UUID    | Primary key       |
| request_id    | TEXT    | Unique request ID |
| provider      | TEXT    | AI provider       |
| model         | TEXT    | Model requested   |
| status_code   | INTEGER | HTTP status code  |
| latency_ms    | BIGINT  | Request latency   |
| input_tokens  | INTEGER | Tokens consumed   |
| output_tokens | INTEGER | Tokens generated  |

## Indexes

### Performance Indexes

- `oauth_tokens`: (provider, user_id), (expires_at), (email)
- `usage_stats`: (provider, model, date), (auth_id, date)
- `api_keys`: (key_hash), (is_active), (expires_at)
- `request_logs`: (request_id), (provider, model, created_at)

### Partial Indexes

- Active tokens: `WHERE deleted_at IS NULL`
- Non-zero usage: `WHERE request_count > 0`
- Recent requests: `WHERE created_at > NOW() - INTERVAL '30 days'`

## Usage

### Initialization

```go
import "github.com/router-for-me/CLIProxyAPI/v6/internal/db"

// From environment variables
repo, err := db.InitFromEnv(ctx)
defer repo.Close()

// Or with explicit config
repo, err := db.NewRepo(ctx, db.ClusterConfig{
    Primary: "postgres://localhost/db",
    Replicas: []string{"postgres://replica1/db"},
    Pool: db.DefaultPoolConfig(),
})
```

### Queries

```go
q := repo.Queries()

// Get OAuth token
token, err := q.SelectOAuthTokenByUser(ctx, "claude", "user@example.com")

// Validate API key
key, err := q.ValidateAPIKey(ctx, "sk-12345678")

// Upsert usage stats
err = q.UpsertUsageStats(ctx, &db.UsageStats{
    Provider: "claude",
    Model: "claude-sonnet-4",
    AuthID: "auth123",
    Date: time.Now().Truncate(24 * time.Hour),
    RequestCount: 1,
    InputTokens: 100,
    OutputTokens: 200,
    SuccessCount: 1,
})
```

### Migrations

```bash
# Run migrations
db-tool migrate

# Check status
db-tool status

# Rollback
db-tool rollback

# Cleanup expired entries
db-tool cleanup
```

## Connection Pooling

Default configuration:

- Max connections: 20
- Min connections: 5
- Max lifetime: 1 hour
- Max idle time: 30 minutes
- Health check: 1 minute

Override via environment:

```
DB_POOL_MAX_CONNS=50
DB_POOL_MIN_CONNS=10
```

## Read Replicas

Read operations automatically route to replicas:

- Query operations: `repo.Cluster().Replica()`
- Write operations: `repo.Cluster().Primary()`

Round-robin load balancing across configured replicas.

## Batch Operations

For high-throughput scenarios:

```go
batch := repo.Batch()

// Insert multiple usage stats
err := batch.BatchInsertUsageStats(ctx, stats)

// Insert multiple log entries
err := batch.BatchInsertRequestLogs(ctx, logs)
```

## Analytics

```go
analytics := repo.Analytics()

// Get usage summary
summary, err := analytics.GetUsageSummary(ctx, start, end)

// Get error rates
errors, err := analytics.GetErrorRate(ctx, start, end)

// Get top auth entries by usage
top, err := analytics.GetTopAuthsByUsage(ctx, start, end, 10)
```

## Environment Variables

| Variable                   | Description                  | Default    |
| -------------------------- | ---------------------------- | ---------- |
| DB_PRIMARY                 | Primary DSN                  | (required) |
| DATABASE_URL               | Alias for DB_PRIMARY         | (required) |
| DB_REPLICAS                | Comma-separated replica DSNs | (none)     |
| DB_SCHEMA                  | Schema prefix                | (none)     |
| DB_POOL_MAX_CONNS          | Max connections              | 20         |
| DB_POOL_MIN_CONNS          | Min connections              | 5          |
| DB_POOL_MAX_CONN_LIFETIME  | Conn lifetime (sec)          | 3600       |
| DB_POOL_MAX_CONN_IDLE_TIME | Idle time (sec)              | 1800       |
| DB_POOL_HEALTH_CHECK       | Health check (sec)           | 60         |
