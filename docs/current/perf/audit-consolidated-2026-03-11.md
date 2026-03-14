# Audit Performance Full-Stack Consolidé — 2026-03-11

**Apps auditées** : back-office + LinkMe
**Mode** : AUDIT (read-only)
**Agents** : 2x perf-optimizer (parallèle)

---

## Résumé Exécutif Global

| Domaine                         | CRITIQUE | IMPORTANT | SUGGESTION | Total    |
| ------------------------------- | -------- | --------- | ---------- | -------- |
| DB — RLS auth.uid() non wrappé  | 3        | 6         | 2          | 11       |
| DB — Sécurité (vues, policies)  | 2        | 6         | 2          | 10       |
| DB — seq_scan / index           | 2        | 7         | 3          | 12       |
| DB — FK sans index              | 0        | 4         | 4          | 8        |
| DB — Index inutilisés/dupliqués | 0        | 2         | 15         | 17       |
| DB — Triggers                   | 0        | 1         | 2          | 3        |
| DB — search_path mutable        | 0        | 1         | 0          | 1        |
| Code — select('\*')             | 0        | 5         | 64+        | 69+      |
| Code — async patterns           | 2        | 4         | 0          | 6        |
| Code — legacy useEffect fetch   | 0        | 1         | 4          | 5        |
| Code — staleTime trop courts    | 0        | 0         | 3          | 3        |
| Bundle — Tremor/barrel exports  | 0        | 1         | 2          | 3        |
| **TOTAL**                       | **9**    | **38**    | **101+**   | **148+** |

---

## CRITIQUE — Action immédiate requise (9 items)

### C1. `user_app_roles` — 67.5M seq_scan (99.6%)

**Source** : back-office audit
**Cause** : RLS policy `Users can view their own roles` utilise `auth.uid()` non wrappé. Table consultée par TOUTES les policies via `is_backoffice_user()`.
**Impact** : Ralentissement de toutes les requêtes authentifiées.
**Fix** : `USING (user_id = (SELECT auth.uid()))`

### C2. `user_profiles` — 32.8M seq_scan (100%)

**Source** : back-office audit
**Cause** : RLS policy `users_own_user_profiles` utilise `auth.uid()` non wrappé.
**Fix** : `USING (user_id = (SELECT auth.uid()))`

### C3. `linkme_commissions` — RLS auth.uid() non wrappé

**Source** : LinkMe audit
**Cause** : Policy `affiliates_view_own_commissions` évalue `auth.uid()` par ligne.
**Fix** : `WHERE ((uar.user_id = (SELECT auth.uid())) AND ...)`

> **Note** : La migration `20260311030000_fix_rls_auth_uid_wrapper.sql` (non commitée) semble couvrir C1-C3. Vérifier son contenu avant d'en créer une nouvelle.

### C4. Vue `v_linkme_users` — expose `auth.users` au rôle `anon`

**Source** : back-office + LinkMe audits (confirmé par Supabase Security Advisor ERROR)
**Impact** : Fuite potentielle d'emails et métadonnées utilisateurs.
**Fix** : Restreindre au rôle `authenticated` ou convertir en fonction avec filtrage `auth.uid()`.

### C5. `sales_order_linkme_details` — RLS INSERT always-true

**Source** : LinkMe audit (Supabase Security Advisor WARN)
**Impact** : N'importe quel anonyme peut créer des lignes de commande LinkMe.
**Fix** : Remplacer `WITH CHECK (true)` par une restriction affilié/token valide.

### C6. `InvoicesSection.tsx` — invalidateQueries sans await (back-office)

**Source** : back-office audit
**Fichier** : `apps/back-office/src/components/orders/InvoicesSection.tsx` lignes 89-93, 116-120
**Impact** : UI affiche données obsolètes après mutation (race condition).
**Fix** :

```typescript
// AVANT
onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: ['invoices-by-order', orderId] });
  void queryClient.invalidateQueries({ queryKey: ['invoice-details', selectedInvoiceId] });
},
// APRES
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: ['invoices-by-order', orderId] });
  await queryClient.invalidateQueries({ queryKey: ['invoice-details', selectedInvoiceId] });
},
```

### C7. `use-affiliate-analytics.ts` — promesses flottantes pures (LinkMe)

**Source** : LinkMe audit
**Fichier** : `apps/linkme/src/lib/hooks/use-affiliate-analytics.ts` lignes 634, 636, 640
**Impact** : 3 `invalidateQueries` sans await, void, ni catch. UI stats peut afficher avant refresh.
**Fix** : Wrapper dans `async` + `await`.

### C8. `enseignes` — RLS SELECT auth.uid() non wrappé

**Source** : back-office audit
**Policy** : `enseignes_select_all` — branche linkme non wrappée.

### C9. `stock_movements` — 6.3M seq_scan (93.1%) + 7 triggers

**Source** : back-office audit
**Cause** : Combinaison RLS `auth.uid()` non wrappé + 7 triggers lourds.
**Fix** : Wrapper auth.uid() + appliquer migration consolidation triggers.

---

## IMPORTANT — A traiter dans les 2 prochains sprints (38 items)

### Database

