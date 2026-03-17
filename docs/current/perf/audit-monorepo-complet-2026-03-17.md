# Audit Performance Monorepo Complet — 2026-03-17

**Scope** : apps/ (back-office, linkme, site-internet) + packages/@verone/\*
**Mode** : AUDIT READ-ONLY
**Dernière mise à jour** : 2026-03-17

---

## Résumé Exécutif

| Catégorie                              | Occurrences | Critique | Important | Mineur |
| -------------------------------------- | ----------- | -------- | --------- | ------ |
| select('\*') / select() sans args      | 63          | 12       | 28        | 23     |
| invalidateQueries sans await           | 23          | 5        | 10        | 8      |
| Polling / refetchInterval              | 9 hooks     | 2        | 5         | 2      |
| Composants > 1500 lignes               | 13          | 5        | 6         | 2      |
| getUser() / getSession() répétés       | 8 fichiers  | 3        | 5         | 0      |
| Requêtes séquentielles parallelisables | 4 pages     | 2        | 2         | 0      |
| useEffect + useState + fetch (legacy)  | 6 pages     | 0        | 6         | 0      |

---

## 1. select('\*') et select() sans arguments

### 1.1 — apps/back-office

| Fichier                                                                             | Ligne    | Table                             | Sévérité  | Recommandation                                                   |
| ----------------------------------------------------------------------------------- | -------- | --------------------------------- | --------- | ---------------------------------------------------------------- |
| `app/(protected)/parametres/webhooks/page.tsx`                                      | 57, 76   | `webhook_configs`, `webhook_logs` | IMPORTANT | Sélectionner uniquement les colonnes affichées dans le tableau   |
| `app/(protected)/parametres/webhooks/[id]/edit/page.tsx`                            | 68       | `webhook_configs`                 | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/parametres/emails/[slug]/preview/page.tsx`                         | 49       | `email_templates`                 | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/parametres/emails/[slug]/edit/page.tsx`                            | 62       | `email_templates`                 | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/parametres/emails/page.tsx`                                        | 47       | `email_templates`                 | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/finance/depenses/[id]/page.tsx`                                    | 121      | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/api/exports/google-merchant-excel/route.ts`                                    | 396      | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/api/admin/users/[id]/activity/route.ts`                                        | 90       | `user_activity_logs`              | MINEUR    | Route admin, OK si volume faible                                 |
| `app/api/qonto/quotes/service/route.ts`                                             | 103, 119 | inconnues                         | IMPORTANT | Sélection explicite                                              |
| `app/api/qonto/invoices/service/route.ts`                                           | 113, 136 | inconnues                         | IMPORTANT | Sélection explicite                                              |
| `app/api/quotes/[id]/push-to-qonto/route.ts`                                        | 154, 164 | inconnues                         | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/messages/components/payment-notifications-tab.tsx`                 | 137      | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/organisation/components/customers-tab.tsx`                         | 78       | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/organisation/components/suppliers-tab.tsx`                         | 52       | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/organisation/components/partners-tab.tsx`                          | 53       | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/prises-contact/[id]/page.tsx`                                      | 117, 136 | inconnues                         | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/canaux-vente/site-internet/hooks/use-site-internet-categories.ts`  | 19, 151  | `site_internet_categories`        | CRITIQUE  | Hook appelé à chaque navigation — overfetch permanent            |
| `app/(protected)/canaux-vente/site-internet/hooks/use-site-internet-collections.ts` | 19, 260  | `site_internet_collections`       | CRITIQUE  | Idem                                                             |
| `app/(protected)/canaux-vente/linkme/hooks/use-linkme-storage.ts`                   | 450      | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/canaux-vente/linkme/commandes/[id]/page.tsx`                       | 604      | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/canaux-vente/linkme/hooks/use-storage-requests-admin.ts`           | 55       | `affiliate_storage_requests`      | IMPORTANT | Hook avec polling 60s — critiquement overfetch                   |
| `app/(protected)/canaux-vente/linkme/hooks/use-organisation-addresses-bo.ts`        | 95       | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/canaux-vente/linkme/components/SelectionsSection.tsx`              | 327      | inconnue                          | MINEUR    | Mutation retour, acceptable si petite table                      |
| `app/(protected)/canaux-vente/prix-clients/page.tsx`                                | 98       | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/contacts-organisations/suppliers/page.tsx`                         | 128      | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/contacts-organisations/partners/page.tsx`                          | 173      | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/contacts-organisations/customers/page.tsx`                         | 254      | inconnue                          | IMPORTANT | Sélection explicite                                              |
| `app/(protected)/admin/users/[id]/page.tsx`                                         | 102      | inconnue                          | MINEUR    | Page admin, usage rare                                           |
| `app/(protected)/profile/page.tsx`                                                  | 99, 244  | `user_profiles`                   | CRITIQUE  | `user_profiles` = table à 100% seq_scan — overfetch aggrave tout |
| `app/actions/consultations.ts`                                                      | 94       | inconnue                          | MINEUR    | Action server, acceptable si petite table                        |
| `app/actions/purchase-orders.ts`                                                    | 83       | `purchase_orders`                 | IMPORTANT | Table volumineuse                                                |
| `app/actions/user-management.ts`                                                    | 481      | inconnue                          | MINEUR    | Action admin                                                     |
| `hooks/base/use-supabase-mutation.ts`                                               | 93, 143  | générique                         | IMPORTANT | Hook de base — affecte tous les composants qui l'utilisent       |
| `app/api/transactions/update-vat/route.ts`                                          | 81       | inconnue                          | MINEUR    | Route mutation                                                   |
| `components/forms/simple-product-form.tsx`                                          | 131      | inconnue                          | IMPORTANT | Formulaire produit — appelé fréquemment                          |
| `components/forms/family-form.tsx`                                                  | 166, 184 | inconnue                          | IMPORTANT | Mutations — retour select() inutile                              |
| `components/forms/category-form.tsx`                                                | 201, 219 | inconnue                          | IMPORTANT | Idem                                                             |
| `components/forms/subcategory-form.tsx`                                             | 240, 266 | inconnue                          | IMPORTANT | Idem                                                             |
| `components/forms/quick-variant-form.tsx`                                           | 255      | inconnue                          | IMPORTANT | Idem                                                             |

