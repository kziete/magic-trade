import { ImageResponse } from "next/og";

export const alt = "Cardtones";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 56px",
            borderRadius: 16,
            border: "2px solid #3560b0",
          }}
        >
          <span
            style={{
              fontSize: 120,
              fontWeight: 650,
              letterSpacing: "-0.02em",
              color: "#f5f5f5",
              fontFamily:
                "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
            }}
          >
            Cardtones
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
