# Plan — [SITE-CATALOGUE-FILTRES-001] Les filtres catégorie du catalogue public ne s'appliquent pas

- **Session dédiée n°1** (avant `[BO-PRODUCTS-LIST-MARGIN-001]` : plus court, visible des clients). Une branche, une PR.
- **Source métier** : prompt Claude Cowork `docs/scratchpad/prompt-2026-09-15-SITE-CATALOGUE-FILTRES-001.md` (copie identique
  dans `~/Documents/Workspace/verone/_outputs/`). Ce plan **prévaut** sur le prompt là où il le corrige.
- **Vérifié le 16/09** (code `staging` `be9bbcf3`, fichiers du catalogue inchangés depuis mai 2026 ; base de production en
  lecture seule). `apps/site-internet` uniquement. Aucune migration, aucune fonction SQL, aucun impact back-office ni LinkMe.

## 1. Objectif métier

Un clic sur une famille (« Mobilier ») ou une sous-catégorie (« Table basse ») dans le menu doit filtrer le catalogue, à
chaque clic, et le filtre doit survivre au tri, au changement de page et au bouton retour. **Décision Roméo** : un clic sur
une famille coche toutes ses sous-catégories dans le panneau de filtres.

## 2. État vérifié (écarts avec le prompt en gras)

`SITE` = `apps/site-internet/src`

