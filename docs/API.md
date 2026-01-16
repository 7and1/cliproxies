# CLIProxies API Documentation

**Version:** 1.0.0
**Last Updated:** 2025-01-16
**Base URL:** `http://localhost:8317`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Core API Endpoints](#core-api-endpoints)
4. [Management API Endpoints](#management-api-endpoints)
5. [Proxy Grid API Endpoints](#proxy-grid-api-endpoints)
6. [WebSocket API](#websocket-api)
7. [Error Responses](#error-responses)
8. [Rate Limiting](#rate-limiting)
9. [OpenAPI Specification](#openapi-specification)

---

## Overview

CLIProxies provides a unified API gateway for multiple AI providers including OpenAI, Claude (Anthropic), Gemini (Google), Codex, Qwen, iFlow, and custom OpenAI-compatible endpoints.

### Features

- Multi-provider support through single endpoint
- OpenAI-compatible `/v1/*` endpoints
- Claude Messages API compatibility
- Gemini API compatibility
- Streaming and non-streaming responses
- Function calling/tools support
- Multimodal input support (text and images)
- OAuth-based authentication
- API key authentication

### Supported Providers

| Provider           | Protocol        | Notes                                  |
| ------------------ | --------------- | -------------------------------------- |
| OpenAI (Codex)     | OpenAI          | GPT models via OAuth or API key        |
| Claude (Anthropic) | Claude Messages | Claude models via OAuth or API key     |
| Gemini (Google)    | Gemini          | Gemini models via OAuth or API key     |
| Vertex AI          | Gemini          | Vertex-compatible endpoints            |
| Qwen               | OpenAI          | Qwen models via OAuth                  |
| iFlow              | OpenAI          | iFlow models via OAuth                 |
| Custom Providers   | OpenAI          | OpenRouter, OpenAI-compatible services |

---

## Authentication

All API requests require authentication. CLIProxies supports two authentication methods:

### API Key Authentication

Include your API key in the `Authorization` header:

```bash
Authorization: Bearer your-api-key
```

Or use the `X-API-Key` header:

```bash
X-API-Key: your-api-key
```

### OAuth Authentication

Configure OAuth credentials through the management API or via CLI commands:

```bash
# Claude OAuth
./CLIProxyAPI -claude-login

# Gemini OAuth
./CLIProxyAPI -login

# Codex OAuth
./CLIProxyAPI -codex-login

# Qwen OAuth
./CLIProxyAPI -qwen-login

# iFlow OAuth
./CLIProxyAPI -iflow-login
```

---

## Core API Endpoints

### Models

List all available models across configured providers.

**Endpoint:** `GET /v1/models`

**Request:**

```bash
curl -H "Authorization: Bearer your-api-key" \
  http://localhost:8317/v1/models
```

**Response:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4",
      "object": "model",
      "created": 1234567890,
      "owned_by": "openai"
    },
    {
      "id": "claude-3-5-sonnet-20241022",
      "object": "model",
      "created": 1234567890,
      "owned_by": "anthropic"
    }
  ]
}
```

### Chat Completions

Create a chat completion request.

**Endpoint:** `POST /v1/chat/completions`

**Request:**

```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "max_tokens": 100,
  "temperature": 0.7,
  "stream": false
}
```

**Response:**

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1234567890,
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
    "prompt_tokens": 20,
    "completion_tokens": 9,
    "total_tokens": 29
  }
}
```

**Streaming Request:**

```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Tell me a joke"
    }
  ],
  "stream": true
}
```

**Streaming Response:**

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"Why"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" don't"},"finish_reason":null}]}

data: [DONE]
```

### Completions (Legacy)

Create a completion request using the legacy API format.

**Endpoint:** `POST /v1/completions`

**Request:**

```json
{
  "model": "gpt-3.5-turbo-instruct",
  "prompt": "Write a hello world program in Python:",
  "max_tokens": 100,
  "temperature": 0.7
}
```

### Claude Messages API

Native Claude Messages API compatibility.

**Endpoint:** `POST /v1/messages`

**Request:**

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Hello, Claude!"
    }
  ]
}
```

**Response:**

```json
{
  "id": "msg_123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello! How can I help you today?"
    }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 25
  }
}
```

### Count Tokens

Count tokens for a Claude request without sending it.

**Endpoint:** `POST /v1/messages/count_tokens`

