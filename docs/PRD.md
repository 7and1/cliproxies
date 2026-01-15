# CLIProxies Production Optimization PRD

**Document Version:** 1.0
**Last Updated:** 2025-01-12
**Status:** Draft
**Target Release:** P2 (Production-Ready)

---

## 1. Product Vision & Goals

### 1.1 Vision Statement

CLIProxies.com will become the central hub for the CLIProxyAPI ecosystem - a production-grade platform that serves developers, power users, and enterprise customers seeking unified access to AI provider APIs through a single, open-source proxy gateway.

### 1.2 Primary Objectives

| Objective               | Success Criteria                   | Target  |
| ----------------------- | ---------------------------------- | ------- |
| **Backend Reliability** | 99.9% uptime, <100ms p95 latency   | Q1 2025 |
| **Frontend Conversion** | Config downloads > 500/month       | Q2 2025 |
| **Ecosystem Growth**    | 15+ ecosystem apps listed          | Q1 2025 |
| **SEO Performance**     | Top 10 results for "AI proxy CLI"  | Q2 2025 |
| **User Retention**      | 40% return visitors within 30 days | Q2 2025 |

### 1.3 Target Personas

**Primary: Developer Power User**

- Uses AI coding tools (Claude Code, Cursor, Cline)
- Has multiple AI provider subscriptions
- Values self-hosting and data privacy
- Technical proficiency: High

**Secondary: DevOps/SRE**

- Manages proxy infrastructure for teams
- Needs monitoring and observability
- Requires enterprise deployment options
- Technical proficiency: Expert

**Tertiary: Non-technical User**

- Uses ecosystem GUI apps (VibeProxy, Quotio)
- Needs simple setup instructions
- Values convenience over customization
- Technical proficiency: Low-Medium

---

## 2. User Stories & Use Cases

### 2.1 Core User Stories

#### Epic 1: Quick Start

| Story                                                                | Priority | Acceptance Criteria                                                   |
| -------------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| As a developer, I want to generate a config.yaml in under 30 seconds | P0       | Config generator produces valid YAML; download works on all platforms |
| As a developer, I want to see platform-specific setup instructions   | P0       | OS detection auto-reveals relevant install commands                   |
| As a developer, I want to verify my setup works without reading docs | P1       | Status page shows green checkmarks for each provider                  |

#### Epic 2: Ecosystem Discovery

| Story                                                         | Priority | Acceptance Criteria                         |
| ------------------------------------------------------------- | -------- | ------------------------------------------- |
| As a user, I want to find apps that work on my OS             | P0       | Platform filter works; counts accurate      |
| As a user, I want to see community adoption before installing | P1       | GitHub stars displayed via ISR              |
| As a developer, I want to submit my app to the directory      | P2       | Submission form or PR guidelines documented |

#### Epic 3: Integration with Proxy Grid API

| Story                                                          | Priority | Acceptance Criteria                         |
| -------------------------------------------------------------- | -------- | ------------------------------------------- |
| As a developer, I want to access SERP data through CLIProxyAPI | P1       | Google/Bing SERP endpoints available        |
| As a developer, I want to convert web content to Markdown      | P1       | Web-to-Markdown endpoint integrated         |
| As a developer, I want enriched metadata for YouTube videos    | P2       | YouTube info/transcript endpoints available |

### 2.2 Use Case Flows

**Flow 1: New User Onboarding**

```
1. Lands on homepage via organic search
2. Sees hero section explaining value proposition
3. Clicks "Generate Config" CTA
4. Selects providers, enters API keys
5. Downloads config.yaml
6. Follows platform-specific install guide
7. Verifies connection via status page
```

**Flow 2: Ecosystem App Discovery**

```
1. Navigates to /apps
2. Filters by platform (macOS)
3. Reviews featured apps with star counts
4. Clicks through to GitHub repository
5. Stars repo, installs via package manager
```

**Flow 3: Troubleshooting**

```
1. Experiences proxy error
2. Visits /status page
3. Checks provider status indicators
4. Views real-time logs (if authenticated)
5. Follows resolution steps from docs
```

---

## 3. Functional Requirements - Backend (CLIProxyAPI)

### 3.1 Core API Features