| #   | Problème                                 | Table(s)                                                                                    | Action                                         |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| I1  | FK sans index                            | `financial_document_items.product_id`                                                       | CREATE INDEX                                   |
| I2  | FK sans index                            | `financial_documents.individual_customer_id`                                                | CREATE INDEX (WHERE NOT NULL)                  |
| I3  | FK sans index                            | `financial_documents.converted_to_invoice_id`                                               | CREATE INDEX (WHERE NOT NULL)                  |
| I4  | FK sans index                            | `linkme_info_requests.sent_by`                                                              | CREATE INDEX                                   |
| I5  | 15 index inutilisés tables linkme\_\*    | Voir rapport LinkMe §2.5                                                                    | DROP INDEX (après confirmation)                |
| I6  | 2 index dupliqués                        | `sales_order_items`, `sales_order_linkme_details`                                           | DROP duplicates                                |
| I7  | 7 vues SECURITY DEFINER                  | `v_transactions_unified`, `linkme_orders_enriched`, etc.                                    | Review + convertir si possible                 |
| I8  | 26 fonctions search_path mutable         | Triggers critiques                                                                          | Ajouter `SET search_path = public, pg_catalog` |
| I9  | 14 triggers sur `products`               | `products`                                                                                  | Appliquer migration consolidation              |
| I10 | RLS non wrappé x5                        | `notifications`, `product_drafts`, `stock_movements`, `user_activity_logs`, `user_sessions` | Wrapper `(SELECT auth.uid())`                  |
| I11 | `linkme_payment_requests` 83.4% seq_scan | RLS + select('\*') combinés                                                                 | Optimiser policy + sélection colonnes          |
| I12 | Multiple permissive policies             | `linkme_affiliates`, `linkme_selections`, `linkme_selection_items`                          | Consolider en `FOR ALL`                        |

### Code

| #   | Problème                      | Fichier(s)                                                                                                                | Action                                    |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| I13 | select('\*') API Qonto        | `app/api/qonto/invoices/route.ts`, `quotes/route.ts`                                                                      | Spécifier colonnes                        |
| I14 | select('\*') prises-contact   | `app/(protected)/prises-contact/[id]/actions.ts` (5 occ.)                                                                 | Spécifier colonnes                        |
| I15 | select('\*') payment-requests | `apps/linkme/src/lib/hooks/use-payment-requests.ts:103`                                                                   | Spécifier colonnes (table 83.4% seq_scan) |
| I16 | select('\*') user-selection   | `apps/linkme/src/lib/hooks/use-user-selection.ts:143,243`                                                                 | Spécifier colonnes                        |
| I17 | invalidateQueries back-office | `use-approve-order.ts:92`, `use-affiliate-branding.ts:127`, `use-onboarding-progress.ts:339`                              | await + async                             |
| I18 | Legacy useEffect fetch x4     | `app/(public)/s/[id]/layout.tsx`, `catalogue/page.tsx`, `commandes/[id]/modifier/page.tsx`, `CommissionDetailContent.tsx` | Migrer vers React Query                   |
| I19 | 40+ RLS policies always-true  | `sales_orders`, `matching_rules`, `webhook_configs`, etc.                                                                 | Review intentionnalité                    |

---

## SUGGESTION — Amélioration continue (101+ items)

### Database

- Surveiller tables peu volumineuses avec seq_scan élevé (`collections`, `variant_groups`, `client_consultations`) — normal pour petites tables
- 4 FK sans index sur tables secondaires (`affiliate_storage_requests` x3, `audit_opjet_invoices`)

### Code

- 64+ occurrences `select('*')` restantes dans hooks client (traiter module par module)
- Remplacer 24 imports `Card` de `@tremor/react` par shadcn/ui Card (LinkMe)
- Augmenter staleTime : `use-linkme-catalog.ts` 30s→10min, `use-payment-requests.ts` 30s→5min
- Supprimer `OrderFormUnified.tsx.backup` (dead code)
- Corriger YAML `.github/workflows/docs-governance.yml` (bloque Knip)
- 15 barrel exports dans LinkMe (impact faible avec Turbopack)

---

## Migrations en attente (non commitées)

| Fichier                                                | Couvre                       |
| ------------------------------------------------------ | ---------------------------- |
| `20260311030000_fix_rls_auth_uid_wrapper.sql`          | C1, C2, C3, C8, C9, I10      |
| `20260311040000_optimize_get_linkme_orders.sql`        | Optimisation requêtes LinkMe |
| `20260311050000_consolidate_notification_triggers.sql` | I9 (triggers products)       |
| `20260311060000_cleanup_duplicate_indexes.sql`         | I5, I6 partiellement         |
| `20260311070000_backfill_siret_from_siren.sql`         | Hors scope perf              |

**Action requise** : Vérifier le contenu de ces migrations avant d'appliquer — elles couvrent potentiellement 6+ items critiques/importants de cet audit.

---

## Rapports détaillés

- [Audit back-office](./audit-2026-03-11.md)
- [Audit LinkMe](./audit-linkme-2026-03-11.md)

---

_Rapport consolidé le 2026-03-11. Mode AUDIT — aucune modification effectuée._