**Request:**

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ]
}
```

**Response:**

```json
{
  "input_tokens": 10
}
```

### OpenAI Responses API

Structured outputs via the Responses API.

**Endpoint:** `POST /v1/responses`

**Request:**

```json
{
  "model": "gpt-4",
  "input": "What's the weather like today?",
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

### Gemini API

Native Gemini API compatibility.

**Endpoint:** `POST /v1beta/models/{model}:generateContent`

**Request:**

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Hello!"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 100
  }
}
```

---

## Management API Endpoints

The Management API provides runtime configuration and monitoring capabilities. All management endpoints require a management key.

### Authentication

Management endpoints require authentication via:

```bash
Authorization: Bearer your-management-key
```

Or:

```bash
X-Management-Key: your-management-key
```

Set the management key in `config.yaml`:

```yaml
remote-management:
  secret-key: "your-secret-key"
  allow-remote: false
```

Or via environment variable:

```bash
export MANAGEMENT_PASSWORD=your-secret-key
```

### Configuration Endpoints

#### Get Configuration

**Endpoint:** `GET /v0/management/config`

**Response:**

```json
{
  "host": "",
  "port": 8317,
  "debug": false,
  "api-keys": ["sk-***", "sk-***"],
  "routing": {
    "strategy": "round-robin"
  }
}
```

#### Get Raw YAML Configuration

**Endpoint:** `GET /v0/management/config.yaml`

Returns the full configuration as YAML.

#### Update Configuration

**Endpoint:** `PUT /v0/management/config.yaml`

**Request Body:** YAML configuration

Updates the server configuration and hot-reloads.

### API Key Management

#### Get API Keys

**Endpoint:** `GET /v0/management/api-keys`

**Response:**

```json
{
  "api-keys": ["sk-abc123***", "sk-def456***"]
}
```

#### Update API Keys

**Endpoint:** `PUT /v0/management/api-keys`

**Request:**

```json
{
  "value": ["sk-new-key-1", "sk-new-key-2"]
}
```

#### Patch API Keys

**Endpoint:** `PATCH /v0/management/api-keys`

Add or remove individual keys.

**Request:**

```json
{
  "action": "add",
  "value": "sk-new-key"
}
```

#### Delete API Keys

**Endpoint:** `DELETE /v0/management/api-keys`

Clears all API keys.

### Provider Key Management

#### Gemini Keys

```bash
GET    /v0/management/gemini-api-key
PUT    /v0/management/gemini-api-key
PATCH  /v0/management/gemini-api-key
DELETE /v0/management/gemini-api-key
```

#### Claude Keys

```bash
GET    /v0/management/claude-api-key
PUT    /v0/management/claude-api-key
PATCH  /v0/management/claude-api-key
DELETE /v0/management/claude-api-key
```

#### Codex Keys

```bash
GET    /v0/management/codex-api-key
PUT    /v0/management/codex-api-key
PATCH  /v0/management/codex-api-key
DELETE /v0/management/codex-api-key
```

#### Vertex Compatible Keys

```bash
GET    /v0/management/vertex-api-key
PUT    /v0/management/vertex-api-key
PATCH  /v0/management/vertex-api-key
DELETE /v0/management/vertex-api-key
```

#### OpenAI Compatibility Providers

```bash
GET    /v0/management/openai-compatibility
PUT    /v0/management/openai-compatibility
PATCH  /v0/management/openai-compatibility
DELETE /v0/management/openai-compatibility
```

### Usage Statistics

#### Get Usage

**Endpoint:** `GET /v0/management/usage`

**Response:**

```json
{
  "statistics": {
    "claude-3-5-sonnet-20241022": {
      "requests": 150,
      "input_tokens": 45000,
      "output_tokens": 30000,
      "total_tokens": 75000
    }
  }
}
```

#### Export Usage

**Endpoint:** `GET /v0/management/usage/export`

Export usage statistics as JSON.

#### Import Usage

**Endpoint:** `POST /v0/management/usage/import`

Import usage statistics from JSON.

### Logging

#### Get Logs

**Endpoint:** `GET /v0/management/logs?lines=100&offset=0`

Returns recent log entries.

#### Delete Logs

**Endpoint:** `DELETE /v0/management/logs`

Clears all log files.

#### Request Logging

Toggle request logging:

```bash
GET  /v0/management/request-log
PUT  /v0/management/request-log
```

#### Request Error Logs

```bash
GET /v0/management/request-error-logs
GET /v0/management/request-error-logs/:name
GET /v0/management/request-log-by-id/:id
```

### Debug Configuration

```bash
GET  /v0/management/debug
PUT  /v0/management/debug
PATCH /v0/management/debug
```

Toggle debug mode.

### Routing Configuration

```bash
GET  /v0/management/routing/strategy
PUT  /v0/management/routing/strategy
PATCH /v0/management/routing/strategy
```

Configure load balancing strategy (`round-robin` or `fill-first`).

### Proxy Configuration

```bash
GET    /v0/management/proxy-url
PUT    /v0/management/proxy-url
PATCH  /v0/management/proxy-url
DELETE /v0/management/proxy-url
```

Configure upstream proxy for all requests.

### WebSocket Authentication

```bash
GET  /v0/management/ws-auth
PUT  /v0/management/ws-auth
PATCH /v0/management/ws-auth
```

Enable/disable WebSocket authentication.

### OAuth Token Requests

Initiate OAuth flows for various providers:

```bash
GET /v0/management/anthropic-auth-url
GET /v0/management/gemini-cli-auth-url
GET /v0/management/codex-auth-url
GET /v0/management/antigravity-auth-url
GET /v0/management/qwen-auth-url
GET /v0/management/iflow-auth-url
POST /v0/management/iflow-auth-url  # Cookie-based
```

Get current auth status:

```bash
GET /v0/management/get-auth-status
```

Handle OAuth callback:

```bash
POST /v0/management/oauth-callback
```

### Amp Integration

```bash
# Amp configuration
GET    /v0/management/ampcode
GET    /v0/management/ampcode/upstream-url
PUT    /v0/management/ampcode/upstream-url
PATCH  /v0/management/ampcode/upstream-url
DELETE /v0/management/ampcode/upstream-url

