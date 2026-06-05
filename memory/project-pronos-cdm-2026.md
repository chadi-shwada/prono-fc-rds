---
name: project-pronos-cdm-2026
description: Site de pronostics privé pour la Coupe du Monde 2026, réservé aux collègues RATP de Chadi
metadata:
  type: project
---

Projet : site web de pronostics pour la **Coupe du Monde 2026** (11 juin – 19 juillet 2026), idée venue d'un client RATP de Chadi.

**Nom du site : « Ligne 26 »** (choisi le 2026-06-05) — clin d'œil bus (l'équipe de Chadi bosse sur les bus RATP) + écho à l'icône « 26 »/CDM 2026. Appliqué partout : NavBar, hero login (`Ligne <gradient>26</gradient>`), footer, métadonnées (`layout.tsx`), `manifest.ts`, `opengraph-image.tsx`. Tagline : « Pronos de la Coupe du Monde 2026 · entre collègues RATP ».

Contraintes et choix actés (2026-06-04) :
- **Privé** : accès réservé aux collègues de la RATP via **code d'invitation** (pas ouvert au public).
- **Système de points avancé** (barème validé) :
  - Phase de groupes : score exact = 3 pts, bon résultat + bon écart = 2 pts, bon résultat seul = 1 pt, sinon 0.
  - Phases finales (8e → finale) : mêmes règles **×2**.
  - **Bonus vainqueur final** de la CDM (prono saisi avant le 1er match).
- **Résultats** : **automatiques via API foot**, avec **mode admin manuel en secours** obligatoire.
- **Stack** : Next.js + base de données, cible de déploiement gratuit type Vercel.
- Timing serré : le tournoi commence ~1 semaine après le démarrage du projet.

Répertoire de travail : `C:\Users\FlowUP\Documents\prono_cup_ratp` (repo git initialisé par create-next-app).

## État technique (2026-06-04) — squelette complet et testé de bout en bout
- Stack : **Next.js 16** (App Router) + TS + Tailwind 4 ; **Prisma 6 + SQLite** en local.
- ⚠️ Prisma 7 a été écarté (adaptateurs de driver obligatoires, trop complexe) → on est sur **Prisma 6**.
- Auth maison : **connexion par pseudo + code d'invitation, SANS mot de passe** (depuis 2026-06-04, demande de Chadi). Une seule page `/login` (form `AuthForm` + `authAction`) : pseudo connu → reconnexion ; pseudo nouveau → création auto. `/register` redirige vers `/login`. `passwordHash` rendu optionnel (migration `password-optional`), `hashPassword`/`verifyPassword` dans lib/auth.ts désormais inutilisés. ⚠️ N'importe qui avec le code peut se connecter sous un pseudo existant (admin compris) — acceptable entre collègues de confiance.
- Admin seed : pseudo `chadi` (isAdmin). Code d'invitation seed : `RATP2026`.
- Scoring dans `src/lib/scoring.ts` (+ barème dans `src/lib/constants.ts`). Vérifié : prono 2-1 sur résultat 3-1 = 1 pt.
- Résultats : synchro API **football-data.org** (`src/lib/football-api.ts`, compétition "WC", nécessite `FOOTBALL_API_KEY`) + saisie manuelle admin en secours.
- Seed actuel = données de **démo** (8 équipes, 4 matchs). Le vrai calendrier viendra de la synchro API.
- Build OK, parcours validé via preview (login → prono → résultat admin → points → classement).
- **Design (2026-06-04)** : refonte visuelle. Libs `motion` (animations) + `flag-icons` (vrais drapeaux, CSS hors-ligne). Table de correspondance code FIFA → ISO dans `src/lib/flags.ts`, composant `src/components/Flag.tsx`. Fond animé "aurore" + utilitaires (`.glass`, `.text-gradient`, `.shimmer`) dans `globals.css`. Typo d'affichage **Sora** (`--font-display`). Composants d'anim : `Reveal.tsx`, `AnimatedNumber.tsx`. Classement avec barres de points/podium.
- **API foot OK (2026-06-04)** : clé football-data.org en place dans `.env`. Synchro testée → **104 matchs + 48 équipes** importés (72 groupes + 32 phases finales, finale 19/07/2026). Les matchs à élimination ont des équipes « à déterminer » (objet aux champs null côté API → gérés). Données de démo supprimées.
  - ⚠️ Les **noms d'équipes viennent de l'API en anglais** ("South Korea", "Czechia", "United States"…). Une table de traduction FR serait un plus.
  - Bouton « Synchroniser » dans l'admin : à recliquer pendant le tournoi pour récupérer les scores (recalcul auto des points).
