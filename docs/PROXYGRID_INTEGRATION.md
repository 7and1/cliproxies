# Proxy Grid API Integration

This document describes the integration of the Proxy Grid API into CLIProxyAPI.

## Overview

Proxy Grid is a third-party API service that provides access to:

- Search engines (Google, Bing, YouTube)
- Social media platforms (Twitter, Instagram, TikTok, Reddit)
- Web content (screenshots, markdown conversion, domain analytics)
- Commerce platforms (Amazon, Crunchbase)
- Tech news (HackerNews)

## Backend Integration (Go)

### Files Created

| File                                               | Description                           |
| -------------------------------------------------- | ------------------------------------- |
| `internal/api/modules/proxygrid/proxygrid.go`      | Main Proxy Grid module implementation |
| `internal/api/modules/proxygrid/proxygrid_test.go` | Unit tests for the module             |

### Files Modified

| File                            | Changes                                        |
| ------------------------------- | ---------------------------------------------- |
| `internal/config/sdk_config.go` | Added `ProxyGridConfig` type to SDKConfig      |
| `internal/api/server.go`        | Registered Proxy Grid module on server startup |

### Configuration

Add to your `config.yaml`:

```yaml
# Proxy Grid API integration settings
proxygrid:
  enabled: true
  base-url: "http://google.savedimage.com" # Optional, defaults to this
  secret: "your-secret-key" # Optional, uses default if not specified
  timeout: 30 # Optional, HTTP timeout in seconds
  rate-limit:
    requests-per-minute: 100
    burst: 20
  cache:
    enabled: true
    ttl-override-minutes: 0 # 0 = use service-specific TTLs
```

### API Endpoints

All endpoints are prefixed with `/v1/proxygrid` and require authentication (same as other CLIProxyAPI endpoints).

#### Search Services

- `GET /v1/proxygrid/search/google?q={query}` - Google search
- `GET /v1/proxygrid/search/bing?q={query}` - Bing search
- `GET /v1/proxygrid/search/youtube?q={query}` - YouTube search

#### Video Services

- `GET /v1/proxygrid/video/youtube/{id}` - Get YouTube video transcript
- `GET /v1/proxygrid/video/youtube/{id}/info` - Get YouTube video info

#### Social Media Services

- `GET /v1/proxygrid/social/twitter/{id}` - Get tweet data
- `GET /v1/proxygrid/social/instagram/{username}` - Get Instagram profile
- `GET /v1/proxygrid/social/tiktok/{username}` - Get TikTok profile
- `GET /v1/proxygrid/social/reddit?url={url}` - Get Reddit post data

#### Web Content Services

- `GET /v1/proxygrid/content/screenshot?url={url}` - Get screenshot (returns PNG)
- `GET /v1/proxygrid/content/markdown?url={url}` - Convert webpage to Markdown
- `GET /v1/proxygrid/content/similarweb/{domain}` - Get SimilarWeb analytics
- `GET /v1/proxygrid/content/hackernews?type={type}` - Get HackerNews stories

#### Commerce Services

- `GET /v1/proxygrid/commerce/amazon/{asin}` - Get Amazon product data
- `GET /v1/proxygrid/commerce/crunchbase/{slug}` - Get Crunchbase organization data

### Cache TTL Strategy

| Service              | TTL        |
| -------------------- | ---------- |
| YouTube (transcript) | 30 days    |
| YouTube (info)       | 7 days     |
| YouTube (search)     | 4 hours    |
| Google/Bing search   | 4 hours    |
| SimilarWeb           | 7 days     |
| Web to Markdown      | 24 hours   |
| Screenshot           | 1 hour     |
| Reddit/Twitter       | 15 minutes |
| HackerNews           | 15 minutes |
| Instagram/TikTok     | 24 hours   |
| Amazon/Crunchbase    | 24 hours   |

## Frontend Integration (Next.js)

### Files Created

| File                                       | Description                    |
| ------------------------------------------ | ------------------------------ |
| `src/lib/proxygrid.ts`                     | TypeScript client library      |
| `src/app/api/proxygrid/[...path]/route.ts` | API proxy route (edge runtime) |
| `src/components/proxygrid-search.tsx`      | Search UI component            |
| `src/components/proxygrid-youtube.tsx`     | YouTube info UI component      |
| `src/components/proxygrid-hackernews.tsx`  | HackerNews UI component        |
| `src/app/proxygrid/page.tsx`               | Demo/documentation page        |

### Usage Example

```typescript
import proxygrid from "@/lib/proxygrid";

// Google search
const results = await proxygrid.search.google("best espresso machine");

// YouTube video info
const info = await proxygrid.video.youtubeInfo("dQw4w9WgXcQ");

// HackerNews stories
const stories = await proxygrid.content.hackernews("top");

// Clear cache
proxygrid.cache.invalidate("google"); // Clear specific service
proxygrid.cache.invalidate("*"); // Clear all cache
```

### Environment Variables

```bash
# Optional: Override backend URL (default: proxy to CLIProxyAPI backend)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8317

# Optional: Direct Proxy Grid API URL
NEXT_PUBLIC_PROXYGRID_API_URL=http://google.savedimage.com
```

## Testing

Run backend tests:

```bash
cd /Volumes/SSD/dev/proxy/cliproxies/CLIProxyAPI
go test ./internal/api/modules/proxygrid/... -v
```

## Production Considerations

1. **Authentication**: All Proxy Grid endpoints require the same authentication as other CLIProxyAPI endpoints
2. **Rate Limiting**: Configure rate limiting in the Proxy Grid config to prevent abuse
3. **Caching**: Responses are cached in-memory with service-specific TTLs
4. **Stale Cache**: On API errors, stale cache is returned if available
5. **Memory Usage**: Cache entries are automatically cleaned up when expired

## Development

To add a new service:

1. Add the handler method in `proxygrid.go`
2. Register the route in the appropriate `register*Routes` method
3. Add the TypeScript types and client method in `proxygrid.ts`
4. Update this documentation
