# Dev Plan — [BO-STOCK-009] StockAlertsBanner select explicite + limit (W4)

**Date** : 2026-04-18
**Branche** : `feat/BO-STOCK-009-stock-banner-select-limit` (créée depuis staging)
**Priorité** : MOYENNE (dette technique W4 de l'audit rétroactif 2026-04-17)
**Source** : `docs/scratchpad/review-report-retroactive-2026-04-17.md` § WARNING-4

## Contexte

`StockAlertsBanner.tsx` utilise `.from('stock_alerts_unified_view').select('*').eq('product_id', productId).neq('alert_type', 'none')`. Viole la règle projet "Pas de `select('*')` sans `.limit()`". En pratique retourne peu de lignes (max ~4 types d'alerte par produit) mais la règle s'applique pour cohérence + defense-in-depth.

## Objectif

1. Remplacer `select('*')` par la liste explicite des colonnes utilisées dans le mapping (16 colonnes)
2. Ajouter `.limit(10)` (marge au-delà des 4 types d'alerte possibles)
3. Profiter pour typer le mapping avec `Database['public']['Views']['stock_alerts_unified_view']['Row']` (pattern Sprint 1)

## Etat verifié (Triple Lecture)

Fichier actuel : `packages/@verone/stock/src/components/cards/StockAlertsBanner.tsx` (111 lignes).

Colonnes effectivement consommées par le mapping (lignes 55-76) :

- `id`
- `product_id`
- `product_name`
- `sku`
- `stock_real`
- `stock_forecasted_in`
- `stock_forecasted_out`
- `min_stock`
- `shortage_quantity`
- `alert_type`
- `severity`
- `is_in_draft`
- `quantity_in_draft`
- `draft_order_id`
- `draft_order_number`
- `validated`
- `validated_at`

17 colonnes précisément (aucune colonne non utilisée du type).

## Plan d'action

### Fichier unique

`packages/@verone/stock/src/components/cards/StockAlertsBanner.tsx`

### Modifications

**1. Import du type Database**

```ts
import type { Database } from '@verone/types';
```

**2. Alias local pour la Row**

```ts
type StockAlertBannerRow =
  Database['public']['Views']['stock_alerts_unified_view']['Row'];
```

**3. Remplacer `select('*')` par la liste explicite + `.limit(10)`**

```ts
const { data, error } = await supabase
  .from('stock_alerts_unified_view')
  .select(
    'id, product_id, product_name, sku, stock_real, stock_forecasted_in, ' +
      'stock_forecasted_out, min_stock, shortage_quantity, alert_type, severity, ' +
      'is_in_draft, quantity_in_draft, draft_order_id, draft_order_number, ' +
      'validated, validated_at'
  )
  .eq('product_id', productId)
  .neq('alert_type', 'none')
  .limit(10);
```

**4. Typer le mapping**

Remplacer `(a: Record<string, unknown>)` par `(a: StockAlertBannerRow)`. Le typage plus strict remplace les casts `String(...)`, `Number(...)`, `Boolean(...)` par des fallbacks natifs `??`. Code résultant :

```ts
const mapped: StockAlert[] = (data ?? []).map(
  (a: StockAlertBannerRow): StockAlert => ({
    id: a.id ?? '',
    product_id: a.product_id ?? '',
    product_name: a.product_name ?? '',
    sku: a.sku ?? '',
    stock_real: a.stock_real ?? 0,
    stock_forecasted_in: a.stock_forecasted_in ?? 0,
    stock_forecasted_out: a.stock_forecasted_out ?? 0,
    min_stock: a.min_stock ?? 0,
    shortage_quantity: a.shortage_quantity ?? 0,
    alert_type: (a.alert_type as StockAlertType | null) ?? 'low_stock',
    severity:
      (a.severity as 'info' | 'warning' | 'critical' | null) ?? 'warning',
    is_in_draft: a.is_in_draft ?? false,
    quantity_in_draft: a.quantity_in_draft,
    draft_order_id: a.draft_order_id,
    draft_order_number: a.draft_order_number,
    validated: a.validated ?? false,
    validated_at: a.validated_at,
  })
);
```

### Commits attendus

Un seul commit :

```
[BO-STOCK-009] perf: explicit select + limit(10) on StockAlertsBanner (W4)
```

## Impact / Portée

- Fichier unique (111 lignes → ~110 lignes)
- Aucune modif logique métier
- Aucune modif DB, aucun trigger, aucune migration
- Aucun changement UI
- Performance : requête plus précise (moins de bytes sur le réseau)

## Verification

- `pnpm --filter @verone/stock type-check` → 0 erreur
- `pnpm --filter @verone/back-office type-check` → 0 erreur
- `grep -c "select('\\*')" packages/@verone/stock/src/components/cards/StockAlertsBanner.tsx` → 0
- `grep -n ".limit(" packages/@verone/stock/src/components/cards/StockAlertsBanner.tsx` → présent

## Hors scope

- Ne pas toucher à `StockAlertCard` ni aux autres consommateurs
- Ne pas modifier l'interface `StockAlert` dans `StockAlertCard.tsx`
- Ne pas renommer ni reorganiser le composant
- Ne pas pagineR les requêtes parentes (hors scope)
