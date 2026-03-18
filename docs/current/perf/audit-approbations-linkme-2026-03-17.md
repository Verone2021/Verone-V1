# Audit Performance — Pages Approbations & Commandes LinkMe

**Date** : 2026-03-17
**Mode** : AUDIT (read-only)
**Scope** : `canaux-vente/linkme/approbations` + `canaux-vente/linkme/commandes/[id]`
**Analysé par** : perf-optimizer agent

---

## Résumé Exécutif

| Catégorie                        | Problèmes trouvés                                | Sévérité max |
| -------------------------------- | ------------------------------------------------ | ------------ |
| Requêtes au chargement (sidebar) | 10 hooks indépendants = **20 requêtes réseau**   | CRITIQUE     |
| N+1 détecté sur page commande    | 5 requêtes séquentielles au lieu de 1-2          | CRITIQUE     |
| select('\*') sur vue enrichie    | 1 occurrence confirmée                           | IMPORTANT    |
| Polling + Realtime cumulés       | 10 hooks avec `setInterval(30s)` + WebSocket     | IMPORTANT    |
| Absence de React.memo/useMemo    | ApprobationsClient ~2100 lignes sans memoization | IMPORTANT    |
| Double fetch organisations       | Approbations : requête dupliquée possible        | MOYEN        |

**Estimation temps de chargement perdu** : 600-900ms sur la page approbations uniquement à cause de la sidebar. La page commandes [id] ajoute 4-5 requêtes séquentielles supplémentaires.

---

## 1. Sidebar : 10 Hooks = 20 Requêtes Réseau au Chargement

### Analyse

Le composant `SidebarContent` dans `apps/back-office/src/components/layout/app-sidebar.tsx` (lignes 376-388) monte **10 hooks de count simultanément** à chaque navigation :

```typescript
// app-sidebar.tsx lignes 376-388 — 10 hooks, tous montés en même temps
const { count: stockAlertsCount } = useStockAlertsCount();
const { count: consultationsCount } = useConsultationsCount();
const { count: linkmePendingCount } = useLinkmePendingCount();
const { count: productsIncompleteCount } = useProductsIncompleteCount();
const { count: ordersPendingCount } = useOrdersPendingCount();
const { count: expeditionsPendingCount } = useExpeditionsPendingCount();
const { count: transactionsUnreconciledCount } =
  useTransactionsUnreconciledCount();
const { count: linkmeApprovalsCount } = useLinkmeApprovalsCount();
const { count: formSubmissionsCount } = useFormSubmissionsCount();
const { count: linkmeMissingInfoCount } = useLinkmeMissingInfoCount();
```

### Problème n°1 : Double appel `supabase.auth.getUser()` par hook

Chaque hook appelle `supabase.auth.getUser()` **deux fois** au montage :

1. Une fois dans `fetchCount()` (la vraie requête)
2. Une fois dans `setupSubscriptions()` (vérification auth avant Realtime)

Soit **20 appels `auth.getUser()`** au chargement de n'importe quelle page. Chaque appel `auth.getUser()` fait une requête réseau vers Supabase Auth.

### Problème n°2 : Polling + Realtime cumulés

Chaque hook active **simultanément** :

- 1 WebSocket Supabase Realtime (subscription `postgres_changes`)
- 1 `setInterval` de polling toutes les 30 secondes (fallback)

Le code de `setupSubscriptions` présente un bug logique :

```typescript
// Condition toujours vraie si refetchInterval > 0
if (!enableRealtime || refetchInterval > 0) {  // ← refetchInterval = 30000 par défaut
  intervalRef.current = setInterval(...)
}
```

Résultat : le polling se déclenche **même quand Realtime est actif**. Les 10 hooks génèrent donc 10 intervalles de polling simultanés + 10 WebSocket channels. Toutes les 30 secondes, 10 requêtes partent en même temps.

### Problème n°3 : Tables `sales_orders` écoutées 3 fois en parallèle

Trois hooks distincts subscribent à la **même table** `sales_orders` sur des channels différents :

- `useLinkmePendingCount` → channel `'linkme-orders-changes'`
- `useLinkmeApprovalsCount` → channel `'linkme-approvals-changes'`
- `useOrdersPendingCount` → channel `'orders-pending-changes'`
- `useExpeditionsPendingCount` → channel `'expeditions-pending-changes'`

