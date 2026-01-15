# Ecosystem Data Specification

## App Interface

```typescript
// data/types.ts
export interface App {
  id: string;
  name: string;
  description: string;
  platforms: Platform[];
  tags: string[];
  repo: string;
  downloadUrl?: string;
  featured?: boolean;
  isPort?: boolean;
}

export type Platform = "mac" | "windows" | "linux" | "web";
```

## Apps Data

```typescript
// data/ecosystem.ts
import { App } from "./types";

export const apps: App[] = [
  {
    id: "vibeproxy",
    name: "VibeProxy",
    description: "Native macOS menu bar app for Claude Code & ChatGPT",
    platforms: ["mac"],
    tags: ["Menu Bar", "SwiftUI", "Open Source"],
    repo: "https://github.com/automazeio/vibeproxy",
    featured: true,
  },
  {
    id: "quotio",
    name: "Quotio",
    description: "Unified quota tracking with smart auto-failover",
    platforms: ["mac"],
    tags: ["Menu Bar", "Quota Tracking"],
    repo: "https://github.com/nguyenphutrong/quotio",
  },
  {
    id: "codmate",
    name: "CodMate",
    description: "SwiftUI app for CLI AI sessions with Git review",
    platforms: ["mac"],
    tags: ["SwiftUI", "Git Review", "Terminal"],
    repo: "https://github.com/loocor/CodMate",
  },
  {
    id: "proxypilot",
    name: "ProxyPilot",
    description: "Windows-native with TUI and system tray",
    platforms: ["windows"],
    tags: ["TUI", "System Tray"],
    repo: "https://github.com/Finesssee/ProxyPilot",
  },
  {
    id: "proxypal",
    name: "ProxyPal",
    description: "Native macOS GUI for managing CLIProxyAPI",
    platforms: ["mac"],
    tags: ["GUI", "Config Manager"],
    repo: "https://github.com/heyhuynhgiabuu/proxypal",
  },
  {
    id: "ccs",
    name: "CCS",
    description: "CLI wrapper for instant account switching",
    platforms: ["mac", "linux"],
    tags: ["CLI", "Account Switch"],
    repo: "https://github.com/kaitranntt/ccs",
  },
  {
    id: "9router",
    name: "9Router",
    description: "Next.js implementation with web dashboard",
    platforms: ["web"],
    tags: ["Next.js", "Dashboard", "Self-host"],
    repo: "https://github.com/decolua/9router",
    isPort: true,
  },
];
```
