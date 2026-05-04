# Dev Plan — [BO-STOCK-008] Typer use-stock-alerts (W3)

**Date** : 2026-04-18
**Branche** : `feat/BO-STOCK-008-type-stock-alerts-hook` (créée depuis staging)
**Priorité** : MOYENNE (dette technique W3 de l'audit rétroactif 2026-04-17)
**Source** : `docs/scratchpad/review-report-retroactive-2026-04-17.md` § WARNING-3

## Contexte

Le hook `use-stock-alerts.ts` mappe la vue dynamique `stock_alerts_unified_view`
vers `StockAlert[]`. Aujourd'hui : 19 `eslint-disable` + `(alert: any)`, violation
directe de CLAUDE.md ("Zero `any` TypeScript — `unknown` + Zod") et du feedback
`feedback_never_disable_eslint`.

Les disables ont été introduits par la PR #306 (ESLint blindage CI) et
maintenus par la PR #629 (BO-STOCK-007). Aucun refactor n'a nettoyé.

## Objectif

Supprimer les 19 `eslint-disable` + `any` en typant le mapping via
`Database['public']['Views']['stock_alerts_unified_view']['Row']`.

## Etat DB verifié (Triple Lecture)

Vue `stock_alerts_unified_view` dans `packages/@verone/types/src/supabase.ts`
ligne 11403-11445. Colonnes disponibles (toutes nullable) :

```ts
{
  alert_color: string | null;
  alert_priority: number | null;
  alert_type: string | null;
  draft_order_id: string | null;
  draft_order_number: string | null;
  id: string | null;
  is_in_draft: boolean | null;
  min_stock: number | null;
  product_id: string | null;
  product_image_url: string | null;
  product_name: string | null;
  quantity_in_draft: number | null;
  severity: string | null;
  shortage_quantity: number | null;
  sku: string | null;
  stock_forecasted_in: number | null;
  stock_forecasted_out: number | null;
  stock_previsionnel: number | null;
  stock_previsionnel_avec_draft: number | null;
  stock_real: number | null;
  supplier_id: string | null;
  validated: boolean | null;
  validated_at: string | null;
}
```

Toutes les colonnes sont nullable, d'où les `?? fallback` dans le mapping
actuel. Le mapping reste nécessaire pour cibler l'interface `StockAlert`
publique (qui refuse les `null` sur id, product_id, etc.).

## Plan d'action

### Fichier unique

`packages/@verone/stock/src/hooks/use-stock-alerts.ts` (209 lignes
actuellement).

### Modifications précises

**1. Import du type Database (nouvelle ligne après l'import `createClient`)**

```ts
import type { Database } from '@verone/types';
```

**2. Alias local pour la Row de la vue (après les types exportés, avant le hook)**

```ts
type StockAlertRow =
  Database['public']['Views']['stock_alerts_unified_view']['Row'];
```

**3. Typer le `createClient()` pour inférence automatique**

Remplacer :

```ts
const supabase = createClient();
```

par :

```ts
const supabase = createClient<Database>();
```

(Conforme au standard `.claude/rules/code-standards.md` § "Client Supabase
Type".)

**4. Remplacer le `map((alert: any) => ...)` lignes 108-150**

Retirer les 19 `eslint-disable` et le `any`. Nouveau code :

```ts
const alertsList: StockAlert[] = (data ?? []).map(
  (alert: StockAlertRow): StockAlert => ({
    id: alert.id ?? '',
    product_id: alert.product_id ?? '',
    product_name: alert.product_name ?? 'Produit inconnu',
    sku: alert.sku ?? 'N/A',
    product_image_url: alert.product_image_url ?? null,
    alert_type: (alert.alert_type as StockAlertType | null) ?? 'low_stock',
    severity: (alert.severity as StockAlert['severity'] | null) ?? 'warning',
    stock_real: alert.stock_real ?? 0,
    stock_forecasted_in: alert.stock_forecasted_in ?? 0,
    stock_forecasted_out: alert.stock_forecasted_out ?? 0,
    min_stock: alert.min_stock ?? 0,
    shortage_quantity: alert.shortage_quantity ?? 0,
    quantity_in_draft: alert.quantity_in_draft ?? null,
    draft_order_id: alert.draft_order_id ?? null,
    draft_order_number: alert.draft_order_number ?? null,
    is_in_draft: alert.is_in_draft ?? false,
    validated: alert.validated ?? false,
    validated_at: alert.validated_at ?? null,
    alert_color: alert.alert_color ?? null,
  })
);
```

**Notes** :

- Les deux champs `alert_type` et `severity` viennent de la vue sous forme
  `string | null`, ils sont castés vers les unions TypeScript locales via `as`.
  Ce cast est acceptable (ce n'est pas un `any`) et équivaut à une narrow
  via fallback — les valeurs non supportées tombent sur la valeur par défaut.
- Les fallbacks `id ?? ''` et `product_id ?? ''` sont déjà implicites dans
  l'ancien code (pas de `??` mais la vue ne retourne jamais de null pour
  ces colonnes en pratique). On garde `??` explicite pour la stricte null
  safety.

**5. Vérifier qu'aucun `eslint-disable` ne subsiste**

Après edit, grep le fichier : `grep -c "eslint-disable" use-stock-alerts.ts`
doit retourner `0`.

### Commits attendus

Un seul commit sur la branche :

```
[BO-STOCK-008] refactor: type stock_alerts_unified_view mapping (W3)
```

## Impact / Portée

- Fichier unique (209 lignes → ~190 lignes après nettoyage)
- Aucune modification de logique métier
- Aucune modif DB, aucun trigger touché, aucune migration
- Aucun changement visible côté UI (mapping identique)
- Zéro risque d'appareillage triggers stock (règle `stock-triggers-protected.md`
  non concernée)

## Verification (verify-agent)

- `pnpm --filter @verone/stock type-check` → 0 erreur
- `pnpm --filter @verone/back-office type-check` → 0 erreur (consommateur)
- `pnpm --filter @verone/back-office build` → OK
- `grep -c "eslint-disable" packages/@verone/stock/src/hooks/use-stock-alerts.ts`
  → doit retourner `0`
- `grep -c ": any" packages/@verone/stock/src/hooks/use-stock-alerts.ts`
  → doit retourner `0`

## Hors scope (explicite)

- Ne PAS toucher aux fonctions helper en fin de hook (`activeAlerts`,
  `criticalAlerts`, `isProductInDraft`, etc.).
- Ne PAS modifier l'interface exportée `StockAlert`.
- Ne PAS refactoriser `useCallback` / `useEffect` (stables, non concernés).
- Ne PAS retirer le `console.warn` de debug (pré-existant, hors scope W3).
- Ne PAS toucher à `StockAlertsBanner` (→ sprint BO-STOCK-009).

## Checklist livrable (dev-agent)

- [ ] Import type Database ajouté
- [ ] `createClient<Database>()` appliqué
- [ ] Alias `StockAlertRow` défini
- [ ] Mapping retypé sans `any` ni `eslint-disable`
- [ ] `pnpm --filter @verone/stock type-check` PASS
- [ ] `pnpm --filter @verone/back-office type-check` PASS
- [ ] Rapport dans `docs/scratchpad/dev-report-2026-04-18-BO-STOCK-008.md`
