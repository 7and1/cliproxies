# Config Generator - Download & Component

## Download Function

```typescript
// lib/config-download.ts
export function downloadConfig(content: string, filename = "config.yaml") {
  const blob = new Blob([content], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

## Zustand Store

```typescript
// stores/config-store.ts
import { create } from "zustand";

interface ConfigState {
  port: number;
  apiKeys: string[];
  setPort: (port: number) => void;
  addApiKey: (key: string) => void;
  removeApiKey: (index: number) => void;
  reset: () => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  port: 8317,
  apiKeys: [],
  setPort: (port) => set({ port }),
  addApiKey: (key) => set((s) => ({ apiKeys: [...s.apiKeys, key] })),
  removeApiKey: (i) =>
    set((s) => ({
      apiKeys: s.apiKeys.filter((_, idx) => idx !== i),
    })),
  reset: () => set({ port: 8317, apiKeys: [] }),
}));
```

## React Component

```tsx
// components/config-generator.tsx
"use client";

import { useConfigStore } from "@/stores/config-store";
import { generateConfig } from "@/lib/config-generator";
import { downloadConfig } from "@/lib/config-download";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ConfigGenerator() {
  const { port, apiKeys, setPort, addApiKey } = useConfigStore();

  const handleGenerate = () => {
    const yaml = generateConfig({ port, apiKeys, providers: [] });
    downloadConfig(yaml);
  };

  return (
    <div className="space-y-4">
      <Input
        type="number"
        value={port}
        onChange={(e) => setPort(Number(e.target.value))}
        placeholder="Port (default: 8317)"
      />
      <Button onClick={handleGenerate}>Download config.yaml</Button>
    </div>
  );
}
```