### 1.2 — apps/linkme

| Fichier                                         | Ligne | Table                 | Sévérité  | Recommandation                                    |
| ----------------------------------------------- | ----- | --------------------- | --------- | ------------------------------------------------- |
| `app/api/complete-info/[token]/route.ts`        | 37    | inconnue              | IMPORTANT | Sélection explicite                               |
| `app/api/complete-info/[token]/submit/route.ts` | 71    | inconnue              | IMPORTANT | Sélection explicite                               |
| `app/api/page-config/[pageId]/route.ts`         | 61    | `page_configurations` | IMPORTANT | Sélection explicite                               |
| `contexts/AuthContext.tsx`                      | 114   | vue (acceptable)      | MINEUR    | Vue enrichie, colonnes probablement toutes utiles |

### 1.3 — packages/@verone

| Fichier                                                                | Ligne             | Table                                   | Sévérité  | Recommandation                                                     |
| ---------------------------------------------------------------------- | ----------------- | --------------------------------------- | --------- | ------------------------------------------------------------------ |
| `customers/src/hooks/use-customers.ts`                                 | 86, 138, 203, 231 | `individual_customers`, `organisations` | CRITIQUE  | 4 occurrences dans un hook appelé partout — overfetch systématique |
| `customers/src/hooks/use-customer-samples.ts`                          | 122               | inconnue                                | IMPORTANT | Sélection explicite                                                |
| `customers/src/components/sections/OrganisationContactsManager.tsx`    | 61                | inconnue                                | IMPORTANT | Sélection explicite                                                |
| `finance/src/hooks/use-pricing.ts`                                     | 284, 418          | tables pricing                          | CRITIQUE  | Hook pricing appelé sur chaque page produit                        |
| `finance/src/hooks/use-expenses.ts`                                    | 129               | `expenses`                              | IMPORTANT | Sélection explicite                                                |
| `finance/src/hooks/use-bank-transaction-stats.ts`                      | 224               | `bank_transactions`                     | IMPORTANT | Table volumineuse                                                  |
| `finance/src/hooks/use-unique-labels.ts`                               | 48                | inconnue                                | MINEUR    | Sélection explicite                                                |
| `finance/src/hooks/use-pcg-categories.ts`                              | 74                | `pcg_categories`                        | MINEUR    | Table stable et petite                                             |
| `finance/src/hooks/use-missing-invoices.ts`                            | 86                | inconnue                                | IMPORTANT | Sélection explicite                                                |
| `organisations/src/components/forms/organisation-contacts-manager.tsx` | 52                | inconnue                                | IMPORTANT | Sélection explicite                                                |
| `notifications/src/components/dropdowns/StockAlertsDropdown.tsx`       | 208               | vue `stock_alerts_enriched`             | CRITIQUE  | Vue SECURITY DEFINER + select('\*') = double overhead              |
| `orders/src/hooks/use-sample-order.ts`                                 | 79                | inconnue                                | IMPORTANT | Sélection explicite                                                |
| `orders/src/hooks/use-draft-purchase-order.ts`                         | 87                | inconnue                                | IMPORTANT | Sélection explicite                                                |
| `orders/src/hooks/linkme/use-linkme-enseignes.ts`                      | 70                | `enseignes`                             | CRITIQUE  | Table à 87.8% seq_scan — select('\*') aggrave la situation         |
| `orders/src/hooks/linkme/use-linkme-order-actions.ts`                  | 119               | inconnue                                | IMPORTANT | Sélection explicite                                                |
| `orders/src/hooks/linkme/use-organisation-addresses-bo.ts`             | 95                | inconnue                                | IMPORTANT | Sélection explicite (doublon avec app hook)                        |
| `products/src/components/wizards/CompleteProductWizard.tsx`            | 184               | inconnue                                | IMPORTANT | Sélection explicite                                                |
| `stock/src/hooks/use-movements-history.ts`                             | 566               | `stock_movements`                       | CRITIQUE  | Table à 93.1% seq_scan — select('\*') aggrave la situation         |
| `stock/src/hooks/use-stock-alerts.ts`                                  | 89                | inconnue                                | IMPORTANT | Sélection explicite                                                |
| `utils/src/supabase/dal.ts`                                            | 141               | générique (DAL)                         | IMPORTANT | Hook de base générique — passe-partout dangereux                   |

