# Audit Performance Back-Office — 2026-03-17

**Mode** : AUDIT read-only — aucun fichier modifié
**Scope** : apps/back-office + packages/@verone/ (tous les domaines)
**Auditeur** : perf-optimizer agent
**Référence précédente** : `audit-back-office-2026-03-11.md`

---

## Résumé Exécutif

| Catégorie                               | Problèmes                    | Critiques | Importants |
| --------------------------------------- | ---------------------------- | --------- | ---------- |
| select('\*') back-office                | 38 occurrences               | 4         | 34         |
| select('\*') packages @verone           | 25 occurrences               | 3         | 22         |
| Bug polling + Realtime cumulés          | 10 hooks                     | 10        | 0          |
| auth.getUser() côté client              | 25 occurrences/notifications | 10        | 15         |
| invalidateQueries void (sans await)     | 2 occurrences                | 0         | 2          |
| Composants monolithiques (>1000 lignes) | 10 fichiers                  | 3         | 7          |
| refetchInterval sans Realtime guard     | 5 hooks                      | 2         | 3          |
| Dépendances non utilisées               | 2 packages                   | 1         | 1          |

**Estimation impact total** : 20-30 requêtes HTTP supplémentaires par chargement de page (sidebar) + 10 requêtes toutes les 30s en background (polling+realtime cumulés).

---

## 1. Requêtes Supabase : select('\*') — Overfetch

### 1.1 Back-Office app (38 occurrences)

#### CRITIQUE — Hooks appelés en boucle ou sur vues enrichies

| Fichier                                                                             | Ligne   | Table                         | Impact                                      |
| ----------------------------------------------------------------------------------- | ------- | ----------------------------- | ------------------------------------------- |
| `app/(protected)/canaux-vente/linkme/commandes/[id]/details/page.tsx`               | 549     | `linkme_order_items_enriched` | Vue SECURITY DEFINER — overfetch maximal    |
| `app/(protected)/canaux-vente/linkme/commandes/[id]/page.tsx`                       | 604     | Inconnue                      | Composant 3127 lignes — critique            |
| `app/(protected)/canaux-vente/site-internet/hooks/use-site-internet-categories.ts`  | 19, 151 | `site_internet_categories`    | Hook réutilisé partout sur le site internet |
| `app/(protected)/canaux-vente/site-internet/hooks/use-site-internet-collections.ts` | 19, 260 | `site_internet_collections`   | Idem                                        |

**Recommandation** : Remplacer par des colonnes explicites. La vue `linkme_order_items_enriched` (SECURITY DEFINER) est particulièrement coûteuse.

#### IMPORTANT — Pages client (Server Components)

