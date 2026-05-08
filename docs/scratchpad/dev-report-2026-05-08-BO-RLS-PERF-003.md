# [BO-RLS-PERF-003] Rapport — Cleanup duplicate RLS policies + wrap volatile fns

**Date** : 2026-05-08
**Branche** : `fix/BO-RLS-PERF-003-cleanup-duplicate-policies`
**Migration** : `supabase/migrations/20260508010005_bo_rls_perf_003_cleanup_duplicate_policies.sql`
**Plan** : `docs/scratchpad/dev-plan-2026-05-08-BO-RLS-PERF-003.md`

## Statut

✅ Migration appliquée en prod via `mcp__supabase__execute_sql` (transaction commitée).
✅ Vérification `pg_policies` : les 4 policies sont à l'état attendu.
✅ Advisors security : 0 nouveau warning sur les 3 tables touchées.
✅ Advisors performance : disparition du `multiple_permissive_policies` sur `variant_groups`.

## Changements appliqués

| #   | Table                 | Policy                             | Avant                             | Après                                                         |
| --- | --------------------- | ---------------------------------- | --------------------------------- | ------------------------------------------------------------- |
| 1   | `variant_groups`      | `staff_read_variant_groups`        | SELECT, `is_backoffice_user()` nu | **DROP** (doublon de `backoffice_full_access_variant_groups`) |
| 2   | `financial_documents` | `staff_manage_financial_documents` | ALL, `is_backoffice_user()` nu    | ALL, `(SELECT is_backoffice_user())`                          |
| 3   | `customer_addresses`  | `staff_read_addresses`             | SELECT, `is_backoffice_user()` nu | SELECT, `(SELECT is_backoffice_user())`                       |
| 4   | `customer_addresses`  | `users_own_addresses`              | ALL, `auth.uid() = user_id` nu    | ALL, `(SELECT auth.uid()) = user_id`                          |

## Vérifications post-migration

### pg_policies (extrait pertinent)

```
variant_groups       | backoffice_full_access_variant_groups | ALL    | (SELECT is_backoffice_user())
financial_documents  | staff_manage_financial_documents      | ALL    | (SELECT is_backoffice_user())
customer_addresses   | staff_read_addresses                  | SELECT | (SELECT is_backoffice_user())
customer_addresses   | users_own_addresses                   | ALL    | (SELECT auth.uid()) = user_id
```

### Advisors

- **Security** : 644 lints total — aucun n'inclut nos 3 tables. `rls_policy_always_true` : 8 entries persistantes (audit_logs, collection_images, individual_customers, notifications, stock_movements, user_activity_logs, user_sessions) — **hors scope**, à traiter dans un sprint séparé.
- **Performance** : 501 lints total. `auth_rls_initplan` réduit à **2** entries sur `addresses` uniquement (table différente, hors scope). `multiple_permissive_policies` sur `customer_addresses` : 1 entry restante entre `staff_read_addresses` (SELECT) et `users_own_addresses` (ALL) — sémantiquement nécessaire (staff vs user, 2 personas distincts), pas un doublon.

## Périmètre non traité (sprint séparé)

Ces 2 policies ouvrent des tables à tout `authenticated` mais sont consommées par site-internet + LinkMe + 13 hooks `@verone/*`. Drop sèche casserait LinkMe et le site. À remplacer par policy plus fine dans un sprint dédié.

- `sales_channels.sales_channels_select_authenticated` (qual = `true`)
- `channel_pricing.channel_pricing_select_authenticated` (qual = `true`)

## Régénération types Supabase

**Non nécessaire** : la migration ne touche aucune colonne, fonction RPC ou table. Les policies RLS ne sont pas typées dans `packages/@verone/types/src/supabase.ts`. Checklist Q4 du workflow ne s'applique pas.

(Tentative `pnpm run generate:types` a échoué avec `Unauthorized` sur la session CLI Supabase — le fichier types a été restauré depuis HEAD. Aucun changement attendu de toute façon.)

## Suite logique (étape 2 du plan d'audit perf)

Après merge de cette PR :

- Quick wins code (½ journée) : remplacer les `select('*')` sur `sales_orders`, `products`, vues finance ; paralléliser les fetches séquentiels du modal "sélectionner une commande" et `useDocumentDetail`.
- Étape 3 (chantier 2-3 jours, branche dédiée) : migration vers TanStack Query sur `useProductDetail` et `useSalesOrders` pour résoudre le re-render cascade ressenti par Roméo.

## Risque

Faible. Aucune perte de droits — toutes les policies recréées sont sémantiquement identiques, optimisées via wrapping (cf. règle perf RLS Postgres `auth_rls_initplan`). Le DROP de `staff_read_variant_groups` est couvert par `backoffice_full_access_variant_groups` (FOR ALL, qual identique).
