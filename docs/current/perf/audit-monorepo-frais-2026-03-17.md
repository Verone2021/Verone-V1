# Audit Performance Monorepo — Frais & Complet — 2026-03-17

**Scope** : all (back-office + linkme + site-internet + packages/@verone/\*)
**Mode** : AUDIT READ-ONLY
**Contexte** : Audit post-PR #312 (invalidateQueries + useEffect migrés)
**Analysé par** : perf-optimizer (Claude)

---

## Résumé Exécutif

| Domaine                    | Findings                                                   | Criticité max |
| -------------------------- | ---------------------------------------------------------- | ------------- |
| TypeScript errors          | 265 erreurs dans back-office                               | CRITIQUE      |
| select('\*')               | 38 apps + 23 packages = 61 occurrences                     | IMPORTANT     |
| Composants > 1500 lignes   | 16 fichiers                                                | IMPORTANT     |
| 'use client' inutile       | ~15 composants sans hooks/events                           | SUGGESTION    |
| DB : seq_scan élevé        | user_app_roles 99.6%, user_profiles 100%                   | CRITIQUE      |
| DB : RLS auth.uid() direct | 2 policies critiques non wrappées                          | CRITIQUE      |
| DB : FK sans index         | 5 FK sans index                                            | IMPORTANT     |
| DB : Index inutilisés      | 269 index jamais utilisés                                  | IMPORTANT     |
| Dépendances inutilisées    | maplibre-gl + react-map-gl + supercluster dans back-office | IMPORTANT     |
| Fichiers en double         | use-enseigne-details identique apps/ vs packages/          | SUGGESTION    |
| Fichiers de test prod      | 4 routes test/ + 2 routes demo/ non protégées              | IMPORTANT     |
| Types dupliqués            | 2 copies de supabase.ts trackées dans @verone/types        | SUGGESTION    |
| console.log prod           | 1 occurrence réelle (CollectionFormModal)                  | SUGGESTION    |
| TypeScript logging.ts      | Appel dynamique logger[logLevel] mal typé                  | IMPORTANT     |
| force-dynamic root         | Layout racine back-office force-dynamic = pas de cache     | SUGGESTION    |
| Sidebar : 10 hooks         | 10 requêtes auth indépendantes au chargement               | IMPORTANT     |
| 4x getUser()               | commandes/fournisseurs/page.tsx : 4 appels getUser()       | IMPORTANT     |

---

## 1. CRITIQUE — TypeScript : 265 erreurs dans back-office

**Commande** : `pnpm --filter @verone/back-office type-check`

**Résultat** : 265 erreurs `error TS` — le build TypeScript est cassé.

### Erreurs récurrentes identifiées

| Fichier                                                                      | Erreur                                                                 | Type                       |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------- |
| `packages/@verone/utils/src/middleware/logging.ts:141`                       | `LogContext` non assignable à `Error & LogContext`                     | Mauvais overload dynamique |
| `packages/@verone/utils/src/middleware/api-security.ts:341`                  | `T[keyof T]` non assignable à `T[keyof T & string]`                    | Generic mal contraint      |
| `packages/@verone/ui/src/components/ui/command-palette.tsx:324`              | Variable `executeCommand` utilisée avant déclaration                   | Hoisting                   |
| `packages/@verone/ui/src/components/ui/notification-system.tsx:209-210`      | `markAsRead` / `removeNotification` avant déclaration                  | Hoisting                   |
| `apps/back-office/src/app/(protected)/stocks/receptions/page.tsx:275-381`    | `Dispatch<SetStateAction<...>>` incompatible avec type retour Supabase | Mapping type               |
| `apps/back-office/src/app/(protected)/produits/catalogue/page.tsx:1698-1700` | `Product` non assignable à `ProductWithSubcategory`                    | Cast abusif                |

### Cause principale du logging.ts

```typescript
// PROBLÈME ligne 141 :
logger[logLevel](message, endContext, metrics);
// logLevel : 'info' | 'warn' | 'error'
// warn(message, context?, metrics?) → OK
// error(message, error?, context?, metrics?) → INCOMPATIBLE
// error attend Error en 2e arg, pas LogContext
```