4 WebSocket channels sur la même table = 4x les events Realtime reçus = 4x les refetchs déclenchés sur chaque changement de `sales_orders`.

### Décompte exact des requêtes réseau au chargement

| Hook                             | auth.getUser() (setup) | auth.getUser() (fetch) | Requête count | Realtime channel |
| -------------------------------- | ---------------------- | ---------------------- | ------------- | ---------------- |
| useStockAlertsCount              | 1                      | 1                      | 1 RPC         | 1 WS             |
| useConsultationsCount            | 1                      | 1                      | 1 count       | 1 WS             |
| useLinkmePendingCount            | 1                      | 1                      | 1 count       | 1 WS             |
| useProductsIncompleteCount       | 1                      | 1                      | 1 count       | 1 WS             |
| useOrdersPendingCount            | 1                      | 1                      | 1 count       | 1 WS             |
| useExpeditionsPendingCount       | 1                      | 1                      | 1 count       | 1 WS             |
| useTransactionsUnreconciledCount | 1                      | 1                      | 1 count       | 1 WS             |
| useLinkmeApprovalsCount          | 1                      | 1                      | 1 count       | 1 WS             |
| useFormSubmissionsCount          | 1                      | 1                      | 1 count       | 1 WS             |
| useLinkmeMissingInfoCount        | 1                      | 1                      | 1 count       | 1 WS             |
| **TOTAL**                        | **10**                 | **10**                 | **10**        | **10**           |

**Total réseau au premier chargement : 30 requêtes** (20 auth + 10 counts).
**Toutes les 30s : 10 requêtes** (polling background).
**Sur un changement `sales_orders` : 4 refetchs** potentiels simultanés.

---

## 2. Page Commandes [id] : 5 Requêtes Séquentielles (N+1)

### Analyse de `fetchOrder()` dans `details/page.tsx`

La fonction `fetchOrder` (lignes 342-596) enchaîne **5 requêtes séquentielles** au lieu de les paralléliser ou de les consolider :

**Requête 1** — Commande principale avec relations (lignes 349-402)

```typescript
supabase
  .from('sales_orders')
  .select(`...sales_order_linkme_details...sales_order_items...`);
```

C'est correct, 1 requête avec JOIN imbriqués.

**Requête 2** — Organisation en doublon (lignes 407-416)

```typescript
// PROBLÈME : les données organisations sont DÉJÀ dans la requête 1 (ligne 368-374)
// via : organisations!sales_orders_customer_id_fkey(...)
// Pourtant une 2ème requête est faite ici :
if (orderData.customer_type === 'organization' && orderData.customer_id) {
  const { data: orgData } = await supabase.from('organisations').select(...).eq('id', ...).single();
}
```

La requête 1 inclut déjà `organisations!sales_orders_customer_id_fkey(...)` avec exactement les mêmes colonnes. Cette **2ème requête est totalement redondante**.

**Requête 3** — user_profiles pour `created_by` (lignes 434-443)

```typescript
if (createdByUserId) {
  const { data: profileData } = await supabase.from('user_profiles').select('first_name, last_name, email').eq('user_id', ...).single();
}
```

Fait séquentiellement après les requêtes 1 et 2. Pourrait être une relation JOIN dans la requête 1 via `created_by:user_profiles(first_name, last_name, email)`.

**Requête 4** — Rapprochement bancaire (lignes 453-480)

```typescript
const { data: linkData } = await supabase.from('transaction_document_links').select(...).eq('sales_order_id', orderId).limit(1);
```

Séquentielle. Pourrait être parallélisée avec requête 3 via `Promise.all`.

**Requête 5** — Vue enrichie `linkme_order_items_enriched` (lignes 547-550)

```typescript
const { data: enrichedData } = await supabase
  .from('linkme_order_items_enriched')
  .select('*')
  .eq('sales_order_id', orderId);
```

**Double problème** :

- `select('*')` sur une vue enrichie = overfetch (toutes les colonnes de la vue)
- Séquentielle après le `setOrder()`, donc bloque l'affichage des items enrichis

**Requête 6** — Products pour `created_by_affiliate` (lignes 557-559)

