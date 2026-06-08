# Instance Discord (2ᵉ accès) — sur le même VPS

L'app peut faire tourner une **2ᵉ instance dédiée à un Discord**, sur le **même
VPS** que la RATP (pas besoin d'un 2ᵉ serveur), totalement **isolée** (base,
classement et joueurs séparés), avec **connexion Discord** et **annonces dans un
salon**.

Même image, un seul Caddy pour les deux domaines. L'instance Discord **ne démarre
que si tu l'actives** (profil Docker) → **la RATP n'est jamais impactée**.

---

## 1) Côté Discord (~5 min)

**a) Application OAuth (connexion)** — <https://discord.com/developers/applications>
→ **New Application** → onglet **OAuth2** :
- récupère **Client ID** + **Client Secret** (*Reset Secret*),
- **Redirects** → ajoute : `https://discord.tondomaine.fr/api/auth/discord/callback`

**b) Webhook (annonces)** — dans ton serveur Discord : **Paramètres du salon →
Intégrations → Webhooks → Nouveau webhook → Copier l'URL**.

---

## 2) Côté VPS

1. **DNS** : fais pointer un sous-domaine (ex. `discord.tondomaine.fr`) vers l'IP
   du VPS (un enregistrement A).

2. **Récupère les derniers fichiers** (compose + Caddyfile + dossier
   `caddy-conf.d/`) — ils arrivent via le déploiement, ou `git pull` / rsync.

3. **`.env`** (dans `~/prono/.env`) : ajoute la section Discord (modèle dans
   `.env.production.example`) et **active le profil** :
   ```env
   COMPOSE_PROFILES=discord
   DISCORD_SITE_URL=https://discord.tondomaine.fr
   DISCORD_APP_SECRET=...            # openssl rand -hex 32
   DISCORD_CRON_SECRET=...           # openssl rand -hex 32
   DISCORD_SEED_ADMIN_NAME=ton_pseudo
   DISCORD_SEED_INVITE_CODE=DISCORD2026
   DISCORD_CLIENT_ID=...
   DISCORD_CLIENT_SECRET=...
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```

4. **Caddy du sous-domaine** :
   ```bash
   cd ~/prono
   cp caddy-conf.d/discord.caddy.example caddy-conf.d/discord.caddy
   # édite caddy-conf.d/discord.caddy → mets ton domaine discord.tondomaine.fr
   ```

5. **Démarre** :
   ```bash
   docker compose up -d
   ```
   (Comme `COMPOSE_PROFILES=discord` est dans `.env`, l'instance Discord démarre,
   et le cron de mise à jour la gère aussi automatiquement.)

✅ `https://discord.tondomaine.fr` affiche la connexion avec le bouton **« Se
connecter avec Discord »**, et les résultats / rappels sont postés dans le salon.

---

## Notes
- **RATP inchangée** : sans `COMPOSE_PROFILES=discord`, seuls `app` + `caddy` +
  `cron` tournent, exactement comme avant.
- **Ressources** : ça fait tourner 2 apps Next sur le VPS. Sur une petite
  machine, garde un peu de **swap** (cf. le souci RAM qu'on a réglé).
- Chaque instance synchronise les matchs indépendamment (mêmes données CDM 2026).
- L'admin Discord est créé via `DISCORD_SEED_ADMIN_NAME` + `DISCORD_SEED_INVITE_CODE`
  (connecte-toi une fois en pseudo+code pour être admin ; ton compte se lie à ton
  Discord au 1ᵉʳ login Discord).
