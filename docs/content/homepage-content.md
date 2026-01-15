# Homepage Content Specification

## Hero Section

### Headline

**Primary (H1):**

```
The Unified AI Proxy Gateway for Developers
```

**Alternative options:**

- "One Proxy, All AI Providers"
- "Your AI API Gateway, Self-Hosted"
- "Connect Claude Code, Cursor, and Cline to Any AI Provider"

### Subheadline

```
Route OpenAI, Claude, Gemini, and more through a single OpenAI-compatible endpoint.
Self-hosted, privacy-focused, and built for AI coding tools.
```

### Primary CTA (OS-aware)

- **macOS:** "Get Started for macOS"
- **Windows:** "Download for Windows"
- **Linux:** "Install on Linux"
- **Default:** "Generate Config"

### Secondary CTA

```
Explore Ecosystem Apps
```

### Value Proposition Points

```
- Single config.yaml for all providers
- Works with Claude Code, Cursor, Cline
- OAuth support - no API keys required
- Open-source and extensible
```

---

## Stats Row

| Metric | Label          | Description                                        |
| ------ | -------------- | -------------------------------------------------- |
| 15+    | Ecosystem Apps | Community-built clients                            |
| 7      | AI Providers   | OpenAI, Claude, Gemini, Qwen, iFlow, Vertex, Codex |
| 100%   | Self-Hosted    | Your infra, your rules                             |

---

## Feature Section 1: Why CLIProxyAPI?

### Heading

```
Stop managing multiple API endpoints
```

### Description

```
CLIProxyAPI unifies access to AI providers through a single OpenAI-compatible interface.
Configure once, route intelligently, and switch providers without changing your application code.
```

### Feature Cards

**Card 1: Unified Interface**

```
Headline: One endpoint, multiple providers
Description: Route requests to OpenAI, Claude, Gemini, or Qwen using model prefixes. All providers respond in OpenAI format.
Code: POST /v1/chat/completions
```

**Card 2: OAuth Authentication**

```
Headline: No API keys required
Description: Connect your existing ChatGPT Plus, Claude, or Gemini accounts through OAuth. Credentials stored locally, never sent to third parties.
```

**Card 3: AI Coding Tool Support**

```
Headline: Built for Claude Code, Cursor, Cline
Description: Works out of the box with popular AI coding environments. Just set your API base URL and go.
```

**Card 4: Smart Routing**

```
Headline: Load balancing and failover
Description: Distribute requests across multiple credentials. Automatically retry failed requests on alternative providers.
```

---

## Feature Section 2: Supported AI Providers

### Heading

```
Connect to the AI services you already use
```

### Provider Grid

| Provider      | Models             | Status | Notes                   |
| ------------- | ------------------ | ------ | ----------------------- |
| **OpenAI**    | GPT-4, GPT-3.5     | Full   | API key or OAuth        |
| **Anthropic** | Claude 3, Claude 2 | Full   | API key or OAuth        |
| **Google**    | Gemini Pro, Ultra  | Full   | API key or OAuth        |
| **Alibaba**   | Qwen               | Full   | API key or OAuth        |
| **iFlow**     | Multiple models    | Full   | OAuth                   |
| **Vertex AI** | All Vertex models  | Full   | API key                 |
| **Custom**    | OpenAI-compatible  | Full   | Any compatible endpoint |

---

## Ecosystem Spotlight Section

### Heading

```
Apps built on CLIProxyAPI
```

### Subheading

```
Community-developed clients for every platform. From menu bar apps to CLI tools, find the perfect interface for your workflow.
```

### CTA

```
Browse All Apps →
```

---

## Config Generator Section

### Heading

```
Get running in under 60 seconds
```

### Subheading

```
Generate a production-ready config.yaml customized for your setup. No YAML knowledge required.
```

### Value Props

```
- Auto-detects your OS and platform
- Pre-configured for common providers
- One-command download and start
- Validated against CLIProxyAPI schema
```

### Generator Form Labels

```
Port: [8317]                         # Default port
Providers: [☑ OpenAI] [☑ Claude] [☑ Gemini]
Authentication: [API Key] [OAuth]
Advanced Options: [Show ▼]
```

### CTA

```
[Download config.yaml] [Copy to clipboard]
```

---

## Quick Start Section

### Heading

```
Three steps to your unified AI gateway
```

### Steps

**Step 1: Generate Config**

```
Use the config generator above to create your config.yaml file with your selected providers.
```

**Step 2: Install CLIProxyAPI**

```
# macOS/Linux
curl -fsSL https://install.cliproxies.com | sh

# Or with Go
go install github.com/router-for-me/CLIProxyAPI/v6/cmd/cli-proxy-api@latest

# Docker
docker pull ghcr.io/cli-proxy-api/cli-proxy-api:latest
```

**Step 3: Start the Proxy**

```
cli-proxy-api --config config.yaml

# Your proxy is now running at http://localhost:8317
```

---

## Sponsor Section

### Heading

```
Sponsored by providers who support open-source
```

### Subheading

```
Special offers for CLIProxyAPI users. Use promo codes to save on API relay services.
```

### Sponsor CTA

```
View all sponsor deals →
```

---

## Testimonials / Social Proof

### Heading

```
Trusted by developers worldwide
```

### Testimonial 1

```
"CLIProxyAPI let me use my ChatGPT Plus subscription with Claude Code.
Setup took literally 5 minutes."
— Developer at Series B startup
```

### Testimonial 2

```
"The failover routing saved us during the OpenAI outage.
Our requests just seamlessly switched to Claude."
— DevOps Engineer
```

### Testimonial 3

```
"Finally, a single interface for all my AI providers.
The OAuth support means I don't have to manage API keys anymore."
— Indie Hacker
```

---

## Final CTA Section

### Heading

```
Ready to unify your AI proxy setup?
```

### Description

```
Join thousands of developers using CLIProxyAPI to simplify their AI workflow.
```

### Primary CTA

```
[Generate Your Config]
```

### Secondary CTA

```
[Read the Documentation] [Join the Community]
```

---

## Footer Links

### Product

- Getting Started
- Configuration Guide
- API Reference
- Management API
- Troubleshooting

### Ecosystem

- Apps Directory
- Submit Your App
- Contributing
- Roadmap

### Community

- GitHub
- Discord
- Twitter/X
- Blog

### Legal

- Privacy Policy
- Terms of Service
- License (Apache 2.0)
