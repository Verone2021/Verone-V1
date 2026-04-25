# Meta Commerce — Comment l'utiliser

**Audience** : Romeo (utilisateur final). Ce guide répond à la question « j'ai un catalogue Meta, mais comment l'utiliser pour vendre sur Facebook et Instagram ? ».

**Date** : 2026-04-25 — état des lieux après audit Playwright Business Manager.

---

## TL;DR

Tu as **déjà** un catalogue connecté à ta Page Facebook Vérone et à ton Instagram @veronecollections. Les 28 produits du catalogue sont **déjà visibles** sur les deux. Tu n'as rien d'autre à faire pour qu'ils apparaissent — ils sont publics dès maintenant. La seule chose qui manque, c'est :

1. Faire la promotion (publications, lien direct, ads) pour que tes clients voient la boutique
2. Compléter les credentials API back-office (`META_ACCESS_TOKEN` / `META_CATALOG_ID`) si tu veux que le BO Verone puisse pousser les modifs produits automatiquement vers Meta

---

## 1. Où sont les produits aujourd'hui ?

### Sur ta Page Facebook Vérone

URL publique : `https://www.facebook.com/[ID page]` (ID `461826940345802`).

Onglet **"Boutique"** dans le menu de la page. Les visiteurs voient les 28 produits, peuvent cliquer sur un produit, voir les images + prix + description, et le bouton « Voir sur le site Web » les redirige vers `veronecollections.fr/produit/[id]` (mode redirect, pas de checkout Meta).

### Sur ton profil Instagram @veronecollections

Icône **sac à provisions** sur le profil (en haut, à côté des Reels). Tap dessus → grille des produits du catalogue. Idem Facebook : redirect vers le site pour acheter.

### Pour vérifier visuellement

```
Facebook : ouvrir https://www.facebook.com/profile.php?id=461826940345802 → cliquer "Boutique"
Instagram : ouvrir l'app Instagram → @veronecollections → icône Shop
```

Si l'onglet Boutique ou l'icône Shop n'apparaît pas, c'est que la connexion catalogue → page a été désactivée. Reconnexion : https://business.facebook.com/commerce/1011870551039929/settings/assets/?business_id=222452897164348 → section "Canaux de vente" → bouton "Visible" doit être actif.

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

## 4. Actions concrètes à prioriser

### Action 1 (priorité 1) — Vérifier la source du flux catalogue

Aller sur https://business.facebook.com/commerce/catalogs/1223749196006844/home/?business_id=222452897164348 → cliquer **"Gérer"** dans la card "Catalogue" en haut à droite. Tu verras la source : feed URL, planning de mise à jour, dernière synchro.

Si c'est un feed XML/CSV vers `veronecollections.fr/feed/meta.xml` (ou similaire), il faut s'assurer que ce feed reste à jour quand on modifie un produit dans le BO. Si c'est un feed manuel uploadé une fois, alors le catalogue est figé et il faut migrer vers l'API (action 2).

### Action 2 (priorité 2) — Configurer l'API Catalog côté back-office

Voir `SETUP.md` étapes 1 à 7. Permet au BO Verone d'appeler `PATCH /api/meta-commerce/products/[id]/visibility`, etc. (routes créées dans PR #762). Sans ça, les onglets Publication / Pricing du BO ne pourront pas piloter Meta.

### Action 3 (priorité 3) — Résoudre les "problèmes d'événements"

Sur la page d'accueil du Sales Manager, cliquer le bouton bleu "Examiner les problèmes". Meta dira si les events `ViewContent`/`AddToCart`/`Purchase` du Pixel ne trouvent pas leur correspondance dans le catalogue. Cause probable : les `content_ids` envoyés par le Pixel (`product.id` UUID Supabase) ne matchent pas les `id` côté catalog Meta (qui sont les `retailer_id` = SKU). Fix : modifier `MetaPixel.tsx` pour envoyer `product.sku` au lieu de `product.id` dans les helpers `trackMeta*`.

### Action 4 (optionnel) — Activer les ads

Aller sur https://business.facebook.com/commerce/1011870551039929/settings/assets/?business_id=222452897164348 → section "Comptes publicitaires" → "Modifier dans Business Manager" → associer le compte ads Verone (s'il existe, sinon en créer un).

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