#### 3.1.1 Multi-Provider Proxying

| Provider                 | Support Level | Implementation Status |
| ------------------------ | ------------- | --------------------- |
| OpenAI (Codex)           | Full          | Implemented           |
| Claude (Anthropic)       | Full          | Implemented           |
| Gemini (Google)          | Full          | Implemented           |
| Qwen (Alibaba)           | Full          | Implemented           |
| iFlow                    | Full          | Implemented           |
| Custom OpenAI-Compatible | Full          | Implemented           |
| Vertex AI                | Full          | Implemented           |

**Requirements:**

- [x] Unified `/v1/chat/completions` endpoint supporting all providers
- [x] Provider-specific routing via model prefix
- [x] Automatic format translation between provider schemas
- [x] Streaming and non-streaming response modes
- [ ] Request queuing with priority levels (P2)
- [ ] Circuit breaker pattern for failing providers (P1)

#### 3.1.2 Authentication

**Current State:**

- API key authentication
- OAuth flows for 6 providers
- Session-based token storage

**Production Requirements:**

- [ ] JWT-based management API tokens with expiry
- [ ] API key rotation without restart
- [ ] Role-based access control (RBAC) for team deployments
- [ ] Audit logging for all auth events
- [ ] Rate limiting per API key (configurable)

#### 3.1.3 Load Balancing

**Current Implementation:**

- Round-robin strategy
- Fill-first alternative
- Per-provider credential pools

**Production Enhancements:**

- [ ] Weighted round-robin for heterogeneous credentials
- [ ] Least-connections routing
- [ ] Health check-based exclusion
- [ ] Geographic routing hints
- [ ] Quota-aware routing (avoid depleted accounts)

#### 3.1.4 Management API

**Required Endpoints (P0):**

| Endpoint                | Method     | Purpose                |
| ----------------------- | ---------- | ---------------------- |
| `/v0/management/config` | GET/PUT    | Runtime config updates |
| `/v0/management/usage`  | GET        | Usage statistics       |
| `/v0/management/logs`   | GET/DELETE | Log access             |
| `/v0/management/health` | GET        | Health check           |

**Additional Endpoints (P1):**

- `/v0/management/providers` - CRUD for provider configs
- `/v0/management/credentials` - Secure credential management
- `/v0/management/webhooks` - Event notifications

### 3.2 Storage Backends

| Backend     | Use Case                   | Priority |
| ----------- | -------------------------- | -------- |
| File System | Local development          | P0       |
| PostgreSQL  | Distributed deployments    | P1       |
| Git Store   | Version-controlled configs | P2       |
| S3/MinIO    | Cloud-native storage       | P2       |

**Requirements:**

- [ ] Abstracted storage interface
- [ ] Hot-swappable storage backend
- [ ] Backup/restore functionality
- [ ] Migration utilities between backends

### 3.3 Observability

**Metrics Collection:**

- [ ] Prometheus metrics export
- [ ] OpenTelemetry tracing
- [ ] Per-provider success/error rates
- [ ] Latency percentiles (p50, p95, p99)
- [ ] Quota consumption tracking

**Logging:**

- [x] Structured JSON logging
- [ ] Log level adjustments at runtime
- [ ] Request/response correlation IDs
- [ ] Sensitive data redaction

### 3.4 Deployment

| Target            | Current   | Target             |
| ----------------- | --------- | ------------------ |
| Docker            | Supported | Multi-arch images  |
| Kubernetes        | Manual    | Helm chart         |
| Cloudflare        | No        | Workers compatible |
| Standalone binary | Supported | Enhanced for edge  |

---

## 4. Functional Requirements - Frontend (cliproxies-web)

### 4.1 Page Requirements

#### 4.1.1 Homepage (/)

**Sections:**

1. **Hero** (P0)
   - Clear value proposition
   - OS-aware primary CTA
   - Animated gradient background

2. **Stats Row** (P0)
   - Ecosystem app count
   - Platform coverage
   - Sponsor count

3. **Featured Apps** (P0)
   - 3-card grid
   - Star counts via ISR
   - Platform badges

4. **Config Generator** (P0)
   - Live YAML preview
   - One-click download
   - Provider selection

