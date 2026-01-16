import { NextRequest, NextResponse } from "next/server";
import { generateConfig } from "@/lib/config-generator";
import type { ProviderConfig } from "@/lib/config-types";

interface ConfigRequest {
  port?: number;
  apiKeys?: string[];
  providers?: ProviderConfig[];
}

// Validate input to prevent injection attacks
function validateConfig(data: ConfigRequest): data is ConfigRequest {
  if (!data || typeof data !== "object") return false;

  // Validate port
  if (data.port !== undefined) {
    if (
      typeof data.port !== "number" ||
      data.port < 1024 ||
      data.port > 65535
    ) {
      return false;
    }
  }

  // Validate apiKeys
  if (data.apiKeys !== undefined) {
    if (!Array.isArray(data.apiKeys)) return false;
    for (const key of data.apiKeys) {
      if (typeof key !== "string") return false;
      if (key.length < 10 || key.length > 256) return false;
      if (/[\n\r<>]/.test(key)) return false;
    }
  }

  // Validate providers if present
  if (data.providers !== undefined) {
    if (!Array.isArray(data.providers)) return false;
    for (const provider of data.providers) {
      if (!provider.type || typeof provider.type !== "string") return false;
      const validTypes = ["gemini", "claude", "codex", "openai-compat"];
      if (!validTypes.includes(provider.type)) return false;
    }
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data: ConfigRequest = await request.json();

    // Validate input
    if (!validateConfig(data)) {
      return NextResponse.json(
        { error: "Invalid configuration data" },
        { status: 400 },
      );
    }

    // Generate YAML config
    const yaml = generateConfig({
      port: data.port,
      apiKeys: data.apiKeys ?? [],
      providers: data.providers,
    });

    // Return response with proper cache and security headers
    return new NextResponse(yaml, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="config.yaml"',
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Config generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate configuration" },
      { status: 500 },
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
