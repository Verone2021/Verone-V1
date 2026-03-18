# Audit Performance LinkMe — Complet — 2026-03-17

**App** : `apps/linkme` (288 fichiers TypeScript)
**Mode** : AUDIT read-only
**Périmètre** : Tout LinkMe — requêtes Supabase, hooks, re-renders, composants lourds, pages publiques, middleware
**Rapport précédent** : `audit-2026-03-11-linkme.md` (baseline de référence)

---

## Résumé Exécutif

| Domaine            | Problèmes critiques | Importants | Mineurs |
| ------------------ | ------------------: | ---------: | ------: |
| Requêtes Supabase  |                   4 |          8 |       6 |
| Hooks / Re-renders |                   2 |          5 |       4 |
| Composants lourds  |                   3 |          4 |       2 |
| Pages publiques    |                   1 |          3 |       1 |
| Middleware         |                   0 |          1 |       0 |
| **Total**          |              **10** |     **21** |  **13** |

**Bonne nouvelle par rapport au 2026-03-11** : Les `select('*')` ont quasi disparu des hooks (14 → 4). Tous les `invalidateQueries` sont correctement `await`és. Aucune promesse flottante dans les handlers. Le dashboard utilise maintenant un RPC optimisé (1 requête au lieu de 6+).

---

## 1. Requêtes Supabase

### 1.1 — select('\*') restants

| Fichier                                         | Ligne | Table                        | Impact                              |
| ----------------------------------------------- | ----- | ---------------------------- | ----------------------------------- |
| `contexts/AuthContext.tsx`                      | 114   | `v_linkme_users`             | MINEUR — vue, acceptable (fallback) |
| `app/api/complete-info/[token]/route.ts`        | 37    | `linkme_info_requests`       | IMPORTANT                           |
| `app/api/complete-info/[token]/submit/route.ts` | 71    | `linkme_info_requests`       | IMPORTANT                           |
| `app/api/page-config/[pageId]/route.ts`         | 61    | `linkme_page_configurations` | MINEUR — table de config légère     |

**`complete-info/[token]/route.ts` ligne 37** — IMPORTANT

```typescript
.from('linkme_info_requests').select('*')  // Overfetch
```

La table `linkme_info_requests` contient des champs sensibles (token, IP, etc.). La route n'a besoin que de : `id, sales_order_id, token_expires_at, completed_at, cancelled_at, cancelled_reason, completed_by_email`. Remplacer par une sélection explicite.

**`complete-info/[token]/submit/route.ts` ligne 71** — IMPORTANT
Même problème. Sélection de toute la table alors que seul `id, sales_order_id` est nécessaire pour la mise à jour.

### 1.2 — Requêtes N+1

**`use-product-sales-detail.ts` lignes 126-142** — CRITIQUE

```typescript
// 2 requêtes sur la MÊME table products pour le MÊME product_id
const [productResult, imageResult, productTypeResult] = await Promise.all([
  supabase.from('products').select('id, name, sku').eq('id', productId).single(),          // Requête A
  supabase.from('product_images')...
  supabase.from('products').select('created_by_affiliate, enseigne_id, assigned_client_id') // Requête B - DOUBLON
    .eq('id', productId).single(),
]);
```

Requête A et requête B touchent la même table `products` avec le même filtre `product_id`. Fusionner en une seule requête `select('id, name, sku, created_by_affiliate, enseigne_id, assigned_client_id')`.

**`use-onboarding-progress.ts` lignes 209-219** — IMPORTANT

```typescript
// Pattern séquentiel forcé : attendr selections AVANT de fetcher items
if (selections.length > 0) {
  const { data: items } = await supabase
    .from('linkme_selection_items')
    .select('id')
    .in('selection_id', selectionIds)
    .limit(1);
}
```

Cette requête dépend des `selectionIds` (donc séquentielle, pas parallélisable). Acceptable SI la liste selections est courte. Mais sans `limit` sur la requête `selectionsRes` (ligne 193 : `.limit(10)`), si un affilié a 10 sélections, les `selectionIds` transmis à la requête items peuvent être larges. Le `limit(1)` final est correct.

**`use-enseigne-organisations.ts` lignes 74-99** — IMPORTANT

```typescript
// 2 requêtes séquentielles : affiliate → organisations
const { data: affiliate } = await supabase
  .from('linkme_affiliates').select('enseigne_id').eq('id', affiliateId).single();
// puis...
const { data: organisations } = await supabase
  .from('organisations').select(...).eq('enseigne_id', affiliate.enseigne_id)...
```

