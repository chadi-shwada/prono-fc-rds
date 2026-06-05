# --- Base ---
FROM node:22-slim AS base
WORKDIR /app
# OpenSSL requis par le moteur Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# --- Dépendances ---
FROM base AS deps
COPY package.json package-lock.json ./
# npm install (et non npm ci) : le lockfile peut être généré sous Windows et
# manquer des dépendances optionnelles propres à Linux (ex. @emnapi/* via sharp).
RUN npm install --no-audit --no-fund

# --- Build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# Mini-base SQLite temporaire (avec le schéma) : le build pré-rend certaines pages
# qui interrogent la base (ex. /login), il faut donc une DATABASE_URL valide.
RUN DATABASE_URL="file:/tmp/build.db" npx prisma migrate deploy
RUN DATABASE_URL="file:/tmp/build.db" npm run build

# --- Runtime ---
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/data ./src/data
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
