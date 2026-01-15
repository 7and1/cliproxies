# CLIProxies System Design and Architecture Optimization Plan

**Version:** 1.0
**Date:** 2026-01-12
**Author:** Solution Architecture Team
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Assessment](#2-current-architecture-assessment)
3. [Proposed Architecture](#3-proposed-architecture)
4. [Proxy Grid API Integration Architecture](#4-proxy-grid-api-integration-architecture)
5. [Scalability Plan](#5-scalability-plan)
6. [Security Architecture](#6-security-architecture)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Migration Strategy](#8-migration-strategy)
9. [Monitoring and Observability](#9-monitoring-and-observability)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

### 1.1 Project Overview

The CLIProxies project consists of two primary components:

1. **CLIProxyAPI (Backend)**: Go 1.24-based API gateway providing OpenAI/Gemini/Claude compatible interfaces for AI providers
2. **cliproxies-web (Frontend)**: Next.js 15.5 application deployed on Cloudflare Workers

### 1.2 Key Findings

| Area                   | Current State                                             | Priority |
| ---------------------- | --------------------------------------------------------- | -------- |
| Backend Performance    | Gin framework with single-instance design                 | High     |
| Caching Strategy       | In-memory signature cache only                            | High     |
| Database               | PostgreSQL with pgx driver, no connection pooling visible | Medium   |
| Frontend               | Next.js 15.5 with Cloudflare Workers, no edge caching     | Medium   |
| Security               | Basic API key auth, bcrypt for management                 | High     |
| Observability          | Logrus logging, usage statistics optional                 | Medium   |
| Proxy Grid Integration | Not integrated                                            | High     |

### 1.3 Recommended Focus Areas

1. **Immediate (0-3 months)**: Security hardening, Proxy Grid API integration, basic caching
2. **Short-term (3-6 months)**: Database optimization, horizontal scaling readiness
3. **Medium-term (6-12 months)**: Full edge computing strategy, advanced observability

---

## 2. Current Architecture Assessment

### 2.1 Backend Architecture (CLIProxyAPI)

#### 2.1.1 Technology Stack

```
Language:    Go 1.24.0
Framework:    Gin 1.10.1
Database:     PostgreSQL (pgx/v5)
Storage:      MinIO (S3-compatible), Git, File system
WebSocket:    Gorilla WebSocket 1.5.3
Authentication: OAuth2 (multiple providers), API keys, JWT
```

#### 2.1.2 Architecture Diagram

```
+-------------------+     +-------------------+     +-------------------+
|   OAuth Providers |     |   AI Providers    |     |  Management API  |
| (Claude, Gemini,  |<--->| (OpenAI, Claude,  |<--->|  (Config, Logs)  |
|  Codex, Qwen)     |     |   Gemini, etc.)   |     |                   |
+-------------------+     +-------------------+     +-------------------+
          ^                         ^                         ^
          |                         |                         |
          v                         v                         v
+-----------------------------------------------------------------------+
|                         CLIProxyAPI (Go/Gin)                        |
| +----------------+  +------------------+  +-----------------------+ |
| | Auth Manager   |  |  Base Handlers   |  |   Module System      | |
| | (OAuth, JWT)   |  | (OpenAI, Claude, |  |   (Amp integration)  | |
| |                |  |  Gemini routes)  |  |                       | |
| +----------------+  +------------------+  +-----------------------+ |
| +----------------+  +------------------+  +-----------------------+ |
| | Token Stores   |  |  Config Manager  |  |   Usage Statistics    | |
| | (Postgres,     |  | (YAML, Hot-reload)|  |   (Optional)          | |
| | S3, Git, File) |  |                  |  |                       | |
| +----------------+  +------------------+  +-----------------------+ |
+-----------------------------------------------------------------------+
          ^                         ^                         ^
          |                         |                         |
          v                         v                         v
+-------------------+     +-------------------+     +-------------------+
|   PostgreSQL      |     |  MinIO/S3         |     |  File System      |
|   (Token Store)   |     |  (Object Store)   |     |  (Auth files)     |
+-------------------+     +-------------------+     +-------------------+
```

#### 2.1.3 Identified Bottlenecks

1. **Single-Instance Design**
   - No built-in load balancing support
   - In-memory state (usage statistics, signature cache) not shared
   - File-based auth locking

2. **Database Access**
   - No visible connection pooling configuration
   - Direct SQL queries without ORM/query builder
   - No read replica support

3. **Caching**
   - Only signature caching (`internal/cache/signature_cache.go`)
   - No response caching
   - No distributed cache layer

4. **Request Handling**
   - Synchronous upstream requests
   - No request queuing or throttling
   - Retry mechanism exists but no circuit breaker

#### 2.1.4 Technical Debt

| Area           | Issue                                   | Impact | Effort |
| -------------- | --------------------------------------- | ------ | ------ |
| Config         | Complex YAML with legacy migrations     | Medium | Medium |
| Error Handling | Inconsistent error types                | Low    | Low    |
| Logging        | Mixed log levels, no structured logging | Medium | Medium |
| Testing        | Limited test coverage                   | Medium | High   |
| Documentation  | Incomplete API docs                     | Low    | Medium |

### 2.2 Frontend Architecture (cliproxies-web)

#### 2.2.1 Technology Stack

```
Framework:      Next.js 15.5.9
React:          19.2.3
Deployment:     Cloudflare Workers (via @opennextjs/cloudflare)
Styling:        Tailwind CSS 4.1.18
State:          Zustand 5.0.9
Language:       TypeScript 5.x
```

#### 2.2.2 Architecture Diagram

```
+------------------------------------------------------------------+
|                         Cloudflare Workers                        |
| +------------------------------------------------------------+   |
| |                      Next.js Application                    |   |
| | +---------+  +------------+  +----------+  +--------------+ |   |
| | | App     |  | Middleware |  | Pages    |  | API Routes   | |   |
| | | Router  |  |            |  |          |  |              | |   |
| | +---------+  +------------+  +----------+  +--------------+ |   |
| | +------------------------------------------------------------+|   |
| | |                      Components                          ||   |
| | | +-------------+  +--------------+  +-------------------+ ||   |
| | | | Config Gen  |  | App Cards     |  | Sponsor Cards     | ||   |
| | | +-------------+  +--------------+  +-------------------+ ||   |
| | +------------------------------------------------------------+|   |
| | +------------------------------------------------------------+|   |
| | |                      State Layer                         ||   |
| | | +--------------+  +------------+  +---------------------+||   |
| | | | Config Store |  | OS Detect  |  | Utils (YAML, etc)   |||   |
| | | +--------------+  +------------+  +---------------------+||   |
| | +------------------------------------------------------------+|   |
| +------------------------------------------------------------+   |
+------------------------------------------------------------------+
          ^                         ^                     ^
          |                         |                     |
          v                         v                     v
+-------------------+     +-------------------+     +-------------------+
| Cloudflare Assets |     | Cloudflare Images|     |  Backend API      |
| (Static files)    |     | (Image optimization)|     |  (CLIProxyAPI)    |
+-------------------+     +-------------------+     +-------------------+
```

#### 2.2.3 Identified Bottlenecks

1. **Edge Computing**
   - No edge caching configured
   - Full SSR on every request (no ISR)
   - No static optimization for config generator

2. **API Integration**
   - No backend API integration visible
   - Config generation is client-side only
   - No real-time updates

3. **Performance**
   - No image optimization strategy documented
   - Bundle size not analyzed
   - No performance monitoring

#### 2.2.4 Technical Debt

| Area             | Issue                       | Impact | Effort |
| ---------------- | --------------------------- | ------ | ------ |
| State Management | Zustand without persistence | Low    | Low    |
| Error Boundaries | Not visible                 | Medium | Low    |
| Testing          | Minimal test coverage       | Medium | Medium |
| Type Safety      | Partial `any` usage in lib  | Low    | Low    |

---

## 3. Proposed Architecture

### 3.1 Backend Optimizations (Go/Gin)

#### 3.1.1 Connection Pooling

**Current State:** Direct database connection without visible pooling

**Proposal:**

```go
// Internal/db/pool.go
package db

import (
    "context"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
)

type PoolConfig struct {
    MaxConns        int32         // Default: 20
    MinConns        int32         // Default: 5
    MaxConnLifetime time.Duration // Default: 1 hour
    MaxConnIdleTime time.Duration // Default: 30 minutes
    HealthCheck     time.Duration // Default: 1 minute
}

func NewPool(ctx context.Context, dsn string, cfg PoolConfig) (*pgxpool.Pool, error) {
    config, err := pgxpool.ParseConfig(dsn)
    if err != nil {
        return nil, err
    }

    config.MaxConns = cfg.MaxConns
    config.MinConns = cfg.MinConns
    config.MaxConnLifetime = cfg.MaxConnLifetime
    config.MaxConnIdleTime = cfg.MaxConnIdleTime
    config.HealthCheckPeriod = cfg.HealthCheck

    return pgxpool.NewWithConfig(ctx, config)
}
```

**Benefits:**

- Reduced connection overhead
- Better resource utilization
- Improved query performance

#### 3.1.2 Distributed Caching Layer

**Current State:** In-memory signature cache only

**Proposal:**

```go
// Internal/cache/distributed.go
package cache

import (
    "context"
    "encoding/json"
    "time"

    "github.com/redis/go-redis/v9"
)

type DistributedCache interface {
    Get(ctx context.Context, key string, dest interface{}) error
    Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
    Delete(ctx context.Context, key string) error
    Invalidate(ctx context.Context, pattern string) error
}

type RedisCache struct {
    client *redis.Client
}

func NewRedisCache(addr, password string, db int) (*RedisCache, error) {
    rdb := redis.NewClient(&redis.Options{
        Addr:     addr,
        Password: password,
        DB:       db,
        PoolSize: 100,
    })

    return &RedisCache{client: rdb}, nil
}

// Cache strategy implementation
type CacheStrategy struct {
    distributed DistributedCache
    local       *SignatureCache
}

func (s *CacheStrategy) Get(ctx context.Context, key string, dest interface{}) error {
    // Try local cache first (L1)
    if err := s.local.Get(key, dest); err == nil {
        return nil
    }

    // Fall back to distributed cache (L2)
    data, err := s.distributed.Get(ctx, key)
    if err != nil {
        return err
    }

    // Populate local cache
    s.local.Set(key, data)
    return json.Unmarshal(data, dest)
}
```

**Cache Configuration:**

```yaml
# config.yaml additions
cache:
  enable: true
  backend: "redis" # redis, memory, none
  redis:
    addr: "localhost:6379"
    password: ""
    db: 0
  ttl:
    signatures: "5m"
    responses: "1m"
    models: "15m"
```

#### 3.1.3 Request Queueing with Worker Pools

**Current State:** Synchronous request handling

**Proposal:**

```go
// internal/queue/queue.go
package queue

import (
    "context"
    "sync"
)

type Job struct {
    ID       string
    Request  *http.Request
    Response chan *JobResult
}

type JobResult struct {
    Data  []byte
    Error error
}

type WorkerPool struct {
    queue    chan *Job
    workers  int
    wg       sync.WaitGroup
    ctx      context.Context
    cancel   context.CancelFunc
}

func NewWorkerPool(workers, queueSize int) *WorkerPool {
    ctx, cancel := context.WithCancel(context.Background())

    pool := &WorkerPool{
        queue:   make(chan *Job, queueSize),
        workers: workers,
        ctx:     ctx,
        cancel:  cancel,
    }

    for i := 0; i < workers; i++ {
        pool.wg.Add(1)
        go pool.worker(i)
    }

    return pool
}

func (p *WorkerPool) worker(id int) {
    defer p.wg.Done()

    for {
        select {
        case job := <-p.queue:
            result := p.processJob(job)
            job.Response <- result
        case <-p.ctx.Done():
            return
        }
    }
}
```

#### 3.1.4 Circuit Breaker Pattern

```go
// internal/circuitbreaker/breaker.go
package circuitbreaker

import (
    "context"
    "sync"
    "time"
)

type State int

const (
    StateClosed State = iota
    StateHalfOpen
    StateOpen
)

type CircuitBreaker struct {
    mu               sync.Mutex
    state            State
    failureCount     int
    failureThreshold int
    successCount     int
    successThreshold int
    nextAttempt      time.Time
    openTimeout      time.Duration
}

func (cb *CircuitBreaker) Execute(ctx context.Context, fn func() error) error {
    cb.mu.Lock()

    if cb.state == StateOpen {
        if time.Now().Before(cb.nextAttempt) {
            cb.mu.Unlock()
            return ErrCircuitOpen
        }
        cb.state = StateHalfOpen
        cb.successCount = 0
    }

    cb.mu.Unlock()

    err := fn()

    cb.mu.Lock()
    defer cb.mu.Unlock()

    if err != nil {
        cb.failureCount++
        if cb.failureCount >= cb.failureThreshold {
            cb.state = StateOpen
            cb.nextAttempt = time.Now().Add(cb.openTimeout)
        }
        return err
    }

    cb.failureCount = 0
    if cb.state == StateHalfOpen {
        cb.successCount++
        if cb.successCount >= cb.successThreshold {
            cb.state = StateClosed
        }
    }

    return nil
}
```

### 3.2 Frontend Optimizations (Next.js 15)

#### 3.2.1 Incremental Static Regeneration (ISR)

**Current State:** Full SSR, no caching

**Proposal:**

```typescript
// src/app/config/[[...slug]]/page.tsx
export const revalidate = 3600; // 1 hour

export async function generateStaticParams() {
  const apps = await getFeaturedApps();
  return apps.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({ params }) {
  const app = await getAppBySlug(params.slug);
  return {
    title: app.name,
    description: app.description,
  };
}
```

#### 3.2.2 Edge Runtime for API Routes

```typescript
// src/app/api/config/route.ts
export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providers = searchParams.get("providers");

  // Edge-optimized config generation
  const config = generateConfig(providers);

  return Response.json(config);
}
```

#### 3.2.3 Image Optimization Strategy

```typescript
// next.config.ts additions
const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.router-for.me",
      },
    ],
    minimumCacheTTL: 31536000, // 1 year
  },
};
```

### 3.3 Database Optimization

#### 3.3.1 Read Replicas Configuration

```go
// internal/db/replicas.go
package db

type ClusterConfig struct {
    Primary string
    Replicas []string
}

type Cluster struct {
    primary *pgxpool.Pool
    replicas []*pgxpool.Pool
    rrIndex  uint32
}

func (c *Cluster) Primary() *pgxpool.Pool {
    return c.primary
}

func (c *Cluster) Replica() *pgxpool.Pool {
    if len(c.replicas) == 0 {
        return c.primary
    }

    // Round-robin replica selection
    idx := atomic.AddUint32(&c.rrIndex, 1) % uint32(len(c.replicas))
    return c.replicas[idx]
}
```

#### 3.3.2 Query Optimization

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_auth_type_active
ON auth_store(type) WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_usage_timestamp
ON usage_logs(timestamp DESC);

CREATE INDEX CONCURRENTLY idx_usage_client_model
ON usage_logs(client_id, model_id);

-- Partition usage logs by month
CREATE TABLE usage_logs_2026_01 PARTITION OF usage_logs
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## 4. Proxy Grid API Integration Architecture

### 4.1 Available Services

The Proxy Grid API at `http://google.savedimage.com` provides:

| Service      | Endpoint        | Description                       |
| ------------ | --------------- | --------------------------------- |
| SERP         | `/api/serp`     | Search engine results scraping    |
| Social Media | `/api/social/*` | Platform-specific data extraction |
| Web Content  | `/api/content`  | Generic web content extraction    |

### 4.2 Integration Architecture

```
+------------------------------------------------------------------+
|                         CLIProxyAPI                               |
| +------------------------------------------------------------+   |
| |                   Proxy Grid Integration Layer                |   |
| | +-------------+  +--------------+  +----------------------+ |   |
| | | Rate Limiter|  | Cache Manager|  |  Error Handler       | |   |
| | +-------------+  +--------------+  +----------------------+ |   |
| | +------------------------------------------------------------+|   |
| | |                     Service Adapters                     ||   |
| | | +------------+  +--------------+  +--------------------+ ||   |
| | | | SERP       |  | Social Media |  |  Web Content        | ||   |
| | | +------------+  +--------------+  +--------------------+ ||   |
| | +------------------------------------------------------------+|   |
| +------------------------------------------------------------+   |
+------------------------------------------------------------------+
          ^                                    ^
          |                                    |
          v                                    v
+-------------------+              +---------------------------+
|  Local Cache      |              |  Proxy Grid API           |
|  (Redis/Memory)   |<------------>|  http://google.savedimage.com|
+-------------------+              +---------------------------+
```

### 4.3 Implementation

#### 4.3.1 Service Client

```go
// internal/proxygrid/client.go
package proxygrid

import (
    "context"
    "encoding/json"
    "net/http"
    "time"
)

const BaseURL = "http://google.savedimage.com"

type Client struct {
    httpClient *http.Client
    baseURL    string
    apiKey     string
    rateLimiter *RateLimiter
}

func NewClient(apiKey string) *Client {
    return &Client{
        httpClient: &http.Client{
            Timeout: 30 * time.Second,
        },
        baseURL: BaseURL,
        apiKey:  apiKey,
        rateLimiter: NewRateLimiter(100, time.Minute), // 100 req/min
    }
}

func (c *Client) Search(ctx context.Context, query string, opts *SearchOptions) (*SearchResult, error) {
    if err := c.rateLimiter.Wait(ctx); err != nil {
        return nil, err
    }

    endpoint := c.baseURL + "/api/serp"
    // ... implementation
}
```

#### 4.3.2 Rate Limiting Strategy

```go
// internal/proxygrid/ratelimit.go
package proxygrid

import (
    "context"
    "time"

    "golang.org/x/time/rate"
)

type RateLimiter struct {
    limiter *rate.Limiter
}

func NewRateLimiter(requestsPerMinute int, window time.Duration) *RateLimiter {
    r := rate.Every(window / time.Duration(requestsPerMinute))
    return &RateLimiter{
        limiter: rate.NewLimiter(r, burstSize),
    }
}

func (rl *RateLimiter) Wait(ctx context.Context) error {
    return rl.limiter.Wait(ctx)
}
```

#### 4.3.3 Caching Strategy

```go
// internal/proxygrid/cache.go
package proxygrid

import (
    "context"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "time"
)

type CacheKey struct {
    Service string
    Method  string
    Params  string
}

func (ck CacheKey) String() string {
    h := sha256.New()
    h.Write([]byte(fmt.Sprintf("%s:%s:%s", ck.Service, ck.Method, ck.Params)))
    return "proxygrid:" + hex.EncodeToString(h.Sum(nil))
}

type CachedResponse struct {
    Data      []byte
    CachedAt  time.Time
    TTL       time.Duration
}

func (c *Client) cachedRequest(ctx context.Context, cacheKey CacheKey, fn func() ([]byte, error)) ([]byte, error) {
    // Try cache first
    var cached CachedResponse
    if err := c.cache.Get(ctx, cacheKey.String(), &cached); err == nil {
        if time.Since(cached.CachedAt) < cached.TTL {
            return cached.Data, nil
        }
    }

    // Execute request
    data, err := fn()
    if err != nil {
        // Return stale cache if available
        if cached.Data != nil {
            return cached.Data, nil
        }
        return nil, err
    }

    // Update cache
    c.cache.Set(ctx, cacheKey.String(), CachedResponse{
        Data:     data,
        CachedAt: time.Now(),
        TTL:      5 * time.Minute,
    })

    return data, nil
}
```

#### 4.3.4 Error Handling and Fallbacks

```go
// internal/proxygrid/errors.go
package proxygrid

import (
    "errors"
    "fmt"
)

var (
    ErrRateLimited  = errors.New("proxygrid: rate limited")
    ErrUnavailable  = errors.New("proxygrid: service unavailable")
    ErrInvalidInput = errors.New("proxygrid: invalid input")
)

type FallbackStrategy int

const (
    FallbackError FallbackStrategy = iota
    FallbackStaleCache
    FallbackAlternativeService
)

type ErrorHandler struct {
    strategy FallbackStrategy
    cache    Cache
}

func (eh *ErrorHandler) Handle(ctx context.Context, err error) ([]byte, error) {
    switch {
    case errors.Is(err, ErrRateLimited):
        return eh.handleRateLimit(ctx)
    case errors.Is(err, ErrUnavailable):
        return eh.handleUnavailability(ctx)
    default:
        return nil, err
    }
}

func (eh *ErrorHandler) handleRateLimit(ctx context.Context) ([]byte, error) {
    if eh.strategy == FallbackStaleCache {
        // Return stale cached data if available
        // ...
    }
    return nil, fmt.Errorf("%w: please retry later", ErrRateLimited)
}
```

### 4.4 Configuration

```yaml
# config.yaml additions
proxygrid:
  enable: true
  base-url: "http://google.savedimage.com"
  api-key: "${PROXYGRID_API_KEY}"
  timeout: "30s"
  rate-limit:
    requests-per-minute: 100
    burst: 10
  cache:
    enabled: true
    ttl: "5m"
    backend: "redis"
  fallback:
    strategy: "stale-cache" # error, stale-cache, alternative-service
    stale-max-age: "1h"
```

---

## 5. Scalability Plan

### 5.1 Horizontal Scaling

#### 5.1.1 Stateless Design Requirements

**Current State Challenges:**

- In-memory usage statistics
- File-based auth locks
- Local signature cache

**Proposed Solutions:**

1. **Shared State Layer**

```go
// internal/state/manager.go
package state

import (
    "context"
    "time"
)

type StateBackend interface {
    Get(ctx context.Context, key string) ([]byte, error)
    Set(ctx context.Context, key string, value []byte, ttl time.Duration) error
    Increment(ctx context.Context, key string, delta int64) (int64, error)
}

type DistributedStateManager struct {
    backend StateBackend
    local   *sync.Map  // For hot data
}

func NewDistributedStateManager(backend StateBackend) *DistributedStateManager {
    return &DistributedStateManager{
        backend: backend,
        local:   &sync.Map{},
    }
}
```

2. **Session Affinity (Sticky Sessions)**

```go
// internal/middleware/affinity.go
package middleware

import (
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

func SessionAffinity() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Check for existing session ID
        sessionID := c.GetHeader("X-Session-ID")

        if sessionID == "" {
            sessionID = uuid.New().String()
            c.Header("X-Session-ID", sessionID)
        }

        c.Set("session_id", sessionID)
        c.Next()
    }
}
```

#### 5.1.2 Load Balancer Configuration

```yaml
# docker-compose.yml additions
services:
  cli-proxy-api:
    image: ${CLI_PROXY_IMAGE:-eceasy/cli-proxy-api:latest}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "1"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M
    environment:
      - INSTANCE_ID=${INSTANCE_ID}

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - cli-proxy-api
```

```nginx
# nginx.conf
upstream cliproxies {
    least_conn;
    server cli-proxy-api:8317 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;

    location / {
        proxy_pass http://cliproxies;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Session-ID $http_x_session_id;

        # Health check
        health_check interval=10s fails=3 passes=2;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 5.2 Edge Computing Strategy

#### 5.2.1 Cloudflare Workers Integration

```typescript
// cliproxies-web/app/api/edge/route.ts
export const runtime = "edge";

interface Env {
  CLIProxyAPI: string;
  KV: KVNamespace;
}

export async function onRequest(context: EventContext<Env>) {
  const { request, env } = context;

  // Edge-level request validation
  const cacheKey = `request:${crypto.randomUUID()}`;

  // Try KV cache first
  const cached = await env.KV.get(cacheKey, "json");
  if (cached) {
    return Response.json(cached);
  }

  // Proxy to backend
  const response = await fetch(env.CLIProxyAPI + request.url);
  const data = await response.json();

  // Cache for 5 minutes
  await env.KV.put(cacheKey, JSON.stringify(data), {
    expirationTtl: 300,
  });

  return Response.json(data);
}
```

#### 5.2.2 CDN Configuration

```javascript
// wrangler.jsonc additions
{
  "routes": [
    {
      "pattern": "https://cliproxies.com/api/*",
      "zone_name": "cliproxies.com"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "preview_id": "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
    }
  ]
}
```

### 5.3 Auto-scaling Configuration

```yaml
# kubernetes/deployment.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cliproxies-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cliproxies
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
        - type: Pods
          value: 2
          periodSeconds: 30
      selectPolicy: Max
```

---

## 6. Security Architecture

### 6.1 Authentication/Authorization Enhancements

#### 6.1.1 Current State

- API key authentication (simple string comparison)
- Bcrypt for management API
- OAuth for external providers

#### 6.1.2 Proposed Improvements

1. **JWT Token Management**

```go
// internal/auth/jwt/tokens.go
package jwt

import (
    "crypto/rand"
    "errors"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

var (
    ErrInvalidToken = errors.New("invalid token")
    ErrExpiredToken = errors.New("token expired")
)

type Claims struct {
    UserID    string            `json:"user_id"`
    APIKeyID  string            `json:"api_key_id"`
    Roles     []string          `json:"roles"`
    Metadata  map[string]string `json:"metadata"`
    jwt.RegisteredClaims
}

type TokenManager struct {
    secretKey   []byte
    issuer      string
    accessToken time.Duration
}

func NewTokenManager(secret string) *TokenManager {
    return &TokenManager{
        secretKey:   []byte(secret),
        issuer:      "cliproxies",
        accessToken: 15 * time.Minute,
    }
}

func (tm *TokenManager) GenerateAccessToken(claims *Claims) (string, error) {
    now := time.Now()
    claims.IssuedAt = jwt.NewNumericDate(now)
    claims.ExpiresAt = jwt.NewNumericDate(now.Add(tm.accessToken))
    claims.Issuer = tm.issuer

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(tm.secretKey)
}

func (tm *TokenManager) ValidateAccessToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, ErrInvalidToken
        }
        return tm.secretKey, nil
    })

    if err != nil {
        return nil, err
    }

    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }

    return nil, ErrInvalidToken
}
```

2. **API Key Rotation**

```go
// internal/auth/apikeys/rotation.go
package apikeys

import (
    "context"
    "crypto/rand"
    "encoding/hex"
    "time"
)

type RotationPolicy struct {
    MaxAge           time.Duration
    WarningPeriod    time.Duration
    AutoRotate       bool
}

type KeyManager struct {
    policy *RotationPolicy
    store  KeyStore
}

func (km *KeyManager) RotateKey(ctx context.Context, keyID string) (string, error) {
    // Generate new key
    newKey, err := km.generateKey()
    if err != nil {
        return "", err
    }

    // Store with old key as fallback
    oldKey, err := km.store.Get(ctx, keyID)
    if err != nil {
        return "", err
    }

    // Mark old key for grace period deletion
    if err := km.store.SetWithExpiry(ctx, keyID+":old", oldKey, 7*24*time.Hour); err != nil {
        return "", err
    }

    // Set new key
    if err := km.store.Set(ctx, keyID, newKey); err != nil {
        return "", err
    }

    return newKey, nil
}

func (km *KeyManager) generateKey() (string, error) {
    bytes := make([]byte, 32)
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    return "cp_" + hex.EncodeToString(bytes), nil
}
```

### 6.2 API Security

#### 6.2.1 Rate Limiting

```go
// internal/middleware/ratelimit.go
package middleware

import (
    "context"
    "fmt"
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/redis/go-redis/v9"
)

type RateLimitConfig struct {
    RequestsPerMinute int
    Burst             int
    Window            time.Duration
}

type RateLimiter struct {
    redis *redis.Client
    cfg   *RateLimitConfig
}

func (rl *RateLimiter) Middleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        apiKey := c.GetHeader("X-API-Key")
        if apiKey == "" {
            apiKey = c.ClientIP()
        }

        key := fmt.Sprintf("ratelimit:%s", apiKey)
        ctx := context.Background()

        // Increment counter
        count, err := rl.redis.Incr(ctx, key).Result()
        if err != nil {
            c.Next()
            return
        }

        if count == 1 {
            rl.redis.Expire(ctx, key, int64(rl.cfg.Window.Seconds()))
        }

        if count > int64(rl.cfg.RequestsPerMinute) {
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Rate limit exceeded",
            })
            c.Abort()
            return
        }

        // Set rate limit headers
        remaining := int64(rl.cfg.RequestsPerMinute) - count
        reset := time.Now().Add(rl.cfg.Window).Unix()

        c.Header("X-RateLimit-Limit", strconv.Itoa(rl.cfg.RequestsPerMinute))
        c.Header("X-RateLimit-Remaining", strconv.FormatInt(remaining, 10))
        c.Header("X-RateLimit-Reset", strconv.FormatInt(reset, 10))

        c.Next()
    }
}
```

#### 6.2.2 Request Validation

```go
// internal/middleware/validation.go
package middleware

