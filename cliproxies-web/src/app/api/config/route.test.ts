import { POST } from "./route";
import { NextRequest } from "next/server";

// Mock the generateConfig function
jest.mock("@/lib/config-generator", () => ({
  generateConfig: jest.fn(
    () => 'host: ""\nport: 8317\napi-keys:\n- test-key\n',
  ),
}));

describe("/api/config route", () => {
  it("should generate config from valid POST data", async () => {
    const request = new NextRequest("http://localhost:3000/api/config", {
      method: "POST",
      body: JSON.stringify({
        port: 3000,
        apiKeys: ["sk-test-key-12345"],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/yaml; charset=utf-8",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="config.yaml"',
    );
    expect(response.headers.get("Cache-Control")).toContain("no-store");

    const text = await response.text();
    expect(text).toContain("port: 8317");
  });

  it("should return 400 for invalid port", async () => {
    const request = new NextRequest("http://localhost:3000/api/config", {
      method: "POST",
      body: JSON.stringify({
        port: 100, // Below 1024
        apiKeys: ["test-key"],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for port above 65535", async () => {
    const request = new NextRequest("http://localhost:3000/api/config", {
      method: "POST",
      body: JSON.stringify({
        port: 70000,
        apiKeys: ["test-key"],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid apiKeys array", async () => {
    const request = new NextRequest("http://localhost:3000/api/config", {
      method: "POST",
      body: JSON.stringify({
        port: 3000,
        apiKeys: "not-an-array",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for API key that is too short", async () => {
    const request = new NextRequest("http://localhost:3000/api/config", {
      method: "POST",
      body: JSON.stringify({
        port: 3000,
        apiKeys: ["short"],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for API key with invalid characters", async () => {
    const request = new NextRequest("http://localhost:3000/api/config", {
      method: "POST",
      body: JSON.stringify({
        port: 3000,
        apiKeys: ["sk-test\nkey"],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should handle empty apiKeys array", async () => {
    const request = new NextRequest("http://localhost:3000/api/config", {
      method: "POST",
      body: JSON.stringify({
        port: 3000,
        apiKeys: [],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("should handle missing optional fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/config", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("should return 500 for invalid JSON", async () => {
    const request = new NextRequest("http://localhost:3000/api/config", {
      method: "POST",
      body: "invalid json",
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("should validate provider types", async () => {
    const request = new NextRequest("http://localhost:3000/api/config", {
      method: "POST",
      body: JSON.stringify({
        port: 3000,
        apiKeys: ["test-key-12345"],
        providers: [
          { type: "openai-compat", apiKey: "sk-test" },
          { type: "claude" },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("should reject invalid provider type", async () => {
    const request = new NextRequest("http://localhost:3000/api/config", {
      method: "POST",
      body: JSON.stringify({
        port: 3000,
        apiKeys: ["test-key-12345"],
        providers: [{ type: "invalid-type" }],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