| Fichier                                                                      | Ligne    | Table                        | Impact                              |
| ---------------------------------------------------------------------------- | -------- | ---------------------------- | ----------------------------------- |
| `app/(protected)/contacts-organisations/customers/page.tsx`                  | 254      | `contacts`                   | Charge tous les champs d'un contact |
| `app/(protected)/contacts-organisations/partners/page.tsx`                   | 173      | `contacts`                   | Idem                                |
| `app/(protected)/contacts-organisations/suppliers/page.tsx`                  | 128      | `contacts`                   | Idem                                |
| `app/(protected)/organisation/components/customers-tab.tsx`                  | 78       | `contacts`                   | Composant tab — chargé souvent      |
| `app/(protected)/organisation/components/suppliers-tab.tsx`                  | 52       | `contacts`                   | Idem                                |
| `app/(protected)/organisation/components/partners-tab.tsx`                   | 53       | `contacts`                   | Idem                                |
| `app/(protected)/messages/components/payment-notifications-tab.tsx`          | 137      | Inconnue                     | Tab messages                        |
| `app/(protected)/profile/page.tsx`                                           | 99, 244  | `user_profiles`              | 2 select('\*') sur la même page     |
| `app/(protected)/prises-contact/[id]/page.tsx`                               | 117, 136 | Formulaire                   | 2 select('\*') sur la même page     |
| `app/(protected)/parametres/webhooks/page.tsx`                               | 57, 76   | `webhooks`                   | 2 select('\*') sur la même page     |
| `app/(protected)/parametres/emails/page.tsx`                                 | 47       | `email_templates`            | Page paramètres                     |
| `app/(protected)/parametres/emails/[slug]/edit/page.tsx`                     | 62       | `email_templates`            | Page édition                        |
| `app/(protected)/parametres/emails/[slug]/preview/page.tsx`                  | 49       | `email_templates`            | Page preview                        |
| `app/(protected)/admin/users/[id]/page.tsx`                                  | 102      | `users`                      | Page admin                          |
| `app/(protected)/canaux-vente/prix-clients/page.tsx`                         | 98       | `channel_pricing`            | Table pricing                       |
| `app/(protected)/finance/depenses/[id]/page.tsx`                             | 121      | `expenses`                   | Page détail                         |
| `app/(protected)/canaux-vente/linkme/hooks/use-linkme-storage.ts`            | 450      | `affiliate_storage`          | Hook storage                        |
| `app/(protected)/canaux-vente/linkme/hooks/use-organisation-addresses-bo.ts` | 95       | `addresses`                  | Hook adresses                       |
| `app/(protected)/canaux-vente/linkme/hooks/use-storage-requests-admin.ts`    | 55       | `affiliate_storage_requests` | Hook admin                          |

#### IMPORTANT — Route Handlers API

| Fichier                                          | Ligne    | Table                 |
| ------------------------------------------------ | -------- | --------------------- |
| `app/api/qonto/invoices/service/route.ts`        | 113, 136 | `financial_documents` |
| `app/api/qonto/quotes/service/route.ts`          | 103, 119 | `financial_documents` |
| `app/api/quotes/[id]/push-to-qonto/route.ts`     | 154, 164 | `financial_documents` |
| `app/api/exports/google-merchant-excel/route.ts` | 396      | Produits              |
| `app/api/admin/users/[id]/activity/route.ts`     | 90       | `user_activity_logs`  |
| `app/actions/user-management.ts`                 | 481      | `user_app_roles`      |

### 1.2 Packages @verone (25 occurrences)

| Fichier                                                                                 | Ligne             | Table                       | Impact                                      |
| --------------------------------------------------------------------------------------- | ----------------- | --------------------------- | ------------------------------------------- |
| `packages/@verone/customers/src/hooks/use-customers.ts`                                 | 86, 138, 203, 231 | `customers`                 | 4 occurrences dans le même hook             |
| `packages/@verone/customers/src/hooks/use-customer-samples.ts`                          | 122               | `product_samples`           | Hook samples                                |
| `packages/@verone/customers/src/components/sections/OrganisationContactsManager.tsx`    | 61                | `contacts`                  | Composant contacts                          |
| `packages/@verone/finance/src/hooks/use-expenses.ts`                                    | 129               | `expenses`                  | Hook finance                                |
| `packages/@verone/finance/src/hooks/use-pricing.ts`                                     | 284, 418          | `channel_pricing`           | 2 occurrences pricing                       |
| `packages/@verone/finance/src/hooks/use-bank-transaction-stats.ts`                      | 224               | `bank_transactions`         | Stats transactions                          |
| `packages/@verone/finance/src/hooks/use-missing-invoices.ts`                            | 86                | `financial_documents`       | Factures manquantes                         |
| `packages/@verone/finance/src/hooks/use-pcg-categories.ts`                              | 74                | `pcg_categories`            | Table de ref — acceptable mais optimisable  |
| `packages/@verone/finance/src/hooks/use-unique-labels.ts`                               | 48                | `bank_transactions`         | Labels — potentiellement grande table       |
| `packages/@verone/orders/src/hooks/use-draft-purchase-order.ts`                         | 87                | `purchase_orders`           | Commandes achat                             |
| `packages/@verone/orders/src/hooks/use-sample-order.ts`                                 | 79                | `purchase_orders`           | Commandes échantillons                      |
| `packages/@verone/orders/src/hooks/linkme/use-linkme-enseignes.ts`                      | 70                | `enseignes`                 | Hook enseignes                              |
| `packages/@verone/orders/src/hooks/linkme/use-organisation-addresses-bo.ts`             | 95                | `addresses`                 | Dupliqué avec la version app/               |
| `packages/@verone/orders/src/hooks/linkme/use-linkme-order-actions.ts`                  | 119               | `sales_orders`              | Actions commandes                           |
| `packages/@verone/stock/src/hooks/use-stock-alerts.ts`                                  | 89                | `stock_alerts_unified_view` | Vue — overfetch sur vue                     |
| `packages/@verone/stock/src/hooks/use-movements-history.ts`                             | 566               | `stock_movements`           | Table 93.1% seq_scan                        |
| `packages/@verone/products/src/components/wizards/CompleteProductWizard.tsx`            | 184               | `products`                  | Wizard produit                              |
| `packages/@verone/utils/src/supabase/dal.ts`                                            | 141               | DAL générique               | select('\*') dans la couche d'accès données |
| `packages/@verone/notifications/src/components/dropdowns/StockAlertsDropdown.tsx`       | 208               | `stock_alerts_unified_view` | Vue — mais limité (`.limit(maxItems)`)      |
| `packages/@verone/organisations/src/components/forms/organisation-contacts-manager.tsx` | 52                | `contacts`                  | Gestion contacts                            |

