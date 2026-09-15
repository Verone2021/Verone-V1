# Dev Report — BO-PRODUCTS-PROFIT-004

**Branch** : `feat/BO-PRODUCTS-PROFIT-001-afficher-rentabilite`
**Date** : 2026-09-15
**Sprint** : Bloc D — « Utiliser ce prix » + filtres période/client/canal sur l'historique

---

## 1. Fichiers créés

| Fichier                                                                                      | Lignes | Rôle                                                                                                |
| -------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| `packages/@verone/products/src/components/sections/profitability/UsePriceDialog.tsx`         | 225    | Dialogue de confirmation avant écriture du prix observé vers le canal site ou `target_price`        |
| `packages/@verone/products/src/components/sections/profitability/SalesHistoryFiltersBar.tsx` | 78     | Barre de filtres extraite (période / client / canal)                                                |
| `packages/@verone/products/src/hooks/use-update-target-price.ts`                             | 52     | `useMutation` TanStack pour `products.target_price` avec `await invalidateQueries` dans `onSuccess` |

---

## 2. Fichiers modifiés

| Fichier                                                                                      | Lignes | Changements                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `packages/@verone/products/src/utils/product-sales-margin.ts`                                | 310    | `SaleLineInput` : champs `customerId?`, `customerName?` (optionnels) ; `ComputedSaleLine` : mêmes champs requis ; pass-through dans `computeSaleLine` ; re-export `summarizeFilteredLines` + `FilteredSummary`                                                                                                                                                                 |
| `packages/@verone/products/src/utils/product-sales-margin-summaries.ts`                      | 295    | Ajout `FilteredSummary` interface + `summarizeFilteredLines(lines)` — totaux filtrés côté client (quantity, veroneRevenue, marginTotal, marginPercent, coefficient)                                                                                                                                                                                                            |
| `packages/@verone/products/src/utils/__tests__/product-sales-margin.test.ts`                 | 590    | Import `summarizeFilteredLines` ; cas PROFIT-004 : 3 lignes multi-canal + filtre client A → vérification quantités et marges                                                                                                                                                                                                                                                   |
| `packages/@verone/products/src/hooks/use-product-sales-margin.ts`                            | 358    | Select étendu : `customer_type`, `individual_customer_id`, embed `organisations!sales_orders_customer_id_fkey(trade_name, legal_name)`, embed `individual_customers!sales_orders_individual_customer_id_fkey(first_name, last_name)` ; extraction `customerId`/`customerName` (guards `unknown` → zero `any`) ; `target_price` ajouté au select produit ; `targetPrice: number | null`ajouté à`UseProductSalesMarginResult` |
| `packages/@verone/products/src/hooks/index.ts`                                               | 31     | Export `use-update-target-price`                                                                                                                                                                                                                                                                                                                                               |
| `packages/@verone/products/src/components/sections/profitability/SalesByChannelCard.tsx`     | 216    | Import `UsePriceDialog` ; état `dialogChannel` ; bouton `ArrowRightLeft` (h-11 w-11 md:h-9 md:w-9) sur chaque ligne tableau et carte mobile ; `UsePriceDialog` monté avec `suggestedPrice=avgVeronePrice`, `cost`, `currentTargetPrice`                                                                                                                                        |
| `packages/@verone/products/src/components/sections/profitability/SalesHistoryTable.tsx`      | 304    | Colonne « Client » (`hidden lg:table-cell`, `truncate` + `title`) + ligne mobile ; 3 filtres client-side (période / client / canal) via `SalesHistoryFiltersBar` ; totaux filtrés via `summarizeFilteredLines` ; liste d'années calculée dynamiquement depuis les données ; `expand` opère sur `filtered` et non plus `lines`                                                  |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-verone-margin.ts` | 116    | Fix pre-existing TS2322 : `fromStr ?? null` → `fromStr ?? undefined` (paramètre RPC Supabase attend `string \| undefined`)                                                                                                                                                                                                                                                     |

---

## 3. Chemin d'écriture « Utiliser ce prix »

### Cible « Prix du site internet (canal) »

```
UsePriceDialog → useUpdateChannelPrice() [packages/@verone/common]
  → POST /api/channel-pricing/upsert
  → guard minimum-price (override_minimum: false par défaut)
  → onSuccess: invalidateQueries(['channel-pricing','by-product',productId])
             + invalidateQueries(['site-internet-product-detail',productId])
             + invalidateQueries(['site-internet-products'])
```

Réutilise exactement le hook existant utilisé par `ChannelPricingDetailed` / `use-channel-pricing-editor.ts`. Aucune nouvelle route, aucune duplication de logique. La garde minimum-price est appliquée par la route API ; si violation, `onError` affiche un toast (chemin identique à l'éditeur de canal).

### Cible « Prix cible du produit »

```
UsePriceDialog → useUpdateTargetPrice() [packages/@verone/products]
  → supabase.from('products').update({ target_price }).eq('id', productId)
  → onSuccess: invalidateQueries(['product-sales-margin', productId])
             + invalidateQueries(['product', productId])
             + toast 'Prix cible mis à jour'
```

### Confirmation explicite

- Si la cible choisie a déjà une valeur (`currentTargetValue != null`), le premier clic sur « Valider » passe `confirming = true` et affiche un bandeau amber « Remplacer X € par Y € ? ».
- Le deuxième clic (bouton libellé « Confirmer le remplacement ») déclenche `doSave`.
- Aucune écriture silencieuse.

---

## 4. Vérifications effectuées

| Check                                            | Résultat                                                      |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `npx tsx __tests__/product-sales-margin.test.ts` | OK (suite PROFIT-002/004)                                     |
| `pnpm --filter @verone/products type-check`      | exit 0 — 0 erreur                                             |
| `pnpm --filter @verone/back-office type-check`   | exit 0 — 0 erreur                                             |
| ESLint sur tous les fichiers touchés             | 0 erreur, 0 warning (8 warnings Prettier résolus via `--fix`) |
| Fichiers source ≤ 400 lignes                     | ✅ max 358 l (use-product-sales-margin.ts)                    |
| Composants React ≤ 200 lignes                    | ✅ UsePriceDialog ~175 l, SalesByChannelCard ~180 l           |

---

## 5. Sanity SQL (read-only, mcp**supabase**execute_sql)

- SO-2026-00096 → `customer_type = 'organization'`, `customer_display_name = 'DSA'` ✓
- PLA-0001 (Plateau bois 20×30) → toutes les lignes valides sont liées à des organisations « Pokawa … » ✓
- FK `sales_orders_individual_customer_id_fkey` confirmée (colonne `individual_customer_id` → `individual_customers`) ✓

---

## 6. Responsive

- `UsePriceDialog` : modal `h-screen md:h-auto`, scroll interne `overflow-y-auto`, boutons `h-11 w-full md:h-9 md:w-auto`
- `SalesByChannelCard` : bouton « Utiliser ce prix » `h-11 w-11 md:h-9 md:w-9` (44 px mobile)
- `SalesHistoryFiltersBar` : `flex-col gap-2 sm:flex-row sm:flex-wrap`
- `SalesHistoryTable` : `ResponsiveDataView` conservé, colonne Client `hidden lg:table-cell`
- `SalesByChannelCard` : `ResponsiveDataView` conservé

---

## 7. Ce qui n'a PAS été touché

- Aucun trigger stock
- Aucune route `/api/qonto/*`
- Aucune migration DB (le champ `products.target_price` existait déjà)
- Aucun push, aucun commit, aucun `pnpm dev`
