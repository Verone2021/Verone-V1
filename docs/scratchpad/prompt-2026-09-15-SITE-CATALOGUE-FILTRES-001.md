# [SITE-CATALOGUE-FILTRES-001] — Les filtres catégorie du catalogue public ne s'appliquent pas

Application : `apps/site-internet` uniquement. Aucune migration, aucun changement RPC, aucun impact back-office ni LinkMe.
Branche : `fix/SITE-CATALOGUE-FILTRES-001` depuis `main`. Une PR. Pas de push ni de merge sans validation de Roméo.
Lis `CLAUDE.md` et `.claude/rules/*.md` avant de commencer (code-standards, non-regression, responsive, no-phantom-data).

## Constat (vérifié dans le code et en base le 2026-09-15)

Le catalogue (`src/app/catalogue/page.tsx`) charge tous les produits via `get_site_internet_products` puis filtre côté client avec `useCatalogueFilters`. Le mécanisme de filtrage fonctionne. Ce qui casse, c'est le pont entre l'URL `/catalogue?categorie=<slug>` et l'état des filtres :

1. **Les familles ne filtrent jamais.** `MegaMenu.tsx` lie les familles sur `?categorie=<categories.slug>` (ex. `mobilier`), mais la page ne résout le slug que contre la table `subcategories`. En base : 12 familles actives, 47 sous-catégories, aucun slug commun. Résultat : « Mobilier » affiche tout le catalogue.
2. **Le second clic dans le menu ne fait rien.** `presetAppliedRef` passe à `true` après la première application. En passant de `?categorie=table-basse` à `?categorie=chaise`, Next.js ne remonte pas la page (même segment) → l'effet sort immédiatement. Le filtre reste sur « Table basse », l'URL dit « Chaise ».
3. **Les tuiles de la home envoient un nom, pas un slug.** `src/components/home/CategoryTiles.tsx` construit `?categorie=Table%20basse` (`name`) alors que la page attend un `slug`. Aucune correspondance.

Cause de fond : l'URL n'est pas la source de vérité. `updateUrl` (tri/page) efface `categorie`, et les cases du drawer n'écrivent jamais dans l'URL.

## Ce qu'il faut livrer

### A. `src/app/catalogue/page.tsx` — l'URL pilote le filtre catégorie

- Supprimer `presetAppliedRef` et l'effet actuel.
- Le paramètre `categorie` accepte une liste de slugs séparés par des virgules. Il est résolu à chaque changement de `searchParams` (dérivation, pas de ref « déjà appliqué ») :
  - slug trouvé dans `subcategories` → cette sous-catégorie (par `name`, puisque `applyFilters` compare `subcategory_name`) ;
  - sinon slug trouvé dans `categories` → toutes les sous-catégories de cette famille ;
  - slug inconnu → ignoré silencieusement, pas d'erreur, pas de filtre fantôme.
- `useSubcategoriesSlugMap` devient `useCategoryTree` : `subcategories.select('name, slug, category_id')` + `categories.select('id, slug').eq('is_active', true)`. Deux requêtes anon en lecture, cache TanStack 5 min. Pas de nouvelle RPC.
- `filters.selectedCategories` devient dérivé de l'URL. Les toggles du drawer sur les catégories écrivent dans l'URL (`router.replace` avec `scroll: false`) au lieu de muter l'état local. Les autres filtres (pièces, style, couleur, prix, fabricant) restent en état local — hors périmètre.
- `updateUrl` conserve `categorie` quand on change le tri ou la page. Changer de catégorie remet `page` à 1.
- `clearFilters` retire `categorie` de l'URL.
- Le bouton « Filtres » et le compteur `activeFilterCount` doivent refléter les catégories venues de l'URL (cliquer « Mobilier » dans le menu → bouton noir avec le nombre de sous-catégories cochées).

### B. `src/components/home/CategoryTiles.tsx`

- Ajouter `slug` à la requête `subcategories` et lier sur `?categorie=${slug}`.

### C. `src/components/layout/MegaMenu.tsx`

- Aucun changement fonctionnel requis. Ne pas toucher au design.

### Décision prise par Roméo à faire respecter

Un clic sur une famille coche toutes ses sous-catégories dans le drawer (pas de section « Famille » séparée pour l'instant).

## Contraintes

- `page.tsx` reste sous 400 lignes : si nécessaire, extraire la résolution slug → noms dans `src/hooks/use-catalogue-category-param.ts` (< 100 lignes, testable sans réseau : fonction pure `resolveCategorieParam(slugs, tree)`).
- Aucune donnée inventée, aucune valeur en dur de slug ou de nom.
- Comportement mobile identique (le drawer est utilisé sur tous les breakpoints).
- Pas de `any`, pas de `@ts-ignore`, `pnpm lint` et `pnpm typecheck` verts sur `apps/site-internet`.

## Recette obligatoire avant de rendre la main (preview Vercel ou `pnpm dev`)

1. Menu → famille « Mobilier » : seuls les produits des sous-catégories de Mobilier s'affichent, compteur de filtres actif, drawer avec les cases cochées.
2. Menu → « Table basse » puis, sans recharger, menu → « Chaise » : la liste change à chaque clic et l'URL suit.
3. Home → tuile catégorie : liste filtrée.
4. Avec un filtre catégorie actif : changer le tri, changer de page → le filtre reste. Bouton retour du navigateur → filtre précédent.
5. Décocher la catégorie dans le drawer → URL nettoyée, catalogue complet.
6. `/catalogue?categorie=inexistant` → catalogue complet, aucune erreur console.

## Livrable

- PR ouverte (pas mergée) avec captures des 6 parcours.
- `docs/scratchpad/dev-report-2026-09-15-SITE-CATALOGUE-FILTRES-001.md` : fichiers touchés, décisions, ce qui reste (passage des autres filtres en URL = chantier suivant, non inclus).