# Amp API key management
GET    /v0/management/ampcode/upstream-api-key
PUT    /v0/management/ampcode/upstream-api-key
PATCH  /v0/management/ampcode/upstream-api-key

# Amp model mappings
GET    /v0/management/ampcode/model-mappings
PUT    /v0/management/ampcode/model-mappings
PATCH /v0/management/ampcode/model-mappings
DELETE /v0/management/ampcode/model-mappings

# Per-client API key mappings
GET    /v0/management/ampcode/upstream-api-keys
PUT    /v0/management/ampcode/upstream-api-keys
PATCH /v0/management/ampcode/upstream-api-keys
DELETE /v0/management/ampcode/upstream-api-keys
```

### Auth File Management

```bash
GET    /v0/management/auth-files
GET    /v0/management/auth-files/models
GET    /v0/management/auth-files/download
POST   /v0/management/auth-files
DELETE /v0/management/auth-files
```

Import Vertex service account:

```bash
POST /v0/management/vertex/import
```

---

## Proxy Grid API Endpoints

The Proxy Grid API provides access to search engines, social media, and web content services.

All endpoints are prefixed with `/v1/proxygrid` and require the same authentication as core API endpoints.

### Search Services

#### Google Search

**Endpoint:** `GET /v1/proxygrid/search/google?q={query}&num={num}`

**Request:**

```bash
curl -H "Authorization: Bearer your-api-key" \
  "http://localhost:8317/v1/proxygrid/search/google?q=best+coffee+shops&num=10"
```

**Response:**

```json
{
  "results": [
    {
      "title": "Best Coffee Shops",
      "link": "https://example.com",
      "snippet": "Top rated coffee shops..."
    }
  ]
}
```

#### Bing Search

**Endpoint:** `GET /v1/proxygrid/search/bing?q={query}`

#### YouTube Search

**Endpoint:** `GET /v1/proxygrid/search/youtube?q={query}`

### Video Services

#### YouTube Transcript

**Endpoint:** `GET /v1/proxygrid/video/youtube/{id}`

Get the transcript of a YouTube video.

**Request:**

```bash
curl -H "Authorization: Bearer your-api-key" \
  "http://localhost:8317/v1/proxygrid/video/youtube/dQw4w9WgXcQ"