---

## 2. invalidateQueries sans await (promesses flottantes)

### Catégorie A : `void queryClient.invalidateQueries` dans `onSuccess` synchrone

Ces occurrences utilisent `void` explicitement mais dans un handler `onSuccess: () =>` (non async). C'est un pattern acceptable dans React Query si les mutations n'ont pas besoin d'attendre l'invalidation avant l'affichage. Cependant si le toast de succès apparaît AVANT que les données soient rechargées, l'UI peut afficher des données stales.

| Fichier                                                                                        | Lignes     | Context                         | Sévérité  | Recommandation                                             |
| ---------------------------------------------------------------------------------------------- | ---------- | ------------------------------- | --------- | ---------------------------------------------------------- |
| `packages/@verone/channels/src/hooks/google-merchant/use-toggle-google-merchant-visibility.ts` | 83, 86     | onSuccess non-async             | IMPORTANT | Passer `onSuccess` en async + await Promise.all            |
| `packages/@verone/channels/src/hooks/google-merchant/use-remove-from-google-merchant.ts`       | 69, 72, 75 | onSuccess non-async             | IMPORTANT | Idem                                                       |
| `packages/@verone/channels/src/hooks/google-merchant/use-update-google-merchant-metadata.ts`   | 82         | onSuccess non-async             | IMPORTANT | Idem                                                       |
| `packages/@verone/channels/src/hooks/google-merchant/use-update-google-merchant-price.ts`      | 89         | onSuccess non-async             | IMPORTANT | Idem                                                       |
| `packages/@verone/channels/src/hooks/google-merchant/use-poll-google-merchant-statuses.ts`     | 82, 85     | onSuccess non-async             | IMPORTANT | Idem                                                       |
| `packages/@verone/channels/src/hooks/google-merchant/use-add-products-to-google-merchant.ts`   | 84, 87, 90 | onSuccess non-async             | IMPORTANT | Idem                                                       |
| `packages/@verone/finance/src/hooks/use-pricing.ts`                                            | 494–518    | helper `useInvalidatePricing()` | MINEUR    | Fonction utilitaire — appeleurs doivent await manuellement |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-page-config.ts`     | 215        | onSuccess non-async             | IMPORTANT | Passer onSuccess en async + await                          |
| `packages/@verone/orders/src/hooks/linkme/use-organisation-addresses-bo.ts`                    | 201        | onSuccess non-async             | IMPORTANT | Passer onSuccess en async + await                          |

### Catégorie B : `queryClient.invalidateQueries` sans await NI void dans `useInvalidate*` helpers

| Fichier                                                 | Lignes        | Context                           | Sévérité | Recommandation                                             |
| ------------------------------------------------------- | ------------- | --------------------------------- | -------- | ---------------------------------------------------------- |
| `packages/@verone/customers/src/hooks/use-customers.ts` | 346, 348, 350 | `useInvalidateCustomers()` helper | MINEUR   | Fonctions helpers — callers doivent void/await en appelant |
| `packages/@verone/utils/src/hooks/use-current-user.ts`  | 158, 160      | `useInvalidateAuth()` helper      | MINEUR   | Idem — OK si les callers utilisent void                    |

**Note** : Les hooks `use-linkme-orders.ts`, `use-linkme-selections.ts`, `use-linkme-users.ts`, `use-linkme-catalog.ts`, `use-linkme-order-actions.ts` sont CORRECTS — ils utilisent `await Promise.all([...])` correctement.

---

## 3. Polling / refetchInterval

| Fichier                                                                                         | Intervalle              | Context                                       | Sévérité  | Recommandation                                                                       |
| ----------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| `packages/@verone/notifications/src/hooks/use-form-submissions-count.ts`                        | 60s (fallback Realtime) | `if (!enableRealtime && refetchInterval > 0)` | MINEUR    | Logique correcte — polling désactivé si Realtime actif                               |
| `packages/@verone/notifications/src/hooks/use-transactions-unreconciled-count.ts`               | 60s (fallback)          | Idem                                          | MINEUR    | Idem                                                                                 |
| `packages/@verone/notifications/src/hooks/use-stock-alerts-count.ts`                            | 30s (fallback)          | Idem                                          | MINEUR    | 30s agressif — envisager 60s comme les autres                                        |
| `packages/@verone/notifications/src/hooks/use-orders-pending-count.ts`                          | 60s (fallback)          | Idem                                          | MINEUR    | Logique correcte                                                                     |
| `packages/@verone/notifications/src/hooks/use-products-incomplete-count.ts`                     | 60s (fallback)          | Idem                                          | MINEUR    | Logique correcte                                                                     |
| `apps/back-office/src/hooks/use-archive-notifications.ts`                                       | 5 min                   | React Query `refetchInterval`                 | IMPORTANT | 5 min est raisonnable mais Realtime serait préférable                                |
| `apps/back-office/src/app/(protected)/canaux-vente/site-internet/hooks/use-vercel-analytics.ts` | 5 min                   | React Query `refetchInterval`                 | MINEUR    | Analytics — polling acceptable                                                       |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-dashboard.ts`        | 2 min                   | React Query `refetchInterval`                 | IMPORTANT | 2 min pour dashboard — acceptable mais envisager Realtime                            |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-product-approvals.ts`       | 1 min                   | React Query `refetchInterval`                 | IMPORTANT | Remplacer par Realtime subscription                                                  |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-payment-requests-admin.ts`  | 1 min                   | React Query `refetchInterval`                 | IMPORTANT | Remplacer par Realtime subscription                                                  |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-storage-requests-admin.ts`  | 1 min                   | React Query `refetchInterval` + select('\*')  | CRITIQUE  | Double problème : polling + overfetch. select('\*') + 1 requête/min = charge inutile |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-organisation-approvals.ts`  | 1 min                   | React Query `refetchInterval`                 | IMPORTANT | Remplacer par Realtime subscription                                                  |
| `packages/@verone/orders/src/hooks/linkme/use-linkme-order-actions.ts`                          | 1 min                   | `usePendingOrdersCount`                       | IMPORTANT | Remplacer par hook notification existant                                             |