**Impact** : Le CI/CD `type-check` est cassé pour `@verone/back-office`. Impossible de détecter de nouvelles erreurs.

---

## 2. CRITIQUE — DB : seq_scan excessifs

### Tables hotspot (scan séquentiel > 80%)

| Table                  | seq_scan   | idx_scan | seq_scan_pct | Lignes réelles | Taille |
| ---------------------- | ---------- | -------- | ------------ | -------------- | ------ |
| `user_app_roles`       | 76 012 807 | 324 079  | **99.6%**    | 8              | 248 kB |
| `user_profiles`        | 32 825 101 | 15 996   | **100.0%**   | 8              | 248 kB |
| `stock_movements`      | 6 357 361  | 477 275  | **93.0%**    | 334            | 520 kB |
| `collections`          | 247 812    | 40       | **100.0%**   | 2              | 336 kB |
| `client_consultations` | 163 105    | 457      | **99.7%**    | 2              | —      |
| `variant_groups`       | 128 246    | 78       | **99.9%**    | 3              | 280 kB |
| `enseignes`            | 109 842    | 16 098   | **87.2%**    | 2              | —      |
| `matching_rules`       | 294 939    | 56 443   | **83.9%**    | 50             | —      |

**Diagnostic** : `user_app_roles` avec 76M seq_scan pour 8 lignes = la policy RLS `is_backoffice_user()` force un scan complet à chaque requête authentifiée. Idem `user_profiles` avec 32M seq_scan.

Pour `stock_movements` (93%), les index existent et sont utilisés (311K idx_scan pour le meilleur). La cause est différente : la policy `users_own_stock_movements` utilise `auth.uid()` non wrappé (voir section RLS).

### Nouvelles tables critiques (non vues dans audits précédents)

- `collections` : 247K seq_scan pour 2 lignes — aucun index utilisé (idx_scan=40 sur pkey seulement)
- `client_consultations` : 163K seq_scan pour 2 lignes — 99.7%
- `variant_groups` : 128K seq_scan pour 3 lignes — 99.9%

Ces 3 tables sont probablement scannées par des RLS policies ou des JOINs non indexés.

---

## 3. CRITIQUE — DB : RLS policies avec auth.uid() non wrappé

### Policies confirmées avec `auth.uid()` direct (évalué N fois)

| Table             | Policy                      | Pattern problématique       |
| ----------------- | --------------------------- | --------------------------- |
| `user_profiles`   | `users_own_user_profiles`   | `user_id = auth.uid()`      |
| `stock_movements` | `users_own_stock_movements` | `performed_by = auth.uid()` |

**Ces 2 policies sont les seules restantes** avec `auth.uid()` direct. Les autres tables (`notifications`, `user_app_roles`, `user_activity_logs`, etc.) utilisent déjà le pattern `(SELECT auth.uid())`.

**Fix requis** (déléguer à `database-architect`) :

```sql
-- user_profiles
ALTER POLICY "users_own_user_profiles" ON user_profiles
  USING (user_id = (SELECT auth.uid()));

-- stock_movements
ALTER POLICY "users_own_stock_movements" ON stock_movements
  USING (performed_by = (SELECT auth.uid()));
```

**Impact attendu** : réduction significative des seq_scan sur `user_profiles` (32M) et `stock_movements` (6.3M).

---

## 4. IMPORTANT — DB : FK sans index

| Table                        | Colonne FK              | Table référencée            |
| ---------------------------- | ----------------------- | --------------------------- |
| `affiliate_storage_requests` | `owner_enseigne_id`     | `enseignes`                 |
| `affiliate_storage_requests` | `owner_organisation_id` | `organisations`             |
| `affiliate_storage_requests` | `reception_id`          | `purchase_order_receptions` |
| `audit_opjet_invoices`       | `po_id`                 | `purchase_orders`           |
| `linkme_commissions`         | `payment_request_id`    | `linkme_payment_requests`   |

Amélioration vs audit 2026-03-11 : `financial_documents.individual_customer_id` et `financial_documents.converted_to_invoice_id` ont été indexés. Il reste 5 FK non indexées.

---

## 5. IMPORTANT — DB : 269 index jamais utilisés

Toutes tables confondues dans le schéma `public`. Exemples représentatifs :