import (
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
)

type RequestValidator struct {
    validate *validator.Validate
}

func NewRequestValidator() *RequestValidator {
    v := validator.New()

    // Register custom validations
    v.RegisterValidation("api_key", validateAPIKey)
    v.RegisterValidation("model_name", validateModelName)

    return &RequestValidator{validate: v}
}

func (rv *RequestValidator) Middleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Validate content-type
        contentType := c.GetHeader("Content-Type")
        if c.Request.Method != "GET" && contentType != "application/json" {
            c.JSON(415, gin.H{"error": "Unsupported media type"})
            c.Abort()
            return
        }

        // Validate request size
        if c.Request.ContentLength > 10*1024*1024 { // 10MB
            c.JSON(413, gin.H{"error": "Request too large"})
            c.Abort()
            return
        }

        c.Next()
    }
}
```

### 6.3 Data Protection

#### 6.3.1 Encryption at Rest

```go
// internal/crypto/encryption.go
package crypto

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
    "errors"
    "io"
)

var (
    ErrInvalidCiphertext = errors.New("invalid ciphertext")
)

type Encryptor struct {
    key []byte
}

func NewEncryptor(key string) (*Encryptor, error) {
    // Key should be 32 bytes for AES-256
    decoded, err := base64.StdEncoding.DecodeString(key)
    if err != nil {
        return nil, err
    }

    if len(decoded) != 32 {
        return nil, errors.New("key must be 32 bytes")
    }

    return &Encryptor{key: decoded}, nil
}

