import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Sonde de santé pour le healthcheck Docker : vérifie que le process répond ET
 * que la base SQLite est accessible (un fichier verrouillé/illisible fait échouer
 * la requête → Docker redémarre le conteneur). Pas de secret : seulement appelée
 * en interne (localhost dans le conteneur).
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