| Table                  | Index inutilisés (exemples)                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `addresses`            | `idx_addresses_active`, `idx_addresses_owner`, `idx_addresses_unique_default`                                                |
| `channel_pricing`      | `idx_channel_pricing_active`, `idx_channel_pricing_assembly`, `idx_channel_pricing_featured`, `idx_channel_pricing_validity` |
| `collections`          | 11 index sur 14 jamais utilisés                                                                                              |
| `variant_groups`       | 10 index sur 12 jamais utilisés                                                                                              |
| `client_consultations` | 11 index sur 13 jamais utilisés                                                                                              |

**Note** : Ces 269 index représentent un overhead en écriture (INSERT/UPDATE/DELETE plus lent) et en RAM (buffer pool). Candidats à la suppression après vérification.

---

## 6. IMPORTANT — select('\*') : 61 occurrences dans le code métier

### Back-office apps/ (38 occurrences)

| Fichier                                                             | Ligne    | Contexte                 |
| ------------------------------------------------------------------- | -------- | ------------------------ |
| `canaux-vente/linkme/commandes/[id]/page.tsx`                       | 604      | Détail commande LinkMe   |
| `canaux-vente/linkme/hooks/use-organisation-addresses-bo.ts`        | 95       | React Query hook         |
| `canaux-vente/linkme/hooks/use-linkme-storage.ts`                   | 450      | React Query hook         |
| `canaux-vente/prix-clients/page.tsx`                                | 98       | Page client              |
| `canaux-vente/site-internet/hooks/use-site-internet-collections.ts` | 19, 260  | Hook + mutation          |
| `messages/components/payment-notifications-tab.tsx`                 | 137      | Composant                |
| `prises-contact/[id]/page.tsx`                                      | 117, 136 | Page détail (2x)         |
| `admin/users/[id]/page.tsx`                                         | 102      | Page admin               |
| `profile/page.tsx`                                                  | 99, 244  | Page profil (2x)         |
| `contacts-organisations/customers/page.tsx`                         | 254      | Page contacts            |
| `contacts-organisations/suppliers/page.tsx`                         | 128      | Page fournisseurs        |
| `contacts-organisations/partners/page.tsx`                          | 173      | Page partenaires         |
| `organisation/components/partners-tab.tsx`                          | 53       | Composant tab            |
| `organisation/components/suppliers-tab.tsx`                         | 52       | Composant tab            |
| `organisation/components/customers-tab.tsx`                         | 78       | Composant tab            |
| `finance/depenses/[id]/page.tsx`                                    | 121      | Page dépense             |
| `parametres/emails/page.tsx`                                        | 47       | Page settings            |
| `parametres/emails/[slug]/edit/page.tsx`                            | 62       | Page edit                |
| `parametres/emails/[slug]/preview/page.tsx`                         | 49       | Page preview             |
| `parametres/webhooks/page.tsx`                                      | 57, 76   | Page webhooks (2x)       |
| `parametres/webhooks/[id]/edit/page.tsx`                            | 68       | Page edit                |
| `app/actions/user-management.ts`                                    | 481      | Server action            |
| `app/api/quotes/[id]/push-to-qonto/route.ts`                        | 154, 164 | API route (2x)           |
| `app/api/admin/users/[id]/activity/route.ts`                        | 90       | API route                |
| `app/api/exports/google-merchant-excel/route.ts`                    | 396      | Export massif            |
| `app/api/qonto/invoices/service/route.ts`                           | 113, 136 | API (2x)                 |
| `app/api/qonto/quotes/service/route.ts`                             | 103, 119 | API (2x)                 |
| `hooks/base/use-supabase-mutation.ts`                               | 93, 143  | Hook générique base (2x) |

### packages/@verone/ (23 occurrences)

