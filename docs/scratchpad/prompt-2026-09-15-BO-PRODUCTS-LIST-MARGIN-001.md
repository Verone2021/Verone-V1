# [BO-PRODUCTS-LIST-MARGIN-001] — Liste produits : segments, recherche, marge réelle et prix site en ligne

Application : `apps/back-office`, module `src/app/(protected)/produits/catalogue/`. Aucune migration. Aucune écriture en base hors action explicite de l'utilisateur (édition en ligne du prix site).
Branche : `feat/BO-PRODUCTS-LIST-MARGIN-001` depuis `main` (après merge de BO-PRODUCTS-PROFIT-001 ; sinon depuis cette branche, à confirmer avec Roméo). Une PR. Pas de push ni de merge sans validation.
Lis `CLAUDE.md`, `.claude/rules/*.md` (code-standards, data-fetching, no-phantom-data, non-regression, responsive) et `docs/scratchpad/dev-report-2026-09-15-BO-PRODUCTS-PROFIT-001.md` avant de commencer.

## Problème métier (Roméo, 2026-09-15)

Sur la liste produits, il faut trop de clics pour voir un problème de rentabilité ou une donnée manquante. Objectif : voir au premier coup d'œil, sans ouvrir la fiche, pour chaque produit : prix d'achat, prix de revient, prix actuellement sur le site, marge — avec un code couleur — et pouvoir corriger le prix de vente directement dans la ligne. Il faut aussi retrouver vite un produit (pour le dépublier) et naviguer par segment (table basse, chaise, canapé…).

## État du code (vérifié)