**Bonne nouvelle** : Le bug `||` de l'audit précédent (hooks notification) a été corrigé. Tous utilisent maintenant `if (!enableRealtime && refetchInterval > 0)` (condition correcte — polling désactivé si Realtime est actif).

---

## 4. Composants > 1500 lignes

### apps/back-office

| Fichier                                                                     | Lignes | Sévérité  | Recommandation                                                          |
| --------------------------------------------------------------------------- | ------ | --------- | ----------------------------------------------------------------------- |
| `app/(protected)/canaux-vente/linkme/commandes/[id]/page.tsx`               | 3127   | CRITIQUE  | Découper en composants : OrderHeader, OrderItemsTable, OrderStatusPanel |
| `app/(protected)/canaux-vente/linkme/messages/page.tsx`                     | 2747   | CRITIQUE  | Découper en : MessagesList, MessageDetail, ThreadView                   |
| `app/(protected)/canaux-vente/linkme/commandes/[id]/details/page.tsx`       | 2740   | CRITIQUE  | Trop grand + 5 requêtes séquentielles — refonte prioritaire             |
| `app/(protected)/canaux-vente/linkme/approbations/ApprobationsClient.tsx`   | 2174   | CRITIQUE  | Découper en : ApprobationsList, ApprobationCard, ApprobationFilters     |
| `app/(protected)/canaux-vente/linkme/components/CreateLinkMeOrderModal.tsx` | 2124   | CRITIQUE  | Découper en steps (StepForm pattern)                                    |
| `app/(protected)/factures/page.tsx`                                         | 2070   | IMPORTANT | Découper en InvoiceList + InvoiceFilters                                |
| `app/(protected)/canaux-vente/linkme/hooks/use-linkme-catalog.ts`           | 1899   | IMPORTANT | Hook monolithique — découper par fonctionnalité                         |
| `app/(protected)/commandes/fournisseurs/page.tsx`                           | 1762   | IMPORTANT | Découper en PurchaseOrderList + PurchaseOrderDetail                     |
| `app/(protected)/produits/catalogue/page.tsx`                               | 1752   | IMPORTANT | Découper en CatalogueTable + CatalogueFilters                           |
| `app/(protected)/factures/devis/[id]/page.tsx`                              | 1748   | IMPORTANT | Découper en QuoteHeader + QuoteItems + QuoteActions                     |
| `app/(protected)/finance/transactions/page.tsx`                             | 1718   | IMPORTANT | Découper en TransactionList + TransactionFilters                        |
| `app/(protected)/canaux-vente/linkme/catalogue/page.tsx`                    | 1646   | MINEUR    | Découper en LinkMeCatalogueTable + Filters                              |
| `app/(protected)/stocks/receptions/page.tsx`                                | 1561   | MINEUR    | Découper en ReceptionList + ReceptionDetail                             |

