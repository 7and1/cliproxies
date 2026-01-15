import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b0b",
        color: "#f5c400",
        fontSize: 28,
        fontWeight: 700,
        borderRadius: 16,
      }}
    >
      CP
    </div>,
    {
      ...size,
    },
  );
}