func (e *Encryptor) Encrypt(plaintext []byte) (string, error) {
    block, err := aes.NewCipher(e.key)
    if err != nil {
        return "", err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }

    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }

    ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (e *Encryptor) Decrypt(ciphertext string) ([]byte, error) {
    data, err := base64.StdEncoding.DecodeString(ciphertext)
    if err != nil {
        return nil, err
    }

    block, err := aes.NewCipher(e.key)
    if err != nil {
        return nil, err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }

    nonceSize := gcm.NonceSize()
    if len(data) < nonceSize {
        return nil, ErrInvalidCiphertext
    }

    nonce, cipherData := data[:nonceSize], data[nonceSize:]
    return gcm.Open(nil, nonce, cipherData, nil)
}
```

---

## 7. Deployment Architecture

### 7.1 CI/CD Pipeline Improvements

#### 7.1.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: "1.24"

      - name: Run tests
        run: |
          go test -race -coverprofile=coverage.out -v ./...
          go tool cover -func=coverage.out

      - name: Security scan
        uses: securego/gosec@master
        with:
          args: ./...

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha,prefix={{branch}}-

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            VERSION=${{ steps.meta.outputs.version }}
            COMMIT=${{ github.sha }}
            BUILD_DATE=${{ github.event.head_commit.timestamp }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: |
          # Deployment logic here
          echo "Deploying ${{ steps.meta.outputs.version }}"
```