- **Évolutions UI (2026-06-04, suite)** :
  - Noms d'équipes **en français** (`src/lib/teamNames.ts`, par code FIFA ; stockés en base + appliqués à la synchro). Drapeau Uruguay corrigé (URY).
  - Prénom **capitalisé** sur l'accueil (classe `capitalize`).
  - Sélecteur « champion » refait : dropdown custom avec drapeaux + recherche (`src/components/ChampionSelect.tsx`). ⚠️ La section champion sur /matchs n'est PAS enveloppée dans `Reveal` (le `transform` piégeait le menu dans son contexte d'empilement).
  - Nouvelle page **/calendrier** (matchs groupés par jour, en-têtes collants).
  - Nouvelle page **/carte** : carte interactive des 16 villes hôtes (`src/components/HostMap.tsx` + `src/lib/hostCities.ts`), survol = infos stade/pays/matchs.
    - **Vrai tracé géographique** (frontières états US + Canada + Mexique) via `d3-geo` (projection geoAlbers) + `topojson-client`. Tracés dans `public/maps/states-10m.json` (us-atlas) et `countries-110m.json` (world-atlas), fetchés côté client. Villes placées par coordonnées [lng,lat] réelles. Counts officiels codés en dur.
  - Nom capitalisé aussi dans la NavBar (`capitalize`).
  - Carte recadrée serré sur les villes hôtes (fitExtent sur les points des villes). Sous la carte : fiches villes/stades cliquables ; clic sur un marqueur = scroll vers la fiche (`city-<id>`).
  - Nouvelle page **/tableau** : bracket seizièmes→finale comme le visuel officiel (`src/lib/bracket.ts` = labels de places 1E/2A/3ABCDF…, `src/app/(app)/tableau/page.tsx`). Dates des tours tirées de la base. Menu : + Tableau.
  - **Lieux des matchs RÉSOLU (2026-06-04)** : football-data ne fournit pas de `venue`, donc import du calendrier officiel depuis **openfootball/worldcup.json** (domaine public). Fichier bundle : `src/data/wc2026-schedule.json`. Champ `Match.venueCity` (id HOST_CITIES) ajouté au schéma (migration `add-venue`). Script `prisma/import-venues.ts` : appariement par **date/heure UTC + codes équipes** (groupes) et **date/heure UTC** (phases finales) → 104/104 matchs reliés. La synchro football-data ne touche pas `venueCity`.
    - Page Carte : sous chaque fiche ville, liste des matchs (équipes FR + drapeaux + date/heure ; label de tour pour les phases finales). Clic sur la carte → scroll vers la fiche.
    - ⚠️ Après un futur reset/migration de la base, relancer `npx tsx prisma/import-venues.ts` pour re-remplir les lieux.
  - Menu mis à jour : Matchs · Calendrier · Carte · Classement · Admin.
- **Animations / finitions (2026-06-04)** : `canvas-confetti` (confettis à la validation d'un prono ; pluie dorée pour le champion). Transitions de page (`src/app/(app)/template.tsx`). Onglet actif animé (pastille glissante `layoutId` dans `src/components/NavLinks.tsx`, NavBar devenue cliente pour les liens). Barres du classement animées (`src/components/AnimatedBar.tsx`) + halo doré pulsé sur le 1er. Utilitaires CSS dans globals : `.card-hover` (soulèvement), `.float` (trophées), `.glow-gold`. Tous désactivés en `prefers-reduced-motion`. Pseudos capitalisés (NavBar, accueil, classement).
- **UX / animations vague 2 (2026-06-04)** :
  - **Son** Web Audio (sans fichier) : `src/lib/sound.ts` — blip à la validation d'un prono, fanfare au choix du champion.
  - **Ballons flottants** en fond : `src/components/Particles.tsx` (positions déterministes, masqués en reduced-motion), montés dans le layout `(app)`. Itéré 2x le 2026-06-04 : (1) semblaient « pluie » → grossis ; (2) la montée semblait « bulles d'eau » → version finale = **positions FIXES** (coins/bords) qui **flottent sur place** (`.particle-float`, va-et-vient + rotation, pas de traversée d'écran). 6 emojis, opacité ~0.10-0.14, ombre portée.
  - **Compte à rebours** en direct jusqu'au 1er match : `src/components/Countdown.tsx`, sur le dashboard.
  - **Menu mobile** (hamburger + tiroir animé) : `src/components/MobileMenu.tsx` ; liens centralisés dans `src/lib/navLinks.ts` ; `NavLinks` desktop = `hidden md:flex`, logout desktop = `hidden md:flex`.
  - **Flip 3D** du score des matchs terminés : `src/components/ScoreReveal.tsx` (visible quand des résultats existent).
- **UX / design vague 3 (2026-06-04)** :
  - Page de connexion redessinée : hero trophée flottant, compte à rebours, **bandeau de drapeaux défilant** (`src/components/FlagsMarquee.tsx`, CSS `.marquee`).
  - Page Matchs : **onglets de filtre** via searchParams (À venir / Mes pronos / Tous), **barre de progression** des pronos, saisie affichée seulement si les 2 équipes sont connues (sinon « Équipes à déterminer » via `TbdMatch`). « À venir » = matchs jouables uniquement.