| Package                 | Fichier                                               | Lignes                     |
| ----------------------- | ----------------------------------------------------- | -------------------------- |
| `@verone/customers`     | `hooks/use-customers.ts`                              | —                          |
| `@verone/customers`     | `components/sections/OrganisationContactsManager.tsx` | 61                         |
| `@verone/customers`     | `hooks/use-customer-samples.ts`                       | 122                        |
| `@verone/finance`       | `hooks/use-missing-invoices.ts`                       | 86                         |
| `@verone/finance`       | `hooks/use-pcg-categories.ts`                         | 74                         |
| `@verone/finance`       | `hooks/use-unique-labels.ts`                          | 48                         |
| `@verone/finance`       | `hooks/use-bank-transaction-stats.ts`                 | 224                        |
| `@verone/finance`       | `hooks/use-expenses.ts`                               | 129                        |
| `@verone/finance`       | `hooks/use-pricing.ts`                                | 284, 418                   |
| `@verone/orders`        | `hooks/linkme/use-organisation-addresses-bo.ts`       | 95                         |
| `@verone/orders`        | `hooks/linkme/use-linkme-order-actions.ts`            | 119                        |
| `@verone/orders`        | `hooks/use-draft-purchase-order.ts`                   | 87                         |
| `@verone/orders`        | `hooks/use-sample-order.ts`                           | 79                         |
| `@verone/stock`         | `hooks/use-stock-alerts.ts`                           | 89                         |
| `@verone/stock`         | `hooks/use-movements-history.ts`                      | 566 — table 93% seq_scan ! |
| `@verone/notifications` | `components/dropdowns/StockAlertsDropdown.tsx`        | 208                        |
| `@verone/products`      | `components/wizards/CompleteProductWizard.tsx`        | 184                        |
| `@verone/organisations` | `components/forms/organisation-contacts-manager.tsx`  | 52                         |
| `@verone/utils`         | `supabase/dal.ts`                                     | 141                        |

### LinkMe apps/ (4 occurrences)

| Fichier                                         | Ligne | Contexte                        |
| ----------------------------------------------- | ----- | ------------------------------- |
| `contexts/AuthContext.tsx`                      | 114   | Auth context — acceptable (vue) |
| `app/api/page-config/[pageId]/route.ts`         | 61    | Route API                       |
| `app/api/complete-info/[token]/submit/route.ts` | 71    | Route API                       |
| `app/api/complete-info/[token]/route.ts`        | 37    | Route API                       |

---

## 7. IMPORTANT — Composants monolithiques (> 1500 lignes)

| Fichier                                    | Lignes | App/Package                          |
| ------------------------------------------ | ------ | ------------------------------------ |
| `OrderFormUnified.tsx`                     | 3596   | linkme — formulaire public principal |
| `commandes/[id]/page.tsx`                  | 3127   | back-office                          |
| `CreateOrderModal.tsx`                     | 2974   | linkme                               |
| `messages/page.tsx`                        | 2747   | back-office                          |
| `commandes/[id]/details/page.tsx`          | 2741   | back-office                          |
| `SalesOrderFormModal.tsx`                  | 2387   | @verone/orders                       |
| `ApprobationsClient.tsx`                   | 2174   | back-office                          |
| `SalesOrdersTable.tsx`                     | 2173   | @verone/orders                       |
| `CreateLinkMeOrderModal.tsx` (back-office) | 2124   | back-office                          |
| `EditOrderPage.tsx`                        | 2108   | linkme                               |
| `factures/page.tsx`                        | 2070   | back-office                          |
| `CreateLinkMeOrderModal.tsx` (packages)    | 2020   | @verone/orders                       |
| `OrderDetailModal.tsx`                     | 1872   | @verone/orders                       |
| `use-linkme-catalog.ts`                    | 1899   | back-office                          |
| `commandes/fournisseurs/page.tsx`          | 1762   | back-office                          |
| `produits/catalogue/page.tsx`              | 1752   | back-office                          |

**16 fichiers > 1500 lignes.** Ces fichiers concentrent :

- Les erreurs TypeScript
- Les bugs de memoisation
- La difficulté de maintenance
- Les re-renders excessifs (composants non découpés = pas de React.memo possible)

---

## 8. IMPORTANT — auth.getUser() redondants

### commandes/fournisseurs/page.tsx : 4 appels getUser()

```
Ligne 616, 666, 718, 801 : supabase.auth.getUser()
```

4 appels séquentiels dans le même composant page. Chaque appel valide le JWT auprès de Supabase (réseau). Devrait être 1 appel unique en début de composant avec réutilisation.

### Sidebar : 10 hooks indépendants au chargement