- La liste existe (`CatalogueListView.tsx`, `CatalogueProductRow.tsx`) avec onglets Actifs / À compléter / Archivés (`CatalogueTabs.tsx`), panneau de filtres multi-niveaux famille > catégorie > sous-catégorie (`CatalogueFilterPanel`), un champ de recherche dans `CatalogueToolbar.tsx`, un switch publication par ligne, et un quick-edit (fournisseur, sous-catégorie, poids, dimensions, prix d'achat) dans `use-quick-edit.ts`.
- **La colonne « Marge » actuelle est trompeuse** : elle affiche `products.margin_percentage`, qui est la _marge cible_ (sert à calculer le prix de vente minimum), pas la marge réelle. Elle est colorée comme si c'était la marge réelle. À remplacer.
- Modèle de prix (source : `product-pricing-dashboard.tsx`, RPC `get_site_internet_products`) :
  - prix d'achat HT = `products.cost_price` (PMP depuis les commandes fournisseur, ou saisi) ;
  - prix de revient = `products.cost_net_avg` si non nul, sinon `cost_price` ; + `eco_tax_default` (voir `calculateMinSellingPrice` dans `@verone/common`) ;
  - marge cible = `products.margin_percentage` → prix mini HT ;
  - **prix sur le site HT** = `channel_pricing.custom_price_ht` (canal `sales_channels.code = 'site_internet'`, `is_active = true`) sinon prix de la liste de base (`price_list_items` × `price_lists.list_type = 'base'`, actif, priorité la plus basse). C'est exactement la règle de la RPC — la reproduire à l'identique, ne pas en inventer une autre.
- `page.tsx` fait 375 lignes, `use-catalogue-page.ts` 545 : ne pas les gonfler, extraire.

## Ce qu'il faut livrer

### 1. Segments (chips) sous les onglets

- Sous `CatalogueTabs`, une rangée de chips **familles** (Mobilier, Éclairage, Objets décoratifs…) avec compteur, puis une seconde rangée avec les **sous-catégories** de la famille sélectionnée (Table basse 12, Chaise 8…). Un clic = filtre exclusif sur ce segment ; « Tous » pour revenir. Compteurs calculés sur l'onglet courant et la marque active.
- Réutiliser les filtres existants (`filters.families` / `filters.subcategories`) et leur synchro URL (`families`, `subcategories`) : les chips sont une autre vue du même état, pas un second état. Le panneau de filtres et les chips doivent rester cohérents dans les deux sens.
- Nouveau composant `CatalogueSegmentChips.tsx` (< 150 lignes). Mobile : rangées défilables horizontalement.

### 2. Recherche

- Le champ existe mais n'est pas assez visible. Le placer en tête de la barre d'outils, pleine largeur sur mobile, placeholder « Nom, SKU, référence fournisseur, EAN », debounce 300 ms, raccourci `/` pour le focus. Vérifier que la recherche côté serveur couvre bien `name`, `sku`, `supplier_reference`, `gtin` (corriger la requête si ce n'est pas le cas, sans changer les autres filtres). Elle doit fonctionner dans les trois onglets.

### 3. Colonnes rentabilité dans la ligne (vue liste) et badge (vue grille)

Remplacer les colonnes « Prix » et « Marge » actuelles par un bloc de 4 colonnes alignées à droite :

- **Achat HT** — `cost_price` ; crayon quick-edit existant si absent.
- **Revient HT** — règle ci-dessus ; info-bulle « PMP net + éco-part » ; si `cost_net_avg` est nul, afficher la valeur en gris avec l'info-bulle « estimé depuis le prix d'achat ».
- **Site HT** — prix site selon la règle RPC ; petit indicateur de source (`canal` / `base`) ; **cliquable → édition en ligne** (voir 4).
- **Marge** — `(prix site − revient) / prix site` en %, et le montant € en dessous en petit ; coefficient au survol.
- Sous les colonnes, vue grille : un badge unique « Marge 34 % » avec la même couleur.
- Tri par marge (asc/desc) et par prix site dans l'en-tête de colonne.

### 4. Édition en ligne du prix site

- Clic sur la cellule « Site HT » → input numérique, Entrée valide, Échap annule, perte de focus valide. Affichage TTC en direct sous l'input (× 1,20).
- Écriture : upsert `channel_pricing` pour le canal `site_internet` (`custom_price_ht`, `is_active = true`) — c'est le « prix sur le site ». Ne jamais écrire dans `price_list_items`. Passer par le hook ou l'API déjà utilisée par `ChannelPricingDetailed` s'il en existe une ; sinon créer `useUpdateSiteChannelPrice` dans `@verone/channels`.
- Garde-fou : si le prix saisi est sous le prix minimum (`calculateMinSellingPrice`), demander confirmation (« Sous le prix minimum de X € HT — confirmer ? »). Jamais de blocage silencieux.
- Invalidation TanStack : la ligne se met à jour sans recharger la page ; toast succès/erreur.
- Aucune écriture au chargement, jamais de sauvegarde automatique.

### 5. Code couleur (une seule fonction, réutilisée partout)

Créer `catalogue-margin-helpers.ts` avec `computeLineMargin(product, sitePrice)` et `marginTone(...)` — fonction pure, testée sans réseau :

- **rouge** : marge < marge cible du produit (`margin_percentage`), ou marge < 15 % si pas de cible ;
- **orange** : entre la cible et cible + 5 points ;
- **vert** : au-dessus ;
- **gris + icône alerte** : donnée manquante (pas de prix site, pas de coût) avec info-bulle qui nomme ce qui manque (« Prix site absent », « Prix d'achat absent »). C'est le cas « il manque quelque chose » — il doit sauter aux yeux autant qu'une marge faible.
- Liseré gauche de la ligne dans la même couleur (rouge/orange seulement) pour repérer d'un coup d'œil en scrollant.
- Un filtre rapide « Rentabilité » dans les chips : Tous / Marge faible / Données manquantes.

### 6. Données

- Nouveau hook `useSitePricesBatch(productIds)` (`@verone/channels` ou `@verone/products`, à côté de `use-product-images-batch.ts`) : **une** requête `channel_pricing` (canal site, `in('product_id', ids)`) + **une** requête `price_list_items` base pour la page courante. Pas de requête par ligne, pas de N+1. Clé `['site-prices', ids]`, staleTime 30 s.
- Ne pas modifier la RPC ni les tables. Si la règle « liste de base » nécessite une jointure impossible côté client, le signaler dans le rapport plutôt que d'approximer.

## Contraintes

- Fichiers : composants < 200 lignes, `page.tsx` reste < 400, `use-catalogue-page.ts` ne grossit pas (extraire dans un hook dédié `use-catalogue-pricing.ts`).
- Pas de `any`, pas de `@ts-ignore`. `pnpm lint`, `pnpm typecheck` verts. Tests des fonctions pures (`npx tsx`, comme `product-sales-margin.test.ts`).
- Responsive : sur < lg, les 4 colonnes se replient en une seule colonne « Marge » (badge) — le détail reste accessible au tap (popover).
- Aucune donnée inventée : si une valeur n'existe pas, afficher « — » et l'alerte, jamais 0.

## Recette obligatoire avant de rendre la main

1. Chips : cliquer « Mobilier » puis « Table basse » → liste filtrée, URL mise à jour, panneau de filtres cohérent ; « Tous » → retour complet.
2. Recherche : un SKU exact, un morceau de nom, une référence fournisseur → résultat en < 1 s dans les trois onglets.
3. Un produit avec `channel_pricing` site, un produit sans (prix base), un produit sans prix, un produit sans coût : les 4 colonnes et les couleurs correspondent aux valeurs de la fiche produit (onglet Tarification) — capture côte à côte pour chacun.
4. Édition en ligne : modifier un prix site → la fiche produit et `get_site_internet_products` (donc le site) reflètent la nouvelle valeur ; saisie sous le minimum → confirmation demandée ; Échap → aucune écriture.
5. Filtre « Marge faible » et « Données manquantes » → listes correctes.
6. Mobile (375 px) : chips défilables, badge marge lisible, édition possible.

## Livrable

- PR ouverte (pas mergée) avec captures des 6 parcours.
- `docs/scratchpad/dev-report-2026-09-15-BO-PRODUCTS-LIST-MARGIN-001.md` : fichiers créés/modifiés, règle de prix site retenue (identique RPC), points laissés ouverts.