#### 7.1.2 Frontend Deployment

```yaml
# .github/workflows/deploy-frontend.yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - "cliproxies-web/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        working-directory: ./cliproxies-web
        run: pnpm install

      - name: Build
        working-directory: ./cliproxies-web
        run: pnpm build

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: wrangler deploy --config ./cliproxies-web/wrangler.jsonc
```

### 7.2 Environment Management

#### 7.2.1 Configuration Strategy

```yaml
# config/environments/development.yaml
host: "localhost"
port: 8317
debug: true

database:
  host: "localhost"
  port: 5432
  name: "cliproxies_dev"
  ssl_mode: "disable"

cache:
  enable: true
  backend: "memory"
```

```yaml
# config/environments/production.yaml
host: "" # Bind all interfaces
port: 8317
debug: false

database:
  host: "${DB_HOST}"
  port: 5432
  name: "cliproxies_prod"
  ssl_mode: "require"
  pool_max_conns: 20

cache:
  enable: true
  backend: "redis"
  redis:
    addr: "${REDIS_ADDR}"
    password: "${REDIS_PASSWORD}"

logging:
  level: "info"
  to_file: true
  max_size_mb: 100
```

### 7.3 Monitoring and Observability

#### 7.3.1 Metrics Collection

```go
// internal/metrics/collector.go
package metrics

import (
    "net/http"
    "time"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "cliproxies_requests_total",
            Help: "Total number of requests",
        },
        []string{"method", "endpoint", "status"},
    )

    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "cliproxies_request_duration_seconds",
            Help:    "Request duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "endpoint"},
    )

    activeConnections = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "cliproxies_active_connections",
            Help: "Number of active connections",
        },
    )
)

func Init() {
    prometheus.MustRegister(requestsTotal)
    prometheus.MustRegister(requestDuration)
    prometheus.MustRegister(activeConnections)
}

func Handler() http.Handler {
    return promhttp.Handler()
}
```

