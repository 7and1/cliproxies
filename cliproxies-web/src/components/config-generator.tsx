"use client";

import { useState, useMemo, useCallback, memo } from "react";
import {
  Copy,
  Download,
  Eye,
  EyeOff,
  Check,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import { useConfigStore } from "@/stores/config-store";
import { generateConfig } from "@/lib/config-generator";
import { downloadConfig } from "@/lib/config-download";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const AVAILABLE_PROVIDERS = [
  { id: "openai", name: "OpenAI", color: "bg-emerald-500" },
  { id: "anthropic", name: "Claude", color: "bg-amber-500" },
  { id: "gemini", name: "Gemini", color: "bg-blue-500" },
  { id: "qwen", name: "Qwen", color: "bg-purple-500" },
  { id: "iflow", name: "iFlow", color: "bg-cyan-500" },
] as const;

function ConfigGeneratorInner() {
  const {
    port,
    apiKeys,
    setPort,
    addApiKey,
    removeApiKey,
    reset,
    selectedProviders,
    setSelectedProviders,
  } = useConfigStore();
  const [nextKey, setNextKey] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yaml = useMemo(
    () => generateConfig({ port, apiKeys }),
    [port, apiKeys],
  );

  const handleAddKey = useCallback(() => {
    const trimmed = nextKey.trim();
    if (!trimmed) {
      setError("Please enter an API key");
      return;
    }

    if (trimmed.length < 10) {
      setError("API key seems too short (minimum 10 characters)");
      return;
    }

    if (trimmed.length > 256) {
      setError("API key is too long (maximum 256 characters)");
      return;
    }

    if (/[\n\r<>]/.test(trimmed)) {
      setError("Invalid API key format");
      return;
    }

    setError(null);
    addApiKey(trimmed);
    setNextKey("");
  }, [nextKey, addApiKey]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [yaml]);

  const handleGenerate = useCallback(() => {
    downloadConfig(yaml);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  }, [yaml]);

  const toggleProvider = useCallback(
    (id: string) => {
      setSelectedProviders((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
      );
    },
    [setSelectedProviders],
  );

  const handleReset = useCallback(() => {
    reset();
    setDownloaded(false);
  }, [reset]);

  const handleKeyRedaction = useCallback((key: string) => {
    if (key.length <= 8) return key;
    return `${key.slice(0, 4)}${"*".repeat(8)}${key.slice(-4)}`;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleAddKey();
      }
    },
    [handleAddKey],
  );

  const providerBadges = useMemo(
    () =>
      AVAILABLE_PROVIDERS.map((provider) => {
        const isSelected = selectedProviders.includes(provider.id);
        return (
          <button
            key={provider.id}
            type="button"
            onClick={() => toggleProvider(provider.id)}
            className={`
            inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5
            text-xs font-medium transition-all duration-200 min-h-[32px]
            ${
              isSelected
                ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
                : "border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground hover:bg-accent/50"
            }
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          `}
            aria-pressed={isSelected}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${provider.color}`}
              aria-hidden="true"
            />
            {provider.name}
            {isSelected && <Check className="h-3 w-3" aria-hidden="true" />}
          </button>
        );
      }),
    [selectedProviders, toggleProvider],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Configuration Form */}
      <div className="rounded-2xl border border-border/70 glass-strong p-6 shadow-lg shadow-black/20 transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">Configuration</h3>
            <div className="group relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 rounded-lg bg-popover border border-border text-xs text-popover-foreground shadow-lg z-10">
                Configure your CLIProxyAPI settings
              </div>
            </div>
          </div>
          <Badge variant="secondary" size="sm" className="text-xs">
            {apiKeys.length} key{apiKeys.length !== 1 ? "s" : ""} ·{" "}
            {selectedProviders.length} provider
            {selectedProviders.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {/* Port Configuration */}
          <div>
            <label
              htmlFor="port-input"
              className="text-sm font-medium text-foreground"
            >
              Listening port
            </label>
            <Input
              id="port-input"
              type="number"
              min={1024}
              max={65535}
              value={port}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (value >= 1024 && value <= 65535) {
                  setPort(value);
                }
              }}
              placeholder="8317"
              className="mt-2 font-mono"
              aria-describedby="port-description"
            />
            <p
              id="port-description"
              className="mt-1.5 text-xs text-muted-foreground"
            >
              Default: 8317. Must be between 1024-65535.
            </p>
          </div>

          {/* Provider Selection */}
          <div>
            <p className="text-sm font-medium text-foreground">
              Enable providers (optional)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">{providerBadges}</div>
          </div>

          {/* API Keys */}
          <div>
            <label
              htmlFor="api-key-input"
              className="text-sm font-medium text-foreground"
            >
              API keys
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="api-key-input"
                value={nextKey}
                onChange={(event) => {
                  setNextKey(event.target.value);
                  setError(null);
                }}
                placeholder="Paste a provider API key"
                onKeyDown={handleKeyDown}
                className="font-mono"
                autoComplete="off"
                error={!!error}
                aria-describedby={error ? "api-key-error" : undefined}
              />
              <Button
                type="button"
                onClick={handleAddKey}
                variant="secondary"
                size="default"
                className="shrink-0 gap-1.5 sm:w-auto min-h-[44px]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Add key</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>

            {error && (
              <p
                id="api-key-error"
                className="mt-2 text-xs text-destructive flex items-center gap-1"
                role="alert"
              >
                <Info className="h-3 w-3" />
                {error}
              </p>
            )}

            {apiKeys.length > 0 && (
              <div
                className="mt-4 grid gap-2"
                role="list"
                aria-label="Added API keys"
              >
                {apiKeys.map((key, index) => (
                  <div
                    key={`${key}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-xs transition-colors hover:bg-accent/50"
                    role="listitem"
                  >
                    <code
                      className="font-mono text-muted-foreground"
                      aria-label={`API key ${index + 1}`}
                    >
                      {handleKeyRedaction(key)}
                    </code>
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground transition-all hover:text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[32px] min-w-[32px] flex items-center justify-center"
                      onClick={() => removeApiKey(index)}
                      aria-label={`Remove API key ${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleGenerate}
              className="animate-glow flex-1 gap-2 shadow-lg hover:shadow-xl transition-all min-h-[44px]"
              aria-describedby="download-hint"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {downloaded ? (
                <>
                  <Check className="h-4 w-4" />
                  Downloaded!
                </>
              ) : (
                "Download config.yaml"
              )}
            </Button>
            <span id="download-hint" className="sr-only">
              Downloads the configuration file to your device
            </span>
            <Button
              variant="outline"
              onClick={handleReset}
              className="min-h-[44px]"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* YAML Preview */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-border/70 glass-strong p-4 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">YAML Preview</h3>
            <Badge variant="outline" size="sm" className="text-xs gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPreview(!showPreview)}
            aria-label={showPreview ? "Hide preview" : "Show preview"}
            aria-pressed={showPreview}
            className="min-h-[36px] min-w-[36px]"
          >
            {showPreview ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        {showPreview && (
          <div className="relative flex-1 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-inner overflow-hidden">
            <div className="absolute right-3 top-3 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-8 w-8 min-h-[32px] min-w-[32px]"
                aria-label="Copy YAML to clipboard"
              >
                {copied ? (
                  <Check
                    className="h-4 w-4 text-emerald-500"
                    aria-hidden="true"
                  />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto pb-2 pr-10 text-xs font-mono text-muted-foreground sm:text-sm leading-relaxed">
              <code>{yaml}</code>
            </pre>
          </div>
        )}

        {/* Quick Tips */}
        <div className="rounded-2xl border border-border/60 glass p-5">
          <h4 className="text-sm font-bold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Quick Tips
          </h4>
          <ul className="mt-3 space-y-2.5 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                Place config.yaml in{" "}
                <code className="rounded bg-background/60 px-1.5 py-0.5 text-foreground font-medium">
                  ~/.cliproxyapi/
                </code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Keys are stored locally and never sent to our servers</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Use OAuth to avoid storing API keys entirely</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export const ConfigGenerator = memo(ConfigGeneratorInner);