| Sujet               | Constat                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chargement          | RPC `get_site_internet_products('verone')` (`SITE/hooks/use-catalogue-products.ts:113`), filtre, recherche et tri dans le navigateur                                                                                                                                                                                                                                                                           |
| Filtre              | `SITE/hooks/use-catalogue-filters.ts` (180 l) : état local, comparaison `selectedCategories.includes(p.subcategory_name)` (`:111-114`), `activeFilterCount` (`:96-105`), `hasActiveFilters` (`:84-94`). **Fichier absent du prompt, à modifier**                                                                                                                                                               |
| Page                | `SITE/app/catalogue/page.tsx` **406 lignes (déjà > 400) → extraction obligatoire**                                                                                                                                                                                                                                                                                                                             |
| Bug 1 — familles    | `useSubcategoriesSlugMap` (`page.tsx:29-46`) ne lit que `subcategories` ; `MegaMenu.tsx:166,173` envoie `categories.slug` → jamais trouvé                                                                                                                                                                                                                                                                      |
| Bug 2 — second clic | `presetAppliedRef` (`page.tsx:96-118`) passe à vrai après la première application (même si le slug est inconnu) → `?categorie=a` puis `b` sans rechargement garde `a`                                                                                                                                                                                                                                          |
| Bug 3 — tuiles      | `SITE/components/home/CategoryTiles.tsx:113` construit le lien avec `name`. **Composant non affiché** : retiré de la page d'accueil le 11/05 (`d2e69c4b`)                                                                                                                                                                                                                                                      |
| URL                 | `updateUrl` (`page.tsx:136-154`) ne garde que `tri`, `q`, `page` → perd `categorie` ; cases du panneau (`page.tsx:372-375` → `CatalogueMobileFilters.tsx:77` → `CatalogueSidebar.tsx:146-147`) n'écrivent pas l'URL ; **bouton « Effacer » du panneau (`CatalogueSidebar.tsx:129` → `page.tsx:396-399`) ne nettoie pas l'URL — oublié par le prompt** ; `clearFilters` (`page.tsx:168-173`) nettoie déjà l'URL |
| Autres liens        | `categorie` écrit seulement par `MegaMenu.tsx:166,173,185` (+ `CategoryTiles` non affiché). **`/journal` a son propre `?categorie=`** (`app/journal/page.tsx:24,28-29`, `JournalCategoryFilter.tsx:27,29`) → aucun remplacement global. Recherche de la loupe `SearchOverlay.tsx:63,136` → `/catalogue?q=`                                                                                                     |
| Base (16/09)        | 12 familles actives · 42 sous-catégories (le prompt disait 47) · 0 slug commun familles / sous-catégories · 0 sous-catégorie sans slug · **0 nom de sous-catégorie partagé entre deux familles** (la comparaison par nom est sûre aujourd'hui) · 0 lien `categorie=` stocké dans `site_content` / `cms_pages` · `subcategories.is_active` existe                                                               |
| Tests               | aucun test dans `apps/site-internet` ; convention du dépôt : `node:assert` + `npx tsx` ; script de types = `type-check`                                                                                                                                                                                                                                                                                        |

## 3. Décisions techniques prises (agent, règle 6)

1. **L'URL est la seule source de la sélection de catégories** : `selectedCategories` dérivé de `searchParams` à chaque
   changement (plus de ref « déjà appliqué »). Les autres filtres (pièces, style, couleur, prix, fabricant) restent en état
   local — hors périmètre.
2. `categorie` = liste de slugs séparés par des virgules ; résolution pure `resolveCategorieParam(slugs, tree)` :
   slug de sous-catégorie → son nom ; slug de famille → noms de toutes ses sous-catégories ; inconnu → ignoré.
3. Arbre = `useCategoryTree` : `subcategories (name, slug, category_id, is_active)` + `categories (id, slug, is_active)`,
   même périmètre que le menu, cache 5 min, 2 lectures publiques. Pas de nouvelle RPC.
4. Écriture : cases du panneau, bouton « Effacer » et `clearFilters` passent par `router.replace(…, { scroll: false })` ;
   `updateUrl` conserve `categorie` (et `q`) ; changer de catégorie remet `page` à 1. Le panneau écrit des **slugs de
   sous-catégories** (conversion nom → slug via l'arbre).
5. `use-catalogue-filters.ts` reçoit la liste dérivée de l'URL en entrée (compteur et bouton « Filtres » suivent).
6. **`CategoryTiles`** : correction du lien (`slug`, 2 lignes, comme demandé) sans le remettre sur la page d'accueil ; sa
   réapparition éventuelle est un choix de Roméo, noté au rapport.
7. Recherche de la loupe depuis une page filtrée : repart sans catégorie (nouvelle recherche = nouveau contexte), noté au
   rapport ; `q` lu une seule fois au montage (`page.tsx:64,68`) = même défaut de remontage → **suivi**, hors périmètre.
8. Extraction : `SITE/hooks/use-catalogue-category-param.ts` (< 100 l, fonction pure + hook d'arbre) et
   `SITE/hooks/__tests__/use-catalogue-category-param.test.ts` ; `page.tsx` redescend sous 400 lignes.

## 4. Étapes (un commit par étape, un seul envoi à la fin)

| #   | Étape                                                                                                                                                                                                                                                                                                                                                                                                       | Contrôle        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 0   | Branche `fix/SITE-CATALOGUE-FILTRES-001` depuis `staging` à jour ; captures « avant » des 6 parcours sur le site en ligne (preuve du défaut)                                                                                                                                                                                                                                                                | captures        |
| 1   | `resolveCategorieParam` + tests (`npx tsx`) : sous-catégorie, famille, liste mixte, doublons, slug inconnu, paramètre vide, casse                                                                                                                                                                                                                                                                           | tests verts     |
| 2   | `useCategoryTree` + dérivation de la sélection depuis l'URL dans `page.tsx` ; suppression de `presetAppliedRef` et `useSubcategoriesSlugMap` ; `use-catalogue-filters.ts` alimenté par l'URL                                                                                                                                                                                                                | parcours 1 et 2 |
| 3   | Écritures d'URL : cases, « Effacer », `clearFilters`, `updateUrl` qui garde `categorie`, page remise à 1                                                                                                                                                                                                                                                                                                    | parcours 4 et 5 |
| 4   | Lien `CategoryTiles` par `slug`                                                                                                                                                                                                                                                                                                                                                                             | lecture du code |
| 5   | `pnpm --filter @verone/site-internet type-check` + `lint`, recette § 5 à 375 / 768 / 1024 / 1440 / 1920 (app publique), relecture reviewer-agent, rapport `dev-report-2026-09-XX-SITE-CATALOGUE-FILTRES-001.md`, un envoi, PR vers staging, 4 contrôles requis vérifiés à la main, fusion puis release sur l'ordre de mise en ligne de Roméo, vérification sur veronecollections.fr (`curl -L`, Playwright) | —               |

Recette sans serveur local de l'agent : Roméo lance le site en local, ou vérification sur le site en ligne après release
(le back-office n'a pas d'aperçu Vercel ; vérifier si le site en a un pour la PR avant de choisir).

## 5. Recette (lecture seule, aucune écriture)

1. Menu → « Mobilier » : seuls les produits de ses sous-catégories, bouton « Filtres » actif avec le bon nombre, cases
   cochées dans le panneau.
2. Menu → « Table basse » puis, sans recharger, « Chaise » : la liste change à chaque clic, l'URL suit.
3. Tri puis page 2 avec un filtre actif : le filtre reste ; bouton retour du navigateur → filtre précédent.
4. Décocher la catégorie dans le panneau, puis « Effacer » : URL nettoyée, catalogue complet.
5. `/catalogue?categorie=inexistant` → catalogue complet, 0 erreur console.
6. `/journal?categorie=…` inchangé.

## 6. Hors périmètre / suivis

- Passer les autres filtres (pièces, style, couleur, prix, fabricant) et la recherche dans l'URL.
- `q` non relu quand on relance une recherche depuis la loupe sur `/catalogue` (même cause que le bug 2).
- `view` du bouton de la page d'accueil (`HeroSection.tsx:14`) jamais lu par le catalogue.
- Code mort : `SITE/hooks/use-categories.ts`, option `categorySlug` de `use-catalogue-products.ts:91`, `CategoryTiles`.

## 7. Texte de lancement de la session

> Lis `docs/scratchpad/dev-plan-2026-09-16-SITE-CATALOGUE-FILTRES-001.md` et suis-le (il prévaut sur le prompt du 15/09).
> Revérifie d'abord les points du § 2 sur `staging` à jour, puis fais les étapes 0 à 5. Réponds-moi en français simple.