#### 7.3.2 Distributed Tracing

```go
// internal/tracing/tracer.go
package tracing

import (
    "context"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/jaeger"
    "go.opentelemetry.io/otel/sdk/resource"
    "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
)

func InitTracer(serviceName, jaegerEndpoint string) error {
    exporter, err := jaeger.New(jaeger.WithCollectorEndpoint(
        jaeger.WithEndpoint(jaegerEndpoint),
    ))
    if err != nil {
        return err
    }

    tp := trace.NewTracerProvider(
        trace.WithBatcher(exporter),
        trace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceNameKey.String(serviceName),
        )),
    )

    otel.SetTracerProvider(tp)
    return nil
}
```

---

## 8. Migration Strategy

### 8.1 Phase 1: Foundation (Weeks 1-4)

**Goals:**

- Establish monitoring baseline
- Implement basic caching
- Security hardening

**Tasks:**

1. Set up Prometheus + Grafana
2. Implement Redis caching layer
3. Add JWT authentication
4. Implement rate limiting

**Success Criteria:**

- 50% reduction in average response time
- 100% authentication coverage
- Basic dashboards operational

### 8.2 Phase 2: Proxy Grid Integration (Weeks 5-8)

**Goals:**

- Integrate Proxy Grid API
- Implement service adapters
- Configure caching and fallbacks

