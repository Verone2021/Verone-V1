# Meta Commerce — Comment l'utiliser

**Audience** : Romeo (utilisateur final). Ce guide répond à la question « j'ai un catalogue Meta, mais comment l'utiliser pour vendre sur Facebook et Instagram ? ».

**Date** : 2026-04-25 — état des lieux après audit Playwright Business Manager.

---

## TL;DR

Le catalogue Meta existe (28 produits, source `https://www.veronecollections.fr/api/feeds/products.xml`, mis à jour automatiquement chaque heure, statut "Tout bon"). Catalog API back-office configuré (token + catalog_id en Vercel le 2026-04-25).

**MAIS** — vu sur la page Facebook publique de Vérone : il n'y a **PAS d'onglet "Boutique"** dans la nav (Tout / À propos / Followers / Photos / Mentions / Plus). Donc tes 28 produits ne sont pas visibles par tes visiteurs Facebook actuels.

Côté Business Manager > Paramètres du catalogue, le canal "Vérone (Page Facebook)" est marqué "Visible" — la connexion technique existe, mais la **section Boutique de la Page n'est pas activée**. Il faut activer l'onglet manuellement (procédure section 2 ci-dessous).

Sur Instagram @veronecollections, à vérifier directement dans l'app (icône Shop sur le profil).

---

## 1. État réel constaté sur la page Facebook publique (audit 2026-04-25)

URL admin : `https://www.facebook.com/461826940345802` (redirige vers la page Vérone en vue admin).

**Page Vérone publique** :

- Nom : Vérone — Magasin de vente en gros
- 6 followers · 0 suivi
- Description : "Vérone est un concept store de décoration dédié au design et à l'art de vivre…"
- Adresse : 229 rue Saint Honoré, Paris 75001
- Lien web : `sumupstore.com` ⚠️ (devrait être `veronecollections.fr`)
- Email : `contact@verone.ai`
- Onglets : **Tout / À propos / Followers / Photos / Mentions / Plus** (Plus = En direct, Groupes, Suivi(e)s)
- ❌ **Pas d'onglet Boutique**

Constat : les visiteurs FB voient la page mais aucun produit. Le catalog est techniquement connecté à la page (Business Manager > Paramètres > Canaux de vente : "Vérone — Visible"), mais l'onglet Boutique n'est pas activé sur la nav publique.

## 2. Activer l'onglet Boutique sur la Page Vérone

Sur les nouvelles Pages Facebook (refonte 2024), la procédure est :

1. Aller sur https://www.facebook.com/461826940345802 connecté en admin
2. Cliquer **"Basculer"** en haut de la sidebar → "Vérone (Page)" pour passer en vue admin de la Page (pas de la persona Roméo)
3. Dans la sidebar admin → **Paramètres** (engrenage) → **Modèles et onglets** (ou "Templates and Tabs")
4. Activer **Boutique**
5. Optionnel : réordonner pour mettre Boutique en haut

Si l'option Boutique n'apparaît pas dans Modèles et onglets : aller sur https://business.facebook.com/commerce/1011870551039929/settings/assets/?business_id=222452897164348 → section "Canaux de vente" → cliquer **"Déconnecter"** sur Vérone → puis **"Associer"** à nouveau → choisir Vérone Page. Cela force la re-création du lien et active l'onglet.

## 3. Côté Instagram @veronecollections

À vérifier directement dans l'app Instagram (le web ne montre pas tous les onglets shopping) :

- Ouvrir profil `@veronecollections`
- Chercher l'icône **sac à provisions** en haut du profil
- Si présente → tap → grille des 28 produits du catalogue
- Si absente → vérifier `https://business.facebook.com/commerce/1011870551039929/settings/assets/?business_id=222452897164348`, "@veronecollections" doit être marqué Visible (déjà OK au 2026-04-25)

## 4. Lien web de la Page : sumupstore.com vs veronecollections.fr

⚠️ Le champ "Liens" de la Page Vérone pointe vers `sumupstore.com` au lieu de `veronecollections.fr`. À corriger :

1. Vue admin Page → Modifier les détails → Liens → remplacer par `https://www.veronecollections.fr`

---

## 2. À quoi sert vraiment le catalogue Meta ?

3 cas d'usage, du plus passif au plus actif :

### Usage 1 — Boutique organique (passif, déjà actif)

Les produits sont visibles sur ta Page Facebook + Instagram pour quiconque visite ton profil. Pas de coût, pas de campagne. Mais aussi pas de visibilité à part les abonnés actuels.

### Usage 2 — Tags produits dans publications & stories (semi-actif, à exploiter)