---

## 2. Bug Critique : Polling + Realtime Cumulés

**Confirmé** : 10 hooks dans `packages/@verone/notifications/src/hooks/` ont un bug logique.

### Localisation du bug (ligne identique dans les 10 fichiers)

```typescript
// LIGNE FAUTIVE — condition OR au lieu de AND
if (!enableRealtime || refetchInterval > 0) {
  intervalRef.current = setInterval(() => {
    fetchCount();
  }, refetchInterval);
}
```

**Analyse** : La condition `!enableRealtime || refetchInterval > 0` est vraie dès que `refetchInterval > 0` (qui vaut 30000 par défaut), même quand `enableRealtime = true`. Résultat : le `setInterval(30s)` est **toujours** activé, y compris quand Realtime est connecté.

### Fichiers concernés (10/10 hooks)

| Fichier                                  | Ligne fautive |
| ---------------------------------------- | ------------- |
| `use-stock-alerts-count.ts`              | 157           |
| `use-linkme-pending-count.ts`            | 236           |
| `use-orders-pending-count.ts`            | 195           |
| `use-expeditions-pending-count.ts`       | 182           |
| `use-products-incomplete-count.ts`       | 181           |
| `use-linkme-approvals-count.ts`          | 181           |
| `use-consultations-count.ts`             | 227           |
| `use-transactions-unreconciled-count.ts` | 170           |
| `use-form-submissions-count.ts`          | 186           |
| `use-linkme-missing-info-count.ts`       | 128           |

**Impact** : Ces 10 hooks sont montés dans `app-sidebar.tsx` au chargement de toute page protégée → 10 intervalles actifs simultanément → **10 requêtes HTTP toutes les 30 secondes en background**, même quand Realtime est opérationnel.

**Fix** : Changer `||` en `&&` dans chaque fichier.

```typescript
// CORRECT
if (!enableRealtime && refetchInterval > 0) {
  // Polling seulement si Realtime désactivé
}
```

---

## 3. auth.getUser() — HTTP Calls Excessifs

`supabase.auth.getUser()` effectue **un appel HTTP** à chaque invocation (pas de cache local). Il est utilisé dans 25 hooks et server actions dans le package notifications seul.

### Hooks notifications (25 appels HTTP par chargement de sidebar)