**Tasks:**

1. Implement Proxy Grid client
2. Create service adapters
3. Add caching layer
4. Implement error handling

**Success Criteria:**

- All Proxy Grid services accessible
- <100ms average response time
- 99.9% uptime for cached responses

### 8.3 Phase 3: Scalability (Weeks 9-12)

**Goals:**

- Enable horizontal scaling
- Implement load balancing
- Configure auto-scaling

**Tasks:**

1. Refactor state management
2. Set up load balancer
3. Configure auto-scaling
4. Implement session affinity

**Success Criteria:**

- Support 3+ instances
- Zero-downtime deployments
- Auto-scaling functional

### 8.4 Phase 4: Production Hardening (Weeks 13-16)

**Goals:**

- Security audit
- Performance optimization
- Documentation

**Tasks:**

1. Security audit and fixes
2. Performance testing and optimization
3. Complete documentation
4. Disaster recovery testing

**Success Criteria:**

- Pass security audit
- Meet SLA requirements
- Complete documentation

### 8.5 Risk Mitigation

| Risk                      | Impact | Probability | Mitigation                         |
| ------------------------- | ------ | ----------- | ---------------------------------- |
| Cache failures            | High   | Medium      | Multi-layer caching with fallbacks |
| Downtime during migration | High   | Low         | Blue-green deployment              |
| Performance regression    | Medium | Medium      | Load testing before each phase     |
| Security vulnerabilities  | High   | Low         | Security audit at each phase       |

