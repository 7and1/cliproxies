import yaml from "yaml";
import { CLIProxyConfig, ProviderConfig } from "./config-types";

export function generateConfig(options: {
  port?: number;
  apiKeys: string[];
  providers?: ProviderConfig[];
}): string {
  const config: CLIProxyConfig = {
    host: "",
    port: options.port ?? 8317,
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
