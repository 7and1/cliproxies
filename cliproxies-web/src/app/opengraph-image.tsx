import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px",
        background:
          "radial-gradient(circle at 20% 20%, rgba(255, 200, 0, 0.3), transparent 45%), linear-gradient(135deg, #0b0b0b, #151515)",
        color: "#f2f2f2",
        fontSize: 64,
        fontWeight: 700,
        letterSpacing: "-0.02em",
      }}
    >
      <span style={{ fontSize: 20, letterSpacing: "0.4em", opacity: 0.6 }}>
        CLIProxyAPI HUB
      </span>
      <span style={{ marginTop: 24 }}>CLIProxies.com</span>
      <span
        style={{ marginTop: 18, fontSize: 30, fontWeight: 400, opacity: 0.8 }}
      >
        Docs · Ecosystem · Status
      </span>
    </div>,
    {
      ...size,
    },
  );
}