5. **Sponsors** (P1)
   - Gold tier prominent
   - Coupon copy-to-clipboard
   - UTM tracking on outbound links

#### 4.1.2 Apps Directory (/apps)

**Features:**

- [ ] Grid/list view toggle
- [ ] Platform filter (macOS/Windows/Linux/Web)
- [ ] Tag filter (CLI/GUI/TUI)
- [ ] Search functionality
- [ ] Sort by popularity/recent
- [ ] "Submit your app" CTA

#### 4.1.3 Documentation (/docs)

**Options (select one):**

- Option A: Embed help.router-for.me via iframe
- Option B: Redirect to official docs
- Option C: Mirror content with ISR

**Recommended:** Option B (redirect) to maintain single source of truth

#### 4.1.4 Status Page (/status)

**Components:**

- [ ] Provider status indicators (green/yellow/red)
- [ ] Incident history (last 7 days)
- [ ] Response time graphs
- [ ] Subscribe to updates (RSS/email)

#### 4.1.5 Config Generator Component

**Inputs:**

- Port number (default: 8317)
- API keys (multi-entry)
- Provider selections
- Routing strategy
- Optional: TLS config

**Outputs:**

- Live YAML preview with syntax highlighting
- One-click download
- Copy to clipboard
- Validation feedback

### 4.2 UI/UX Requirements

#### 4.2.1 Design System

**Theme:** Dark-first with gold accents (geek aesthetic)