Quand tu poses une photo sur Instagram (publication, Reel, story), tu peux **taguer un produit du catalogue**. L'utilisateur voit alors un sticker prix sur la photo et peut cliquer pour acheter. C'est le levier #1 pour les concept stores Instagram.

Procédure : créer publication → option « Taguer des produits » → choisir dans le catalogue Vérone.

### Usage 3 — Publicités Advantage+ Catalog Ads (actif, payant)

Meta génère automatiquement des publicités à partir du catalogue. Tu choisis un budget, Meta cible les utilisateurs intéressés et leur montre les produits du catalogue qui matchent leur profil (similar audience, retargeting visiteurs site).

⚠️ Pas activé aujourd'hui : aucun compte publicitaire associé au catalogue (vu dans Paramètres > Comptes publicitaires). À activer si tu veux faire des ads.

---

## 3. État de la chaîne aujourd'hui

| Maillon                                | Statut                       | Détail                                                                                                                                                                                                                           |
| -------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domaine `veronecollections.fr` vérifié | ✅                           | Meta tag dans `apps/site-internet/src/app/layout.tsx:36`                                                                                                                                                                         |
| Pixel Meta installé sur site-internet  | ✅                           | `NEXT_PUBLIC_META_PIXEL_ID` en Vercel, composant `MetaPixel.tsx`, 4 events (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase)                                                                                        |
| Catalogue créé                         | ✅                           | ID `1223749196006844`, 28 produits sync                                                                                                                                                                                          |
| Page Facebook reliée                   | ✅                           | Vérone, ID `461826940345802` — Visible                                                                                                                                                                                           |
| Compte Instagram relié                 | ✅                           | @veronecollections — Visible                                                                                                                                                                                                     |
| Source du flux                         | ⚠️ "Nouveau flux de données" | Probablement feed automatique. À confirmer (procédure ci-dessous)                                                                                                                                                                |
| API Catalog back-office                | ❌                           | `META_ACCESS_TOKEN` + `META_CATALOG_ID` MANQUANTS en Vercel — la sync depuis le BO ne marche pas                                                                                                                                 |
| Compte publicitaire associé            | ❌                           | Aucun — pas d'ads possibles tant que non associé                                                                                                                                                                                 |
| Événements produits matchés            | ⚠️                           | Meta affiche "Examiner les problèmes — Nous ne pourrons peut-être pas montrer les produits les plus pertinents dans vos publicités". Le Pixel envoie des events mais le matching avec les products du catalog n'est pas confirmé |

---

## 6. Actions restantes pour Romeo (dans l'ordre)

### Action A (5 min) — Activer l'onglet Boutique sur la Page Vérone

Procédure section 2 ci-dessus. C'est l'action #1 : sans ça, tout le reste (Pixel, catalog, ads) ne sert à rien côté visiteur Facebook.

### Action B (1 min) — Corriger le lien web sur la Page

Remplacer `sumupstore.com` par `https://www.veronecollections.fr` (section 4).

### Action C (2 min) — Vérifier l'icône Shop sur Instagram

Ouvrir l'app Instagram, profil @veronecollections, vérifier la présence de l'icône sac à provisions. Si absente, le canal est marqué Visible côté admin mais déconnecter/reconnecter peut aider.

### Action D (optionnel, plus tard) — Activer les ads catalog

Si tu veux faire des Advantage+ Catalog Ads : associer un compte publicitaire au catalog. Cf. https://business.facebook.com/commerce/1011870551039929/settings/assets/?business_id=222452897164348 → "Comptes publicitaires" → Modifier dans Business Manager.

### Ce qui est déjà fait par l'agent (2026-04-25)

- ✅ Confirmé URL feed `https://www.veronecollections.fr/api/feeds/products.xml`
- ✅ Configuré `META_ACCESS_TOKEN` + `META_CATALOG_ID` en Vercel pour les 3 environnements (Production / Preview / Development) via System User VeroneCatalog
- ✅ Fix Pixel content_ids = SKU (`[SI-PIXEL-001]` PR #766)
- ✅ Doc complète : README technique + SETUP procédure + USAGE (ce fichier)

---

## 5. Ce qui n'a PAS besoin d'être refait

- Domain verification (déjà OK)
- Création du catalogue (déjà OK)
- Pixel Meta côté site (déjà OK)
- Connexion Page Facebook + Instagram (déjà OK)

## Voir aussi

- `README.md` — vue technique complète (tables DB, routes API, RPCs)
- `SETUP.md` — procédure pas à pas pour récupérer credentials et configurer Vercel
- `docs/current/canaux-vente-publication-rules.md` — règle métier cascade Site → Google + Meta
