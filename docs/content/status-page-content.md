# Status Page Content

---

## Page Metadata

**Title:** AI Provider Status | OpenAI, Claude, Gemini Uptime Monitor
**Description:** Real-time status monitoring for AI providers. Check OpenAI, Claude, Gemini, Qwen availability. Response times and incident history.

---

## Hero Section

### Heading

```
AI Provider Status Monitor
```

### Subheading

```
Real-time availability and response times for all supported AI providers. Last updated: {timestamp}
```

### Auto-Refresh Notice

```
Auto-refreshing every 30 seconds
```

---

## Provider Status Cards

### OpenAI Status

**Provider Name:** OpenAI

**Status Indicators:**

```
[Green Circle] API Operational
[Green Circle] Chat Completions Operational
[Green Circle] Embeddings Operational
```

**Metrics:**

```
Response Time: 245ms
Success Rate: 99.8%
Last Check: 2 seconds ago
```

**Models Monitored:**

- GPT-4
- GPT-4 Turbo
- GPT-3.5 Turbo
- Text Embeddings

### Anthropic Claude Status

**Provider Name:** Anthropic

**Status Indicators:**

```
[Green Circle] API Operational
[Yellow Circle] Messages Degraded
[Green Circle] Streaming Operational
```

**Metrics:**

```
Response Time: 312ms
Success Rate: 99.2%
Last Check: 5 seconds ago
```

**Models Monitored:**

- Claude 3 Opus
- Claude 3 Sonnet
- Claude 3 Haiku
- Claude 2.1

### Google Gemini Status

**Provider Name:** Google AI

**Status Indicators:**

```
[Green Circle] API Operational
[Green Circle] Generate Content Operational
[Green Circle] Streaming Operational
```

**Metrics:**

```
Response Time: 189ms
Success Rate: 99.5%
Last Check: 3 seconds ago
```

**Models Monitored:**

- Gemini Pro
- Gemini Ultra
- Gemini Flash

### Alibaba Qwen Status

**Provider Name:** Alibaba Cloud

**Status Indicators:**

```
[Green Circle] API Operational
[Green Circle] Chat Operational
```

**Metrics:**

```
Response Time: 421ms
Success Rate: 98.9%
Last Check: 8 seconds ago
```

**Models Monitored:**

- Qwen Turbo
- Qwen Plus
- Qwen Max

### iFlow Status

**Provider Name:** iFlow

**Status Indicators:**

```
[Green Circle] API Operational
[Green Circle] All Models Operational
```

**Metrics:**

```
Response Time: 298ms
Success Rate: 99.1%
Last Check: 6 seconds ago
```

### Vertex AI Status

**Provider Name:** Google Cloud Vertex

**Status Indicators:**

```
[Green Circle] API Operational
[Green Circle] Prediction Endpoint Operational
```

**Metrics:**

```
Response Time: 267ms
Success Rate: 99.6%
Last Check: 4 seconds ago
```

---

## Overall Status Summary

### Status Bar

```
[Green] All Systems Operational
```

### Summary Text

```
All 7 providers are currently operational. No incidents reported in the last 24 hours.
```

### Uptime Stats (Last 30 Days)

```
Overall Uptime: 99.94%
Total Incidents: 0
Average Response Time: 289ms
```

---

## Incident History

### Section Heading

```
Recent Incidents
```

### Incident Card Template (When Active)

**Title:** [Provider] - [Issue Type]

**Status:** [Investigating | Identified | Monitoring | Resolved]

**Timeline:**

```
[Time] - Update description
[Time] - Earlier update
[Time] - Incident began
```

**Affected Services:**

- Service 1
- Service 2

### No Incidents Message

```
No incidents reported in the last 7 days. All systems operating normally.
```

---

## Performance Metrics Section

### Heading

```
Response Time History (Last 24 Hours)
```

### Description

```
Median response times across all providers. Data refreshed every 5 minutes.
```

### Chart Placeholder

```
[Line chart showing response times over 24 hours]
Y-axis: Response Time (ms)
X-axis: Time (last 24 hours)
```

### Metrics Table

| Provider  | p50   | p95   | p99    | Trend        |
| --------- | ----- | ----- | ------ | ------------ |
| OpenAI    | 245ms | 412ms | 687ms  | [Arrow Up]   |
| Anthropic | 312ms | 523ms | 891ms  | [Arrow Flat] |
| Gemini    | 189ms | 298ms | 456ms  | [Arrow Down] |
| Qwen      | 421ms | 687ms | 1023ms | [Arrow Flat] |
| iFlow     | 298ms | 456ms | 712ms  | [Arrow Up]   |
| Vertex    | 267ms | 445ms | 678ms  | [Arrow Down] |

---

## Subscribe to Updates

### Heading

```
Get notified about provider outages
```

### Description

```
Receive email alerts when AI providers experience downtime or degraded performance.
```

### Subscribe Form

```
Email: [input@example.com]
[Subscribe to Status Updates]
```

### Alternative Options

```
[RSS Feed] [Twitter Alerts] [Webhook]
```

---

## FAQ Section

### Common Questions

**Q: How often is this page updated?**

A: Status data refreshes every 30 seconds automatically. Incident updates are posted by our team as they happen.

**Q: What do the status indicators mean?**

A:

- Green: Service is fully operational
- Yellow: Service is degraded but functional
- Red: Service is experiencing an outage

**Q: How do you measure response times?**

A: We send test requests to each provider every 30 seconds and measure the time to first response. p50, p95, and p99 values show median, 95th percentile, and 99th percentile response times.

**Q: Why might a provider show as operational but my requests are failing?**

A: Our status checks use a centralized test location. Regional issues, API key-specific rate limits, or your network configuration may cause different results.

**Q: Can I integrate these status metrics into my own monitoring?**

A: Yes. Status data is available via our public API. See the documentation for integration details.

---

## Footer Links

### Related Pages

- [← Back to Homepage]
- [Documentation]
- [Config Generator]
- [Apps Directory]

### External Resources

- [OpenAI Status]
- [Anthropic Status]
- [Google Cloud Status]
- [Alibaba Cloud Status]

### Status API

```
GET https://cliproxies.com/api/status
```

---

## Status API Response Format

```json
{
  "timestamp": "2025-01-12T10:30:00Z",
  "overall_status": "operational",
  "providers": [
    {
      "name": "openai",
      "status": "operational",
      "response_time_ms": 245,
      "success_rate": 99.8,
      "last_check": "2025-01-12T10:29:58Z"
    },
    {
      "name": "anthropic",
      "status": "degraded",
      "response_time_ms": 312,
      "success_rate": 98.5,
      "last_check": "2025-01-12T10:29:55Z"
    }
  ],
  "incidents": []
}
```

---

## Maintenance Windows

### Scheduled Maintenance

**No scheduled maintenance at this time.**

### Maintenance Notice Template

```
**Scheduled Maintenance: [Provider Name]**

**Date:** [Date]
**Time:** [Start Time] - [End Time] (UTC)
**Affected Services:** [Service List]

**Expected Impact:**
- Brief interruptions to [service]
- Increased response times during maintenance window

We will provide updates throughout the maintenance period.
```