Ces 2 requêtes sont séquentielles (la 2e dépend de `enseigne_id`). En théorie acceptable, mais elles pourraient être remplacées par un JOIN direct : `.from('linkme_affiliates').select('enseigne_id, organisations!enseigne_id(...)')`. Gain : 1 round-trip au lieu de 2.

### 1.3 — Requêtes dupliquées / redondantes

**Page commandes `/commandes/page.tsx`** — IMPORTANT
Au montage, 3 hooks distincts sont instanciés simultanément :

- `useLinkMeOrders` → 2 requêtes (`sales_orders` + counts)
- `useMonthlyKPIs` → 2-3 requêtes (`sales_orders` + `linkme_commissions`)
- `useAffiliateCommissionStats` → 1 requête (`linkme_commissions`)

`useMonthlyKPIs` et `useAffiliateCommissionStats` interrogent tous les deux `linkme_commissions` avec `affiliate_id` comme filtre. React Query déduplique si les `queryKey` sont identiques, mais ici les clés sont différentes — les 2 requêtes partent en parallèle. Impact : 2 requêtes identiques sur `linkme_commissions` à chaque montage de la page.

**`use-affiliate-analytics.ts`** — IMPORTANT
La page `/statistiques` monte à la fois `useAffiliateAnalytics` et potentiellement `useSelectionTopProducts`. Ces hooks interrogent indépendamment `linkme_commissions` + `linkme_order_items_enriched`. Si `useAffiliateCommissionStats` est aussi monté (sidebar/dashboard), c'est une 3e requête sur `linkme_commissions` simultanée.

### 1.4 — SELECT sans LIMIT sur tables potentiellement grandes

**`use-affiliate-commission-stats.ts` lignes 52-57** — IMPORTANT

```typescript
await supabase
  .from('linkme_commissions')
  .select('status, affiliate_commission, affiliate_commission_ttc, ...')
  .eq('affiliate_id', affiliate.id);
// PAS DE LIMIT
```

Ramène TOUTES les commissions de l'affilié pour faire une agrégation côté client. Si un affilié a des centaines de commandes, c'est potentiellement des milliers de lignes. L'agrégation devrait se faire côté PostgreSQL (via RPC ou `.rpc()`).

**`use-affiliate-commissions.ts` lignes 35-70** — IMPORTANT
Même pattern : ramène toutes les commissions sans limit pour affichage dans un tableau. Acceptable pour l'affichage paginé, mais sans pagination côté serveur ni limit explicite.