- Primary: Gold/Amber for CTAs
- Secondary: Slate/Gray for structure
- Background: Nearly black (#0a0a0a)
- Text: High contrast off-white

**Components (shadcn/ui):**

- Button, Card, Badge, Tabs
- Dialog, Select, Input
- Toast notifications

#### 4.2.2 Responsive Design

| Breakpoint  | Target Devices              |
| ----------- | --------------------------- |
| < 640px     | Mobile phones               |
| 640-768px   | Large phones, small tablets |
| 768-1024px  | Tablets                     |
| 1024-1280px | Small laptops               |
| > 1280px    | Desktops                    |

#### 4.2.3 Accessibility

- [ ] WCAG 2.1 Level AA compliance
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader optimized
- [ ] Focus indicators visible
- [ ] Color contrast ratio >= 4.5:1

### 4.3 Performance Requirements

| Metric                  | Target | Measurement    |
| ----------------------- | ------ | -------------- |
| Initial Load            | < 1.5s | Lighthouse     |
| First Contentful Paint  | < 1.0s | Lighthouse     |
| Time to Interactive     | < 2.0s | Lighthouse     |
| Cumulative Layout Shift | < 0.1  | Lighthouse     |
| Lighthouse Score        | > 90   | All categories |

---

## 5. SEO Requirements

### 5.1 Technical SEO

#### 5.1.1 Core Implementation

| Requirement     | Implementation   | Priority |
| --------------- | ---------------- | -------- |
| Meta tags       | Dynamic per page | P0       |
| Open Graph      | All pages        | P0       |
| Twitter Cards   | All pages        | P0       |
| Structured Data | JSON-LD          | P0       |
| Sitemap         | Auto-generated   | P0       |
| Robots.txt      | Configured       | P0       |
| Canonical URLs  | Set correctly    | P0       |

#### 5.1.2 Structured Data

**Organization Schema:**

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CLIProxyAPI",
  "url": "https://cliproxies.com",
  "logo": "https://cliproxies.com/logo.png",
  "sameAs": ["https://github.com/router-for-me/CLIProxyAPI"]
}
```

**Software Application Schema (for each app):**

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "CLIProxyAPI",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "macOS, Windows, Linux",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

### 5.2 Content Strategy

#### 5.2.1 Target Keywords

**Primary Keywords:**

- "AI proxy server"
- "CLI API gateway"
- "OpenAI proxy"
- "Claude proxy"
- "Gemini CLI proxy"

**Long-tail Keywords:**

- "how to use Claude Code with proxy"
- "self-hosted AI API gateway"
- "multi-provider AI proxy"
- "OAuth AI proxy without API keys"

#### 5.2.2 Content Calendar

| Content Type      | Frequency | Target               |
| ----------------- | --------- | -------------------- |
| Blog posts        | 2x/month  | Tutorials, use cases |
| Case studies      | Quarterly | User success stories |
| Changelog         | Monthly   | Release notes        |
| Comparison guides | Quarterly | vs alternatives      |

### 5.3 Link Building

- [ ] GitHub README backlinks
- [ ] Ecosystem app mentions
- [ ] Developer forum engagement
- [ ] Technical tutorial submissions
- [ ] Open source directory listings

---

## 6. Content Requirements

### 6.1 Essential Pages

| Page      | Word Count Target | Status      |
| --------- | ----------------- | ----------- |
| Home      | 300-400           | Implemented |
| About     | 400-500           | Needed      |
| Docs      | N/A (redirect)    | Partial     |
| Apps      | 50-100 per app    | Partial     |
| Status    | 200-300           | Implemented |
| Changelog | Per release       | Needed      |

### 6.2 Copy Guidelines

**Tone:** Technical but approachable

- Assume developer audience
- Use active voice
- Avoid jargon where possible
- Include code examples

**Style:**

- British English (per existing README)
- Title case for headings
- Sentence case for UI labels
- Oxford commas

### 6.3 Asset Requirements

| Asset         | Dimensions     | Format    | Priority |
| ------------- | -------------- | --------- | -------- |
| Logo          | 200x60px       | SVG + PNG | P0       |
| Favicon       | 32x32, 16x16px | ICO       | P0       |
| OG Image      | 1200x630px     | PNG       | P0       |
| Sponsor logos | 200x80px       | PNG       | P1       |
| App icons     | 128x128px      | PNG       | P2       |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric              | Backend Target | Frontend Target |
| ------------------- | -------------- | --------------- |
| Response Time (p95) | < 100ms        | < 200ms (TTFB)  |
| Throughput          | > 1000 req/s   | N/A             |
| Cold Start          | < 500ms        | < 1s (edge)     |
| Memory              | < 512MB        | < 50MB (bundle) |

### 7.2 Security

**Backend:**

- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting (per IP, per key)
- [ ] CORS configurable
- [ ] Secrets not in logs
- [ ] Dependency scanning (Snyk/Dependabot)

**Frontend:**

- [ ] CSP headers configured
- [ ] No eval() or dangerous innerHTML
- [ ] Dependency updates automated
- [ ] ENV vars only on server-side

### 7.3 Scalability

**Horizontal Scaling:**

- Stateless API design
- Redis session store option
- Database connection pooling
- Load balancer compatible

**Vertical Scaling:**

- Configurable worker pools
- Memory-mapped file options
- GZIP compression toggle

### 7.4 Reliability

| Requirement    | Target                       |
| -------------- | ---------------------------- |
| Uptime SLA     | 99.9% (43min/month downtime) |
| Error Rate     | < 0.1% of requests           |
| Data Loss      | Zero (for configs)           |
| Recovery Time  | < 5min (RTO)                 |
| Recovery Point | < 1min (RPO)                 |

### 7.5 Maintainability

- Code coverage > 70%
- Documentation coverage > 80%
- Linter passing (golangci-lint, ESLint)
- CI/CD pipeline automated
- Semantic versioning

---

## 8. Integration Requirements - Proxy Grid API

### 8.1 Connection Details

```
Base URL: http://google.savedimage.com
Secret: 21ab30d5ec9e26c4e425b2c76320c296dbb7e6d2d51cad700892c7752ca005c0
```

### 8.2 Service Integration Map

| Service            | Endpoint Method | Use Case                  | Priority |
| ------------------ | --------------- | ------------------------- | -------- |
| Google SERP        | GET             | Search result aggregation | P1       |
| Bing SERP          | GET             | Alternative search source | P2       |
| YouTube Transcript | GET             | Content extraction        | P1       |
| YouTube Info       | GET             | Video metadata            | P1       |
| YouTube SERP       | GET             | Video search              | P2       |
| SimilarWeb         | GET             | Traffic analytics         | P2       |
| Web to Markdown    | GET             | Content conversion        | P1       |
| Screenshots        | GET             | Visual capture            | P2       |
| Hacker News        | GET             | Tech news feed            | P2       |
| Reddit             | GET             | Discussion threads        | P2       |
| Twitter            | GET             | Social data               | P2       |
| Instagram          | GET             | Media data                | P2       |
| TikTok             | GET             | Video metadata            | P2       |
| Amazon             | GET             | Product data              | P2       |
| Crunchbase         | GET             | Company info              | P2       |

### 8.3 Implementation Architecture

```
CLIProxyAPI Backend
├── /v1/proxy/* (new route group)
│   ├── /serp/google
│   ├── /serp/bing
│   ├── /youtube/transcript
│   ├── /youtube/info
│   ├── /youtube/search
│   ├── /web/markdown
│   ├── /web/screenshot
│   └── /social/{platform}
└── Proxy Grid Client (Go module)
    ├── HTTP client with secret auth
    ├── Response parsers
    ├── Error handling
    └── Rate limiting wrapper
```

### 8.4 API Specification

**Proxy Grid Client Module:**

```go
// internal/proxygrid/client.go
package proxygrid

type Client struct {
    BaseURL string
    Secret  string
    HTTP    *http.Client
}

func (c *Client) GoogleSERP(ctx context.Context, query string) (*SERPResponse, error)
func (c *Client) YouTubeTranscript(ctx context.Context, videoID string) (*TranscriptResponse, error)
func (c *Client) WebToMarkdown(ctx context.Context, url string) (*MarkdownResponse, error)
```

**Management API Endpoints:**

```
GET  /v0/management/proxygrid/status
GET  /v0/management/proxygrid/usage
PUT  /v0/management/proxygrid/config
```

### 8.5 Rate Limiting Strategy

| Service      | Rate Limit | Reason          |
| ------------ | ---------- | --------------- |
| SERP APIs    | 10 req/min | Cost control    |
| YouTube      | 30 req/min | Free tier       |
| Social       | 20 req/min | Platform limits |
| Web/Markdown | 50 req/min | Lower cost      |

### 8.6 Frontend Integration

**New Page: /integrations**

- Proxy Grid service catalog
- Code examples for each endpoint
- Interactive API playground
- Rate limit display

---

## 9. Success Metrics & Acceptance Criteria

### 9.1 Phase 1 - Foundation (Week 1-4)

| Metric             | Baseline | Target | How to Measure     |
| ------------------ | -------- | ------ | ------------------ |
| Build success rate | N/A      | 100%   | CI/CD passing      |
| Test coverage      | ~0%      | 60%    | go test, vitest    |
| Lighthouse score   | N/A      | >80    | Lighthouse CI      |
| Deploy time        | Manual   | <5 min | Automated pipeline |

**Exit Criteria:**

- [ ] All P0 backend tests passing
- [ ] Frontend builds without warnings
- [ ] Deployed to staging environment
- [ ] Smoke tests passing

### 9.2 Phase 2 - Content & SEO (Week 5-8)

| Metric          | Baseline | Target        | How to Measure        |
| --------------- | -------- | ------------- | --------------------- |
| Organic traffic | N/A      | 100 visits/mo | Google Analytics      |
| SERP position   | N/A      | Top 50        | Ahrefs/SEMrush        |
| Indexed pages   | 0        | 20+           | Google Search Console |
| Backlinks       | Existing | +10           | Ahrefs                |

**Exit Criteria:**

- [ ] All core pages indexed
- [ ] Sitemap submitted
- [ ] Core Web Vitals passing
- [ ] Meta tags complete

### 9.3 Phase 3 - Proxy Grid Integration (Week 9-12)

| Metric                | Baseline | Target | How to Measure |
| --------------------- | -------- | ------ | -------------- |
| Integration endpoints | 0        | 5      | Code count     |
| Success rate          | N/A      | >95%   | Monitoring     |
| Response time (p95)   | N/A      | <2s    | Metrics        |
| Documentation         | 0        | 100%   | Doc coverage   |

**Exit Criteria:**

- [ ] SERP integration working
- [ ] YouTube integration working
- [ ] Web-to-Markdown working
- [ ] API documentation complete

### 9.4 Phase 4 - Production Hardening (Week 13-16)

| Metric        | Baseline | Target     | How to Measure    |
| ------------- | -------- | ---------- | ----------------- |
| Uptime        | N/A      | 99.9%      | Uptime monitoring |
| Error rate    | Unknown  | <0.1%      | Error tracking    |
| Response time | Unknown  | <100ms p95 | APM               |
| Security scan | Not done | 0 critical | Snyk              |

**Exit Criteria:**

- [ ] Security audit passed
- [ ] Load tested to 1000 req/s
- [ ] Disaster recovery documented
- [ ] On-call runbook created

---

## 10. Implementation Roadmap

### 10.1 Sprint 1-2: Backend Foundation

**Backend:**

- [ ] Add Prometheus metrics endpoint
- [ ] Implement health check endpoint
- [ ] Add structured logging middleware
- [ ] Create Docker multi-arch build
- [ ] Write integration tests

### 10.2 Sprint 3-4: Frontend Foundation

**Frontend:**

- [ ] Complete homepage sections
- [ ] Implement config generator
- [ ] Add OS detection hook
- [ ] Create apps directory page
- [ ] Set up analytics

### 10.3 Sprint 5-6: SEO & Content

**Content:**

- [ ] Write all page copy
- [ ] Implement meta tags
- [ ] Add structured data
- [ ] Create sitemap
- [ ] Submit to search consoles

### 10.4 Sprint 7-8: Proxy Grid Integration

**Integration:**

- [ ] Create Go client module
- [ ] Implement SERP endpoints
- [ ] Add YouTube endpoints
- [ ] Add Web-to-Markdown
- [ ] Create /integrations page

### 10.5 Sprint 9-10: Production Hardening

**Production:**

- [ ] Security audit
- [ ] Load testing
- [ ] Set up monitoring
- [ ] Create runbooks
- [ ] Final documentation

---

## 11. Open Questions

| Question                       | Impact            | Decision Needed By |
| ------------------------------ | ----------------- | ------------------ |
| Hosting provider for frontend? | Cost, performance | Sprint 1           |
| CDN strategy?                  | Global latency    | Sprint 2           |
| Analytics provider?            | User privacy      | Sprint 2           |
| Proxy Grid rate limits?        | Cost management   | Sprint 4           |
| Monetization strategy?         | Sustainability    | Sprint 6           |

---

## 12. Risks & Mitigations

| Risk                   | Probability | Impact   | Mitigation                           |
| ---------------------- | ----------- | -------- | ------------------------------------ |
| Proxy Grid API changes | Medium      | High     | Version client, document assumptions |
| SEO competition        | High        | Medium   | Focus on long-tail, build backlinks  |
| Security vulnerability | Low         | Critical | Regular audits, dependency updates   |
| Hosting cost overruns  | Medium      | Medium   | Usage monitoring, caching            |
| Contributor burnout    | Medium      | High     | Simplify contribution process        |

---

## Appendix A: Technical Stack Summary

### Backend (CLIProxyAPI)

- Language: Go 1.24
- Framework: Gin
- Database: PostgreSQL (optional)
- Storage: File / Git / S3 / MinIO
- Auth: OAuth2 (6 providers)
- Deployment: Docker / Standalone

### Frontend (cliproxies-web)

- Framework: Next.js 15.5
- UI: React 19, Tailwind CSS v4
- Components: shadcn/ui (Radix)
- State: Zustand
- Deploy: Cloudflare Workers (@opennextjs/cloudflare)
- Analytics: PostHog (optional)

### DevOps

- CI/CD: GitHub Actions
- Container: Docker
- Monitoring: Prometheus + Grafana (planned)
- Logging: Structured JSON (logrus)

---

## Appendix B: Reference Links

| Resource         | URL                                          |
| ---------------- | -------------------------------------------- |
| CLIProxyAPI Repo | https://github.com/router-for-me/CLIProxyAPI |
| Official Docs    | https://help.router-for.me/                  |
| Next.js Docs     | https://nextjs.org/docs                      |
| Cloudflare Pages | https://developers.cloudflare.com/pages      |
| Proxy Grid API   | http://google.savedimage.com                 |
| Hub Strategy     | ./hub-strategy/README.md                     |

---

**Document History**

| Version | Date       | Author          | Changes              |
| ------- | ---------- | --------------- | -------------------- |
| 1.0     | 2025-01-12 | Product Manager | Initial PRD creation |
