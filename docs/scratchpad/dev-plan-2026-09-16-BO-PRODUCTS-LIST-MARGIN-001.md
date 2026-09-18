# Plan — [BO-PRODUCTS-LIST-MARGIN-001] Liste produits : segments, recherche, marge réelle, prix site en ligne

- **Session dédiée n°2** (après `[SITE-CATALOGUE-FILTRES-001]`, plus court et visible des clients). Une branche, une PR.
- **Source métier** : prompt Claude Cowork `docs/scratchpad/prompt-2026-09-15-BO-PRODUCTS-LIST-MARGIN-001.md` (copie identique
  dans `~/Documents/Workspace/verone/_outputs/`). Ce plan **prévaut** sur le prompt là où le code a changé depuis (#1160 en
  production le 15/09).
- **Vérifié le 16/09** (code `staging` `be9bbcf3` + base de production, lecture seule). Aucune migration. Aucune écriture en
  base hors action explicite de l'utilisateur (édition du prix site).

## 1. Objectif métier (Roméo, 15/09)

Voir sans ouvrir la fiche, pour chaque produit de la liste catalogue : prix d'achat, prix de revient, prix sur le site,
marge réelle avec un code couleur ; corriger le prix du site dans la ligne ; retrouver vite un produit ; naviguer par
segment (famille, sous-catégorie).

## 2. État vérifié (écarts avec le prompt en gras)

`CAT` = `apps/back-office/src/app/(protected)/produits/catalogue`

| Sujet               | Constat                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fichiers liste      | `CAT/CatalogueListView.tsx` 267 l · `CAT/CatalogueProductRow.tsx` **313 l (déjà > 200)** · `CAT/CatalogueTabs.tsx` 78 · `CAT/CatalogueToolbar.tsx` 122 · `CAT/use-quick-edit.ts` 201 · `CAT/page.tsx` 375 · `CAT/use-catalogue-page.ts` 545. **`CatalogueFilterPanel` est dans `apps/back-office/src/components/catalogue/`**                                                                                           |
| Colonne « Marge »   | affiche `products.margin_percentage` (marge **cible**) colorée comme une marge réelle (`CatalogueProductRow.tsx:232-250`, en-tête et tri `CatalogueListView.tsx:206-208`, `:100-101`) → à remplacer                                                                                                                                                                                                                     |
| Colonne « Prix HT » | **c'est déjà le prix d'achat** `cost_price` avec crayon (`CatalogueProductRow.tsx:211-230`) → devient « Achat HT »                                                                                                                                                                                                                                                                                                      |
| Filtres             | `filters.families/subcategories` synchronisés dans l'URL (`use-catalogue-page.ts:75-79`, `syncFiltersToUrl` `:128-138`). **Côté serveur, familles + catégories + sous-catégories sont fusionnées en une union** (`packages/@verone/categories/src/hooks/use-catalogue-data.ts:19-54`) : famille + sous-catégorie ⇒ toute la famille                                                                                     |
| Recherche           | onglet Actifs : name, sku, supplier_reference, gtin, manufacturer (`use-catalogue-data.ts:88-90`) ; **Archivés et À compléter : name et sku seulement** (`:208-212`, `:278-282`)                                                                                                                                                                                                                                        |
| Rafraîchissement    | **la liste n'est pas en TanStack Query** (`use-catalogue.ts` en `useState`) → une invalidation ne met pas la ligne à jour                                                                                                                                                                                                                                                                                               |
| Sélection produit   | `PRODUCT_SELECT` (`use-catalogue-data.ts:56-68`) a `cost_price`, `cost_net_avg`, `margin_percentage`, `is_published_online` ; **manque `eco_tax_default`** (colonne présente en base)                                                                                                                                                                                                                                   |
| Règle prix site     | `get_site_internet_products` (`supabase/migrations/20260914020400_bo_channels_p7_site_internet_sellable.sql:41-43,69`) : `COALESCE(channel_pricing.custom_price_ht` (canal `site_internet`, `is_active`, sans filtre `min_quantity`) `, price_list_items.price_ht` (item actif, liste active `list_type='base'`, `priority` la plus basse)`)` ; source `channel_pricing` / `base_price` ; `discount_rate` non appliqué  |
| Écriture prix site  | **existe déjà** : `useUpdateChannelPrice` (`packages/@verone/common/src/hooks/use-channel-pricing.ts:149-194`) → `apps/back-office/src/app/api/channel-pricing/upsert/route.ts` (upsert `channel_pricing`, `is_active` true, 422 sous le minimum sauf `override_minimum`). Parcours confirmation → `override_minimum` déjà codé dans `CAT/detail/[id]/_components/_pricing-blocks/use-channel-pricing-editor.ts:94-132` |
| Prix minimum        | **incohérence** : route serveur = `cost_price` + éco-part × (1 + marge) (`route.ts:90-113`) ; fiche produit = `cost_net_avg ?? cost_price` (`calculateMinSellingPrice`, `@verone/common`)                                                                                                                                                                                                                               |
| Revient             | helper pur existant `resolveCost({costNetAvg, costPrice})` (`packages/@verone/products/src/utils/product-sales-margin.ts:189-201`, `cost_net_avg` seulement si > 0, sans éco-part) + tests                                                                                                                                                                                                                              |
| Lots                | `use-product-images-batch.ts` dans `packages/@verone/products/src/hooks/` (une requête `.in`) ; **aucun lot de prix canal** ; modèle de compteurs par segment : `use-sourcing-segment-counts.ts`                                                                                                                                                                                                                        |
| Base (16/09)        | 209 produits actifs : prix canal site 30 · liste de base seule 177 · **aucun prix 2** ; tous ont un `cost_price` ; 159 ont un `cost_net_avg` ; staff lit `channel_pricing`, `price_lists`, `price_list_items` (RLS `is_backoffice_user()`) ; canal site `0c2639e9-df80-41fa-84d0-9da96a128f7f` (constante `canaux-vente/site-internet/constants.ts:5`)                                                                  |

