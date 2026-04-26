# Audit visuel site-internet en prod (veronecollections.fr)

**Date** : 2026-04-26
**Méthode** : Playwright lane-2, viewport 1440×900 + 375×812 mobile
**Pages testées** : 14
**Screenshots** : `.playwright-mcp/screenshots/20260426/`

---

## Bugs critiques (P0)

### Bug 0 — `/canaux-vente/site-internet` retourne 404 en prod (BO)

**URL fautive** : `https://verone-backoffice.vercel.app/canaux-vente/site-internet`
**Symptôme** : "404 Page introuvable" alors que la nav du canal (Dashboard / Analytique / Catalogue / Commerce / Contenu) s'affiche correctement
**Vérification** :

- ✅ Code `apps/back-office/src/app/(protected)/canaux-vente/site-internet/page.tsx` est bien sur main HEAD (commit 4faf8be7f)
- ✅ Composant `ChannelTabs` est en prod (visible sur la page 404)
- ✅ Dernier déploiement Vercel BO sur main = 2026-04-25T16:58:24Z (status SUCCESS)
- ❌ Pourtant cette URL spécifique retourne 404 (header `x-next-error-status: 404`)
- ✅ Les autres canaux fonctionnent : `/canaux-vente/google-merchant` 200, `/canaux-vente/linkme` 200, `/canaux-vente` 200, `/dashboard` 200
  **Diagnostic** : bundle Next.js sur Vercel n'inclut PAS cette route alors qu'elle existe dans le code. Probable bug build incrementiel Vercel/Next ou cache obsolète d'un ancien déploiement.
  **Impact** : impossible d'administrer le site-internet depuis le BO en prod. Bloque création ambassadeurs, gestion produits site, configuration, KPIs commandes/CA, gestion clients site, etc.
  **Fix** : forcer un nouveau déploiement Vercel sur main. Le merge des PR #795 et #796 (qui touchent `apps/back-office/`) devrait suffire à déclencher un rebuild propre — turbo-ignore détectera les changements et autorisera le build.

### Bug 1 — Lien marque produit → 404

**URL fautive** : `/marques/opjet` (et probablement toutes les autres marques)
**Reproduction** : aller sur n'importe quelle fiche produit, cliquer sur "par OPJET" sous le titre
**Console** : `Failed to load resource: status 404 @ /marques/opjet`
**Impact** : navigation cassée + erreur prod tracée par les analytics
**Fix** : soit créer la route `/marques/[slug]`, soit retirer le lien si la route n'est pas prévue à court terme

### Bug 2 — Description de test affichée publiquement

**Page** : `/collections`
**Contenu** : la collection "Collection Bohème Salon 2025" affiche le texte

> "Collection de test pour démonstration inline edit pattern 2025"
> **Impact** : rupture de confiance immédiate — un client voit du langage technique BO
> **Fix** : nettoyer la description en BO ou désactiver `is_active` sur cette collection

### Bug 3 — Téléphone factice sur page Contact

**Page** : `/contact`
**Valeur affichée** : `+33 1 23 45 67 89`
**Impact** : numéro inutilisable, manque de crédibilité
**Fix** : mettre le vrai numéro Vérone ou retirer le bloc téléphone si pas de support tel

---

## Bugs majeurs (P1)

### Bug 4 — Logo Vérone absent du header

**Pages** : toutes
**Symptôme** : zone vide à gauche du menu (où devrait se trouver le logo). Le wordmark "Vérone" est visible dans le footer mais pas dans le header.
**Hypothèse** : composant `Header` n'a pas de logo image OU la classe est masquée OU le fichier image manque
**Fix à investiguer** : voir `apps/site-internet/src/components/layout/Header.tsx`

### Bug 5 — Collections sans cover image

**Page** : `/collections`
**Symptôme** : les 2 collections affichent une icône placeholder (boîte 3D grise) au lieu d'une vraie image cover
**Cause probable** : `collections.cover_image_url` est null ou pointe vers un fichier inexistant. Aucune image uploadée via le BO.
**Fix produit** : uploader des images via `/canaux-vente/site-internet` → onglet Collections

### Bug 6 — Compteur produits collection incohérent

**Page** : `/collections/salon-contemporain`
**Symptôme** : la card sur `/collections` annonce "6 PRODUITS" mais le détail n'affiche que **2 produits** (Eve Orange + Eve Kaki)
**Hypothèses** :

- `collections.product_count` est mis à jour par trigger mais ne tient pas compte du filtre `p.product_status = 'active'` que la RPC `get_site_internet_collection_detail` applique
- 4 produits liés sont en `archived` ou `is_published_online=false`
  **Fix** : aligner le compteur sur le filtre RPC (ou afficher "X / Y produits visibles")

---

## Bugs mineurs (P2)

### Bug 7 — Caractères accentués cassés sur page ambassadeur (non-auth)

**Page** : `/ambassadeur`
**Symptômes** : "Acces non autorise" au lieu de "Accès non autorisé", "reservee" au lieu de "réservée", "Verone" au lieu de "Vérone", "etes" au lieu de "êtes"
**Fix** : corriger les chaînes dans le composant qui affiche le state non-auth (probablement `apps/site-internet/src/app/ambassadeur/page.tsx`)

### Bug 8 (UX) — Bannière cookies couvre les 3 premiers produits du catalogue

