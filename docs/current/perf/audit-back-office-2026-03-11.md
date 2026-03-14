# Audit Performance Back-Office — 2026-03-11

**App cible** : back-office
**Mode** : AUDIT (read-only)
**Domaines** : dead-code | db-perf | code-perf | bundle
**Agent** : perf-optimizer
**Branche active** : feat/BO-FACT-001-legal-name-invoices

---

## Résumé Exécutif

| Domaine          | Findings                                                                                                                       | Criticité max |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| Dead Code & Deps | Knip bloqué (YAML invalide CI), 2 deps suspects                                                                                | IMPORTANT     |
| DB Performance   | 11 policies auth.uid() non wrappé, 12 FK sans index, 5 index dupliqués, 237 index inutilisés, 223 multiple permissive policies | CRITIQUE      |
| Code Performance | 54 select('\*') overfetch, 6 void invalidateQueries, 10+ patterns useEffect+fetch legacy                                       | IMPORTANT     |
| Bundle           | jspdf+html2canvas via dynamic import (ok), maplibre-gl en dep sans usage                                                       | IMPORTANT     |

**Total problèmes identifiés** : 350+ issues dont 1 CRITIQUE sécurité

---

## 1. Dead Code & Dependencies

### 1.1 Etat Knip

**Knip ne peut pas s'exécuter** : Le fichier `.github/workflows/docs-governance.yml` contient une syntaxe YAML invalide (alias `*Summary:**` non défini à la ligne 123). Ceci bloque le parsing de Knip v5.68.0.

**Action requise** : Corriger le fichier YAML ou l'exclure de la config Knip.

```
ERROR: Error loading .github/workflows/docs-governance.yml
Reason: unidentified alias "*Summary:**" (123:13)
```

### 1.2 Dépendances Suspects (analyse manuelle)

**apps/back-office/package.json** — 10 dépendances directes :

| Package                                  | Usage détecté                                       | Verdict                             |
| ---------------------------------------- | --------------------------------------------------- | ----------------------------------- |
| `maplibre-gl`                            | 0 import dans src/                                  | SUSPECT — potentiellement inutilisé |
| `react-map-gl`                           | 0 import dans src/                                  | SUSPECT — potentiellement inutilisé |
| `supercluster`                           | Importé dans au moins 1 fichier                     | A vérifier                          |
| `jspdf`                                  | Dynamic import dans SelectionProductDetailModal.tsx | OK (lazy)                           |
| `html2canvas`                            | Dynamic import dans SelectionProductDetailModal.tsx | OK (lazy)                           |
| `resend`                                 | A vérifier dans API routes                          | A vérifier                          |
| `@verone/roadmap`                        | Utilisé dans roadmap-widget-wrapper.tsx             | OK                                  |
| `@supabase/ssr`, `@supabase/supabase-js` | Utilisés partout                                    | OK                                  |
| `@verone/types`                          | Utilisé partout                                     | OK                                  |

> NOTE : Vérification requise avant suppression — `maplibre-gl` et `react-map-gl` ne montrent aucun import dans `apps/back-office/src/`, mais peuvent être des dépendances transitives déclarées explicitement.

### 1.3 Barrel Exports

Deux fichiers dans `components/business/` utilisent `export * from` pour re-exporter depuis `@verone/organisations`. Ce pattern peut nuire au tree-shaking :

