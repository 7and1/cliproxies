import { App } from "./types";

export const apps: App[] = [
  {
    id: "vibeproxy",
    name: "VibeProxy",
    description:
      "Native macOS menu bar app to use Claude Code & ChatGPT subscriptions without API keys.",
    platforms: ["mac"],
    tags: ["Menu Bar", "SwiftUI", "Claude Code"],
    repo: "https://github.com/automazeio/vibeproxy",
    featured: true,
  },
  {
    id: "subtitle-translator",
    name: "Subtitle Translator",
    description:
      "Browser-based SRT translation with Gemini + validation via CLIProxyAPI OAuth.",
    platforms: ["web"],
    tags: ["Browser", "Gemini", "Localization"],
    repo: "https://github.com/VjayC/SRT-Subtitle-Translator-Validator",
  },
  {
    id: "ccs",
    name: "CCS (Claude Code Switch)",
    description:
      "CLI wrapper for fast account switching and alternative model routing.",
    platforms: ["mac", "linux"],
    tags: ["CLI", "Account Switch", "Claude"],
    repo: "https://github.com/kaitranntt/ccs",
  },
  {
    id: "proxypal",
    name: "ProxyPal",
    description:
      "Native macOS GUI for configuring providers, routing, and model mappings.",
    platforms: ["mac"],
    tags: ["GUI", "Config Manager"],
    repo: "https://github.com/heyhuynhgiabuu/proxypal",
    featured: true,
  },
  {
    id: "quotio",
    name: "Quotio",
    description:
      "Menu bar quota tracking with smart auto-failover for AI coding tools.",
    platforms: ["mac"],
    tags: ["Menu Bar", "Quota Tracking"],
    repo: "https://github.com/nguyenphutrong/quotio",
  },
  {
    id: "codmate",
    name: "CodMate",
    description:
      "SwiftUI session manager for Codex, Claude Code, and Gemini CLI workflows.",
    platforms: ["mac"],
    tags: ["SwiftUI", "Terminal", "Git Review"],
    repo: "https://github.com/loocor/CodMate",
    featured: true,
  },
  {
    id: "proxypilot",
    name: "ProxyPilot",
    description:
      "Windows-native CLIProxyAPI fork with TUI, system tray, and OAuth flows.",
    platforms: ["windows"],
    tags: ["TUI", "System Tray"],
    repo: "https://github.com/Finesssee/ProxyPilot",
  },
  {
    id: "claude-proxy-vscode",
    name: "Claude Proxy VSCode",
    description:
      "VSCode extension with embedded proxy backend for quick Claude model switching.",
    platforms: ["mac", "windows", "linux"],
    tags: ["VSCode", "Extension", "Proxy"],
    repo: "https://github.com/uzhao/claude-proxy-vscode",
  },
  {
    id: "9router",
    name: "9Router",
    description:
      "Next.js implementation inspired by CLIProxyAPI with web dashboard and fallback routing.",
    platforms: ["web"],
    tags: ["Next.js", "Dashboard", "Self-host"],
    repo: "https://github.com/decolua/9router",
    isPort: true,
  },
];
