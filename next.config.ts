import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En-têtes de sécurité appliqués à toutes les réponses (les deux instances).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Anti-clickjacking : le site ne doit jamais être affiché dans une iframe.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          // Le navigateur ne doit pas « deviner » les types MIME.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Pas d'URL interne complète divulguée aux sites externes.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // L'app n'utilise ni caméra, ni micro, ni géoloc.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HTTPS imposé pendant 1 an (Caddy sert déjà tout en HTTPS).
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
