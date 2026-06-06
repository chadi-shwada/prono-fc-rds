import { PrismaClient } from "@prisma/client";

// Singleton pour éviter de multiplier les connexions en dev (hot reload Next.js).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (!globalForPrisma.prisma) {
  // Réglages SQLite pour tenir la charge pendant un match (synchro qui écrit +
  // beaucoup de lectures via le LiveRefresher) :
  //  - WAL : les lectures ne sont plus bloquées par l'écriture (persistant).
  //  - busy_timeout : on patiente jusqu'à 5 s sur un verrou au lieu d'échouer.
  // Best-effort : ignoré silencieusement sur un autre moteur (Postgres).
  void prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL;").catch(() => {});
  void prisma.$executeRawUnsafe("PRAGMA busy_timeout=5000;").catch(() => {});
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