```typescript
const { data: productsData } = await supabase
  .from('products')
  .select('id, created_by_affiliate')
  .in('id', productIds);
```

Correcte (batch), mais séquentielle après la requête 5.

### Timeline réelle des requêtes sur `commandes/[id]`

```
t=0ms    → auth.getUser() (handleStatusChange)
t=0ms    → Requête 1 : sales_orders + joins (300-500ms estimé)
t=~400ms → Requête 2 : organisations (REDONDANTE, ~100ms)
t=~400ms → Requête 3 : user_profiles (~100ms)  [séquentiel avec 2 !]
t=~500ms → Requête 4 : transaction_document_links (~100ms)
t=~550ms → setOrder() → premier render
t=~550ms → Requête 5 : linkme_order_items_enriched select('*') (~200ms)
t=~750ms → Requête 6 : products (~100ms)
t=~850ms → setEnrichedItems() → render final
```

**Total estimé : 850ms+ avant que la page soit complète**, dont ~200ms évitables.

---

## 3. Page Approbations : useAllLinkMeOrders sans staleTime adapté

### Analyse de `useAllLinkMeOrders` (lignes 1241-1510)

```typescript
export function useAllLinkMeOrders(status?: OrderValidationStatus) {
  return useQuery({
    queryKey: ['linkme-orders', status],
    queryFn: async (): Promise<PendingOrder[]> => { ... },
    staleTime: 300_000,  // 5 minutes — OK
  });
}
```

Le `staleTime: 300_000` (5 minutes) est correct pour cette donnée. Mais la page `ApprobationsClient.tsx` appelle ce hook **3 fois** (une par onglet : pending, approved, rejected), ce qui génère **3 requêtes distinctes** au premier chargement des onglets.

La requête `useAllLinkMeOrders` fait elle-même un batch côté JS (organisations récupérées en 1 seule requête), ce qui est bien. Mais chaque appel inclut `product_images!left(...)` pour chaque item = potentiellement lourd si beaucoup de commandes.

### Problème : `usePendingOrdersCount` en doublon sur la page

```typescript
// ApprobationsClient.tsx importe ces deux hooks :
usePendingOrdersCount(); // queryKey: ['pending-orders-count'] — staleTime: 2min
useAllLinkMeOrders(); // queryKey: ['linkme-orders', status]
```

`usePendingOrdersCount` fait une requête séparée pour le count alors que `useAllLinkMeOrders` retourne déjà toutes les commandes. Le count peut être calculé côté client depuis les données déjà chargées.

---

## 4. Absence de Memoization sur ApprobationsClient.tsx (~2100 lignes)

Le fichier fait 2100 lignes et est un seul composant `'use client'`. D'après l'aperçu lu, il contient :

- Des filtres locaux (`useState`) appliqués sur la liste complète à chaque render
- Des calculs de validation (`getOrderMissingFields`) potentiellement appelés en boucle
- Des dialogs d'action (approve/reject/request-info) intégrés inline

**Patterns problématiques attendus** (non confirmés ligne par ligne car fichier tronqué) :

- Filtrage de liste sans `useMemo` → recalcul à chaque setState
- `getOrderMissingFields` appelée sans `useMemo` dans le rendu de liste
- Composants de dialog non séparés → re-render de la liste entière quand dialog s'ouvre

---

## 5. Récapitulatif des Requêtes au Chargement

### Page `/canaux-vente/linkme/approbations` (premier chargement)

| Source                        | Requêtes                                 | Type | Parallèle/Séquentiel     |
| ----------------------------- | ---------------------------------------- | ---- | ------------------------ |
| Sidebar (10 hooks)            | 20 auth.getUser + 10 counts              | HTTP | Parallèle                |
| useAllLinkMeOrders('pending') | 1 sales_orders + 1 organisations (batch) | HTTP | Séquentiel interne       |
| usePendingOrdersCount         | 1 count sales_orders                     | HTTP | Parallèle avec ci-dessus |
| Sidebar Realtime              | 10 WebSocket channels                    | WS   | Simultanés               |
| **Total HTTP**                | **~33 requêtes**                         |      |                          |
| **Total WebSocket**           | **10 channels**                          |      |                          |