---

## 9. Monitoring and Observability

### 9.1 Key Metrics

#### 9.1.1 Application Metrics

```
# Request Metrics
cliproxies_requests_total{method, endpoint, status}
cliproxies_request_duration_seconds{method, endpoint}
cliproxies_request_size_bytes
cliproxies_response_size_bytes

# Connection Metrics
cliproxies_active_connections
cliproxies_connections_total

# Cache Metrics
cliproxies_cache_hits_total{backend}
cliproxies_cache_misses_total{backend}
cliproxies_cache_evictions_total

# Provider Metrics
cliproxies_provider_requests_total{provider, model}
cliproxies_provider_errors_total{provider, error_type}
cliproxies_provider_latency_seconds{provider}
```

#### 9.1.2 Business Metrics

```
# Usage Metrics
cliproxies_active_users_total
cliproxies_tokens_processed_total{provider}
cliproxies_quota_exceeded_total{provider}

# Cost Metrics
cliproxies_cost_per_token{provider, model}
cliproxies_daily_spend{provider}
```

### 9.2 Alerting Rules

```yaml
# prometheus/alerts.yaml
groups:
  - name: cliproxies
    rules:
      - alert: HighErrorRate
        expr: rate(cliproxies_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: HighLatency
        expr: histogram_quantile(0.95, cliproxies_request_duration_seconds) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile latency above 1s"

      - alert: CacheHitRateLow
        expr: rate(cliproxies_cache_hits_total[5m]) / rate(cliproxies_cache_hits_total[5m] + rate(cliproxies_cache_misses_total[5m])) < 0.8
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Cache hit rate below 80%"
```

