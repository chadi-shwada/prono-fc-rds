# Instance Discord (2ᵉ accès)

L'app peut tourner en **2ᵉ instance dédiée à un Discord**, totalement **isolée**
de la version RATP (base, classement et joueurs séparés), avec **connexion via
Discord** et **annonces automatiques dans un salon**.

C'est **le même code / la même image** : tout est piloté par les variables
d'environnement. L'instance RATP n'est pas touchée (sans les variables
`DISCORD_*`, ces fonctions restent désactivées).

---

## 1) Côté Discord (~5 min)

### a) Application OAuth — pour la connexion
1. Va sur <https://discord.com/developers/applications> → **New Application**.
2. Onglet **OAuth2** : récupère le **Client ID** et le **Client Secret**
   (*Reset Secret* pour l'afficher).
3. **OAuth2 → Redirects** → ajoute exactement :
   `https://TON-DOMAINE-DISCORD/api/auth/discord/callback`

### b) Webhook — pour les annonces
Dans ton serveur Discord : **Paramètres du salon** (celui des annonces) →
**Intégrations → Webhooks → Nouveau webhook → Copier l'URL**.

---

## 2) Déploiement — recommandé : un hôte séparé

La 2ᵉ instance est un déploiement à part (domaine + base séparés). Le plus simple
et le plus sûr : un petit VPS dédié.

1. Fais pointer un (sous-)domaine vers l'IP, ex. `discord.tondomaine.fr`.
2. Récupère le repo, copie `.env.production.example` en `.env` et remplis :
   ```env
   DOMAIN=discord.tondomaine.fr
   NEXT_PUBLIC_SITE_URL=https://discord.tondomaine.fr
   FOOTBALL_API_KEY=...            # la même clé que la RATP convient
   APP_SECRET=...                  # openssl rand -hex 32 (un NOUVEAU)
   CRON_SECRET=...                 # openssl rand -hex 32 (un NOUVEAU)
   SEED_ADMIN_NAME=ton_pseudo
   SEED_INVITE_CODE=DISCORD2026
   # --- Discord ---
   DISCORD_CLIENT_ID=...
   DISCORD_CLIENT_SECRET=...
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   # (VAPID optionnels : génère une NOUVELLE paire si tu veux aussi le push ici)
   ```
3. `docker compose up -d`

C'est tout : même image GHCR, mais base/volume isolés. La page de connexion
affichera **« Se connecter avec Discord »**, et résultats / rappels seront
postés dans le salon.

---

## 3) (Option) Sur le MÊME VPS que la RATP

Deux Caddy ne peuvent pas partager les ports 80/443. Pour tout mettre sur un seul
VPS, il faut **un seul Caddy** qui sert les deux domaines vers deux conteneurs
`app`. C'est faisable mais demande un compose + Caddyfile adaptés — demande-le-moi
et je te les fournis prêts à l'emploi.

---

## Notes
- Chaque instance synchronise les matchs indépendamment (mêmes données CDM 2026).
- L'admin de l'instance Discord est créé via `SEED_ADMIN_NAME` + `SEED_INVITE_CODE`
  (tu peux te connecter une fois en pseudo+code pour être admin, puis utiliser
  Discord ensuite — le compte est lié à ton `discordId` au 1ᵉʳ login Discord).