Chaque hook compte-notification appelle `auth.getUser()` **deux fois** : une fois dans `fetchCount()` + une fois dans `setupSubscriptions()`.

```
10 hooks × 2 appels = 20 appels auth.getUser() au chargement de la sidebar
+ useDatabaseNotifications (3 appels supplémentaires)
= ~25 appels auth.getUser() par montage de sidebar
```

| Fichier                                  | Appels getUser() |
| ---------------------------------------- | ---------------- |
| `use-database-notifications.ts`          | 4                |
| `use-stock-alerts-count.ts`              | 2                |
| `use-linkme-pending-count.ts`            | 2                |
| `use-orders-pending-count.ts`            | 2                |
| `use-expeditions-pending-count.ts`       | 2                |
| `use-consultations-count.ts`             | 2                |
| `use-linkme-approvals-count.ts`          | 2                |
| `use-products-incomplete-count.ts`       | 2                |
| `use-transactions-unreconciled-count.ts` | 2 (probable)     |
| `use-form-submissions-count.ts`          | 2 (probable)     |
| `use-linkme-missing-info-count.ts`       | 2                |
| `use-user-activity-tracker.ts`           | 1                |

**Recommandation** : Créer un `AuthProvider` qui expose le user via context. Les hooks notifications utilisent `useAuth()` au lieu de `supabase.auth.getUser()`. Zéro HTTP call supplémentaire.

### Back-Office app — getUser() dans les mutations

`commandes/fournisseurs/page.tsx` appelle `supabase.auth.getUser()` **4 fois** dans le même composant (lignes 616, 666, 718, 801) — dans 4 handlers différents. Chaque action utilisateur = 1 HTTP call inutile.

---

## 4. invalidateQueries void (sans await)

**Problème** : `void queryClient.invalidateQueries(...)` (sans await) — l'UI peut se mettre à jour avant que le cache soit invalidé, causant des données stale.

| Fichier                                                                      | Ligne | Impact                                     |
| ---------------------------------------------------------------------------- | ----- | ------------------------------------------ |
| `app/(protected)/canaux-vente/linkme/hooks/use-linkme-page-config.ts`        | 215   | Config page — données stale après mutation |
| `app/(protected)/canaux-vente/linkme/hooks/use-organisation-addresses-bo.ts` | 201   | Adresses org — données stale               |

**Note** : Ces 2 occurrences persistent depuis l'audit du 2026-03-11. Le reste du codebase utilise correctement `await`.

---

## 5. refetchInterval Sans Guard Realtime

5 hooks React Query avec `refetchInterval` activé **sans vérifier si Realtime est connecté** :

| Fichier                         | Intervalle | Table                                         |
| ------------------------------- | ---------- | --------------------------------------------- |
| `use-archive-notifications.ts`  | 5 min      | `notifications`                               |
| `use-vercel-analytics.ts`       | 5 min      | API Vercel externe — acceptable               |
| `use-linkme-dashboard.ts`       | 2 min      | `linkme_orders_enriched` vue SECURITY DEFINER |
| `use-storage-requests-admin.ts` | 1 min      | `affiliate_storage_requests`                  |
| `use-payment-requests-admin.ts` | 1 min      | `linkme_payment_requests`                     |
| `use-product-approvals.ts`      | 1 min      | `product_drafts`                              |
| `use-organisation-approvals.ts` | 1 min      | `organisations`                               |

**Cas CRITIQUE** : `use-linkme-dashboard.ts` (2 min) poll la vue `linkme_orders_enriched` qui est SECURITY DEFINER — chaque requête = accès via vue contournant RLS.

**Recommandation** : Si Realtime est disponible sur ces tables, remplacer les polling par des subscriptions. Sinon, augmenter l'intervalle à 5-10 min minimum.

---

## 6. Composants Monolithiques (> 1000 lignes)