`app-sidebar.tsx` instancie 10 hooks de comptage :

- `useStockAlertsCount`, `useConsultationsCount`, `useLinkmePendingCount`
- `useProductsIncompleteCount`, `useOrdersPendingCount`, `useExpeditionsPendingCount`
- `useTransactionsUnreconciledCount`, `useLinkmeApprovalsCount`
- `useFormSubmissionsCount`, `useLinkmeMissingInfoCount`

Chaque hook fait sa propre requête `auth.getUser()` + une requête COUNT. Au chargement initial = minimum 20 appels réseau.

**Solution recommandée** : 1 hook `useSidebarCounts` consolidé avec `Promise.all` sur les 10 counts.

---

## 9. IMPORTANT — Dépendances inutilisées dans back-office

**package.json de `@verone/back-office`** liste :

- `maplibre-gl: ^4.7.1` (~1.2MB)
- `react-map-gl: ^7.1.9` (~300KB)
- `supercluster: ^8.0.1` (~50KB)

**Vérification** : `grep -rn "maplibre\|react-map-gl\|supercluster" apps/back-office/src/` → **0 résultat**.

Ces packages sont utilisés dans `apps/linkme/` et `packages/@verone/organisations/` mais pas dans `apps/back-office/src/`. Ils sont dans les deps back-office sans raison apparente.

**Impact bundle estimé** : ~1.5MB inutilement inclus dans le bundle back-office.

---

## 10. IMPORTANT — Routes test/demo non protégées en production

Les routes suivantes sont accessibles à tout utilisateur authentifié (pas dans `(protected)`) :

| Route                                   | Fichier                                             |
| --------------------------------------- | --------------------------------------------------- |
| `/test-client-enseigne-selector`        | `app/test-client-enseigne-selector/page.tsx`        |
| `/test-client-enseigne-selector-simple` | `app/test-client-enseigne-selector-simple/page.tsx` |
| `/test-components/button-unified`       | `app/test-components/button-unified/page.tsx`       |
| `/test-purchase-order`                  | `app/test-purchase-order/page.tsx`                  |
| `/demo-stock-ui`                        | `app/demo-stock-ui/`                                |
| `/demo-universal-selector`              | `app/demo-universal-selector/`                      |

Ces pages exposent des composants internes et UI. Elles ne sont pas dans `(protected)` donc pas soumises à la vérification de rôle back-office. Un affilié LinkMe authentifié pourrait théoriquement y accéder.

---

## 11. IMPORTANT — 'use client' inutile sur composants statiques

Composants avec `'use client'` mais sans aucun hook React ni event handler :

### Back-office (prioritaires — pages et composants)

- `canaux-vente/linkme/commissions/components/CommissionDetailSheet.tsx`
- `canaux-vente/linkme/selections/page.tsx`
- `canaux-vente/linkme/enseignes/page.tsx`
- `canaux-vente/linkme/components/ConfigurationSection.tsx`
- `canaux-vente/linkme/components/DashboardSection.tsx`
- `canaux-vente/linkme/components/CommissionsStatusCard.tsx`
- `canaux-vente/linkme/components/SelectionsPerformanceTable.tsx`
- `canaux-vente/linkme/catalogue/fournisseurs/page.tsx`
- `stocks/mouvements/components/MovementsListView.tsx`
- `finance/bibliotheque/_components/pdf-preview.tsx`
- `finance/bibliotheque/_components/document-list.tsx`
- `finance/bibliotheque/_components/library-stats.tsx`
- `finance/page.tsx`

### LinkMe (prioritaires — composants landing/publics)

- `components/landing/Hero.tsx`
- `components/landing/Features.tsx`
- `components/landing/HowItWorks.tsx`
- `components/landing/Footer.tsx`
- `components/landing/CTA.tsx`
- `components/landing/Marketplace.tsx`
- `components/public-selection/SelectionHero.tsx`

**Note** : Beaucoup de ces composants reçoivent des props issues de hooks dans leur parent — ils ont `'use client'` hérité. Vérifier cas par cas avant suppression.

---

## 12. SUGGESTION — Fichier use-enseigne-details identique (doublon exact)