## 3. Décisions techniques prises (agent, règle 6)

1. **Aucune nouvelle écriture** : réutiliser `useUpdateChannelPrice` + la route existante (routes API immuables) ; ne pas
   créer `useUpdateSiteChannelPrice` ; ne jamais écrire dans `price_list_items`.
2. **Minimum affiché = minimum du serveur** : première tentative sans `override_minimum` ; si 422, afficher la valeur
   `minimum_selling_price` renvoyée et demander confirmation, puis renvoyer avec `override_minimum: true` (même parcours
   que `use-channel-pricing-editor.ts`). Pas de second calcul côté écran qui contredirait la route.
3. **Revient** : `resolveCost` + `eco_tax_default` (ajouté à `PRODUCT_SELECT`) ; si `cost_net_avg` ≤ 0 → valeur grise
   « estimé depuis le prix d'achat ».
4. **Chips = autre vue du même état** : famille ⇒ `families=[id]` et vide `categories`/`subcategories` ; sous-catégorie ⇒
   `subcategories=[id]` et vide `families`/`categories` (sinon l'union serveur renvoie toute la famille). Passer par
   `handleFiltersChange` / `syncFiltersToUrl`.
5. **Mise à jour de la ligne** : état local comme `use-quick-edit.ts` (`onProductUpdated`) + invalidation de la clé du
   nouveau lot `['site-prices', ids]`.
6. **Tri par marge / prix site** : sur la page affichée seulement (comme le tri actuel) — écrit dans le rapport.
7. **Tailles** : nouvelles cellules dans des sous-composants ; `CatalogueProductRow.tsx` redescend sous 300 lignes au
   passage (extraction des cellules existantes touchées, pas de refonte) ; `use-catalogue-page.ts` ne grossit pas
   (`use-catalogue-pricing.ts`).

## 4. Étapes (un commit par étape, un seul envoi à la fin)

| #   | Étape                                                                                                                                                                                                                                                                                                                          | Fichiers                                                                                                             | Contrôle                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 0   | Branche `feat/BO-PRODUCTS-LIST-MARGIN-001` depuis `staging` à jour ; captures « avant » (liste 1440 + 375, 4 produits témoins : prix canal, base seule, sans prix, `cost_net_avg` nul)                                                                                                                                         | —                                                                                                                    | captures + valeurs lues dans la fiche Tarification                                      |
| 1   | Calcul pur `catalogue-margin-helpers.ts` : `resolveSitePrice(channel, base)`, `computeLineMargin(product, sitePrice)` (marge %, montant, coefficient, manques nommés), `marginTone` (rouge < cible ou < 15 % sans cible ; orange cible → cible + 5 pts ; vert au-dessus ; gris + alerte si donnée manquante) + tests `npx tsx` | `CAT/_lib/`                                                                                                          | tests verts, dont « aucune valeur inventée : — jamais 0 »                               |
| 2   | Lot `useSitePricesBatch(productIds)` : 1 requête `channel_pricing` (canal site, actif) + 1 requête `price_list_items` ⋈ `price_lists` (base, actifs, priorité) ; clé `['site-prices', ids]`, `staleTime` 30 s ; `eco_tax_default` dans `PRODUCT_SELECT`                                                                        | `packages/@verone/products/src/hooks/` + `packages/@verone/categories/src/hooks/use-catalogue-data.ts`               | 2 requêtes par page (onglet réseau) ; valeurs = RPC pour les 4 témoins                  |
| 3   | Colonnes Achat HT · Revient HT · Site HT (source canal/base) · Marge (% + € + coefficient au survol), liseré rouge/orange, badge en vue grille, repli < lg en une colonne « Marge » avec détail au tap                                                                                                                         | nouveaux `CatalogueMarginCells.tsx`, `CatalogueMarginBadge.tsx` ; `CatalogueListView.tsx`, `CatalogueProductRow.tsx` | captures 1440 / 375 ; valeurs = fiche Tarification                                      |
| 4   | Édition en ligne du prix site (Entrée / Échap / perte de focus, TTC × 1,20 en direct, confirmation sous le minimum via 422, toasts, ligne mise à jour sans rechargement)                                                                                                                                                       | `CatalogueSitePriceCell.tsx`, `use-catalogue-pricing.ts`                                                             | Échap = 0 requête ; saisie valide = 1 upsert ; fiche produit et RPC reflètent la valeur |
| 5   | Chips familles + sous-catégories avec compteurs (une requête légère, comptage en mémoire), filtre rapide « Rentabilité » (Tous / Marge faible / Données manquantes), mobile défilable                                                                                                                                          | `CatalogueSegmentChips.tsx` (< 150 l) + hook de compteurs                                                            | cohérence chips ↔ panneau ↔ URL dans les deux sens                                    |
| 6   | Recherche : champ en tête, pleine largeur mobile, placeholder « Nom, SKU, référence fournisseur, EAN », raccourci `/` ; ajouter `supplier_reference`, `gtin`, `manufacturer` aux onglets Archivés et À compléter                                                                                                               | `CatalogueToolbar.tsx`, `use-catalogue-data.ts:208-212,278-282`                                                      | SKU exact, morceau de nom, référence fournisseur dans les 3 onglets                     |
| 7   | Type-check + lint (`@verone/back-office`, `@verone/products`, `@verone/categories`), recette § 5, relecture reviewer-agent, rapport `dev-report-2026-09-XX-BO-PRODUCTS-LIST-MARGIN-001.md`, un envoi, PR vers staging, 4 contrôles requis vérifiés à la main, fusion puis release sur l'ordre de mise en ligne de Roméo        | —                                                                                                                    | —                                                                                       |

## 5. Recette (Playwright, sans enregistrer sauf étape 4)

1. Chips « Mobilier » puis une sous-catégorie → liste filtrée, URL et panneau cohérents ; « Tous » → liste complète.
2. Recherche SKU / nom / référence fournisseur → < 1 s dans les 3 onglets.
3. 4 témoins (prix canal, base seule, sans prix, `cost_net_avg` nul) : colonnes et couleurs = fiche Tarification (captures
   côte à côte).
4. Édition du prix site sur **un produit choisi avec Roméo**, valeur relevée avant, remise à l'identique après et vérifiée
   en base (`channel_pricing`) : fiche + RPC suivent ; sous le minimum → confirmation ; Échap → 0 écriture.
5. Filtres « Marge faible » et « Données manquantes » (les 2 produits sans prix y figurent).
6. 375 px : chips défilables, badge lisible, édition possible ; 0 erreur console.

## 6. Hors périmètre / suivis

- Aligner le minimum de la route (`cost_price`) sur la fiche (`cost_net_avg`) : modification de route API → décision et
  PR dédiée, non incluse.
- Tri par marge sur tout le catalogue (côté serveur) : non inclus.
- Réduire `use-catalogue-page.ts` (545 l) : refactor à part.

## 7. Texte de lancement de la session

> Lis `docs/scratchpad/dev-plan-2026-09-16-BO-PRODUCTS-LIST-MARGIN-001.md` et suis-le (il prévaut sur le prompt du 15/09).
> Revérifie d'abord les points du § 2 sur `staging` à jour, puis fais les étapes 0 à 7. Réponds-moi en français simple.
> Pour l'essai d'édition du prix site, montre-moi le produit choisi avant d'écrire.