### Page `/canaux-vente/linkme/commandes/[id]` (premier chargement)

| Source                   | Requêtes                                   | Type | Parallèle/Séquentiel      |
| ------------------------ | ------------------------------------------ | ---- | ------------------------- |
| Sidebar (10 hooks)       | 30 (idem ci-dessus)                        | HTTP | Parallèle                 |
| fetchOrder() - Requête 1 | 1 sales_orders + joins                     | HTTP | Séquentiel                |
| fetchOrder() - Requête 2 | 1 organisations (REDONDANT)                | HTTP | Séquentiel                |
| fetchOrder() - Requête 3 | 1 user_profiles                            | HTTP | Séquentiel                |
| fetchOrder() - Requête 4 | 1 transaction_document_links               | HTTP | Séquentiel                |
| fetchOrder() - Requête 5 | 1 linkme_order_items_enriched select('\*') | HTTP | Séquentiel                |
| fetchOrder() - Requête 6 | 1 products                                 | HTTP | Séquentiel                |
| useOrderHistory(orderId) | 1+ requête                                 | HTTP | Parallèle avec fetchOrder |
| **Total HTTP**           | **~38+ requêtes**                          |      |                           |

---

## Recommandations Prioritaires

### 1. CRITIQUE — Corriger le bug polling + Realtime dans tous les hooks de sidebar

**Fichiers** : tous les hooks dans `packages/@verone/notifications/src/hooks/`

Le bug : `if (!enableRealtime || refetchInterval > 0)` démarre le polling même quand Realtime est actif. La condition correcte est `if (!enableRealtime && refetchInterval > 0)`.

```typescript
// AVANT (bug) — polling se déclenche TOUJOURS si refetchInterval > 0
if (!enableRealtime || refetchInterval > 0) {
  intervalRef.current = setInterval(...)
}

// APRES (correct) — polling seulement si Realtime désactivé
if (!enableRealtime && refetchInterval > 0) {
  intervalRef.current = setInterval(...)
}
```

**Impact** : Élimine 10 intervalles `setInterval` simultanés. Réduit les requêtes background de 10 toutes les 30s à 0 (tant que Realtime est connecté).

---

### 2. CRITIQUE — Supprimer la requête organisations redondante dans `details/page.tsx`

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/page.tsx` lignes 407-416

La requête `supabase.from('organisations')` à la ligne 407 est inutile car les données sont déjà dans `orderData` via le JOIN de la requête 1 (lignes 368-374). Il suffit de lire `orderData.organisations` directement.

**Impact** : -1 requête séquentielle (~100ms) sur chaque chargement de page commande.

---

### 3. CRITIQUE — Paralléliser user_profiles et transaction_document_links

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/page.tsx` lignes 434-480

```typescript
// AVANT — 2 requêtes séquentielles
const profileData = await supabase.from('user_profiles')...
const linkData    = await supabase.from('transaction_document_links')...

// APRES — 2 requêtes parallèles
const [profileResult, linkResult] = await Promise.all([
  supabase.from('user_profiles').select('first_name, last_name, email').eq('user_id', createdByUserId).single(),
  supabase.from('transaction_document_links').select('...')...
]);
```

**Impact** : -100ms (une des 2 requêtes disparaît du chemin critique).

---

### 4. IMPORTANT — Remplacer `select('*')` sur `linkme_order_items_enriched`

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/page.tsx` ligne 549

```typescript
// AVANT
.from('linkme_order_items_enriched').select('*')