| Fichier                                                 | Export                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/components/business/supplier-segment-select.tsx`   | `export * from '@verone/organisations/components/forms/supplier-segment-select'`   |
| `src/components/business/unified-organisation-form.tsx` | `export * from '@verone/organisations/components/forms/unified-organisation-form'` |

---

## 2. DB Performance

### 2.1 Tables avec ratio seq_scan elevé (public schema)

Les tables suivantes accumulent des sequential scans massifs par rapport aux index scans :

| Table                       | seq_scan   | idx_scan | ratio seq% | Lignes | Commentaire                                          |
| --------------------------- | ---------- | -------- | ---------- | ------ | ---------------------------------------------------- |
| `user_profiles`             | 32 819 028 | 15 990   | **100%**   | 7      | INDEX PRESENT mais RLS non wrappé — cause principale |
| `collections`               | 247 811    | 40       | **100%**   | 2      | Nombreux index mais seq dominant                     |
| `client_consultations`      | 148 026    | 457      | **99.7%**  | 2      | 15 index présents — pattern RLS suspect              |
| `variant_groups`            | 128 237    | 78       | **99.9%**  | 3      | Nombreux index — RLS non wrappé probable             |
| `finance_settings`          | 5 220      | 0        | **100%**   | 1      | Table config, peu critique                           |
| `mcp_resolution_strategies` | 36 116     | 0        | **100%**   | 10     | Table interne                                        |
| `sample_order_items`        | 270        | 0        | **100%**   | 0      | Table vide — ok                                      |
| `stock_snapshot`            | 588        | 0        | **100%**   | 1      | MV, ok                                               |

**Analyse `user_profiles`** : 32M seq_scans sur 7 lignes est pathologique. La policy `users_own_user_profiles` utilise `auth.uid()` sans wrapper `(SELECT auth.uid())`, ce qui force une évaluation par ligne plutôt qu'une évaluation unique.

### 2.2 FK sans index (confirmé par requête SQL + Supabase advisors)

**12 FK sans index** identifiées (7 critiques, 5 via advisors uniquement) :

| Table                        | Colonne FK                | Table référencée            | Priorité  |
| ---------------------------- | ------------------------- | --------------------------- | --------- |
| `affiliate_storage_requests` | `owner_enseigne_id`       | `enseignes`                 | IMPORTANT |
| `affiliate_storage_requests` | `owner_organisation_id`   | `organisations`             | IMPORTANT |
| `affiliate_storage_requests` | `reception_id`            | `purchase_order_receptions` | IMPORTANT |
| `affiliate_storage_requests` | `reviewed_by`             | (users)                     | IMPORTANT |
| `audit_opjet_invoices`       | `po_id`                   | `purchase_orders`           | IMPORTANT |
| `consultation_emails`        | `sent_by`                 | (users)                     | NORMAL    |
| `financial_document_items`   | `product_id`              | `products`                  | IMPORTANT |
| `financial_documents`        | `converted_to_invoice_id` | `financial_documents`       | IMPORTANT |
| `financial_documents`        | `individual_customer_id`  | `individual_customers`      | IMPORTANT |
| `linkme_info_requests`       | `sent_by`                 | (users)                     | NORMAL    |
| `order_payments`             | `created_by`              | (users)                     | NORMAL    |

> NOTE : Des migrations pending dans `supabase/migrations/` existent déjà (`20260311040000_optimize_get_linkme_orders.sql`, `20260311060000_cleanup_duplicate_indexes.sql`) — vérifier si elles adressent ces FK avant d'en créer de nouvelles.

### 2.3 Tables sans RLS

**Aucune table publique sans RLS détectée.** Excellent — toutes les tables `public` ont `rowsecurity = true`.

### 2.4 auth.uid() non wrappé dans RLS (CRITIQUE PERFORMANCE)

**11 policies** avec `auth.uid()` évalué N fois au lieu d'une fois :

| Table                        | Policy                                    | Impact                                       |
| ---------------------------- | ----------------------------------------- | -------------------------------------------- |
| `notifications`              | `users_own_notifications`                 | `user_id = auth.uid()`                       |
| `product_drafts`             | `users_own_product_drafts`                | `created_by = auth.uid()`                    |
| `stock_movements`            | `users_own_stock_movements`               | `performed_by = auth.uid()`                  |
| `user_activity_logs`         | `users_view_own_user_activity_logs`       | `user_id = auth.uid()`                       |
| `user_profiles`              | `users_own_user_profiles`                 | `user_id = auth.uid()` — **32M seq_scans !** |
| `user_sessions`              | `users_view_own_user_sessions`            | `user_id = auth.uid()`                       |
| `user_app_roles`             | `Users can view their own roles`          | `user_id = auth.uid()`                       |
| `enseignes`                  | `enseignes_select_all`                    | `uar.user_id = auth.uid()` dans subquery     |
| `linkme_commissions`         | `affiliates_view_own_commissions`         | `uar.user_id = auth.uid()` dans subquery     |
| `product_commission_history` | `product_commission_history_select_admin` | `user_app_roles.user_id = auth.uid()`        |

**Fix pattern** (à déléguer à database-architect) :

```sql
-- AVANT (évalué N fois — lent)
USING (user_id = auth.uid())

