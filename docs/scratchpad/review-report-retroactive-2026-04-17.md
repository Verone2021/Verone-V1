# Audit rétroactif 10 PRs BO-STOCK — 2026-04-17

**Auteur** : reviewer-agent (blind audit rétroactif, read-only strict)
**Contexte** : les 10 PRs BO-STOCK du 17 avril ont été mergées sans blind audit (vitesse). Audit rétroactif avant enchaînement BO-SHIP-003.

## Verdict global : **PASS WITH WARNINGS**

0 CRITICAL. 5 WARNING identifiés. Axes sécurité triggers solides (15 fonctions en `SECURITY DEFINER` + `search_path=public` vérifiés via `pg_proc`). Idempotence des backfills confirmée. RLS `sales_order_shipments` en place.

---

## Résumé par PR

| PR   | Titre                                                               | Verdict | Issues |
| ---- | ------------------------------------------------------------------- | ------- | ------ |
| #621 | Stock adjustment from shipment modal                                | PASS    | 0      |
| #622 | Polish stock adjust icon + widen qty input                          | PASS    | 0      |
| #623 | Shipment trigger RLS silent failure + legacy backfill               | PASS    | 0      |
| #624 | Harden stock triggers + fix SO direct-validated forecast            | WARNING | 2      |
| #625 | Fix display shipment quantity as negative                           | PASS    | 0      |
| #626 | Test protocol for BO-STOCK-004                                      | PASS    | 0      |
| #627 | Restore alert card validated logic + draft order link               | PASS    | 0      |
| #628 | Alert trigger filters + forecast snapshot + helper text             | WARNING | 1      |
| #629 | Group alerts by product + low_stock_forecast + fiche produit banner | WARNING | 2      |
| #630 | Fix A1 shipment delete + restore 6 docs business-rules              | PASS    | 0      |

---

## CRITICAL (0)

Aucun problème critique. Les triggers sont en `SECURITY DEFINER`, search_path fixé, idempotence assurée.

---

## WARNING (5)

### [WARNING-1] Trigger AFTER INSERT sur sales_orders ne peut pas voir les sales_order_items

- **PR** : #624
- **Fichier** : `supabase/migrations/20260418_fix_so_direct_validated_forecast.sql`
- **Problème** : `trigger_so_insert_validated_forecast` se déclenche AFTER INSERT sur `sales_orders`. Le FOR loop scanne `sales_order_items`, mais ces items sont insérés APRÈS le `sales_orders` dans le flux applicatif. En production, si une SO est créée programmatiquement (non-Bubble), le forecast ne sera pas incrémenté par ce trigger. Le backfill Phase 3 corrige le passé mais pas les futures créations.
- **Fix proposé** : ajouter un trigger AFTER INSERT sur `sales_order_items` qui vérifie `SO.status = 'validated'` et incrémente `stock_forecasted_out`. Ou documenter explicitement que ce path n'existe pas en prod aujourd'hui.

### [WARNING-2] `update_forecasted_out_on_so_validation` — `search_path = public, pg_temp` non standard

- **PR** : #628
- **Fichier** : `supabase/migrations/20260419_fix_a3_forecast_out_snapshot_double_update.sql` ligne 34
- **Problème** : utilise `SET search_path = public, pg_temp`. La règle standard Supabase est `SET search_path = public` uniquement. Les 14 autres fonctions utilisent uniquement `search_path = public`.
- **Fix proposé** : supprimer `pg_temp` → `SET search_path = public`.

### [WARNING-3] `use-stock-alerts.ts` — `any` + 19 `eslint-disable`

- **PR** : #629 (a modifié ce fichier)
- **Fichier** : `packages/@verone/stock/src/hooks/use-stock-alerts.ts` lignes 108-149
- **Problème** : mapping `stock_alerts_unified_view` vers `StockAlert[]` utilise `(data ?? []).map((alert: any) => ...)` avec 19 `eslint-disable`. Violation CLAUDE.md ("Zero `any`") et `feedback_never_disable_eslint`. Les disables sont pré-existants (PR #306 ESLint blindage) mais la PR #629 aurait pu nettoyer.
- **Fix proposé** : typer la vue dans `supabase.ts` avec `Database['public']['Views']['stock_alerts_unified_view']['Row']`, puis `data.map(alert => ...)` sans `any`.

### [WARNING-4] `StockAlertsBanner` — `select('*')` sans `.limit()`

- **PR** : #629
- **Fichier** : `packages/@verone/stock/src/components/cards/StockAlertsBanner.tsx` ligne 48
- **Problème** : `.from('stock_alerts_unified_view').select('*').eq('product_id', productId)`. En pratique retourne peu de lignes (max 4 types par produit) mais viole la règle "Pas de `select("*")` sans `.limit()`".
- **Fix proposé** : remplacer `select('*')` par colonnes explicites + ajouter `.limit(10)`.

### [WARNING-5] `reset_stock_alerts_on_po_cancel` — reset trop large

- **PR** : #624 (Partie A5)
- **Fichier** : `supabase/migrations/20260418_fix_remaining_security_invoker_triggers.sql`
- **Problème** : remet `validated=false` sur toutes les alertes d'un produit où `validated=true`, sans filtrer par la PO annulée. Si un produit a 2 POs validées et qu'on annule une seule, les 2 alertes sont remises à non-validé. Il existe déjà `rollback_stock_alert_tracking_on_po_cancel` → doublonnage potentiel.
- **Fix proposé** : ajouter `AND draft_order_id = NEW.id` dans le WHERE, ou supprimer cette fonction si l'autre trigger couvre le cas.

---

## INFO

**I1 — Triggers DB confirmés** : Les 4 triggers restaurés (`trigger_before_delete_shipment`, `trigger_before_update_shipment`, `trigger_before_update_reception`, `trigger_so_insert_validated_forecast`) sont actifs (`tgenabled = 'O'`).

**I2 — RLS `stock_alert_tracking` policies `USING (true)`** : Supabase advisor signale `rls_policy_always_true` WARN pour DELETE/INSERT/UPDATE. Ces policies pré-existaient. La policy `backoffice_full_access_stock_alert_tracking` (ALL via `is_backoffice_user()`) est correcte.

**I3 — Liens cassés `/catalogue/${id}`** dans `StockAlertCard.tsx` (lignes 238, 250) : route inexistante — correct path : `/produits/catalogue/${id}`. Pré-existant, hors scope de cet audit.

**I4 — `mapAlertType` dans `AlertsListCard`** (PR #629) : utilise `alert.title` comme proxy pour `alert_type`. Fragile si les libellés changent. Préférable d'utiliser directement `alert.alert_type`.

**I5 — `supabase = createClient()` sans `useMemo`** dans `use-stock-alerts.ts` : `createClient()` retourne un singleton module-level. Référence stable, pattern acceptable.

---

## Méthodologie utilisée

- Commits analysés : 10 merge commits (PRs 621-630)
- Fichiers lus : 18 fichiers code + 8 migrations SQL
- Tools utilisés : `gh pr view`, `git show`, Read, Grep, `mcp__supabase__execute_sql` (READ ONLY), `mcp__supabase__get_advisors`
- Vérification DB : `pg_proc` pour SECURITY DEFINER + search_path, `pg_trigger` pour existence et conditions, `pg_policies` pour RLS
