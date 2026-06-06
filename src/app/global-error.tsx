"use client";

// Dernier filet de sécurité : capture une erreur du layout racine lui-même.
// Doit fournir ses propres <html>/<body> (il remplace tout le document).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          background: "#060a13",
          color: "#f1f5f9",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 16,
        }}
      >
        <div style={{ fontSize: 56 }}>⚠️</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
          Une erreur est survenue
        </h1>
        <p style={{ color: "#94a3b8", maxWidth: 420, margin: 0 }}>
          {error.digest ? `Référence : ${error.digest}` : "Réessaie dans un instant."}
        </p>
        <button
          onClick={reset}
          style={{
            border: "none",
            borderRadius: 12,
            padding: "10px 20px",
            fontWeight: 700,
            color: "#052e16",
            background: "linear-gradient(90deg, #10b981, #2dd4bf)",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