**`use-linkme-catalog.ts` lignes 117-153`** — MINEUR
Pas de `limit()` sur `channel_pricing` JOIN `products`. Si le catalogue LinkMe grossit, cette requête peut devenir lourde. À surveiller.

---

## 2. Hooks et Re-renders

### 2.1 — Realtime subscriptions

**Aucune subscription Realtime directe** n'a été trouvée dans `apps/linkme/src`. Pas de `supabase.channel()` ni `.on(`. C'est une **bonne pratique confirmée** — LinkMe utilise uniquement React Query.

Note : Le package `@verone/notifications` est importé via `LinkmeActivityTrackerProvider` (ligne 14). Ce package contient le bug polling+realtime documenté dans la mémoire agent. Ce bug affecte indirectement LinkMe si des notifications sont activées.

### 2.2 — useEffect avec dépendances problématiques

**`components/layout/AppSidebar.tsx` lignes 177-194** — MINEUR

```typescript
useEffect(() => {
  if (isProduitsPath(pathname)) {
    setOpenGroups(prev => { ... });
  }
}, [pathname]);

useEffect(() => {
  if (isReseauPath(pathname)) {
    setOpenGroups(prev => { ... });
  }
}, [pathname]);
```

Deux `useEffect` séparés sur la même dépendance `pathname`. Fusionnable en un seul useEffect pour éviter 2 évaluations à chaque changement de route.

**`app/(public)/s/[id]/layout.tsx` lignes 93-245** — IMPORTANT

```typescript
useEffect(() => {
  async function fetchSelection() { ... }
  void fetchSelection();
}, [id]);
```

Ce `useEffect` contient un fetch Supabase **en dehors de React Query**. Le layout de la sélection publique (page critique pour le SEO et l'UX) utilise le pattern `useState + useEffect + fetch` au lieu de React Query. Conséquences :

- Pas de cache entre navigations
- Pas de deduplication si le composant monte 2 fois
- Le spinner de chargement s'affiche à chaque navigation vers `/s/[id]/*` (catalogue, faq, contact...)
- Suivi `staleTime` impossible → toujours re-fetch

**`app/(public)/delivery-info/[token]/page.tsx` ligne 120** — IMPORTANT
Même pattern `useState + useEffect + fetch` sur une page publique. Cette page est accédée via magic link par des clients finaux — la performance est critique.

**`app/(public)/complete-info/[token]/page.tsx` ligne 274** — IMPORTANT
Idem. Formulaire magique lien client → useState + useEffect.

### 2.3 — Polls répétés de auth.getSession() / auth.getUser()

**`components/providers/LinkmeActivityTrackerProvider.tsx` ligne 47-54** — IMPORTANT

```typescript
useEffect(() => {
  const supabase = createClient();
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };
  void getSession().catch(...);
  // + onAuthStateChange listener
}, []);
```

Ce provider **crée un nouveau client Supabase** et appelle `getSession()` à chaque montage. L'`AuthContext` fait déjà cela. Résultat : 2 appels `getSession()` au montage de l'application, + 2 `onAuthStateChange` listeners actifs simultanément.

**`app/(main)/layout.tsx` ligne 42** — MINEUR (obligatoire)
`supabase.auth.getUser()` dans le Server Component layout est obligatoire (sécurité SSR). C'est correct.

**`middleware.ts` lignes 80-105** — IMPORTANT (pattern valide mais coûteux)
Le middleware effectue **2 requêtes Supabase à chaque requête HTTP protégée** :

1. `supabase.auth.getUser()` — valide le JWT
2. `supabase.from('user_app_roles').select('id')...` — vérifie le rôle linkme

Sur les routes protégées (toutes les pages `/dashboard`, `/commandes`, etc.), chaque navigation déclenche ces 2 requêtes au niveau Edge. La requête sur `user_app_roles` pourrait être évitée en stockant le rôle dans le JWT (via `app_metadata`) ou dans un cookie signé.

### 2.4 — Calculs coûteux sans useMemo

**`components/OrderFormUnified.tsx`** — CRITIQUE (3596 lignes)
Le composant utilise `useMemo` et `useCallback` de manière appropriée pour les calculs principaux (`cartTotals`, `validateStep*`). Cependant, la structure du composant (3596 lignes, 6 étapes multi-steps, 15+ hooks customs) implique que **tout changement d'état re-render l'arbre entier**. Le formulaire n'est pas découpé en sous-composants memoizés — chaque frappe dans un champ de texte déclenche un re-render de 3596 lignes de JSX.

**`app/(main)/commandes/components/CreateOrderModal.tsx`** — CRITIQUE (2974 lignes)
Même analyse. Modal de création de commande avec 2974 lignes, sans découpage en composants enfants stables. Les `useEffect` aux lignes 277, 291, 387, 461 se déclenchent sur des dépendances complexes.

**`app/(main)/commandes/[id]/modifier/EditOrderPage.tsx`** — IMPORTANT (2108 lignes)
Même pattern. 3 `useEffect` (lignes 334, 413, 466) avec des dépendances profondes.

---

## 3. Composants lourds (> 1000 lignes)

| Fichier                                     | Lignes | Type         | Impact    |
| ------------------------------------------- | ------ | ------------ | --------- |
| `components/OrderFormUnified.tsx`           | 3596   | Composant UI | CRITIQUE  |
| `components/CreateOrderModal.tsx`           | 2974   | Composant UI | CRITIQUE  |
| `commandes/[id]/modifier/EditOrderPage.tsx` | 2108   | Page         | CRITIQUE  |
| `organisations/OrganisationDetailSheet.tsx` | 1361   | Composant UI | IMPORTANT |
| `checkout/EnseigneStepper.tsx`              | 1178   | Composant UI | IMPORTANT |
| `orders/steps/BillingStep.tsx`              | 1104   | Step         | IMPORTANT |
| `hooks/use-user-selection.ts`               | 958    | Hook         | IMPORTANT |
| `orders/steps/ShippingStep.tsx`             | 928    | Step         | IMPORTANT |

### OrderFormUnified.tsx — Analyse détaillée

- **3596 lignes**, `'use client'`, un seul composant React non découpé
- Gère 6 étapes d'un formulaire multi-steps dans un seul arbre de composants
- Les étapes 1-6 sont toutes instanciées dans le render (même si invisible), pas de lazy loading des steps inactives
- `useMemo` est utilisé pour `cartTotals` (correct) mais les steps conditionnelles (`currentStep === 1 && <Step1/>`) re-calculent à chaque render de tous les handlers
- Recommandation : découper en `<Step1Form/>`, `<Step2Form/>` etc. avec `React.memo`, lazy-load les steps non actives

### CreateOrderModal.tsx — Analyse détaillée

- **2974 lignes**, `'use client'`, modal avec logique inline
- 4 `useEffect` avec des dépendances complexes pouvant créer des boucles
- Les fonctions `handleSubmit` (ligne 734) appelle `queryClient.invalidateQueries` en dehors d'un `useMutation.onSuccess` — pattern moins robuste

---

## 4. Pages publiques (performance critique)

### 4.1 — Layout de sélection publique `/s/[id]/layout.tsx`

**Impact : CRITIQUE pour UX/SEO**

Le layout de la sélection publique (708 lignes) est un **Client Component** qui gère tout l'état via `useState + useEffect` :

- `useState` pour : selection, items, branding, cart, isLoading, error, orderNumber, submittedOrderData, affiliateInfo
- `useEffect` ligne 93 : fetch complet de la sélection (RPC)
- `useQuery` via `useEnseigneOrganisations` : 2e requête séquentielle

**Problème** : Ce layout est un RSC (`app/` directory) mais est forcé `'use client'`. Un Server Component pourrait pré-fetcher la sélection côté serveur, l'hydrater instantanément, et éviter le flash de loading spinner à chaque accès `/s/[id]/*`.

**Nombre de requêtes au premier chargement de `/s/[id]/catalogue`** :

1. Middleware : `getUser()` → 0 requête (route publique, bypass)
2. Layout `useEffect` → RPC `get_public_selection` ou `get_public_selection_by_slug` (1 requête)
3. Layout `useEffect` → `linkme_affiliates` pour info affilié (1 requête séquentielle)
4. `useEnseigneOrganisations` → `linkme_affiliates` (1 requête) + `organisations` (1 requête séquentielle)

**Total : 4 requêtes séquentielles** avant que la page soit interactive. Sur mobile 4G, cela peut représenter 1-2 secondes de latence cumulée.

### 4.2 — Catalogue `/s/[id]/catalogue/page.tsx`

La page du catalogue consomme les données depuis le `SelectionContext` (pas de nouvelles requêtes). Elle fait une requête `track_selection_view` non-bloquante (`.rpc()`). **Bonne pratique confirmée.**

La pagination côté client (`ITEMS_PER_PAGE = 12`, filtrage `useMemo`) est correcte pour des catalogues de taille raisonnable. Sans limit sur le nombre d'items dans le RPC de sélection, si une sélection a 500+ produits, tout est chargé en mémoire. À surveiller.

### 4.3 — Delivery info `/delivery-info/[token]/page.tsx` (751 lignes)

Page accédée par les clients finaux via magic link. Utilise `useState + useEffect + fetch` au lieu de React Query :

```typescript
useEffect(() => {
  // fetch direct vers /api/complete-info/[token]
}, [token]);
```

Pas de cache, pas de deduplication, spinner à chaque accès. Pour une page one-shot, c'est acceptable, mais un Server Component avec `fetch()` natif serait plus performant (pre-render, pas de hydration delay).

### 4.4 — Complete info `/complete-info/[token]/page.tsx` (676 lignes)

Même analyse que delivery-info. Page formulaire client via magic link. Utilise `useState + useEffect`. Acceptable pour une page one-shot publique.

---

## 5. Middleware

**`apps/linkme/src/middleware.ts`** — IMPORTANT

Le middleware exécute sur **chaque requête non-publique** en Edge Runtime :

1. `createServerClient` → cookies parsing
2. `supabase.auth.getUser()` → validation JWT (réseau Supabase)
3. `supabase.from('user_app_roles').select('id')...` → requête DB PostgreSQL

La requête #3 sur `user_app_roles` est exécutée à **chaque navigation** pour toutes les pages protégées. Sur une session active, le rôle ne change pas. Cette requête pourrait être évitée en :

- Stockant le rôle linkme dans `app_metadata` du JWT Supabase (mis à jour uniquement à l'attribution du rôle)
- Ou en cachant le résultat dans un cookie signé (TTL 5min)

La requête #2 (`getUser()`) est obligatoire (best practice Supabase SSR pour refresh de session). Elle ne peut pas être évitée.

---

## 6. Patterns positifs confirmés (ne pas modifier)

- `useAffiliateDashboard` : RPC optimisé (1 requête au lieu de 6+) — excellent pattern
- `useLinkMeOrders` : Pagination server-side avec `count: 'exact'` — correct
- Tous les `invalidateQueries` sont `await`és — correct
- Aucun `select('*')` dans les hooks métier — bon travail depuis audit 2026-03-11
- `staleTime` cohérents (1-5 min selon criticité) — correct
- Pas de `refetchInterval` / polling actif dans LinkMe — correct
- Pas de `useEffect + fetch` dans les hooks (pattern React Query respecté dans les hooks)
- `useMemo` utilisé pour les calculs coûteux dans `OrderFormUnified`
- Aucune promesse flottante dans les handlers TSX

---

## Recommandations Prioritaires

### CRITIQUE

1. **Fusionner les 2 requêtes `products` dans `use-product-sales-detail.ts` ligne 126-142**
   `select('id, name, sku, created_by_affiliate, enseigne_id, assigned_client_id')` en une seule requête. Fix immédiat, 5 minutes.

2. **Découper `OrderFormUnified.tsx` (3596 lignes) en sous-composants**
   Créer `Step1Form`, `Step2Form`... avec `React.memo`. Chaque step ne devrait re-render que si ses propres données changent. Impact direct sur l'UX du formulaire public.

3. **Découper `CreateOrderModal.tsx` (2974 lignes) en sous-composants**
   Même approche. Modal utilisé par les affiliés pour créer des commandes depuis le dashboard.

### IMPORTANT

4. **Migrer `s/[id]/layout.tsx` de useState+useEffect vers RSC + Server Component**
   La sélection publique est la page d'entrée pour tous les clients finaux. Pré-fetcher côté serveur élimine le spinner de 1-2 secondes et améliore le LCP (Largest Contentful Paint).

5. **Déplacer l'agrégation de `useAffiliateCommissionStats` côté PostgreSQL**
   Remplacer le `select(...)` sans limit + agrégation JS par un RPC `get_commission_stats(p_affiliate_id)`. Évite de charger toutes les commissions en mémoire client.

6. **Fusionner `useMonthlyKPIs` + `useAffiliateCommissionStats` sur la page commandes**
   Ces 2 hooks interrogent `linkme_commissions` au même moment. Soit fusionner en un hook, soit s'assurer que les `queryKey` sont identiques pour bénéficier de la deduplication React Query.

7. **Supprimer la double gestion auth dans `LinkmeActivityTrackerProvider`**
   Ce provider crée son propre client Supabase et appelle `getSession()` en doublon avec `AuthContext`. Utiliser `useAuth()` depuis `AuthContext` au lieu de refaire un `getSession()`.

8. **Remplacer les 2 `select('*')` dans `complete-info/[token]/route.ts`**
   Routes API publiques — sélectionner uniquement les champs nécessaires.

9. **Optimiser le middleware : mettre le rôle en cache**
   Stocker le rôle linkme dans `app_metadata` JWT ou cookie signé pour éviter 1 requête DB à chaque navigation.

10. **Fusionner les 2 `useEffect` de `AppSidebar.tsx` sur la dépendance `pathname`**
    Simple refactor, élimine une évaluation inutile à chaque navigation.

### MINEUR

11. Les fichiers `complete-info` et `delivery-info` (pages one-shot magic link) pourraient être convertis en Server Components pour un pre-render sans spinner. Impact UX limité mais mesurable sur mobile.

12. Ajouter un `limit()` sur `use-linkme-catalog.ts` (pas de pagination sur le catalogue).

---

## Notes de dépréciation

- `use-linkme-public.ts` : Ce hook est toujours présent mais ses 4 occurrences `select('*')` de l'audit 2026-03-11 semblent avoir été corrigées (non retrouvées dans l'audit actuel). Confirmer que le fichier est à jour.

---

_Rapport généré le 2026-03-17 par perf-optimizer agent (AUDIT mode, aucun fichier modifié)_
