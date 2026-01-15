# Config Generator Specification

## Overview

Generate `config.yaml` files compatible with CLIProxyAPI based on user selections.

## Config Interface

```typescript
// lib/config-types.ts
export interface CLIProxyConfig {
  host: string;
  port: number;
  "api-keys": string[];
  "auth-dir": string;
  debug: boolean;
  "request-retry": number;
  routing: {
    strategy: "round-robin" | "fill-first";
  };
}

export interface ProviderConfig {
  type: "gemini" | "claude" | "codex" | "openai-compat";
  apiKey?: string;
  baseUrl?: string;
  prefix?: string;
}
```

## Generator Function

```typescript
// lib/config-generator.ts
import yaml from "yaml";

export function generateConfig(options: {
  port: number;
  apiKeys: string[];
  providers: ProviderConfig[];
}): string {
  const config: CLIProxyConfig = {
    host: "",
    port: options.port || 8317,
    "api-keys": options.apiKeys,
    "auth-dir": "~/.cli-proxy-api",
    debug: false,
    "request-retry": 3,
    routing: {
      strategy: "round-robin",
    },
  };

  return yaml.stringify(config);
}
```
