import { ImageResponse } from "next/og";

export const alt = "Prono FC RDS — Pronos de la Coupe du Monde 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Trophée doré du logo (sans le « 26 » ni le fond — ajoutés en JSX pour un rendu
// net du texte). Mêmes tracés que src/app/icon.svg.
const TROPHY_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><g transform="translate(256,128) scale(0.42) translate(-256,-256)"><path d="M168 150 C108 150 108 244 178 252" fill="none" stroke="url(#g)" stroke-width="26" stroke-linecap="round"/><path d="M344 150 C404 150 404 244 334 252" fill="none" stroke="url(#g)" stroke-width="26" stroke-linecap="round"/><path d="M158 130 H354 V198 C354 270 314 314 256 314 C198 314 158 270 158 198 Z" fill="url(#g)"/><rect x="238" y="312" width="36" height="50" fill="url(#g)"/><rect x="196" y="358" width="120" height="22" rx="8" fill="url(#g)"/><rect x="170" y="382" width="172" height="32" rx="13" fill="url(#g)"/></g></svg>`;
const trophySrc = `data:image/svg+xml;base64,${Buffer.from(TROPHY_SVG).toString("base64")}`;

// Aperçu de partage (réseaux / messageries) — au design de l'app.
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
          gap: 26,
          background:
            "radial-gradient(820px 460px at 22% 8%, rgba(16,185,129,0.30), transparent 60%), radial-gradient(820px 520px at 100% 100%, rgba(14,165,233,0.26), transparent 55%), #060a13",
          color: "#f1f5f9",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo réel : fond sombre arrondi + trophée doré + « 26 » */}
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 188,
            height: 188,
            borderRadius: 43,
            background: "#0a0e17",
            boxShadow: "0 0 60px rgba(245,158,11,0.35)",
          }}
        >
          <img
            src={trophySrc}
            width={188}
            height={188}
            style={{ position: "absolute", top: 0, left: 0 }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 0,
              width: 188,
              display: "flex",
              justifyContent: "center",
              fontSize: 96,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: -5,
            }}
          >
            26
          </div>
        </div>

        {/* Marque */}
        <div style={{ display: "flex", fontSize: 86, fontWeight: 800, letterSpacing: -3 }}>
          <span>Prono FC </span>
          <span style={{ color: "#5eead4", marginLeft: 18 }}>RDS</span>
        </div>

        {/* Accroche */}
        <div style={{ display: "flex", fontSize: 38, color: "#5eead4" }}>
          Pronos de la Coupe du Monde 2026 ⚽
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#94a3b8" }}>
          entre collègues RATP · accès sur invitation 🔒
        </div>

        {/* Pays hôtes */}
        <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 52 }}>
          🇺🇸 🇨🇦 🇲🇽
        </div>
      </div>
    ),
    { ...size, emoji: "twemoji" },
  );
}