```

**Response:**

```json
{
  "transcript": "[Music] Never gonna give you up...",
  "duration": 212
}
```

#### YouTube Video Info

**Endpoint:** `GET /v1/proxygrid/video/youtube/{id}/info`

Get metadata about a YouTube video.

**Response:**

```json
{
  "title": "Video Title",
  "author": "Channel Name",
  "viewCount": 1000000,
  "publishDate": "2024-01-01"
}
```

### Social Media Services

#### Twitter

**Endpoint:** `GET /v1/proxygrid/social/twitter/{id}`

#### Instagram

**Endpoint:** `GET /v1/proxygrid/social/instagram/{username}`

#### TikTok

**Endpoint:** `GET /v1/proxygrid/social/tiktok/{username}`

#### Reddit

**Endpoint:** `GET /v1/proxygrid/social/reddit?url={url}`

### Web Content Services

#### Screenshot

**Endpoint:** `GET /v1/proxygrid/content/screenshot?url={url}`

Returns a PNG screenshot of the webpage.

#### Web to Markdown

**Endpoint:** `GET /v1/proxygrid/content/markdown?url={url}`

Converts a webpage to Markdown format.

**Response:**

```json
{
  "markdown": "# Page Title\n\nContent..."
}
```

#### SimilarWeb Analytics

**Endpoint:** `GET /v1/proxygrid/content/similarweb/{domain}`

**Response:**

```json
{
  "visits": 1000000,
  "rank": 1000
}
```

#### Hacker News

**Endpoint:** `GET /v1/proxygrid/content/hackernews?type={type}`

Type can be `top`, `new`, `best`, `ask`, `show`, `job`.

### Commerce Services

#### Amazon Product

**Endpoint:** `GET /v1/proxygrid/commerce/amazon/{asin}`

Get Amazon product data by ASIN.

#### Crunchbase

**Endpoint:** `GET /v1/proxygrid/commerce/crunchbase/{slug}`

Get organization data from Crunchbase.

---

## WebSocket API

CLIProxies supports WebSocket connections for real-time streaming.

### Endpoint

`ws://localhost:8317/v1/ws`

### Authentication

WebSocket authentication can be enabled via configuration:

```yaml
ws-auth: true
```

When enabled, include the API key as a query parameter:

```
ws://localhost:8317/v1/ws?api-key=your-api-key
```

### Connection

```javascript
const ws = new WebSocket("ws://localhost:8317/v1/ws");

ws.onopen = () => {
  console.log("Connected to CLIProxies WebSocket");
};

ws.onmessage = (event) => {
  console.log("Received:", event.data);
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("WebSocket connection closed");
};
```

---

## Error Responses

All error responses follow a consistent format:

### Error Format

```json
{
  "error": {
    "message": "Error description",
    "type": "error_type",
    "code": "error_code"
  }
}
```

### Error Types

| HTTP Status | Error Type              | Error Code              | Description                          |
| ----------- | ----------------------- | ----------------------- | ------------------------------------ |
| 400         | `invalid_request_error` | `invalid_request`       | Invalid request format or parameters |
| 401         | `authentication_error`  | `invalid_api_key`       | Missing or invalid API key           |
| 403         | `permission_error`      | `insufficient_quota`    | Quota exceeded or access denied      |
| 404         | `invalid_request_error` | `model_not_found`       | Model not found                      |
| 429         | `rate_limit_error`      | `rate_limit_exceeded`   | Too many requests                    |
| 500         | `server_error`          | `internal_server_error` | Internal server error                |
| 502         | `server_error`          | `upstream_error`        | Upstream provider error              |
| 503         | `server_error`          | `service_unavailable`   | Service temporarily unavailable      |
| 504         | `server_error`          | `request_timeout`       | Request timed out                    |

### Error Example

```json
{
  "error": {
    "message": "The model `gpt-5` does not exist or you do not have access to it.",
    "type": "invalid_request_error",
    "code": "model_not_found"
  }
}
```

---

## Rate Limiting

Rate limiting can be configured via YAML:

```yaml
rate-limit:
  enabled: true
  requests-per-minute: 60
  burst: 10
```

### Rate Limit Headers

When rate limiting is enabled, responses include:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705435200
```

### Handling Rate Limits

When rate limited, the API returns:

```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}
```

Implement exponential backoff for retries:

```
Initial wait: 1 second
Max wait: 30 seconds
Multiplier: 2
```

---

## OpenAPI Specification

The complete OpenAPI 3.1 specification is available below:

```yaml
openapi: 3.1.0
info:
  title: CLIProxies API
  version: 1.0.0
  description: Multi-provider AI API gateway
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:8317
    description: Local development server
  - url: https://api.cliproxies.com
    description: Production server