```
apps/back-office/.../hooks/use-enseigne-details.ts  (ligne par ligne identique)
packages/@verone/orders/src/hooks/linkme/use-enseigne-details.ts
```

`diff` entre les deux = aucune différence. Seul le fichier `packages/` devrait exister.

---

## 13. SUGGESTION — Types dupliqués dans @verone/types

Deux fichiers trackés dans git qui sont des copies de l'ancien type généré :

```
packages/@verone/types/apps/back-office/src/types/supabase.ts   (10 423 lignes)
packages/@verone/types/packages/@verone/types/src/supabase.ts   (10 423 lignes)
```

Ces fichiers sembent être des artéfacts d'une ancienne commande de génération lancée depuis le mauvais répertoire. La source de vérité est `packages/@verone/types/src/supabase.ts` (14 720 lignes — version à jour).

**Taille** : 344KB + 344KB = ~688KB de fichiers inutiles trackés dans git.

---

## 14. SUGGESTION — Logger dynamique mal typé (logging.ts)

```typescript
// packages/@verone/utils/src/middleware/logging.ts:141
let logLevel: 'info' | 'warn' | 'error' = 'info';
// ...
logger[logLevel](message, endContext, metrics);
```

Le problème : `logger.error()` attend `(message, error?: Error, context?, metrics?)` mais l'appel dynamique passe `(message, context, metrics)`. TypeScript ne peut pas résoudre l'overload dynamiquement.

**Fix simple** :

```typescript
if (logLevel === 'error') {
  logger.error(message, undefined, endContext, metrics);
} else {
  logger[logLevel](message, endContext, metrics);
}
```

---

## 15. SUGGESTION — console.log en production

1 occurrence réelle (non dans tests, non commentée) :

```
packages/@verone/common/src/components/collections/CollectionFormModal.tsx:230
console.log('✅ Image collection uploadée:', imageId);
```

---

## 16. SUGGESTION — force-dynamic sur le root layout back-office

```typescript
// apps/back-office/src/app/layout.tsx:24
export const dynamic = 'force-dynamic';
```

Ce `force-dynamic` au niveau root empêche tout cache Next.js sur les pages publiques (login, unauthorized). Ces pages pourraient bénéficier du cache statique. Seul le `(protected)/layout.tsx` devrait porter `force-dynamic`.

---

## Récapitulatif DB — État actuel

### Tables sans RLS : 0 (parfait)

### RLS auth.uid() non wrappé : 2 restantes

| Table             | Policy                                                    |
| ----------------- | --------------------------------------------------------- |
| `user_profiles`   | `users_own_user_profiles` : `user_id = auth.uid()`        |
| `stock_movements` | `users_own_stock_movements` : `performed_by = auth.uid()` |

### Tables les plus volumineuses

| Table                | Taille totale | Lignes | Note              |
| -------------------- | ------------- | ------ | ----------------- |
| `user_activity_logs` | 75 MB         | 87 321 | Croissance rapide |
| `audit_logs`         | 65 MB         | 88 474 | Croissance rapide |
| `user_sessions`      | 9 MB          | 9 442  | Normal            |
| `products`           | 1.5 MB        | 231    | OK                |

`user_activity_logs` et `audit_logs` à 75MB/65MB pour un projet en début de vie — surveiller la stratégie de rétention.

---

## Recommandations Prioritaires

### CRITIQUES (bloqueront la scalabilité / masquent des bugs)