### apps/linkme

| Fichier                                                | Lignes | Sévérité | Recommandation                                                          |
| ------------------------------------------------------ | ------ | -------- | ----------------------------------------------------------------------- |
| `components/OrderFormUnified.tsx`                      | 3596   | CRITIQUE | Composant monolithique public — découper en steps React avec React.memo |
| `app/(main)/commandes/components/CreateOrderModal.tsx` | 2974   | CRITIQUE | Découper en steps (déjà partiellement fait dans OrderFormUnified)       |
| `app/(main)/commandes/[id]/modifier/EditOrderPage.tsx` | 2108   | CRITIQUE | Découper en sections éditables                                          |

### packages/@verone

| Fichier                                                | Lignes | Sévérité  | Recommandation                                |
| ------------------------------------------------------ | ------ | --------- | --------------------------------------------- |
| `orders/src/components/modals/SalesOrderFormModal.tsx` | 2387   | CRITIQUE  | Découper en steps                             |
| `orders/src/components/SalesOrdersTable.tsx`           | 2173   | IMPORTANT | Découper en SalesOrderRow + SalesOrderActions |
| `orders/src/hooks/use-sales-orders.ts`                 | 2057   | IMPORTANT | Hook trop grand — extraire les mutations      |

---

## 5. auth.getUser() / getSession() répétés dans le même fichier

### Répétitions multiples (3+ appels dans le même fichier)

