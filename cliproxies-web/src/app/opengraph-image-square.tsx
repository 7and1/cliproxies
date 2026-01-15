import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 1200,
};

export const contentType = "image/png";

export default function OpenGraphImageSquare() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "80px",
        background:
          "radial-gradient(circle at 30% 30%, rgba(255, 200, 0, 0.3), transparent 50%), radial-gradient(circle at 70% 70%, rgba(255, 200, 0, 0.2), transparent 50%), linear-gradient(135deg, #0b0b0b, #151515)",
        color: "#f2f2f2",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "20px",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          opacity: 0.6,
          marginBottom: "32px",
        }}
      >
        CLIProxyAPI HUB
      </div>
      <div
        style={{
          fontSize: "72px",
          fontWeight: "700",
          letterSpacing: "-0.02em",
          marginBottom: "24px",
        }}
      >
        CLIProxies
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: "400",
          opacity: 0.8,
          marginBottom: "48px",
        }}
      >
        .com
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "center",
          fontSize: "18px",
          opacity: 0.7,
        }}
      >
        <span
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        >
          OpenAI
        </span>
        <span
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        >
          Claude
        </span>
        <span
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        >
          Gemini
        </span>
        <span
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        >
          Qwen
        </span>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
