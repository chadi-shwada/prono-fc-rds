#!/bin/sh
set -e

echo "→ Application des migrations de base de données…"
npx prisma migrate deploy

echo "→ Bootstrap (admin + code d'invitation)…"
node prisma/bootstrap.mjs

echo "→ Démarrage de Prono FC RDS…"
exec npm run start