| Fichier                                                                  | Nb appels | Lignes                       | Sévérité  | Recommandation                                                                         |
| ------------------------------------------------------------------------ | --------- | ---------------------------- | --------- | -------------------------------------------------------------------------------------- |
| `packages/@verone/notifications/src/hooks/use-database-notifications.ts` | 4         | 113, 204, 269, 332           | CRITIQUE  | `getUser()` appelé dans chaque `useEffect` — mémoriser dans un `useRef` ou React Query |
| `packages/@verone/stock/src/hooks/core/use-stock-core.ts`                | 3         | 231, 295, 347                | CRITIQUE  | 3 getUser() dans le même hook — extraire dans `const user = useCurrentUser()`          |
| `apps/back-office/src/app/(protected)/commandes/fournisseurs/page.tsx`   | 4         | 616, 666, 718, 801           | CRITIQUE  | Page de commandes fournisseurs avec 4 getUser() dans 4 handlers — mémoriser au mount   |
| `packages/@verone/stock/src/hooks/use-stock.ts`                          | 2         | 200, 435                     | IMPORTANT | 2 getUser() dans 2 mutations — ok si rarement exécutés ensemble                        |
| `packages/@verone/orders/src/hooks/use-sales-orders.ts`                  | 5         | 1303, 1391, 1738, 1816, 1948 | CRITIQUE  | 5 getUser() dans les handlers de mutations — extraire user via React Query/context     |
| `apps/back-office/src/app/(protected)/profile/page.tsx`                  | 2         | 74, 236                      | IMPORTANT | Deux fonctions async distinctes qui pourraient partager le user                        |
| `packages/@verone/stock/src/hooks/use-stock-reservations.ts`             | 4         | 260, 296, 337, 423           | IMPORTANT | 4 getUser() dans handlers séparés — ok en terme de perf car Supabase cache             |

**Note** : Supabase SSR met `getUser()` en cache côté client, donc ces appels multiples ne créent PAS forcément de requêtes réseau supplémentaires. Cependant, c'est une mauvaise pratique qui peut créer des états incohérents si l'utilisateur se déconnecte entre deux appels.

---

## 6. Requêtes Supabase séquentielles parallelisables

### 6.1 — profile/page.tsx (IMPORTANT)

```
app/(protected)/profile/page.tsx — fonction loadUserData (ligne 67)
```

Séquence actuelle :

1. `await supabase.auth.getUser()` — ligne 74 (nécessaire en premier pour obtenir user.id)
2. `await supabase.from('user_profiles').select('*')` — ligne 97
3. `await supabase.from('user_app_roles').select('role')` — ligne 104

Les requêtes 2 et 3 sont **indépendantes** après l'obtention de `user.id`. Elles devraient être en `Promise.all`.

**Fix recommandé** :

```typescript
const [profileData, roleData] = await Promise.all([
  supabase
    .from('user_profiles')
    .select('first_name, last_name, phone, job_title, ...')
    .eq('user_id', user.id)
    .single(),
  supabase
    .from('user_app_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('app', 'back-office')
    .single(),
]);
```

### 6.2 — commandes/[id]/details/page.tsx (CRITIQUE)

Séquence actuelle dans `fetchOrder` (5 requêtes séquentielles) :

1. `sales_orders` JOIN complet (ligne 349) — nécessaire en premier
2. `user_profiles` pour `createdByUserId` (ligne 427) — conditionnel
3. `transaction_document_links` (ligne 445) — indépendante
4. `linkme_order_items_enriched` (ligne 539) — indépendante
5. `products` pour `created_by_affiliate` (ligne 551) — dépend de 4

Les requêtes 2, 3 et 4 peuvent être parallèles une fois `orderId` connu :

```typescript
const [profileData, linkData, enrichedData] = await Promise.all([
  createdByUserId ? supabase.from('user_profiles')... : Promise.resolve({ data: null }),
  supabase.from('transaction_document_links')...,
  supabase.from('linkme_order_items_enriched')...
]);
```

### 6.3 — commandes/fournisseurs/page.tsx (IMPORTANT)

4 handlers distincts qui appellent chacun `supabase.auth.getUser()`. Ces handlers gèrent des statuts différents mais l'user est le même dans tous. Mémoriser le userId au chargement du composant éviterait 4 appels réseau redondants.

### 6.4 — use-sales-orders.ts (IMPORTANT)

5 mutations distinctes qui appellent chacune `getUser()`. Bien que Supabase mette en cache `getUser()`, le hook `useCurrentUser()` de `@verone/utils` est disponible et centralise cet accès.

---

## 7. useEffect + useState + fetch (legacy pattern)

Ces pages/hooks utilisent `useState` + `useEffect` pour fetch des données au lieu de React Query (pattern obsolète dans Next.js 15 App Router).