1. **TypeScript 265 erreurs** — Corriger `logging.ts` (cause racine de l'overload), `command-palette.tsx`, `notification-system.tsx`. Le type-check cassé = accumulation silencieuse de régressions.

2. **RLS user_profiles** — `user_id = auth.uid()` → `user_id = (SELECT auth.uid())`. 32M seq_scan pour 8 lignes. Déléguer à `database-architect`.

3. **RLS stock_movements** — `performed_by = auth.uid()` → `performed_by = (SELECT auth.uid())`. 6.3M seq_scan. Déléguer à `database-architect`.

### IMPORTANTS (impact perf mesurable)

4. **4x getUser() dans commandes/fournisseurs** — 1 seul appel en début de composant, réutiliser la variable.

5. **Sidebar 10 hooks** — Consolider en 1 hook `useSidebarCounts` avec `Promise.all`.

6. **Supprimer maplibre-gl + react-map-gl + supercluster du back-office** — ~1.5MB bundle inutile.

7. **Routes test/demo** — Déplacer dans `(protected)` ou supprimer de la codebase si non utilisées en prod.

8. **FK sans index** — 5 FK : `affiliate_storage_requests` (3 colonnes) + `audit_opjet_invoices.po_id` + `linkme_commissions.payment_request_id`. Déléguer à `database-architect`.

9. **select('\*') sur use-movements-history.ts ligne 566** — Table `stock_movements` à 93% seq_scan, overfetch aggravant la situation.

10. **select('\*') sur hooks React Query** — Priorité : `use-site-internet-collections.ts`, `use-organisation-addresses-bo.ts` (en double apps/ et packages/), `use-linkme-storage.ts`.

### SUGGESTIONS (qualité / maintenabilité)

11. **Supprimer les 269 index inutilisés** — Analyse approfondie requise (certains peuvent être récents). Priorité : `collections` (11/14 inutilisés), `variant_groups` (10/12), `channel_pricing` (5/5).

12. **Nettoyer le doublon use-enseigne-details** — Supprimer la copie dans `apps/back-office/`.

13. **Supprimer les 2 fichiers supabase.ts leakés** dans `packages/@verone/types/apps/` et `packages/@verone/types/packages/`.

14. **console.log CollectionFormModal** — Remplacer par `logger.info()`.

15. **force-dynamic root layout** — Déplacer sur `(protected)/layout.tsx` uniquement.

16. **Composer les 16 fichiers > 1500 lignes** — Commencer par `OrderFormUnified.tsx` (3596 lignes, pas de React.memo sur les steps).

---

## Plan de Fix Suggéré

### Phase 1 — DB (déléguer à database-architect)

```sql
-- Migration 1 : Fix RLS auth.uid() wrapper
ALTER POLICY "users_own_user_profiles" ON user_profiles
  USING (user_id = (SELECT auth.uid()));
ALTER POLICY "users_own_stock_movements" ON stock_movements
  USING (performed_by = (SELECT auth.uid()));

-- Migration 2 : Index FK manquants
CREATE INDEX CONCURRENTLY idx_affiliate_storage_requests_owner_enseigne
  ON affiliate_storage_requests(owner_enseigne_id);
CREATE INDEX CONCURRENTLY idx_affiliate_storage_requests_owner_org
  ON affiliate_storage_requests(owner_organisation_id);
CREATE INDEX CONCURRENTLY idx_affiliate_storage_requests_reception
  ON affiliate_storage_requests(reception_id);
CREATE INDEX CONCURRENTLY idx_audit_opjet_invoices_po
  ON audit_opjet_invoices(po_id);
CREATE INDEX CONCURRENTLY idx_linkme_commissions_payment_request
  ON linkme_commissions(payment_request_id);
```

### Phase 2 — TypeScript (back-office)

1. Corriger `logging.ts:141` (appel dynamique)
2. Corriger `command-palette.tsx` et `notification-system.tsx` (déclarations)
3. Corriger les incompatibilités de type dans `stocks/receptions/page.tsx` et `stocks/expeditions/page.tsx`

### Phase 3 — Bundle & Dead Code

1. Supprimer maplibre-gl/react-map-gl/supercluster de back-office/package.json
2. Supprimer les fichiers leakés dans @verone/types/apps/ et @verone/types/packages/
3. Supprimer apps/back-office/diagnostic-production.png (trackée en git)
4. Consolider use-enseigne-details (supprimer la copie apps/)

### Phase 4 — select('\*') ciblés (impact > effort)

Prioriser les hooks React Query appelés fréquemment :

1. `use-movements-history.ts:566` (table 93% seq_scan)
2. `use-site-internet-collections.ts:19,260`
3. `use-organisation-addresses-bo.ts:95` (dans apps/ ET packages/)
4. `use-linkme-storage.ts:450`

---

_Rapport généré le 2026-03-17 par perf-optimizer (Claude Sonnet 4.6)_
_Données DB fraîches via MCP Supabase_
_1877 fichiers TS/TSX analysés dans apps/ et packages/_