// APRES — sélectionner uniquement les colonnes utilisées
.from('linkme_order_items_enriched').select(`
  id, product_id, product_name, product_sku, product_image_url,
  quantity, unit_price_ht, total_ht, base_price_ht,
  margin_rate, commission_rate, selling_price_ht,
  affiliate_margin, retrocession_rate
`)
```

La vue `linkme_order_items_enriched` est une vue enrichie (SECURITY DEFINER, déjà identifiée comme problématique dans l'audit 2026-03-11). `select('*')` ramène potentiellement des colonnes calculées coûteuses inutilisées.

---

### 5. IMPORTANT — Consolider les 10 hooks sidebar en 1 hook agrégé

**Concept** : Remplacer les 10 hooks indépendants par un seul hook `useSidebarCounts` qui :

1. Fait **1 seul** appel `supabase.auth.getUser()`
2. Lance les 10 requêtes count en `Promise.all` (parallèle)
3. Maintient **1 seul** canal Realtime par table concernée (au lieu de 4 pour `sales_orders`)
4. Utilise React Query pour le cache partagé

```typescript
// Concept
export function useSidebarCounts() {
  return useQuery({
    queryKey: ['sidebar-counts'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser(); // 1 seul appel
      if (!user) return defaultCounts;

      const [stockAlerts, consultations, linkme, ...] = await Promise.all([
        supabase.rpc('get_stock_alerts_count'),
        supabase.from('client_consultations').select('id', { count: 'exact', head: true })...,
        // ... 8 autres
      ]);

      return { stockAlerts: stockAlerts.data, consultations: consultations.count, ... };
    },
    staleTime: 30_000, // 30s
    refetchInterval: 30_000,
  });
}
```

**Impact** : 30 requêtes HTTP → 1+10 requêtes parallèles. Temps de chargement réduit de ~600ms à ~150ms pour la sidebar.

Attention : cette refactorisation est significative. À faire après correction du bug polling (recommandation n°1).

---

### 6. IMPORTANT — Supprimer `usePendingOrdersCount` de la page Approbations

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/approbations/ApprobationsClient.tsx`

`usePendingOrdersCount` retourne un count que `useAllLinkMeOrders('pending')` permet déjà de calculer via `.length`. Éliminer la requête redondante.

---

### 7. SUGGESTION — Ajouter `user_profiles` comme JOIN dans la requête principale

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/page.tsx`

```typescript
// Dans le select de la requête 1 (ligne 352), ajouter :
created_by_profile:user_profiles!sales_orders_created_by_fkey (
  first_name, last_name, email
)
```

Cela éliminerait la requête 3 séparée sur `user_profiles`. Vérifier que la FK `sales_orders.created_by → user_profiles.user_id` existe bien avant d'appliquer.

---

## Fichiers Concernés

| Fichier                                                                                        | Problème                                                               | Priorité                    |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------- |
| `packages/@verone/notifications/src/hooks/use-linkme-pending-count.ts`                         | Bug polling + Realtime                                                 | CRITIQUE                    |
| `packages/@verone/notifications/src/hooks/use-linkme-approvals-count.ts`                       | Bug polling + Realtime                                                 | CRITIQUE                    |
| `packages/@verone/notifications/src/hooks/use-linkme-missing-info-count.ts`                    | Bug polling + Realtime                                                 | CRITIQUE                    |
| `packages/@verone/notifications/src/hooks/use-orders-pending-count.ts`                         | Bug polling + Realtime + table sales_orders x4                         | CRITIQUE                    |
| `packages/@verone/notifications/src/hooks/use-expeditions-pending-count.ts`                    | Bug polling + Realtime + table sales_orders x4                         | CRITIQUE                    |
| `packages/@verone/notifications/src/hooks/use-stock-alerts-count.ts`                           | Bug polling + Realtime                                                 | CRITIQUE                    |
| `packages/@verone/notifications/src/hooks/use-transactions-unreconciled-count.ts`              | Bug polling + Realtime                                                 | CRITIQUE                    |
| `packages/@verone/notifications/src/hooks/use-consultations-count.ts`                          | Bug polling + Realtime                                                 | CRITIQUE                    |
| `packages/@verone/notifications/src/hooks/use-products-incomplete-count.ts`                    | Bug polling + Realtime                                                 | CRITIQUE                    |
| `packages/@verone/notifications/src/hooks/use-form-submissions-count.ts`                       | Bug polling + Realtime                                                 | CRITIQUE                    |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/page.tsx`     | Requête organisations redondante, requêtes séquentielles, select('\*') | CRITIQUE                    |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/approbations/ApprobationsClient.tsx` | usePendingOrdersCount redondant                                        | IMPORTANT                   |
| `apps/back-office/src/components/layout/app-sidebar.tsx`                                       | 10 hooks indépendants = 30 requêtes                                    | IMPORTANT (après fix hooks) |

---

_Rapport généré en MODE AUDIT. Aucune modification de code effectuée._
_Pour appliquer les corrections : demander MODE FIX à Romeo._