| Fichier                                                                                    | Pattern                                                                         | Table concernée                   | Sévérité  | Recommandation                                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------- | --------- | -------------------------------------------------------------- |
| `apps/back-office/src/app/(protected)/parametres/emails/page.tsx`                          | `useState + useEffect + supabase.from('email_templates').select('*')`           | `email_templates`                 | IMPORTANT | Migrer vers `useQuery` React Query                             |
| `apps/back-office/src/app/(protected)/parametres/emails/[slug]/edit/page.tsx`              | `useState + useEffect + supabase`                                               | `email_templates`                 | IMPORTANT | Migrer vers `useQuery` React Query                             |
| `apps/back-office/src/app/(protected)/parametres/emails/[slug]/preview/page.tsx`           | `useState + useEffect + supabase`                                               | `email_templates`                 | IMPORTANT | Migrer vers `useQuery` React Query                             |
| `apps/back-office/src/app/(protected)/parametres/webhooks/page.tsx`                        | `useState + useEffect + supabase` + boucle `for...of` séquentielle sur webhooks | `webhook_configs`, `webhook_logs` | IMPORTANT | Migrer vers `useQuery` + éviter la boucle séquentielle de logs |
| `apps/back-office/src/app/(protected)/parametres/webhooks/[id]/edit/page.tsx`              | `useState + useEffect + supabase`                                               | `webhook_configs`                 | IMPORTANT | Migrer vers `useQuery` React Query                             |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/page.tsx` | `useState + useEffect + fetchOrder callback`                                    | `sales_orders` + 4 autres tables  | IMPORTANT | Migrer vers `useQuery` React Query                             |

**Cas particulier — webhooks/page.tsx** :

```typescript
// Boucle séquentielle ligne 88-91 — CRITIQUE
for (const webhook of data) {
  await loadRecentLogs(webhook.id); // N requêtes séquentielles !
}
// Fix: await Promise.all(data.map(w => loadRecentLogs(w.id)));
```

---

## Recommandations Prioritaires

### CRITIQUE (traiter dans la semaine)

1. **`use-customers.ts` : 4x select('\*')** — Hook appelé partout dans le back-office sur des tables volumineuses (`individual_customers`, `organisations`). Sélectionner uniquement les colonnes nécessaires.

2. **`use-storage-requests-admin.ts` : polling 60s + select('\*')** — Double problème. Une requête volumineuse toutes les 60 secondes. Remplacer par Realtime subscription + sélection explicite.

3. **`details/page.tsx` : 5 requêtes séquentielles** — Paralléliser requêtes 2+3+4 avec `Promise.all` après la requête principale.

4. **`use-database-notifications.ts` : 4x getUser()** — Hook de notifications chargé au démarrage. 4 appels `getUser()` inutiles. Mémoriser dans un `useRef` ou React Query.

5. **`use-sales-orders.ts` : 5x getUser()** — Hook critique du workflow commandes. Utiliser `useCurrentUser()` disponible dans `@verone/utils`.

6. **`webhooks/page.tsx` : boucle for séquentielle** — `N` appels réseau séquentiels pour charger les logs. Remplacer par `Promise.all`.

### IMPORTANT (traiter dans le mois)

7. **6 hooks Google Merchant : void invalidateQueries** — Passer les `onSuccess` en async + await Promise.all pour éviter les états stale après mutation.

8. **`use-site-internet-categories.ts` et `use-site-internet-collections.ts`** — 2 hooks avec select('\*') appelés à chaque navigation sur les pages site-internet.

9. **6 pages parametres : pattern legacy useState+useEffect** — Migrer vers React Query pour bénéficier du cache, de la deduplication et des retry automatiques.

10. **`use-linkme-enseignes.ts` : select('\*') sur table à 87.8% seq_scan** — Sélection explicite urgente car aggrave les scans séquentiels.

11. **`use-movements-history.ts` : select('\*') sur table à 93.1% seq_scan** — Idem.

### SUGGESTION (traiter si temps disponible)

12. Découper les composants > 2000 lignes (OrderFormUnified 3596L, commandes/[id]/page.tsx 3127L) en sous-composants avec `React.memo`.

13. `use-stock-alerts-count.ts` : harmoniser l'intervalle à 60s comme les autres hooks de notifications (actuellement 30s).

14. Ajouter `useCurrentUser()` de `@verone/utils` dans les hooks stock (`use-stock-core.ts`, `use-stock-reservations.ts`) pour éviter les appels getUser() répétés.