-- APRES (évalué 1 fois — correct)
USING (user_id = (SELECT auth.uid()))
```

> NOTE : La migration `supabase/migrations/20260311030000_fix_rls_auth_uid_wrapper.sql` existe déjà dans le repo — **elle n'a pas encore été appliquée**. Elle traite probablement ce problème. Vérifier son contenu avant d'appliquer.

### 2.5 Index dupliqués (Supabase advisor WARN)

**5 paires d'index identiques** détectées — coût de stockage et d'écriture inutile :

| Table                        | Index A                                       | Index B (doublon)                                                                                     |
| ---------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `product_images`             | `idx_product_images_product_id_primary`       | `idx_product_images_product_primary` (identiques : `product_id, is_primary WHERE is_primary=true`)    |
| `products`                   | `idx_products_active_filter`                  | `idx_products_archived_status` (identiques : `archived_at, product_status WHERE archived_at IS NULL`) |
| `sales_order_items`          | `idx_sales_order_items_order_id`              | `idx_sales_order_items_sales_order_id` (identiques : `sales_order_id`)                                |
| `sales_order_items`          | `idx_sales_order_items_linkme_selection_item` | `idx_sales_order_items_linkme_selection_item_id` (identiques)                                         |
| `sales_order_linkme_details` | `idx_sales_order_linkme_details_order`        | `idx_sales_order_linkme_details_sales_order_id` (identiques)                                          |

> NOTE : La migration `supabase/migrations/20260311060000_cleanup_duplicate_indexes.sql` existe et semble cibler ce problème. Appliquer en priorité.

### 2.6 Advisors Sécurité — Points Critiques

| Advisor                           | Niveau    | Détail                                                                                                                                                                                                              |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth_users_exposed`              | **ERROR** | Vue `v_linkme_users` expose `auth.users` aux rôles `anon` — fuite données utilisateurs                                                                                                                              |
| `security_definer_view`           | **ERROR** | 8 vues avec SECURITY DEFINER : `v_transactions_unified`, `linkme_order_items_enriched`, `linkme_orders_with_margins`, `v_transaction_documents`, `affiliate_pending_orders`, `v_matching_rules_with_org` + 2 autres |
| `rls_policy_always_true`          | WARN      | 54 policies permettent un accès illimité (USING true) — intentionnel pour staff back-office mais à documenter                                                                                                       |
| `multiple_permissive_policies`    | WARN      | 223 occurrences — peut ralentir les requêtes (OR logique entre policies)                                                                                                                                            |
| `function_search_path_mutable`    | WARN      | 39 fonctions avec search_path mutable — vecteur d'injection schema                                                                                                                                                  |
| `materialized_view_in_api`        | WARN      | 3 MV exposées sans protection supplémentaire                                                                                                                                                                        |
| `extension_in_public`             | WARN      | `pg_trgm` et `unaccent` dans schema public                                                                                                                                                                          |
| `auth_leaked_password_protection` | WARN      | Protection HaveIBeenPwned désactivée                                                                                                                                                                                |

**Focus critique — `v_linkme_users` exposée à `anon`** : Cette vue peut exposer des données d'authentification (emails, métadonnées) aux utilisateurs non authentifiés. Risque RGPD.

---

## 3. Code Performance

### 3.1 select('\*') — Overfetch (54 occurrences)

**54 usages de `.select('*')`** identifiés dans `apps/back-office/src/`. Liste partielle des plus impactants :

**Hooks React Query (exécutés en boucle) :**
| Fichier | Ligne | Table concernée |
|---------|-------|----------------|
| `hooks/use-linkme-page-config.ts` | 54 | Inconnue — config page |
| `hooks/use-organisation-addresses-bo.ts` | 95 | addresses |
| `hooks/use-storage-requests-admin.ts` | 55 | affiliate_storage_requests |
| `hooks/use-linkme-users.ts` | 89, 124, 166 | user_profiles/user_app_roles |
| `hooks/use-linkme-enseignes.ts` | 69, 166 | enseignes |
| `hooks/use-linkme-storage.ts` | 450 | storage |
| `hooks/use-site-internet-collections.ts` | 19, 260 | collections |
| `hooks/use-site-internet-categories.ts` | 19, 151 | categories |

**Server Actions et API Routes :**
| Fichier | Occurrences | Commentaire |
|---------|-------------|-------------|
| `prises-contact/[id]/actions.ts` | 5 | Server action — toutes les mutations retournent `*` |
| `api/qonto/invoices/route.ts` | 2 | API route — finances |
| `api/qonto/quotes/route.ts` | 4 | API route — devis |
| `api/exports/google-merchant-excel/route.ts` | 1 | Export — acceptable si export complet |

**Pages client-side :**
| Fichier | Table concernée |
|---------|----------------|
| `canaux-vente/linkme/commandes/[id]/page.tsx:604` | sales_order_items |
| `canaux-vente/linkme/commandes/[id]/details/page.tsx:543` | sales_order_items |
| `contacts-organisations/customers/page.tsx:254` | customers |
| `contacts-organisations/suppliers/page.tsx:128` | suppliers |
| `contacts-organisations/partners/page.tsx:173` | partners |
| `finance/depenses/[id]/page.tsx:121` | depenses |
| `parametres/emails/page.tsx:47` | email_templates |
| `parametres/webhooks/page.tsx:57` | webhooks |