| Fichier                                 | Lignes | Problèmes                                                      |
| --------------------------------------- | ------ | -------------------------------------------------------------- |
| `commandes/[id]/page.tsx`               | 3127   | CRITIQUE — 1 seul fichier pour tout le détail commande         |
| `messages/page.tsx`                     | 2747   | CRITIQUE — 36 hooks, 6 useQuery, 1 getUser() intégré           |
| `commandes/[id]/details/page.tsx`       | 2746   | CRITIQUE — 5 requêtes séquentielles, select('\*') vue enrichie |
| `approbations/ApprobationsClient.tsx`   | 2174   | IMPORTANT — composant client avec logique métier               |
| `components/CreateLinkMeOrderModal.tsx` | 2124   | IMPORTANT — modal complexe                                     |
| `factures/page.tsx`                     | 2070   | IMPORTANT — liste factures avec logique inline                 |
| `hooks/use-linkme-catalog.ts`           | 1899   | IMPORTANT — hook monolithique, 50+ invalidateQueries           |
| `commandes/fournisseurs/page.tsx`       | 1762   | IMPORTANT — 4 getUser() inline                                 |
| `produits/catalogue/page.tsx`           | 1752   | IMPORTANT                                                      |
| `factures/devis/[id]/page.tsx`          | 1748   | IMPORTANT                                                      |

**Impact** : Composants de 2000+ lignes sont impossibles à tester unitairement, forcent le rechargement complet à chaque modification, et empêchent React de faire du code splitting.

---

## 7. N+1 Confirmé — details/page.tsx

La page `commandes/[id]/details/page.tsx` exécute les requêtes suivantes **séquentiellement** :

1. Requête principale `sales_orders` avec JOINs (ligne ~350) — inclut déjà `organisations`
2. **Requête redondante** `organisations` (ligne 408-415) — même données que le JOIN #1
3. Requête `user_profiles` pour `created_by` (ligne 435)
4. Requête `transaction_document_links + bank_transactions` (ligne 453)
5. Requête `linkme_order_items_enriched` select('\*') (ligne 547)
6. Requête `products` pour `created_by_affiliate` (ligne 557)

**Problèmes** :

- Requêtes 3, 4, 5 peuvent être parallélisées avec `Promise.all`
- Requête #2 est entièrement dupliquée (les données sont déjà dans le JOIN #1, ligne 368)

---

## 8. Dépendances Non Utilisées

### maplibre-gl + react-map-gl (~1-2 MB bundle)

**Situation** : Les deux packages sont dans `package.json` back-office mais **aucun composant ne les importe**.

```json
"maplibre-gl": "^4.7.1",   // ~900KB minified
"react-map-gl": "^7.1.9",  // ~200KB minified
```

**Usage trouvé** :

- `app/globals.css:6` : `@import 'maplibre-gl/dist/maplibre-gl.css'` — CSS importé globalement
- `lib/security/headers.ts` : CSP configuré pour MapLibre workers

**Conclusion** : CSS importé globalement mais **aucun composant Map réel** dans `src/`. Les packages sont peut-être une préparation pour une future feature map, mais le CSS global charge ~50KB de styles inutiles sur toutes les pages.

**Recommandation** : Confirmer avec Romeo si la feature map est prévue à court terme. Si non, retirer les deux packages + l'import CSS global.

---

## 9. Hook useSupabaseQuery — Pattern Legacy

`apps/back-office/src/hooks/base/use-supabase-query.ts` est un hook manuel `useState+useEffect` qui **duplique React Query**. Le projet utilise React Query (291 occurrences), ce hook n'est utilisé qu'à **6 endroits**.

**Problèmes** :

- Pas de cache partagé (chaque composant refetch indépendamment)
- Pas de deduplication des requêtes en parallèle
- Pas de staleTime configurable
- Pas de invalidation possible depuis d'autres composants

**Recommandation** : Migrer les 6 usages vers `useQuery` de TanStack Query.

---

## 10. Barrel Exports — Tree-Shaking

