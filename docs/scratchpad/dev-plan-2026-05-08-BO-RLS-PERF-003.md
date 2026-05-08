# [BO-RLS-PERF-003] Plan — Cleanup duplicate RLS policies + wrap volatile fns

**Date** : 2026-05-08
**Branche** : `fix/BO-RLS-PERF-003-cleanup-duplicate-policies`
**Source audit** : `dev-report-2026-05-07-audit-perf-pages-lentes.md` (perdu avec branche BO-RLS-PERF-002 mergée — contenu en mémoire de session)
**Suite de** : BO-RLS-PERF-002 (mergée commit 93c5a5a7)

---

## Contexte

Audit perf 2026-05-07 a identifié des seq_scan élevés (99%+) sur tables jointes par les pages lentes (commandes, factures, devis, détail produit). Cause :

1. Policies RLS dupliquées qui s'évaluent toutes ligne par ligne
2. Fonctions `is_backoffice_user()` et `auth.uid()` non wrappées dans `(SELECT …)` → évaluation N fois au lieu d'1 (cf. règle perf RLS Postgres `auth_rls_initplan`)

BO-RLS-PERF-002 a déjà fait le gros nettoyage (consolidation 3 phases). Reste 4 fixes ciblés liés directement aux pages auditées.

## Périmètre — 4 fixes safe

| #   | Table                 | Policy                             | Action           | Pourquoi                                                                                                                                                      |
| --- | --------------------- | ---------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `variant_groups`      | `staff_read_variant_groups`        | DROP             | Doublon exact de `backoffice_full_access_variant_groups` (FOR ALL, déjà wrappé). Cumul = 2× évaluation par row. Cause directe du seq_scan 99,9% sur la table. |
| 2   | `financial_documents` | `staff_manage_financial_documents` | RECREATE wrapped | `is_backoffice_user()` nu (VOLATILE) → wrapper `(SELECT is_backoffice_user())`. Pages factures/devis.                                                         |
| 3   | `customer_addresses`  | `staff_read_addresses`             | RECREATE wrapped | `is_backoffice_user()` nu → wrapper. Pages détail commande/client.                                                                                            |
| 4   | `customer_addresses`  | `users_own_addresses`              | RECREATE wrapped | `auth.uid()` nu → wrapper `(SELECT auth.uid())`.                                                                                                              |

## Hors périmètre (reporté à sprint dédié)

- `sales_channels.sales_channels_select_authenticated` (qual=true) → utilisée par site-internet + LinkMe + 13 hooks `@verone/*`. Drop sèche casserait LinkMe et site. À remplacer par policy plus fine (anon read seulement les canaux publics, etc.) dans un sprint séparé.
- `channel_pricing.channel_pricing_select_authenticated` (qual=true) → utilisée par catalogue LinkMe, feed produits site, etc. Idem.

## Sortie attendue

- Suppression seq_scan élevé sur `variant_groups` (impact direct liste produits)
- Réduction CPU RLS sur `financial_documents` (pages factures/devis)
- Réduction CPU RLS sur `customer_addresses` (détail commande)
- 0 régression fonctionnelle (policies équivalentes, juste optimisées)

## Fichiers touchés

1. `supabase/migrations/20260508HHMMSS_bo_rls_perf_003_cleanup_duplicate_policies.sql` (nouveau)
2. `packages/@verone/types/src/supabase.ts` (régénéré post-migration — checklist workflow Q4)
3. `docs/current/database/schema/*.md` (régénéré via `python3 scripts/generate-docs.py --db`, gitignored donc ne sera pas commité — juste à régénérer en local)
4. `docs/scratchpad/dev-plan-2026-05-08-BO-RLS-PERF-003.md` (ce fichier)
5. `docs/scratchpad/dev-report-2026-05-08-BO-RLS-PERF-003.md` (à créer après application)

## Validation

- `mcp__supabase__get_advisors({ type: "security" })` : pas de nouveau warning
- `mcp__supabase__get_advisors({ type: "performance" })` : disparition des entries `multiple_permissive_policies` sur variant_groups + `auth_rls_initplan` sur les 3 policies wrappées
- Test fonctionnel via Playwright (lane-1) : liste produits charge (variant_groups read OK), liste factures charge, détail commande client charge avec adresses

## Risque

Faible. Aucune politique ne perd de droits — toutes les recreate-wrapped sont sémantiquement identiques. Seul le drop de `staff_read_variant_groups` réduit la surface, mais la policy `backoffice_full_access_variant_groups` (FOR ALL) couvre intégralement le SELECT staff.