security:
  - BearerAuth: []
  - APIKeyAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: API Key
    APIKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    ManagementAuth:
      type: http
      scheme: bearer
      description: Management API authentication

  schemas:
    ChatMessage:
      type: object
      required:
        - role
        - content
      properties:
        role:
          type: string
          enum: [system, user, assistant]
        content:
          type: string

    ChatCompletionRequest:
      type: object
      required:
        - model
        - messages
      properties:
        model:
          type: string
          description: Model identifier
        messages:
          type: array
          items:
            $ref: "#/components/schemas/ChatMessage"
        max_tokens:
          type: integer
          default: 100
        temperature:
          type: number
          minimum: 0
          maximum: 2
          default: 0.7
        stream:
          type: boolean
          default: false

    ChatCompletionResponse:
      type: object
      properties:
        id:
          type: string
        object:
          type: string
          enum: [chat.completion]
        created:
          type: integer
        model:
          type: string
        choices:
          type: array
          items:
            type: object
            properties:
              index:
                type: integer
              message:
                $ref: "#/components/schemas/ChatMessage"
              finish_reason:
                type: string
        usage:
          type: object
          properties:
            prompt_tokens:
              type: integer
            completion_tokens:
              type: integer
            total_tokens:
              type: integer

    ErrorResponse:
      type: object
      properties:
        error:
          type: object
          properties:
            message:
              type: string
            type:
              type: string
            code:
              type: string

    Model:
      type: object
      properties:
        id:
          type: string
        object:
          type: string
          enum: [model]
        created:
          type: integer
        owned_by:
          type: string

    ModelsResponse:
      type: object
      properties:
        object:
          type: string
          enum: [list]
        data:
          type: array
          items:
            $ref: "#/components/schemas/Model"

paths:
  /v1/models:
    get:
      operationId: listModels
      summary: List available models
      tags: [Models]
      responses:
        "200":
          description: List of models
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ModelsResponse"

  /v1/chat/completions:
    post:
      operationId: createChatCompletion
      summary: Create chat completion
      tags: [Chat]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ChatCompletionRequest"
      responses:
        "200":
          description: Chat completion response
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ChatCompletionResponse"
        "400":
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
        "401":
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
        "429":
          description: Rate limited
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
        "500":
          description: Server error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"

  /v1/completions:
    post:
      operationId: createCompletion
      summary: Create completion (legacy)
      tags: [Completions]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [model, prompt]
              properties:
                model:
                  type: string
                prompt:
                  type: string
                max_tokens:
                  type: integer
                  default: 100
                temperature:
                  type: number
                  default: 0.7
      responses:
        "200":
          description: Completion response

  /v1/messages:
    post:
      operationId: createClaudeMessage
      summary: Create Claude message
      tags: [Claude]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [model, messages, max_tokens]
              properties:
                model:
                  type: string
                messages:
                  type: array
                  items:
                    type: object
                    properties:
                      role:
                        type: string
                      content:
                        type: string
                max_tokens:
                  type: integer
      responses:
        "200":
          description: Claude message response

  /v1/messages/count_tokens:
    post:
      operationId: countTokens
      summary: Count tokens for Claude request
      tags: [Claude]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [model, messages]
              properties:
                model:
                  type: string
                messages:
                  type: array
                  items:
                    type: object
      responses:
        "200":
          description: Token count
          content:
            application/json:
              schema:
                type: object
                properties:
                  input_tokens:
                    type: integer

  /health:
    get:
      operationId: healthCheck
      summary: Health check endpoint
      tags: [Health]
      security: []
      responses:
        "200":
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string

  /ready:
    get:
      operationId: readinessCheck
      summary: Readiness check endpoint
      tags: [Health]
      security: []
      responses:
        "200":
          description: Service is ready

tags:
  - name: Models
    description: Model listing operations
  - name: Chat
    description: Chat completion operations
  - name: Completions
    description: Legacy completion operations
  - name: Claude
    description: Claude-specific operations
  - name: Health
    description: Health check operations
```

---

## Version Compatibility

| CLIProxies Version | API Version | Status     |
| ------------------ | ----------- | ---------- |
| 1.0.0              | v1          | Current    |
| 0.x                | v0          | Deprecated |

---

## Additional Resources

- [Configuration Reference](./CONFIGURATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Main Repository](https://github.com/router-for-me/CLIProxyAPI)