### 9.3 Logging Strategy

```go
// internal/logging/structured.go
package logging

import (
    "context"
    "time"

    "github.com/sirupsen/logrus"
)

type StructuredLogger struct {
    logger *logrus.Logger
}

func NewStructuredLogger(level string) *StructuredLogger {
    logger := logrus.New()
    logger.SetFormatter(&logrus.JSONFormatter{
        TimestampFormat: time.RFC3339,
        FieldMap: logrus.FieldMap{
            logrus.FieldKeyTime:  "timestamp",
            logrus.FieldKeyLevel: "level",
            logrus.FieldKeyMsg:   "message",
        },
    })

    l, _ := logrus.ParseLevel(level)
    logger.SetLevel(l)

    return &StructuredLogger{logger: logger}
}

func (sl *StructuredLogger) LogRequest(ctx context.Context, fields logrus.Fields) {
    fields["request_id"] = GetRequestID(ctx)
    sl.logger.WithFields(fields).Info("request")
}
```

---

## 10. Appendices

### 10.1 Configuration Reference

```yaml
# Complete configuration example
server:
  host: ""
  port: 8317
  tls:
    enable: false
    cert: ""
    key: ""

remote-management:
  allow-remote: false
  secret-key: "" # Use MANAGEMENT_PASSWORD env var
  disable-control-panel: false

auth:
  dir: "~/.cli-proxy-api"
  api-keys: []

cache:
  enable: true
  backend: "redis" # redis, memory, none
  redis:
    addr: "localhost:6379"
    password: ""
    db: 0
  ttl:
    signatures: "5m"
    responses: "1m"
    models: "15m"

database:
  primary:
    host: "${DB_HOST}"
    port: 5432
    name: "cliproxies"
    user: "${DB_USER}"
    password: "${DB_PASSWORD}"
    ssl_mode: "require"
  replicas: []
  pool:
    max_conns: 20
    min_conns: 5
    max_conn_lifetime: "1h"
    max_conn_idle_time: "30m"

proxygrid:
  enable: true
  base-url: "http://google.savedimage.com"
  api-key: "${PROXYGRID_API_KEY}"
  timeout: "30s"
  rate-limit:
    requests-per-minute: 100
    burst: 10
  fallback:
    strategy: "stale-cache"

logging:
  level: "info"
  to_file: true
  max_size_mb: 100

monitoring:
  prometheus:
    enable: true
    port: 9090
  tracing:
    enable: true
    exporter: "jaeger"
    endpoint: "${JAEGER_ENDPOINT}"
```

### 10.2 API Endpoints Reference

```
# Core API Endpoints
GET    /v1/models                      # List available models
POST   /v1/chat/completions           # Chat completion
POST   /v1/completions                # Text completion
POST   /v1/messages                   # Claude messages API

# Management API Endpoints
GET    /v0/management/config          # Get configuration
PUT    /v0/management/config          # Update configuration
GET    /v0/management/usage           # Usage statistics
GET    /v0/management/logs            # Request logs

# Proxy Grid API Endpoints (Proposed)
GET    /v1/proxygrid/serp             # Search results
GET    /v1/proxygrid/social/:platform # Social media data
POST   /v1/proxygrid/content          # Web content extraction
```

### 10.3 Glossary

| Term           | Definition                                     |
| -------------- | ---------------------------------------------- |
| CLIProxyAPI    | Go-based backend API gateway                   |
| cliproxies-web | Next.js frontend application                   |
| Proxy Grid     | External API service for SERP and web scraping |
| OAuth          | Open Authorization protocol for authentication |
| SERP           | Search Engine Results Page                     |
| ISR            | Incremental Static Regeneration                |
| KV             | Key-Value storage (Cloudflare Workers)         |
| HPA            | Horizontal Pod Autoscaler (Kubernetes)         |

---

## Document History

| Version | Date       | Author                     | Changes         |
| ------- | ---------- | -------------------------- | --------------- |
| 1.0     | 2026-01-12 | Solution Architecture Team | Initial release |

---

**End of Document**
