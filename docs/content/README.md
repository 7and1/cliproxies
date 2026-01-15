# CLIProxies Content Package

Production-ready content for the CLIProxies.com website and marketing materials.

---

## Content Files

| File                  | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `homepage-content.md` | Hero, features, CTAs, testimonials for homepage            |
| `documentation.md`    | Full getting started guide, API reference, troubleshooting |
| `marketing-copy.md`   | App descriptions, social posts, press kit, testimonials    |
| `seo-content.md`      | Meta descriptions, structured data, keywords, sitemaps     |

---

## Quick Reference

### Key Messages

1. **Unified Gateway**: One OpenAI-compatible API for all AI providers
2. **Self-Hosted**: Your infrastructure, your data, your control
3. **OAuth Support**: Use existing subscriptions without API keys
4. **AI Coding Tools**: Built for Claude Code, Cursor, and Cline
5. **Open Source**: Apache 2.0 licensed, community-driven

### Value Propositions by Persona

**Developer Power User (Primary)**

- Use ChatGPT Plus with Claude Code or Cursor
- Single config.yaml for all providers
- Model prefix routing (gpt-, claude-, gemini-)
- OAuth authentication

**DevOps/SRE (Secondary)**

- Self-hosted deployment
- Docker and Kubernetes support
- Management API for monitoring
- Load balancing and failover

**Non-technical User (Tertiary)**

- GUI apps in ecosystem (VibeProxy, ProxyPal)
- Simple setup instructions
- One-click config generator

### Supported AI Providers

| Provider  | Models             | Auth           |
| --------- | ------------------ | -------------- |
| OpenAI    | GPT-4, GPT-3.5     | API Key, OAuth |
| Anthropic | Claude 3, Claude 2 | API Key, OAuth |
| Google    | Gemini Pro, Ultra  | API Key, OAuth |
| Alibaba   | Qwen               | API Key, OAuth |
| iFlow     | Multiple           | OAuth          |
| Vertex AI | All Vertex         | API Key        |
| Custom    | OpenAI-compatible  | API Key        |

---

## Taglines

**Primary**

- "One Gateway. Unlimited AI."
- "Your Unified AI API Gateway"
- "Simplify Your AI Stack"

**Secondary**

- "The Proxy for AI Development"
- "Connect Every AI, Through One API"
- "Self-hosted, privacy-focused, open source"

---

## URLs

| Resource      | URL                                          |
| ------------- | -------------------------------------------- |
| Website       | https://cliproxies.com                       |
| GitHub        | https://github.com/router-for-me/CLIProxyAPI |
| Documentation | https://help.router-for.me                   |

---

## Implementation Notes

### Homepage Structure

```
Hero Section
    - Headline, subheadline, CTAs
    - OS-aware primary CTA
Stats Row
    - Ecosystem apps count
    - Provider count
    - Self-hosted badge
Feature Section 1
    - Why CLIProxyAPI?
    - 4 feature cards
Feature Section 2
    - Supported providers grid
Ecosystem Spotlight
    - Featured apps (3 cards)
Config Generator
    - Interactive YAML generator
Quick Start
    - 3-step setup guide
Sponsor Section
    - Gold/silver sponsors
Final CTA
    - Generate config, join community
```

### Tone Guidelines

- Technical but accessible
- Developer-focused
- Clear and concise
- Action-oriented
- Avoid jargon where possible

### Style Guide

- Use active voice
- British English (per PRD)
- Title case for headings
- Sentence case for UI labels
- Oxford commas in lists
- Code blocks with syntax highlighting

---

## Content Checklist

### Homepage

- [ ] Hero headline and subheadline
- [ ] OS-aware CTAs
- [ ] Stats row with live counts
- [ ] Feature cards (4)
- [ ] Provider grid
- [ ] Featured apps (3)
- [ ] Config generator section
- [ ] Quick start steps
- [ ] Sponsor cards
- [ ] Testimonials
- [ ] Final CTA

### Documentation

- [ ] What is CLIProxyAPI
- [ ] Quick start (30 seconds)
- [ ] Installation (macOS, Linux, Windows)
- [ ] Configuration reference
- [ ] Authentication guide
- [ ] Usage examples (cURL, tools)
- [ ] API reference
- [ ] Management API
- [ ] Troubleshooting
- [ ] Advanced topics (Docker, K8s)

### Marketing

- [ ] App store descriptions
- [ ] Feature highlights
- [ ] Social media posts (Twitter, LinkedIn)
- [ ] Newsletter templates
- [ ] Press kit boilerplate
- [ ] Comparison copy

### SEO

- [ ] Meta descriptions (all pages)
- [ ] H1/H2 structure
- [ ] Target keywords
- [ ] Structured data (JSON-LD)
- [ ] Sitemap
- [ ] Robots.txt

---

## Next Steps

1. **Review Content**: Team review of all content files
2. **Implement Homepage**: Update hero-section.tsx and page.tsx
3. **Expand Docs**: Add documentation pages to website
4. **SEO Audit**: Verify meta tags and structured data
5. **Launch Content**: Deploy and monitor engagement

---

## Version History

| Version | Date       | Changes                          |
| ------- | ---------- | -------------------------------- |
| 1.0     | 2025-01-12 | Initial content package creation |