### 3.2 invalidateQueries sans await (6 occurrences)

Le pattern correct est `await queryClient.invalidateQueries(...)` — sinon l'UI peut se mettre à jour avec des données obsolètes.

**3 fichiers concernés avec `void` au lieu de `await` :**

| Fichier                                  | Occurrences | Impact                                 |
| ---------------------------------------- | ----------- | -------------------------------------- |
| `components/orders/InvoicesSection.tsx`  | 2+          | Cache factures/détails non synchronisé |
| `hooks/use-linkme-page-config.ts`        | 2           | Config page non rechargée              |
| `hooks/use-organisation-addresses-bo.ts` | 2           | Adresses organisations non rechargées  |

**Exemple du problème dans InvoicesSection.tsx :**

```typescript
// ACTUEL (lignes 90, 93) — UI s'affiche avant rechargement
onSuccess: () => {
  void queryClient.invalidateQueries({
    queryKey: ['invoices-by-order', orderId],
  });
  void queryClient.invalidateQueries({
    queryKey: ['invoice-details', selectedInvoiceId],
  });
  setActionLoading(null);
};

// CORRECT
onSuccess: async () => {
  await queryClient.invalidateQueries({
    queryKey: ['invoices-by-order', orderId],
  });
  await queryClient.invalidateQueries({
    queryKey: ['invoice-details', selectedInvoiceId],
  });
  setActionLoading(null);
};
```

### 3.3 Patterns legacy useState+useEffect pour fetch (10+ occurrences)

Pattern obsolète avec Next.js 15 App Router — doit utiliser React Query ou RSC.

| Fichier                                                | Type                                        |
| ------------------------------------------------------ | ------------------------------------------- |
| `commissions/components/CommissionDetailContent.tsx`   | useEffect + supabase direct                 |
| `messages/page.tsx`                                    | useEffect implicite via useState            |
| `components/UserConfigModal.tsx`                       | useEffect + createClient                    |
| `components/EnseignesSection.tsx`                      | useEffect + fetchOrganisationsIndependantes |
| `stockage/[id]/page.tsx`                               | useEffect + dynamic import supabase         |
| `hooks/use-linkme-analytics.ts`                        | useEffect + useState + createClient         |
| `utilisateurs/[id]/components/UserNavigationStats.tsx` | useEffect + useState                        |
| `utilisateurs/[id]/components/UserEngagementCards.tsx` | useEffect + useState                        |
| `produits/sourcing/page.tsx`                           | useEffect + fetchCompletedCount             |
| `prix-clients/page.tsx`                                | useEffect + supabase direct                 |

### 3.4 staleTime — Configurations

La plupart des `staleTime` sont à 30 000ms (30s) ou 60 000ms (1min) — acceptable pour un back-office. Aucun staleTime < 10s détecté.

Configurations notables (correctes) :

- `use-linkme-page-config.ts` : `5 * 60 * 1000` (5 min) — config stable, bon
- `use-products-for-affiliate.ts` : `60 000` (1 min) — catalogue, bon
- `use-organisation-approvals.ts` : `120 000` (2 min) — validations, bon

### 3.5 SWR vs React Query

Aucun import SWR détecté — React Query utilisé exclusivement. Pas de caches concurrents.

---

## 4. Bundle

### 4.1 Librairies lourdes

| Package                        | Usage                                                     | Recommandation                                               |
| ------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------ |
| `jspdf` + `html2canvas`        | Dynamic import dans `SelectionProductDetailModal.tsx`     | OK — lazy loading correct                                    |
| `recharts`                     | 2 composants charts LinkMe                                | Acceptable — back-office interne                             |
| `xlsx`                         | 1 usage dans `google-merchant-excel/route.ts` (API route) | OK — server-side uniquement                                  |
| `maplibre-gl` + `react-map-gl` | 0 import détecté dans src/                                | SUSPECT — dep potentiellement inutile, ajoute ~1MB au bundle |

### 4.2 Barrel Exports problématiques

2 fichiers dans `components/business/` utilisent `export * from` — potentiellement problématique pour le tree-shaking mais impacte mineur car re-exports de composants `@verone/organisations`.

### 4.3 "use client" inutiles