370 occurrences de `export * from` dans `packages/@verone/`. Les barrel exports (`index.ts` avec `export * from './x'`) empêchent le tree-shaking car le bundler doit importer tout le module pour résoudre les exports.

**Impact** : Augmentation du bundle size pour les pages qui n'utilisent qu'une fraction des exports.

**Fichiers à risque** :

- `packages/@verone/ui/src/components/ui/index.ts` — exporte tous les composants shadcn
- `packages/@verone/customers/src/index.ts` — exporte hooks + composants
- `packages/@verone/finance/src/hooks/index.ts` — tous les hooks finance

**Note** : Ce pattern est standard pour les design systems. L'impact réel dépend de la qualité du tree-shaking de Next.js. À investiguer avec `@next/bundle-analyzer`.

---

## Recommandations Prioritaires

### CRITIQUE (à traiter immédiatement)

1. **Bug polling + Realtime** : Changer `||` en `&&` ligne 157/236/195/182/181/181/227/170/186/128 dans les 10 hooks notifications. Fix 10 caractères, impact -10 requêtes/30s.

2. **auth.getUser() dans les hooks notifications** : Créer un `AuthContext` partagé — supprimer 25 appels HTTP au chargement de chaque page.

3. **Requête organisations dupliquée** dans `details/page.tsx` ligne 408-415 — les données sont déjà dans le JOIN ligne 368. Supprimer la requête redondante.

4. **select('\*') sur vue SECURITY DEFINER** : `linkme_order_items_enriched` (details/page.tsx:549) et `stock_alerts_unified_view` (notifications). Ces vues bypasse RLS — overfetch sur ces vues est doublement coûteux.

### IMPORTANT (à traiter avant prochaine release)

5. **invalidateQueries void** dans `use-linkme-page-config.ts:215` et `use-organisation-addresses-bo.ts:201` — ajouter `await`.

6. **select('\*') dans les hooks React Query** montés globalement — `use-customers.ts` (4 occurrences), `use-expenses.ts`, `use-pricing.ts` — remplacer par colonnes explicites.

7. **refetchInterval 1-2 min** sur `use-linkme-dashboard.ts` — chaque poll = requête sur vue SECURITY DEFINER. Passer à 5 min ou Realtime.

8. **Parallélisation requêtes** dans `details/page.tsx` — grouper les requêtes 3+4+5 dans un `Promise.all`.

9. **4 getUser() inline** dans `commandes/fournisseurs/page.tsx` — extraire user une seule fois en haut du composant.

### SUGGESTION (optimisations moyen terme)

10. **Retirer maplibre-gl + react-map-gl** si la feature map n'est pas prévue — économie ~1-2 MB bundle.

11. **Migrer useSupabaseQuery** (6 usages) vers `useQuery` TanStack — supprimer code mort + unifier le cache.

12. **Décomposer les composants monolithiques** — `messages/page.tsx` (2747 lignes), `commandes/[id]/page.tsx` (3127 lignes) — en composants séparés avec lazy loading.

13. **Analyser le bundle** avec `ANALYZE=true pnpm --filter @verone/back-office build` pour quantifier l'impact des barrel exports.

---

## Delta vs Audit 2026-03-11

| Problème                 | 2026-03-11      | 2026-03-17           | Evolution      |
| ------------------------ | --------------- | -------------------- | -------------- |
| invalidateQueries void   | 6 occurrences   | 2 occurrences        | Amélioré (-4)  |
| select('\*') back-office | ~55 occurrences | 38 occurrences       | Amélioré (-17) |
| Bug polling+Realtime     | Identifié       | Toujours présent     | Inchangé       |
| auth.getUser() excessif  | Identifié       | Quantifié (25 calls) | Précisé        |
| N+1 details/page.tsx     | Identifié       | Toujours présent     | Inchangé       |
| maplibre-gl non utilisé  | Identifié       | Toujours présent     | Inchangé       |

---

_Rapport généré par perf-optimizer agent — 2026-03-17_
_Mode AUDIT — aucun fichier modifié_
