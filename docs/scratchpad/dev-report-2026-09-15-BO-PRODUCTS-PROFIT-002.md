# Dev Report — BO-PRODUCTS-PROFIT-002

**Branch** : `feat/BO-PRODUCTS-PROFIT-001-afficher-rentabilite`
**Date** : 2026-09-15
**Sprint** : Bloc M — coût figé à la vente + marge nette LinkMe tout-historique

---

## 1. Fichiers créés / modifiés

| Fichier                                                                                             | Lignes | Type            |
| --------------------------------------------------------------------------------------------------- | ------ | --------------- |
| `packages/@verone/products/src/utils/product-sales-margin.ts`                                       | 298    | rewrite (split) |
| `packages/@verone/products/src/utils/product-sales-margin-summaries.ts`                             | 246    | new             |
| `packages/@verone/products/src/utils/__tests__/product-sales-margin.test.ts`                        | 529    | updated         |
| `packages/@verone/products/src/hooks/use-product-sales-margin.ts`                                   | 302    | updated         |
| `packages/@verone/products/src/components/sections/profitability/SalesByChannelCard.tsx`            | 176    | updated         |
| `packages/@verone/products/src/components/sections/profitability/CostSourceBadge.tsx`               | 42     | new             |
| `packages/@verone/products/src/components/sections/profitability/SalesHistoryTable.tsx`             | 219    | updated         |
| `packages/@verone/products/src/components/sections/profitability/LinkMeRealSalesSection.tsx`        | 122    | updated         |
| `packages/@verone/products/src/components/sections/profitability/LinkMeNetMarginCard.tsx`           | 136    | updated         |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-verone-margin.ts`        | 116    | new             |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/VeroneMarginProductsTable.tsx` | 148    | new             |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/VeroneNetMarginCard.tsx`       | 175    | new             |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/analytics/page.tsx`                       | 373    | updated         |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/index.ts`                      | —      | updated         |

Fixes de qualité hors-sprint (pre-existing lint issues exposés par le check) :

- `ChannelPricingDetailed.tsx` — `no-misused-promises` (async `save` passé directement à `onSave` prop)
- `ChannelPricingRow.tsx`, `performance-analytics-fetchers.ts`, `use-product-detail.tsx` — prettier reformatage

---

## 2. API publique — changements

### `product-sales-margin.ts`

**Nouveaux types exportés :**

```typescript
type CostSource =
  | 'validation'
  | 'purchase_history'
  | 'current_cost_net_avg'
  | 'current_cost_price'
  | 'missing';
type CostSourceDisplay = CostSource | 'current_not_frozen';
interface LockedCostInput {
  costUnitHt: number | null;
  source: CostSource;
  includesFees: boolean;
}
```

**`SaleLineInput`** — nouveau champ `lockedCost: LockedCostInput | null`

**`ComputedSaleLine`** — nouveaux champs : `isAffiliateProduct`, `costUnit`, `costSource`, `costIncludesFees`

**`ChannelSummary`** — nouveaux champs : `marginTotal: number | null`, `coefficient`, `coveredLines`, `uncoveredLines`, `withoutFeesLines`, `costTotal`, `coveredRevenue`

**`LinkMeSummary`** — idem + `affiliateProductLines`

**Re-exports depuis `./product-sales-margin-summaries`** pour compatibilité backward des imports existants.

### Hook `use-product-sales-margin.ts`

Select Supabase étendu : `cost:sales_order_item_costs(cost_unit_ht, cost_source, includes_fees)` (embed 1:1 left join).
Type guard `isCostSource` + parser `parseLockedCost` (zero `any`).

### Nouveaux hooks/composants (analytics LinkMe)

- `useLinkMeVeroneMargin({ from, to })` — RPC `get_linkme_verone_margin`, Zod validation complète
- `VeroneNetMarginCard` — card principale avec KPIs + table produits
- `VeroneMarginProductsTable` — top 10 avec toggle "voir tout"

---

## 3. Décisions techniques

**Split `product-sales-margin.ts`** : le fichier aurait dépassé 400 lignes si les fonctions `summarizeByChannel`/`summarizeLinkMe` y restaient. Déplacées dans `product-sales-margin-summaries.ts`, re-exportées depuis l'original pour compatibilité transparente.

**"Covered lines only" summation** : la marge globale ne retourne plus `null` si certaines lignes manquent leur coût. Seules les lignes avec coût figé contribuent à `marginTotal` / `costTotal`. Les lignes non couvertes sont comptées dans `uncoveredLines` et affichées en note.

**`lockedCost` priority** : dans `computeSaleLine`, si `lockedCost != null`, il prend la priorité absolue sur le coût produit actuel. Source = DB enum → `costSource` set en conséquence. Si pas de `lockedCost` → fallback coût produit actuel → `costSource = 'current_not_frozen'`.

**`AVAILABLE_YEARS` dynamique** : était hardcodé `[2024, 2025]`. Remplacé par `Array.from({ length: CURRENT_YEAR - 2023 }, (_, i) => 2024 + i)`. Ajoute 2026, 2027... automatiquement.

---

## 4. Tests

```
npx tsx packages/@verone/products/src/utils/__tests__/product-sales-margin.test.ts
→ product-sales-margin: OK (suite PROFIT-002)
   12 cas : lockedCost priority, missing source, covered-only summation,
            affiliate product lines, coefficient computation
```

---

## 5. Vérifications CI locales

| Check                                          | Résultat                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `pnpm --filter @verone/products type-check`    | exit 0                                                                  |
| `pnpm --filter @verone/back-office type-check` | exit 0                                                                  |
| `pnpm --filter @verone/products lint`          | exit 0 (pages-dir notice = cosmétique, non bloquant)                    |
| `pnpm --filter @verone/back-office lint`       | exit 0 après fix `no-misused-promises` + prettier                       |
| Ligne max fichier source                       | 529 (test file — pas de limite sur les tests) ; tous fichiers src ≤ 373 |
| Composants React max                           | 175 lignes (VeroneNetMarginCard) ≤ 200                                  |

---

## 6. SQL sanity (read-only)

La RPC `get_linkme_verone_margin` est protégée par un guard back-office (`RAISE EXCEPTION`) et ne peut pas être appelée via le MCP Supabase qui s'exécute avec le rôle service. Requête approximative sur les colonnes brutes :

```sql
-- Jointure directe sales_order_items × sales_order_item_costs
-- Filtre : so.linkme_selection_id IS NOT NULL + status IN (validated…delivered)
-- Résultat : 108 lignes, 18 cmd, 532 pièces, 41 899 € encaissé, 20 874 € marge
-- (périmètre plus étroit que la RPC qui inclut tous les canaux LinkMe,
--  les produits affiliés, et le filtre created_by_affiliate_id)
```

Les valeurs attendues (470 lignes, 140 cmd, 4218 pièces, 167 198 €) correspondent au périmètre complet de la RPC incluant tous les affiliés/canaux LinkMe.
