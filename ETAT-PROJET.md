# État du projet — Pronos Coupe du Monde 2026

App de pronostics de la CDM 2026. **Next.js 16** (App Router) + **Prisma + SQLite**,
déploiement **Docker**. **Deux instances** sur le **même VPS Hostinger**
(IP `69.62.111.176`), **même image**, données **séparées** :

- **RATP** — https://pronofcrds.fr — connexion **pseudo + code d'invitation**.
- **Discord (InoxStaff)** — https://discord.pronofcrds.fr — connexion **OAuth Discord**,
  branding perso, lot « 1 mois de Discord Nitro ». Easter egg désactivé.

## Déploiement
- **GitHub Actions** (`.github/workflows/deploy.yml`) : build l'image **en CI** →
  push **GHCR** (`ghcr.io/chadi-shwada/prono-fc-rds:latest`, **package public**).
  Les étapes SSH vers le VPS sont **best-effort** (`continue-on-error`) car la
  connexion entrante GitHub→VPS est souvent bloquée. Le VPS récupère l'image lui-même.
- **VPS** : `cd ~/prono && docker compose pull && docker compose up -d`.
  Mettre à jour un fichier de config : `curl -fsSL https://raw.githubusercontent.com/chadi-shwada/prono-fc-rds/main/<fichier>`.
  Ne pas écraser `.env` ni `caddy-conf.d/*.caddy` (exclus du rsync).
- **Compose** : `app` (RATP) + un seul `caddy` (multi-domaines via
  `Caddyfile` qui fait `import /etc/caddy/conf.d/*.caddy`) + `cron`.
  Instance Discord sous **profil `discord`** (activé par `COMPOSE_PROFILES=discord`
  dans le `.env`) : `app-discord` + `cron-discord`, volume `discord-data`.
  Le site Caddy du sous-domaine est dans `caddy-conf.d/discord.caddy`.

## Config par instance — variables d'env lues au RUNTIME
⚠️ Ne PAS utiliser `NEXT_PUBLIC_*` côté serveur (figé au build). Helpers :
`src/lib/features.ts` (`appName`, `appTagline`, `prize`, `previewNames`,
`isEasterEggEnabled`) et `src/lib/discord.ts` (`siteUrl` via **APP_URL**).
- `APP_URL` (URL publique, runtime — indispensable pour redirections OAuth),
  `APP_NAME`, `APP_TAGLINE`, `PREVIEW_NAMES` (3 noms d'aperçu), `PRIZE`,
  `EASTER_EGG_DISABLED=1`.
- Discord : `DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET` (activent le login Discord),
  `DISCORD_WEBHOOK_URL` (annonces salon). Côté .env, l'instance Discord utilise des
  variables préfixées `DISCORD_*` (ex. `DISCORD_APP_NAME`, `DISCORD_PRIZE`, `DISCORD_SITE_URL`…).

## Fonctionnalités
Scoring (`src/lib/scoring-core.ts` + tests `npm test`), barème (exact 3 / écart 2 /
résultat 1, ×2 phases finales, +10 champion, finale aux T.A.B. gérée via
`Match.winnerTeamId`), classement (exacts, par journée), joueur du jour, badges,
easter egg lion (+5 pts, déclencheur **tactile** = tapoter le lion dans /regles, ou
« senegal » au clavier), engagement (streak, duels, accroche du jour), réactions emoji,
landing **rendue serveur + CSS** (visible même si le JS est bloqué) + encart
« ouvre sur mobile » (RATP only), skeletons, bottom-nav mobile, PWA + invite install iOS.
Notifications : **push web** (VAPID) + **webhook Discord**, via `runNotifications()`
appelé par le cron (`/api/cron/sync`), idempotent (`Match.reminderSentAt` /
`resultNotifiedAt`). Broadcast admin « Message à tous ». Admin : saisie résultats,
codes d'invitation, supprimer / promouvoir un utilisateur, notif de test.

## Pièges déjà rencontrés (à se rappeler)
- `NEXT_PUBLIC_*` est figé au build → redirections OAuth via `APP_URL` (runtime).
- `VPS_HOST` doit être l'**IPv4 littérale** (runners GitHub IPv4-only). Image GHCR
  **publique** ; si « denied » au pull alors qu'elle est publique → `docker logout ghcr.io`.
- Le **réseau RATP bloque `/_next/static`** (JS) → landing serveur+CSS pour rester visible.
- **SWC supprime l'espace après `</strong>`** → forcer avec `{" "}`.

## Reste à faire
- Brancher le **webhook Discord** (`DISCORD_WEBHOOK_URL`) quand droits admin obtenus.
- **11 juin 21h** : 1er match → vérifier 1ère synchro auto + notifications.
- (Optionnel) sauvegarde quotidienne de la base SQLite ; push pour l'instance Discord
  (paire `DISCORD_VAPID_*`).
