import { ImageResponse } from "next/og";

export const alt = "Prono FC RDS — Pronos de la Coupe du Monde 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #064e3b 0%, #0f172a 55%, #0c4a6e 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 150,
            height: 150,
            borderRadius: 40,
            background: "linear-gradient(160deg, #fde68a, #f59e0b)",
            fontSize: 90,
          }}
        >
          🏆
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          Prono FC RDS
        </div>
        <div style={{ marginTop: 12, fontSize: 36, color: "#5eead4" }}>
          Pronos de la Coupe du Monde 2026 ⚽
        </div>
      </div>
    ),
    { ...size, emoji: "twemoji" },
  );
}
