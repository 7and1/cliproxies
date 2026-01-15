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