**Page** : `/catalogue`
**Symptôme** : à l'arrivée sur la page, la bannière cookies (en bas du viewport) cache visuellement les noms et prix des 3 premières cartes produits
**Sévérité** : modérée — l'utilisateur peut accepter/refuser et voir, mais le premier contact est dégradé
**Fix possible** : layout `pb-24` sur le conteneur catalogue tant que le banner est visible, ou réduire la hauteur du banner

### Bug 9 (UX) — Section "Explorez par catégorie" home : 1 seule tuile

**Page** : `/`
**Symptôme** : la section affiche une unique tuile (Fauteuil) — il n'y a pas d'autres catégories peuplées avec produits publiés
**Cause** : data — seulement les `Fauteuil` ont des produits publiés en ligne actuellement
**Fix produit** : publier d'autres produits en ligne ou masquer la section tant qu'il y a < 3 catégories peuplées

---

## Pages OK (sans bug visible)

| Page                    | Statut          | Observation                                                          |
| ----------------------- | --------------- | -------------------------------------------------------------------- |
| `/` (home desktop)      | ✅              | Hero + grille produits + sections OK                                 |
| `/` (home mobile 375px) | ✅              | Layout responsive correct, hero adapté                               |
| `/produit/[id]`         | ✅              | Galerie + variantes + cross-sell + accordéons + JSON-LD (sauf bug 1) |
| `/cgv`                  | ✅              | 25 379 chars, contenu structuré                                      |
| `/faq`                  | ✅              | 23 063 chars                                                         |
| `/mentions-legales`     | ✅              | 22 515 chars                                                         |
| `/livraison`            | ✅              | 22 603 chars                                                         |
| `/retours`              | ✅              | 23 211 chars                                                         |
| `/panier` (vide)        | ✅              | Design soigné, CTA "Parcourir le catalogue"                          |
| `/contact`              | ✅ (sauf bug 3) | Form + horaires                                                      |
| `/auth/login`           | ✅              | OAuth Google + email/password + lien register/forgot                 |

---

## Pages non testées (besoin d'auth ou flow)

- `/compte` (auth required) — historique commandes + profil
- `/compte/favoris` (auth required) — wishlist
- `/checkout` (besoin produit dans panier) — flow Stripe
- `/checkout/success` et `/checkout/cancel` (post-Stripe)
- `/ambassadeur` (côté authentifié) — profil ambassadeur, code promo, primes
- `/a-propos` — contenu statique long-form
- `/cookies`, `/confidentialite`, `/politique-de-confidentialite`

À faire dans un 2e passage avec login Stripe test + ajout panier.

---

## Console errors / warnings

- `/produit/[id]` : 1 erreur (404 marques) + ~197 warnings (probablement React DevTools, hydration, performance)
- Toutes les autres pages : 0 erreur, 7-11 warnings normaux
- Aucun crash React, aucune erreur de hooks, aucune RLS error

---

## Synthèse pour Romeo

Le site est en **bonne santé technique** (zéro crash, 1 erreur 404 isolée, perf OK). Les vrais problèmes sont **éditoriaux et de pilotage BO** :

1. Du contenu de **test** est en prod (Bug 2)
2. Des **données factices** sont en prod (Bug 3 téléphone)
3. Des **assets manquants** côté BO non-uploadés (Bug 5 covers collections)
4. Une **route manquante** (Bug 1 marques) — soit fonctionnalité incomplète, soit lien à retirer
5. Des **détails UI** à polish (Bug 4 logo, Bug 7 accents, Bug 8 cookies UX, Bug 9 catégories)

**Aucun de ces bugs ne nécessite une migration SQL ou un refactor majeur.** Tout se règle :

- Côté BO `/canaux-vente/site-internet` (mise à jour collections + descriptions + uploads)
- Côté code site-internet (Header logo + page ambassadeur accents + route `/marques/[slug]`)
- Côté config (téléphone contact)

**Recommandation senior** :

- Bloc 1 PR `[SI-CONTENT-001]` → Bug 2, 3, 5 (uniquement contenu DB / config — pas de code) — Romeo peut le faire depuis le BO
- Bloc 1 PR `[SI-UI-001]` → Bug 1, 4, 7 (code site-internet) — petit fix isolé
- Bug 6 (compteur collection) → fix RPC ou logique compteur, à voir selon priorité

À noter : les bugs critiques C1-C5 du premier audit BO étaient **4/5 faux positifs**. L'audit visuel direct a révélé des bugs **réels et différents**, plus pratiques pour un client. **Conclusion** : prioriser les audits visuels en prod plutôt que les rapports d'agents Explore non vérifiés.

---

## Screenshots disponibles

- `.playwright-mcp/screenshots/20260426/site-home-desktop-000708.png`
- `.playwright-mcp/screenshots/20260426/site-home-mobile375.png`
- `.playwright-mcp/screenshots/20260426/site-catalogue-desktop.png`
- `.playwright-mcp/screenshots/20260426/site-produit-detail-desktop.png`
- `.playwright-mcp/screenshots/20260426/site-collections-list.png`
- `.playwright-mcp/screenshots/20260426/site-collection-detail.png`
- `.playwright-mcp/screenshots/20260426/site-contact.png`
- `.playwright-mcp/screenshots/20260426/site-panier-vide.png`
- `.playwright-mcp/screenshots/20260426/site-login.png`
- `.playwright-mcp/screenshots/20260426/site-ambassadeur-non-auth.png`
