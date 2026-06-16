# 🏆 Pronos Coupe du Monde 2026 — entre collègues RATP

Site privé de pronostics pour la Coupe du Monde 2026. Accès réservé via **code d'invitation**.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **Prisma 6** + **SQLite** en local (→ Postgres pour le déploiement)
- Auth maison (code d'invitation + session par cookie)

## Démarrer en local

```bash
npm install
npx prisma migrate dev      # crée la base + applique le schéma
npx prisma db seed          # données de démarrage (admin, code, démo)
npm run dev                 # http://localhost:3000
```

## Qualité

Avant d'ouvrir une PR ou de déployer, lance au minimum :

```bash
npm run lint
npm run typecheck
npm test
```

Le script de test exécute les fichiers `*.test.ts` avec le runner natif Node et
`tsx`. La glob n'est pas entourée de guillemets afin d'être développée par le
shell et de ne pas être interprétée comme un chemin littéral.

### Identifiants de démarrage (à changer !)

- **Admin** : `chadi` / `admin1234`
- **Code d'invitation** : `RATP2026`

Personnalisables via variables d'env au moment du seed :
`SEED_ADMIN_NAME`, `SEED_ADMIN_PASSWORD`, `SEED_INVITE_CODE`.

## Règles de points

| Cas | Phase de groupes | Phases finales (×2) |
|---|---|---|
| Score exact | 3 | 6 |
| Bon résultat + bon écart | 2 | 4 |
| Bon résultat seul | 1 | 2 |
| Mauvais résultat | 0 | 0 |

**Bonus** : +10 pts si on prédit le vainqueur final (prono verrouillé au coup d'envoi du tournoi).

Barème centralisé dans [`src/lib/constants.ts`](src/lib/constants.ts).

## Résultats des matchs

Deux modes, complémentaires :

1. **Automatique (API)** — bouton « Synchroniser » dans l'admin. Nécessite une clé
   [football-data.org](https://www.football-data.org/) dans `.env` (`FOOTBALL_API_KEY`).
2. **Manuel (secours)** — saisie des scores dans la page Admin. Recalcule les points immédiatement.

## Structure

```
src/
  app/
    (auth)/          login + inscription
    (app)/           pages protégées (accueil, matchs, classement, admin)
    actions/         server actions (auth, predictions, admin)
  components/        formulaires & UI
  lib/               prisma, auth, scoring, leaderboard, football-api, constants
prisma/
  schema.prisma     modèle de données
  seed.ts           données de démarrage
```

## Déploiement

Le chemin recommandé est le déploiement **VPS + Docker + HTTPS** documenté dans
[`DEPLOY.md`](DEPLOY.md). Il conserve SQLite dans un volume Docker persistant et
évite d'avoir deux schémas Prisma différents entre le local et la production.

### Variante Vercel / Postgres

Si tu préfères Vercel, crée une branche de déploiement dédiée et fais-y
explicitement la bascule Prisma vers Postgres :

1. Créer une base **Postgres** (Neon / Vercel Postgres / Supabase).
2. Dans `prisma/schema.prisma`, passer `provider = "postgresql"` sur cette
   branche uniquement.
3. Renseigner `DATABASE_URL`, `APP_SECRET`, `CRON_SECRET` et `FOOTBALL_API_KEY`
   dans les variables Vercel.
4. Lancer `npx prisma migrate deploy` au déploiement.

Évite de changer le provider directement sur la branche principale si tu
continues à développer et tester en SQLite local.
