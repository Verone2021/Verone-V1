# Perf Optimizer Agent Memory

# Last updated: 2026-03-11 (audit back-office complet ajouté)

## Rapports Disponibles

- Back-office : `docs/current/perf/audit-back-office-2026-03-11.md` (nouveau)
- LinkMe : `docs/current/perf/audit-2026-03-11-linkme.md`
- Général : `docs/current/perf/audit-2026-03-11.md`

## Blocages Outils

- **Knip BLOQUÉ** : `.github/workflows/docs-governance.yml` YAML invalide — alias `*Summary:**` ligne 123. Knip v5.68.0 ne peut pas parser le workspace. Corriger le YAML ou Knip ne fonctionnera pas.

## Hotspots DB connus (seq_scan élevés)

- `user_app_roles` : 67M seq_scan / 256K idx_scan (99.6%) — CRITIQUE. 10 index existent mais la RLS policy `is_backoffice_user()` scanne encore en seq_scan. Voir audit 2026-03-11.
- `user_profiles` : 32M seq_scan / 16K idx_scan (100%) — CRITIQUE. La RLS policy `users_own_user_profiles` utilise `auth.uid()` non wrappé. Malgré 13 index présents, la policy force seq_scan.
- `stock_movements` : 6.3M seq_scan (93.1%) — IMPORTANT. 332 lignes réelles, index présents. Probablement causé par triggers nombreux (7 triggers dont audit).
- `matching_rules` : 295K seq_scan (84%) — IMPORTANT. 50 lignes. Index insuffisant sur les colonnes de matching.

## RLS Policies avec auth.uid() non wrappé (CRITIQUE)

Policies identifiées le 2026-03-11 avec `auth.uid()` direct (sans SELECT wrapper) :

- `enseignes.enseignes_select_all` — branche `uar.user_id = auth.uid()`
- `linkme_commissions.affiliates_view_own_commissions` — branche `uar.user_id = auth.uid()`
- `notifications.users_own_notifications` — `user_id = auth.uid()`
- `product_drafts.users_own_product_drafts` — `created_by = auth.uid()`
- `stock_movements.users_own_stock_movements` — `performed_by = auth.uid()`
- `user_activity_logs.users_view_own_user_activity_logs` — `user_id = auth.uid()`
- `user_app_roles.Users can view their own roles` — `user_id = auth.uid()`
- `user_profiles.users_own_user_profiles` — `user_id = auth.uid()`
- `user_sessions.users_view_own_user_sessions` — `user_id = auth.uid()`

## FK sans index (confirmés 2026-03-11)

- `affiliate_storage_requests.owner_organisation_id` → organisations
- `affiliate_storage_requests.owner_enseigne_id` → enseignes
- `affiliate_storage_requests.reception_id` → purchase_order_receptions
- `audit_opjet_invoices.po_id` → purchase_orders
- `financial_document_items.product_id` → products
- `financial_documents.individual_customer_id` → individual_customers
- `financial_documents.converted_to_invoice_id` → financial_documents (auto-ref)

## Vues SECURITY DEFINER (ERREUR Supabase)

- `v_linkme_users` : expose auth.users à anon (ERREUR critique)
- `v_transactions_unified`, `linkme_order_items_enriched`, `linkme_orders_enriched`
- `linkme_orders_with_margins`, `affiliate_pending_orders`
- `v_matching_rules_with_org`, `v_transaction_documents`

## select('\*') dans back-office

55+ occurrences. Fichiers critiques :

- `apps/back-office/src/app/api/qonto/invoices/route.ts` (lignes 369, 379)
- `apps/back-office/src/app/api/qonto/quotes/route.ts` (lignes 267, 277, 302, 309)
- `apps/back-office/src/app/(protected)/prises-contact/[id]/actions.ts` (5 occurrences)

## select('\*') dans LinkMe (audit 2026-03-11)

14 occurrences. Hotspots :

- `apps/linkme/src/lib/hooks/use-payment-requests.ts:103` (table en 83.4% seq_scan !)
- `apps/linkme/src/lib/hooks/use-user-selection.ts:143` (linkme_affiliates)
- `apps/linkme/src/lib/hooks/use-linkme-public.ts` (4 occurrences)
- `apps/linkme/src/lib/hooks/use-entity-addresses.ts:159`
- `apps/linkme/src/contexts/AuthContext.tsx:111` (vue — acceptable)

## Audit LinkMe complet (2026-03-11) — RAPPORT DEFINITIF

Rapport : `docs/current/perf/audit-2026-03-11-linkme.md`

Problèmes confirmés spécifiques à LinkMe :

- `enseignes` : 87.8% seq_scan (109 446 scans) — policy `enseignes_select_all` avec auth.uid() non wrappé
- `linkme_payment_requests` : 83.4% seq_scan — index existants mais non utilisés (table actuellement vide)
- `linkme_commissions.affiliates_view_own_commissions` : auth.uid() non wrappé
- `use-linkme-public.ts` L59,85,102,154 : select('\*') sur pages publiques (affiliates + selections)
- `use-user-selection.ts` L143,243 : select('\*') sur linkme_affiliates et linkme_selections
- 7 occurrences `.select()` sans args dans les mutations (overfetch implicite)
- FK manquants : affiliate_storage_requests (owner_enseigne_id, owner_organisation_id), linkme_info_requests (sent_by)
- Multiple permissive policies : 12+ tables LinkMe (overhead PostgreSQL)
- 15 index non utilisés sur tables linkme/affiliate

Points positifs confirmés 2026-03-11 :

- Tous les invalidateQueries sont correctement awaités dans linkme
- Aucune promesse flottante dans les TSX linkme
- Policies linkme*affiliates_own et linkme_selection_items*\* utilisent déjà (SELECT auth.uid()) correctement
- user_app_roles a un index composite RLS dédié (idx_user_app_roles_rls_linkme)

Migrations non appliquées au 2026-03-11 (untracked dans supabase/migrations/) :

- 20260311030000_fix_rls_auth_uid_wrapper.sql
- 20260311040000_optimize_get_linkme_orders.sql
- 20260311050000_consolidate_notification_triggers.sql
- 20260311060000_cleanup_duplicate_indexes.sql
- 20260311070000_backfill_siret_from_siren.sql

## invalidateQueries void (sans await) — Back-Office (confirmé 2026-03-11)

3 fichiers concernés (6 occurrences total) :

- `apps/back-office/src/components/orders/InvoicesSection.tsx` lignes 90, 93, 117, 120
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-page-config.ts`
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-organisation-addresses-bo.ts`

## select('\*') Back-Office — Hotspots (54 occurrences, audit 2026-03-11)

Hooks React Query les plus critiques (appelés en boucle) :

- `hooks/use-linkme-users.ts` : 3 occurrences (lignes 89, 124, 166)
- `hooks/use-linkme-enseignes.ts` : 2 occurrences (lignes 69, 166)
- `hooks/use-site-internet-collections.ts` : 2 occurrences
- `hooks/use-site-internet-categories.ts` : 2 occurrences
- `prises-contact/[id]/actions.ts` : 5 occurrences (server actions)

## Dépendances suspectes Back-Office

- `maplibre-gl` + `react-map-gl` dans package.json mais 0 import dans src/ — potentiellement inutilisées (~1MB bundle)

## Triggers lourds sur products (14 triggers!)

Table `products` : 14 triggers distincts = risque de cascade sur chaque INSERT/UPDATE.

## Fonctions avec search_path mutable (WARN Supabase)

26+ fonctions publiques sans `SET search_path = public` fixe. Risque de schema hijacking.
