import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 600,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px",
        background:
          "radial-gradient(circle at 80% 20%, rgba(255, 200, 0, 0.25), transparent 45%), linear-gradient(135deg, #0a0a0a, #111111)",
        color: "#f2f2f2",
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          Open Source AI Proxy Gateway
        </div>
        <div
          style={{
            fontSize: "56px",
            fontWeight: "700",
            letterSpacing: "-0.02em",
            lineHeight: "1.1",
          }}
        >
          CLIProxies.com
        </div>
        <div
          style={{
            fontSize: "24px",
            opacity: 0.8,
            marginTop: "8px",
          }}
        >
          OpenAI · Claude · Gemini · Qwen
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "24px",
            fontSize: "16px",
            opacity: 0.7,
          }}
        >
          <span>Config Generator</span>
          <span>·</span>
          <span>Ecosystem Apps</span>
          <span>·</span>
          <span>Status Monitor</span>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