0 fichier `.tsx` avec `"use client"` sans hooks ni event handlers détecté — excellent, aucun RSC mal configuré.

### 4.4 Note sur la taille du code

588 fichiers TypeScript/TSX dans `apps/back-office/src/` avec seulement 10 dépendances directes dans `package.json` — la majorité du code est dans les packages workspace. Architecture saine.

---

## Migrations en Attente (Non Appliquées)

Des migrations ont été créées mais ne sont pas encore appliquées (fichiers non commités) :

| Fichier                                                | Contenu probable             |
| ------------------------------------------------------ | ---------------------------- |
| `20260311030000_fix_rls_auth_uid_wrapper.sql`          | Fix auth.uid() sans wrapper  |
| `20260311040000_optimize_get_linkme_orders.sql`        | Optimisation fonction orders |
| `20260311050000_consolidate_notification_triggers.sql` | Consolidation triggers       |
| `20260311060000_cleanup_duplicate_indexes.sql`         | Suppression index dupliqués  |
| `20260311070000_backfill_siret_from_siren.sql`         | Données SIRET                |

**Ces migrations doivent être relues, validées et appliquées.**

---

## Recommandations Prioritaires

### CRITIQUE

1. **Appliquer la migration `20260311030000_fix_rls_auth_uid_wrapper.sql`** — `user_profiles` cumule 32M seq_scans à cause de `auth.uid()` non wrappé dans la policy `users_own_user_profiles`. Fix immédiat requis. Déléguer à `database-architect` si migration insuffisante.

2. **Corriger `v_linkme_users` exposant `auth.users` à `anon`** — Risque sécurité/RGPD. La vue expose potentiellement des emails d'utilisateurs sans authentification. Remplacer par une vue avec RLS ou restreindre les permissions.

### IMPORTANT

3. **Appliquer `20260311060000_cleanup_duplicate_indexes.sql`** — 5 paires d'index dupliqués sur tables critiques (`products`, `sales_order_items`) ralentissent les INSERTs/UPDATEs.

4. **Créer les index manquants sur `financial_documents`** — FK `converted_to_invoice_id` et `individual_customer_id` sans index sur une table probablement très utilisée pour les factures (back-office finance).

5. **Corriger les 6 `void invalidateQueries`** dans `InvoicesSection.tsx`, `use-linkme-page-config.ts`, `use-organisation-addresses-bo.ts` — pattern incorrect causant des inconsistances visuelles.

6. **Réduire les `select('*')` dans les hooks React Query** — Priorité : `use-linkme-users.ts` (3 occurrences), `use-linkme-enseignes.ts` (2), `use-site-internet-collections.ts` (2). Ces hooks sont appelés en boucle.

7. **Vérifier et supprimer `maplibre-gl` + `react-map-gl`** si inutilisés — Ces packages ajoutent environ 1MB au bundle inutilement.

8. **Corriger le fichier `.github/workflows/docs-governance.yml`** — Syntaxe YAML invalide bloque Knip et potentiellement d'autres outils CI.

### SUGGESTION

9. **Migrer les `useEffect+fetch` legacy** vers React Query dans le module LinkMe canaux-vente — 10+ composants utilisent encore le pattern obsolète, notamment dans `utilisateurs/[id]/`.

10. **Revoir les 8 vues `SECURITY DEFINER`** — Documenter pourquoi chaque vue nécessite ce mode et s'assurer que c'est intentionnel.

11. **39 fonctions avec `search_path` mutable** — Ajouter `SET search_path = public` à chaque fonction pour prévenir les attaques par injection de schéma.

12. **Considérer la désactivation de `multiple_permissive_policies`** sur les tables sensibles — 223 occurrences peuvent ralentir les requêtes RLS (chaque policy est évaluée avec OR logique).

---

## Annexes

### Commandes de vérification rapide

```bash
# Vérifier les migrations pending
ls supabase/migrations/2026031*.sql

# Type-check back-office
pnpm --filter @verone/back-office type-check

# Analyse dead code (après fix YAML)
pnpm audit:deadcode

# Vérifier FK sans index
# Via MCP Supabase — requête SQL section 2.2
```

### Ressources

- [Supabase RLS Performance](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
- [auth.uid() wrapper pattern](https://supabase.com/docs/guides/database/database-linter?lint=0013_auth_rls_initplan)
- [security_definer_view](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [auth_users_exposed](https://supabase.com/docs/guides/database/database-linter?lint=0002_auth_users_exposed)

---

_Rapport généré le 2026-03-11 par l'agent perf-optimizer_
_Mode : AUDIT (aucune modification de code effectuée)_
