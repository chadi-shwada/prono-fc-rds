# 🚀 Déployer Prono FC RDS (VPS + Docker + HTTPS)

Guide pas-à-pas pour mettre le site en ligne sur **ton propre serveur** avec un
**vrai nom de domaine** et **HTTPS automatique**. Base de données = SQLite
(fichier persisté sur le serveur, rien d'autre à installer).

Temps estimé : **30 à 45 min**. Coût : **~5 €/mois** (VPS) + **~10 €/an** (domaine).

---

## 1. Acheter un nom de domaine

Chez un registrar (français de préférence) :
- **OVH** (ovh.com), **Gandi** (gandi.net), **Namecheap**…
- Choisis un domaine, ex. `pronofcrds.fr` (~10 €/an).

➡️ Garde l'onglet ouvert : on reviendra configurer le DNS à l'étape 4.

## 2. Créer un serveur (VPS) en Europe

Au choix (tous en France/Europe) :
- **Hetzner** (hetzner.com) — le moins cher : VPS **CX22** ~4 €/mois (Allemagne/Finlande)
- **Scaleway** (scaleway.com) — France, **DEV1-S** ~5 €/mois
- **OVH** (ovhcloud.com) — France, **VPS** ~5 €/mois

Réglages à la création :
- **OS : Ubuntu 24.04 LTS**
- Ajoute ta **clé SSH** (ou note le mot de passe root)
- Note l'**adresse IP** publique du serveur (ex. `91.x.x.x`)

## 3. Se connecter et installer Docker

Depuis ton terminal :

```bash
ssh root@TON_IP_SERVEUR

# Installer Docker + Docker Compose
curl -fsSL https://get.docker.com | sh

# Ouvrir le pare-feu (HTTP/HTTPS/SSH)
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```

## 4. Faire pointer le domaine vers le serveur

Chez ton registrar (étape 1), dans la **zone DNS**, crée un enregistrement :

| Type | Nom | Valeur |
|------|-----|--------|
| `A`  | `@` | `TON_IP_SERVEUR` |
| `A`  | `www` | `TON_IP_SERVEUR` |

➡️ La propagation DNS prend de quelques minutes à 1 h. C'est ce qui permet à
Caddy d'obtenir le certificat HTTPS automatiquement.

## 5. Récupérer le projet sur le serveur

```bash
# Sur le serveur. Remplace par l'URL de ton dépôt git…
git clone TON_DEPOT prono && cd prono
```

> Pas de dépôt git ? Tu peux aussi copier le dossier du projet sur le serveur
> avec `scp -r ./prono_cup_ratp root@TON_IP:/root/prono`.

## 6. Configurer les variables d'environnement

```bash
cp .env.production.example .env
nano .env
```

Remplis :
- `DOMAIN` = ton domaine (ex. `pronofcrds.fr`)
- `NEXT_PUBLIC_SITE_URL` = `https://pronofcrds.fr`
- `FOOTBALL_API_KEY` = ta clé [football-data.org](https://www.football-data.org/) (offre gratuite)
- `APP_SECRET` et `CRON_SECRET` : génère-les avec
  ```bash
  openssl rand -hex 32
  ```
- `SEED_ADMIN_NAME` = ton pseudo admin · `SEED_INVITE_CODE` = le code à partager

Enregistre (`Ctrl+O`, `Entrée`, `Ctrl+X`).

## 7. Lancer ! 🚀

```bash
docker compose up -d --build
```

Le premier build prend quelques minutes. Ensuite :
- Caddy obtient **automatiquement le certificat HTTPS** (Let's Encrypt)
- Les migrations de base + le compte admin sont créés tout seuls

Suivre les logs si besoin :
```bash
docker compose logs -f app
```

## 8. Première mise en route du jeu

1. Ouvre **https://ton-domaine** → tu dois voir la page de connexion.
2. Connecte-toi avec **ton pseudo admin** + le **code d'invitation**.
3. Va dans **Admin → « Synchroniser via l'API »** : ça importe les 104 matchs,
   les 48 équipes (noms en français) **et les lieux** automatiquement.
4. (Optionnel) Crée d'autres **codes d'invitation** et partage-les avec tes collègues.

🎉 C'est en ligne ! La synchro des résultats tourne ensuite **toute seule chaque heure**.

---

## Commandes utiles

```bash
# Mettre à jour le site après un changement de code
git pull && docker compose up -d --build

# Voir les logs
docker compose logs -f app

# Redémarrer
docker compose restart

# Sauvegarder la base (le fichier SQLite)
docker compose cp app:/data/prod.db ./backup-$(date +%F).db
```

## Notes

- **Base de données** : SQLite dans le volume Docker `app-data` (persiste aux
  redémarrages). Pour une sauvegarde, voir la commande ci-dessus.
- **Sécurité** : pense à changer le `SEED_INVITE_CODE` par défaut et garde le
  code privé (la connexion se fait par pseudo + code, sans mot de passe).
- **Mails/rappels** : non inclus pour l'instant (peut être ajouté plus tard).
