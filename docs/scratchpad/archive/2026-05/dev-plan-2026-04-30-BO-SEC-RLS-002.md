# Dev Plan — BO-SEC-RLS-002 Vues SDF + function_search_path

**Date** : 2026-04-30
**Branche** : `fix/BO-SEC-RLS-002-views-security-invoker`
**Base** : `staging` @ `996eb975b`
**Type** : Migration SQL pure (zéro changement code TS)
**Suite de** : `[BO-SEC-CRITICAL-001]` #840 + `[BO-SEC-CRITICAL-002]` #841

---

## Cible

- **11 vues SECURITY DEFINER** sur 13 (advisor `security_definer_view`)
  - `affiliate_pending_orders`, `linkme_orders_enriched`, `linkme_orders_with_margins`, `linkme_order_items_enriched`, `stock_alerts_unified_view`, `v_all_payments`, `v_library_documents`, `v_library_missing_documents`, `v_matching_rules_with_org`, `v_transaction_documents`, `v_transactions_unified`
  - **2 vues SORTIES du scope** :
    - `v_linkme_users` (traité par #841)
    - `linkme_globe_items` (anon publique → PR `[BO-SEC-RLS-003]` avec test Playwright site-internet)
- **21 fonctions** sans `SET search_path` (advisor `function_search_path_mutable`)

---

## Stratégie

### 1. ALTER VIEW security_invoker = true (11 vues)

- Aucune modification de définition.
- Effet : la vue exécute désormais avec les permissions/RLS du caller, plus celles du créateur (postgres).
- Cartographie d'usage : toutes consommées principalement côté staff back-office (`is_backoffice_user()` retourne true → bypass RLS via les helpers existants des tables sous-jacentes).
- Vues LinkMe (`linkme_orders_enriched`, etc.) consommées côté affilié authentifié — les RLS `sales_orders` filtrent déjà par `created_by_affiliate_id` et user_app_roles → comportement RLS préservé.

### 2. ALTER FUNCTION SET search_path (21 fonctions)

- `pg_temp` toujours en dernier (best practice).
- `extensions` ajouté à `search_organisations_unaccent` (utilise `unaccent()` → compat post-#840 qui déplace l'extension vers le schéma `extensions`).
- 20 autres fonctions : `public, pg_temp` suffit (pas d'usage pg_trgm/unaccent direct).

### 3. baseline.json

- **Pas de modification** dans cette PR pour éviter conflits avec #840 / #841 qui modifient également `baseline.json`. La baseline sera réalignée lors du merge final (séquentiel #840 → #841 → cette PR).
- L'agent ou Romeo doit appliquer les baselines correctement à l'ordre de merge.

---

## Hors scope

- **PR `[BO-SEC-RLS-003]`** : `linkme_globe_items` (anon publique sur site-internet → test Playwright dédié).
- **PR `[BO-SEC-RLS-004]`** : 48 RLS policies `always_true` (audit case-by-case → service_role legitimes vs anon insertions à durcir).
- **PR `[BO-SEC-SDF-FUNCS-005]`** : 309 fonctions SECURITY DEFINER (628 advisors anon+auth → REVOKE EXECUTE en masse + whitelist explicite des RPCs publics).

---

## Test plan

### Avant push

- [x] Migration SQL (auto-documentée, pas de scratchpad dev-report nécessaire — c'est du hardening pur)
- [x] Pas de changement TS → type-check pas requis

### En preview Vercel (par Romeo)

- [ ] Login back-office staff → toutes les pages qui consomment ces vues chargent OK :
  - `/stocks/alertes` (stock_alerts_unified_view, 349 refs code)
  - `/canaux-vente/linkme/commandes` (linkme_orders_enriched, 219 refs)
  - `/canaux-vente/linkme/marges` (linkme_orders_with_margins, 208 refs)
  - `/finance/rapprochement` (v_transactions_unified, v_transaction_documents)
  - `/factures` + `/paiements` (v_all_payments, v_library_documents)
  - `/finance/rapprochement/regles-correspondance` (v_matching_rules_with_org)
- [ ] Login affilié LinkMe → ne voit que ses commandes (linkme_orders_enriched filtrée par RLS sales_orders)
- [ ] Console DevTools : 0 erreur SQL
- [ ] Rapprochement bancaire → recherche unaccent fonctionne (search_organisations_unaccent compat extensions)

---

## Rollback

```sql
-- Revenir aux SECURITY DEFINER (rétabli mais réintroduit le risque)
ALTER VIEW public.affiliate_pending_orders     SET (security_invoker = false);
ALTER VIEW public.linkme_orders_enriched       SET (security_invoker = false);
-- ... etc pour les 11 vues

-- Retirer les SET search_path (rétabli mais réintroduit l'advisor)
ALTER FUNCTION public.add_product_to_selection(...) RESET search_path;
-- ... etc pour les 21 fonctions
```

À éviter — préférer un fix en avant si une vue casse en preview.