- **Sélecteur de score sur-mesure (2026-06-04)** : `src/components/ScoreInput.tsx` remplace les inputs `type=number` (spinners natifs gris hors-thème) dans `PredictionForm` et `AdminResultForm`. Flèches ▲▼ stylées, champ tapable (0-99), placeholder « – ». MAJ d'état fonctionnelle (`setV(prev=>…)`) pour que les clics rapides s'accumulent.
- **Largeur (2026-06-04)** : conteneur élargi de `max-w-4xl` à `max-w-[1440px]` (layout `(app)` + NavBar), padding responsive `px-4 sm:px-6 lg:px-10`. Pour remplir l'espace : matchs en `lg:grid-cols-2`, fiches villes carte en `lg:grid-cols-3`, calendrier (par jour) en `lg:grid-cols-2`. La carte interactive devient grande/bannière.
- **Fonctions sociales/admin (2026-06-04)** :
  - **Détail match** `/matchs/[id]` : révèle les pronos de tous les participants **après le coup d'envoi** (avant = masqué, anti-triche). Badge « 🎯 exact », points. Liens depuis cartes matchs (« Pronos des autres → ») et lignes du calendrier (cliquables).
  - **Page `/regles`** (barème depuis `SCORING`), lien footer + menu mobile.
  - **Page `/profil`** (stats : points, rang, scores exacts, % réussite, champion). Pseudo navbar = lien vers /profil.
  - **Admin** : créer/activer/désactiver des **codes d'invitation** (`createCodeAction`, `toggleCodeActiveAction` + `CreateCodeForm`), liste des **membres** (pseudo, admin, nb pronos, date).
  - **Auto-synchro** : route `GET /api/cron/sync` (protégée par `CRON_SECRET` en prod) + `vercel.json` (cron horaire `0 * * * *`). ⚠️ Plan Vercel Hobby limite les crons à 1×/jour ; bouton manuel toujours dispo. La synchro ne touche pas `venueCity`.
- **Finitions pro + équité (2026-06-05)** :
  - **Icône** : design original « 26 + trophée doré sur fond sombre » (style CDM 2026, sans copier le logo FIFA). `src/app/icon.svg` (favicon) + PNG générés via `sharp` (`public/icons/icon-192|512.png`, `src/app/apple-icon.png`). Manifest PWA installable (`src/app/manifest.ts`), image Open Graph dynamique (`src/app/opengraph-image.tsx`, next/og + emoji twemoji), métadonnées (metadataBase via NEXT_PUBLIC_SITE_URL/VERCEL_URL, openGraph, themeColor).
  - **Auth insensible à la casse** : `authAction` compare les pseudos en minuscule (évite les doublons type "Chadi"/"chadi"). ⚠️ SQLite ne gère pas mode:insensitive → comparaison en mémoire (ok faible volume).
  - **Classement** : départage par **scores exacts** (`getLeaderboard` calcule `exactScores`), colonne 🎯 affichée. **Classement par journée** (`?jour=YYYY-MM-DD`, chips visibles dès qu'un match est terminé).
  - **Badge EN DIRECT** (`src/components/LiveBadge.tsx`, statut LIVE) sur matchs/calendrier/détail.
- **Easter egg Sénégal (2026-06-05)** : `src/components/SenegalEasterEgg.tsx` (monté dans le layout `(app)`). Taper « senegal » au clavier (n'importe où) déclenche un overlay rigolo (lion 🦁, drapeau, confettis vert/jaune/rouge) avec une vanne amicale CAN/Maroc — pour chambrer un collègue supporter du Sénégal. Vanne modifiable dans le composant.
- **Déploiement self-hosted (2026-06-05)** : choix de Chadi = VPS + Docker + Caddy (HTTPS auto), hébergeur Europe, **SQLite gardée** (pas de Postgres). Fichiers ajoutés : `Dockerfile` (build + `next start`), `docker-compose.yml` (app + caddy + cron horaire), `Caddyfile`, `docker-entrypoint.sh` (migrate deploy + `prisma/bootstrap.mjs`), `.dockerignore`, `.gitattributes` (LF), `.env.production.example`, **`DEPLOY.md`** (guide pas-à-pas).
  - App rendue autonome : `src/lib/venues.ts` (`importVenues(db)`) appelé **automatiquement à la fin de la synchro** (`football-api.ts`) → 1 clic « Synchroniser » importe matchs + équipes FR + lieux + recalcul. `prisma/bootstrap.mjs` crée admin + code sans données démo.
  - Cron auto via service `cron` (alpine curl horaire sur `/api/cron/sync` avec `CRON_SECRET`).
  - ⚠️ Build Docker non testé en local (démon Docker Desktop éteint) → se construira sur le VPS.
- **Reste à faire (déploiement)** : Chadi doit acheter domaine + VPS (Hetzner/Scaleway/OVH), suivre `DEPLOY.md`. Puis 1ère synchro + changer le code d'invitation.
