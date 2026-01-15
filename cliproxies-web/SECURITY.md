# Security Policy

## Security Headers

The following security headers are implemented across all pages:

| Header                         | Value                                          | Purpose                                                 |
| ------------------------------ | ---------------------------------------------- | ------------------------------------------------------- |
| `Content-Security-Policy`      | See below                                      | Prevents XSS, clickjacking, and other injection attacks |
| `X-Frame-Options`              | `DENY`                                         | Prevents clickjacking                                   |
| `X-Content-Type-Options`       | `nosniff`                                      | Prevents MIME sniffing                                  |
| `Referrer-Policy`              | `strict-origin-when-cross-origin`              | Controls referrer information                           |
| `Permissions-Policy`           | `camera=(), microphone=(), geolocation=()`     | Restricts browser features                              |
| `Strict-Transport-Security`    | `max-age=31536000; includeSubDomains; preload` | Enforces HTTPS                                          |
| `Cross-Origin-Opener-Policy`   | `same-origin`                                  | Isolates browsing contexts                              |
| `Cross-Origin-Resource-Policy` | `same-origin`                                  | Prevents cross-origin resource loading                  |
| `Cross-Origin-Embedder-Policy` | `require-corp`                                 | Requires COOP/COEP for advanced features                |

## Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
font-src 'self' data:;
connect-src 'self' https://*.router-for.me https://github.com https://opengraph.githubassets.com;
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

## Input Validation

All user inputs are validated and sanitized:

- **Search queries**: Min 2 chars, max 500 chars, HTML tags removed
- **URL parameters**: Protocol validation (http/https only), hostname validation
- **GitHub repositories**: Format validation (`owner/repo` or full URL)
- **YouTube IDs**: Exact 11-character alphanumeric validation
- **API keys**: Length validation (10-256 chars), injection character checks

## Rate Limiting

API routes implement rate limiting:

| Endpoint            | Limit        | Window   |
| ------------------- | ------------ | -------- |
| `/api/github-stars` | 30 requests  | 1 minute |
| `/api/proxygrid/*`  | 100 requests | 1 minute |

Rate limit headers are included in responses:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` (when limited)

## API Security

### Authentication

- `PROXYGRID_SECRET`: Server-side only, never exposed to client
- `GITHUB_TOKEN`: Server-side only, used for GitHub API requests

### Error Handling

- Generic error messages in production
- No stack traces or internal details exposed
- Proper HTTP status codes

### CORS

- Default same-origin policy
- No wildcard `Access-Control-Allow-Origin`

## Data Protection

### Client-Side Data

- API keys stored only in browser memory (Zustand state)
- No localStorage/sessionStorage for sensitive data
- Keys are redacted in UI display

### Server-Side Data

- Environment variables never logged
- Secrets not included in client bundles
- Proper secret management via Cloudflare Workers env

## Dependencies

- Regular security audits via `pnpm audit`
- Automatic dependency updates via Renovate/Dependabot recommended
- No direct eval() usage in application code

## Reporting Vulnerabilities

To report a security vulnerability:

1. Do NOT open a public issue
2. Send details to: security@cliproxies.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

Response times:

- Critical: Within 24 hours
- High: Within 48 hours
- Medium: Within 1 week

## Security Checklist

- [x] Content Security Policy implemented
- [x] XSS protection (input sanitization)
- [x] CSRF protection (same-origin, stateless API)
- [x] SQL Injection protection (no SQL database)
- [x] Rate limiting on API routes
- [x] Security headers configured
- [x] HTTPS enforcement (HSTS)
- [x] No sensitive data in client-side code
- [x] Environment variables properly managed
- [x] Error messages don't leak information
- [x] Dependencies regularly updated
- [x] Image optimization security
- [x] Open redirect protection
