import { ImageResponse } from "next/og";
import { SCORING } from "@/lib/constants";

export const alt = "Prono FC RDS — Pronos de la Coupe du Monde 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Aperçu de partage (réseaux / messageries) — généré dynamiquement.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "radial-gradient(900px 500px at 20% 0%, rgba(16,185,129,0.28), transparent 60%), radial-gradient(900px 600px at 100% 100%, rgba(14,165,233,0.25), transparent 55%), #060a13",
          color: "#f1f5f9",
          fontFamily: "sans-serif",
        }}
      >
        {/* En-tête : marque */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 92,
              height: 92,
              borderRadius: 24,
              background: "linear-gradient(160deg, #fde68a, #f59e0b)",
              color: "#0c0a09",
              fontSize: 52,
              fontWeight: 800,
            }}
          >
            26
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
            Prono FC RDS
          </div>
        </div>

        {/* Titre */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.02,
            }}
          >
            Coupe du Monde 2026 🏆
          </div>
          <div style={{ display: "flex", fontSize: 40, color: "#5eead4" }}>
            Le prono maison · entre collègues RATP ⚽
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 46 }}>
            🇺🇸 🇨🇦 🇲🇽 🇫🇷 🇧🇷 🇦🇷
          </div>
        </div>

        {/* Pied : barème + accès */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 14 }}>
            <Chip text={`Score exact ${SCORING.EXACT}`} />
            <Chip text={`Phases finales ×${SCORING.KNOCKOUT_MULTIPLIER}`} />
            <Chip text={`Champion +${SCORING.CHAMPION_BONUS}`} gold />
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#94a3b8" }}>
            🔒 Accès sur invitation
          </div>
        </div>
      </div>
    ),
    { ...size, emoji: "twemoji" },
  );
}

function Chip({ text, gold = false }: { text: string; gold?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "12px 22px",
        borderRadius: 999,
        fontSize: 28,
        fontWeight: 700,
        color: gold ? "#fcd34d" : "#6ee7b7",
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${gold ? "rgba(252,211,77,0.35)" : "rgba(110,231,183,0.3)"}`,
      }}
    >
      {text}
    </div>
  );
}
