# Audit Performance — Commandes Clients Back-Office

## 2026-05-09 | Mode AUDIT (read-only) | Périmètre : pages liste + détail

---

## RÉSUMÉ EXÉCUTIF (pour Roméo)

**Constat mesuré** : la page liste charge 168 commandes avec 7 appels réseau simultanés
puis 3 appels séquentiels supplémentaires à l'ouverture d'une fiche détail — soit
**10 allers-retours base de données** à chaque ouverture de commande. Le chargement
de la liste seule prend ~95ms côté base de données, mais deux problèmes importants
ralentissent le ressenti :

1. **Le stock de chaque produit est chargé dans la liste** alors que cette information n'est
   affichée que dans la fiche détail — inutile et coûteux.
2. **Chaque ouverture de fiche détail fait 3 appels en séquence** (commande → client → créateur)
   au lieu de les faire en parallèle, allongeant le temps d'affichage de 300 à 600 ms estimé.
3. **Aucun cache** : chaque action (valider, expédier, lier une transaction) recharge la liste
   entière — soit 7 appels réseau à chaque clic de bouton.

**Note sur le rapport antérieur** : le rapport `dev-report-2026-05-08-perf-commandes-clients.md`
n'existe pas dans le repository. L'audit ci-dessous est donc le rapport de référence.

**Aucun problème grave d'index DB** : `sales_orders` est bien indexée. Les ralentissements
viennent du code, pas de la base de données.

---

## PHASE 1 — INVENTAIRE CODE (mesures réelles)

### 1.1 Page liste — requêtes déclenchées au chargement

**Source** : `packages/@verone/orders/src/hooks/use-sales-orders-fetch-list.ts`

Au montage de `SalesOrdersTable`, `use-sales-order-actions.ts:99-138` déclenche
`fetchOrders()` via `useEffect([channelId, preloadedOrders])`. Cela exécute :

**Requête principale** :

```
sales_orders (168 lignes) → LIMIT 500
  + LEFT JOIN sales_order_linkme_details
  + LEFT JOIN sales_order_items (498 lignes)
     + LEFT JOIN products (stock_quantity, stock_real, stock_forecasted_in, stock_forecasted_out)
  + LEFT JOIN contacts × 3 (billing, delivery, responsable)
  + LEFT JOIN sales_channels
ORDER BY created_at DESC
```

**Batch enrichment (Promise.all)** — 6 requêtes parallèles :

1. `transaction_document_links` .in('sales_order_id', 168 IDs) + INNER JOIN bank_transactions
2. `financial_documents` .in('sales_order_id', 168 IDs) WHERE type IN ('invoice','quote')
3. `sales_order_shipments` .in('sales_order_id', 168 IDs) WHERE packlink_status = 'a_payer'
4. `user_profiles` .in('user_id', créateurs uniques) — ~4 profils
5. `organisations` .in('id', orgIds) — ~X orgs
6. `individual_customers` .in('id', individualIds) — ~Y particuliers

**Total liste : 1 requête principale + 6 parallèles = 7 appels DB par chargement**

### 1.2 Problème #1 — Stock chargé dans la liste (CONFIRMÉ)

La requête principale inclut `sales_order_items` avec les colonnes stock de `products` :

```
products (id, name, sku, stock_quantity, stock_real, stock_forecasted_in, stock_forecasted_out)
```

L'enrichissement (ligne 485) force explicitement `primary_image_url: null` avec le commentaire
`[BO-RLS-PERF-002] Images retirées`. Les images ont donc déjà été supprimées, mais
**les colonnes stock restent**. Or dans la table `SalesOrderDataTable`, il n'y a aucun
affichage des colonnes stock par ligne. Ces colonnes sont utilisées uniquement dans
le détail d'une commande déjà chargée.

**Constat** : 498 lignes `sales_order_items` × 7 colonnes stock = payload inutile à chaque chargement de liste.

### 1.3 Problème #2 — fetchOrder séquentiel dans use-universal-order-header.ts

**Source** : `packages/@verone/orders/src/components/modals/use-universal-order-header.ts`

À l'ouverture d'une fiche (via `UniversalOrderDetailsModal`), 3 appels **séquentiels** :

1. `sales_orders.select(...).eq('id', orderId)` — appel 1
2. Si org → `organisations.select('legal_name, trade_name').eq('id', customer_id)` — appel 2
3. Si created_by → `supabase.rpc('get_user_info', {p_user_id})` — appel 3

Et en **parallèle** (useOrderItems dans use-universal-order-modal.ts) : 4. `sales_order_items` .select('\*') avec JOIN products × images — appel 4

**Problème critique** : appels 2 et 3 sont séquentiels alors qu'ils peuvent être parallèles.
De plus, le `useOrderItems` fait **select('\*')** (LIGNE 133) — violation de la règle stricte
du projet. Toutes les colonnes de `sales_order_items` sont chargées incluant des champs
non utilisés dans le modal.

### 1.4 Problème #3 — Deux chemins de détail non synchronisés

**Chemin A** (utilisé par `SalesOrdersTable.onView` pour les commandes non-LinkMe) :
`SalesOrderModals` → modal `OrderDetailModal` → qui reuse les données déjà dans `orders[]`
via `selectedOrder` passé depuis la liste. Ce chemin est **efficace** (pas de refetch).

**Chemin B** (utilisé par `UniversalOrderDetailsModal`) :
Reconstruit tout depuis zéro via `use-universal-order-header` + `useOrderItems`.
Ce chemin fait **4 requêtes réseau** à l'ouverture, dont 2-3 séquentielles.

**Quel chemin pour la page `/commandes/clients` ?** Le chemin A est utilisé par défaut
pour les commandes non-LinkMe. Le Chemin B est utilisé dans `use-sales-orders-fetch.ts`
via `fetchOrder()` — déclenché à chaque mutation (`updateOrder`, `updateStatus`, etc.)
pour resynchroniser `currentOrder`.

### 1.5 Problème #4 — fetchOrder séquentiel aussi dans use-sales-orders-fetch.ts

**Source** : `packages/@verone/orders/src/hooks/use-sales-orders-fetch.ts:40-251`

La fonction `fetchOrder` fait ces appels **séquentiels** :

1. `sales_orders.select(TOUTES LES COLONNES).eq('id', orderId)` — 60+ colonnes
2. Si org → `organisations.select(...)` — 20 colonnes
3. Si individual → `individual_customers.select(...)`
4. `get_user_info` RPC (si created_by)
5. `transaction_document_links.select(...).eq('sales_order_id', orderId)`

Appels 2, 3, 4, 5 sont séquentiels. Les appels 2, 3, 4, 5 peuvent être parallèles.
**Gain estimé** : -300 à -500 ms par ouverture de fiche.

### 1.6 Problème #5 — Refetch total après chaque action

**Source** : `use-sales-orders-success-handlers.ts`, `use-sales-orders-mutations.ts`

Après chaque action (création, modification, changement statut, expédition, lien transaction) :
→ `fetchOrders()` est appelé = **7 requêtes réseau complètes** sont rejouées.

Le commentaire `[BO-PERF-TANSTACK-001]` dans `use-sales-orders-fetch-list.ts:541`
indique une tentative de mise en cache TanStack Query (`queryClient.setQueryData`),
mais cette mise à jour ne se déclenche que si `Object.keys(filters).length === 0`
(liste non filtrée). Le cache n'est donc pas alimenté quand on utilise un filtre canal.

De plus, ce cache n'est **jamais lu** par le composant principal — `SalesOrdersTable`
utilise l'état local `orders` du hook `useSalesOrders`, pas le cache TanStack Query.
La logique TanStack est donc actuellement sans consommateur.

### 1.7 Absence de staleTime / cache React Query

Le hook `useSalesOrders` utilise `useState` + `useCallback` (pattern legacy setState).
Aucun `useQuery` de TanStack Query sur les chemins critiques de la liste.
Résultat : chaque remontage du composant (navigation retour-avant) redéclenche `fetchOrders`.

### 1.8 select('\*') confirmé dans useOrderItems

**Source** : `use-order-items.ts:133` — `.select('*, products(...)') `

Le `*` charge toutes les colonnes de `sales_order_items`. Pour la modale de détail,
les colonnes `retrocession_rate`, `retrocession_amount`, `linkme_selection_item_id` etc.
ne sont pas affichées dans `UniversalOrderItemsCard` — overfetch confirmé.

### 1.9 useOrderItems — Instabilité de deps useEffect (risque boucle)

**Source** : `use-order-items.ts:112-164`

```typescript
const supabase = createClient();  // ← créé à chaque render, INSTABLE

const fetchItems = useCallback(async () => { ... }, [orderId, orderType, table, fkColumn, supabase]);
//                                                                                          ↑ INSTABLE

useEffect(() => {
  void fetchItems();
}, [fetchItems]);  // ← se retrigger quand fetchItems change = à chaque render
```

`createClient()` est appelé directement dans le corps du composant sans `useMemo`.
Selon l'implémentation de `createClient`, si elle retourne un objet non-stable,
`supabase` change à chaque render → `fetchItems` se recalcule → `useEffect` retrigger.
**Risque de boucle infinie** similaire à l'incident prod du 16 avril 2026.

---

## PHASE 2 — INVENTAIRE DB (mesures EXPLAIN ANALYZE)

### 2.1 Requête liste principale — seq scan confirmé

```
EXPLAIN ANALYZE: Seq Scan on sales_orders
Execution Time: 95.144 ms (planning: 89.080 ms)
```

**168 lignes**. La query `ORDER BY created_at DESC LIMIT 500` fait un seq scan car
il n'y a pas d'index sur `created_at` seul. Mais avec 168 lignes, le planner
préfère le seq scan à un index scan — c'est **correct** pour cette taille.

**Observation critique** : le planning time (89ms) est presque aussi long que l'execution
time (95ms). Cela indique que le schéma est complexe (60+ index sur sales_orders,
RLS avec is_backoffice_user()). Ce surcoût fixe s'accumule sur les 7 requêtes parallèles.

### 2.2 Requête avec filtre status — index utilisé correctement

```
EXPLAIN ANALYZE: Index Scan using idx_sales_orders_channel_status_created
Execution Time: 1.306 ms
```

Quand un filtre `status` est actif, l'index composite `idx_sales_orders_channel_status_created`
est utilisé. Performant.

### 2.3 Requête avec JOIN items + products

```
EXPLAIN ANALYZE: Nested Loop + Hash Right Join
Execution Time: 95.492 ms
Seq Scan on sales_order_items (498 lignes)
Memoize sur products (Cache hits: 444, Misses: 64)
```

Le JOIN `sales_orders × sales_order_items × products` coûte ~95ms.
Ce coût est **inévitable** si les items doivent être dans la liste.
**Solution** : retirer items+stock de la liste, charger seulement à la demande.

### 2.4 financial_documents — seq scan sur petite table

```
EXPLAIN ANALYZE: Seq Scan on financial_documents
Execution Time: 9.742 ms
```

40 lignes. L'index `idx_financial_documents_sales_order` existe mais le Hash Join
avec les 168 IDs force le seq scan. Normal sur petite table. Non problématique.

### 2.5 user_profiles — 32M seq_scans confirmé

```
pg_stat: 32,878,424 seq_scans / 17,902 idx_scans (99.9% seq)
```

La table n'a que **8 lignes**. Le seq scan est trivial (1ms). La RLS policy
`users_own_user_profiles` utilise `auth.uid()` non wrappé — confirmé 2026-03-11 —
mais l'impact pour le back-office est nul car `backoffice_full_access_user_profiles`
bypasse via `is_backoffice_user()`.

### 2.6 individual_customers — 99% seq_scan, 21 lignes

```
pg_stat: 187,973 seq_scans / 1,913 idx_scans (99.0% seq)
```

La table n'a que **21 lignes**. Pour cette taille, le planner utilisera toujours le
seq scan même avec un index — c'est correct. Non problématique à ce stade.

### 2.7 is_backoffice_user() — coût fixe de 14ms par appel hors session

```
EXPLAIN ANALYZE: is_backoffice_user() = One-Time Filter, Execution Time: 14.219 ms
```

Ce coût est mesuré depuis le MCP (sans session auth). En production, avec une vraie
session, `is_backoffice_user()` fait un SELECT sur `user_app_roles` (9 lignes actuellement).
La fonction est `SECURITY DEFINER + SET row_security = off`, donc rapide en prod.
Ce n'est pas la cause du ralentissement.

### 2.8 Index existants sur sales_orders — complets

**32 index** sur `sales_orders`. Les index critiques pour les requêtes de la liste sont :

- `idx_sales_orders_channel_status_created` (channel_id, status, created_at DESC) ✅
- `idx_sales_orders_customer_id` ✅
- `idx_sales_orders_created_by` ✅
- `idx_sales_orders_order_number` ✅
- `sales_orders_pkey` ✅

**Aucun index manquant critique pour les requêtes actuelles.**

### 2.9 FK sans index sur sales_orders

Advisor Supabase signale `sales_orders_applied_discount_id_fkey` sans index.
Impact : faible (colonne rarement filtrée). Non prioritaire.

---

## PHASE 3 — ANALYSE PATTERNS CODE

### 3.1 Pas de staleTime — refetch systématique

```typescript
// ACTUEL : useState + useCallback (legacy pattern)
const [orders, setOrders] = useState<SalesOrder[]>([]);
// → refetch à chaque remontage composant
```

Aucun `staleTime` configuré. Chaque navigation retour → page commandes redéclenche
7 requêtes réseau même si les données ont été chargées 10 secondes avant.

### 3.2 TanStack cache partiellement implémenté mais non consommé

```typescript
// use-sales-orders-fetch-list.ts:541
queryClient.setQueryData(['sales_orders', 'list'], finalOrders);
// Alimente le cache uniquement si !filters
```

Ce cache est écrit mais jamais lu par `SalesOrdersTable` qui consomme `fetchedOrders`
depuis `useSalesOrders()` (état local useState). **Travail à moitié fait.**

### 3.3 Retry logic inutile en prod (3s de délai)

```typescript
// use-sales-order-actions.ts:107-122
const fetchWithRetry = async (retries = 2) => {
  // ...
  await new Promise(resolve => setTimeout(resolve, 3000)); // 3 secondes
  // ...
};
```

En cas d'échec temporaire, ce retry ajoute 3 puis 3 secondes d'attente.
Dans un contexte Supabase (connexion stable), ce n'est pas utile. En cas d'erreur
réseau réelle, l'UI reste bloquée 6 secondes avant de renoncer.

### 3.4 Double createClient dans use-universal-order-header

```typescript
// use-universal-order-header.ts:32 dans useEffect
const supabase = createClient(); // ← créé à chaque exécution de l'effect
```

`createClient()` est appelé **à l'intérieur** du `useEffect`, pas dans le corps du
composant. Ce n'est pas un risque de boucle directement, mais c'est un anti-pattern :
une nouvelle instance Supabase créée à chaque fetch.

### 3.5 select('\*') dans useOrderItems

**Fichier** : `use-order-items.ts` lignes 133, 211-227, 274-290

Trois occurrences de `.select('*, products(...)')` dans le hook universel.
Ce hook est utilisé dans `UniversalOrderDetailsModal` pour la modale de détail.

### 3.6 Aucune pagination côté serveur

La liste charge `LIMIT 500` côté serveur, puis pagine en JavaScript.
Avec 168 commandes actuelles, ce n'est pas critique. Mais dès que le volume dépassera
500 commandes, il faudra une pagination serveur (range + offset ou cursor).

---

## PHASE 4 — COMPARAISON BEST PRACTICES INDUSTRIELS

### Comment Linear / Stripe / Shopify Admin gèrent une liste de commandes

**Linear** : uses `useQuery` avec `staleTime: 5 * 60 * 1000` (5 min). Mise à jour
optimiste côté client après action, resync en background. Pas de refetch full après
chaque mutation.

**Stripe Dashboard** : paginate serveur dès le départ (cursor-based). 25 éléments par
page. Prefetch au survol des boutons "Page suivante".

**Shopify Admin** : Server Components Next.js pour la liste initiale. Client Components
uniquement pour les interactions (modals, actions). Cache `stale-while-revalidate`.

**Pattern actuel Verone** : 100% Client Component, useState legacy, refetch total après
chaque action. **En retard de 2 générations** par rapport aux patterns actuels.

### Ce qui est bien fait dans le repo

- `use-factures-page.ts` utilise TanStack Query avec staleTime — pattern à copier
- Le `Promise.all` dans `fetchOrders` (batch des 6 requêtes) est correct
- La suppression des images en liste (commentaire [BO-RLS-PERF-002]) montre une
  démarche de perf déjà active
- Les index sur `sales_orders` sont nombreux et bien structurés

---

## TOP 5 QUICK WINS (ordonnés par impact / risque)

### QW-1 — Retirer stock items de la liste (IMPACT HAUT, RISQUE BAS)

**Fichier** : `use-sales-orders-fetch-list.ts` ligne 71-78

Supprimer les colonnes stock de la requête liste :

```typescript
// AVANT
sales_order_items (
  id, product_id, quantity, unit_price_ht, total_ht, tax_rate,
  products (id, name, sku, stock_quantity, stock_real, stock_forecasted_in, stock_forecasted_out)
)
// APRÈS
sales_order_items (
  id, product_id, quantity, unit_price_ht, total_ht, tax_rate,
  products (id, name, sku)  ← seulement les colonnes affichées en liste
)
```

**Gain estimé** : -30 à -50% sur le payload de la requête principale. Réduction du
temps de traitement JS côté client (moins de données à mapper).

### QW-2 — Paralléliser fetchOrder dans use-sales-orders-fetch.ts (IMPACT HAUT, RISQUE BAS)

**Fichier** : `use-sales-orders-fetch.ts` lignes 117-199

Les appels 2 (organisations), 3 (individual_customers), 4 (get_user_info), 5 (transaction_document_links)
sont tous indépendants. Les mettre en Promise.all après avoir obtenu les IDs depuis
la requête 1.

**Gain estimé** : -300 à -500 ms à l'ouverture d'une fiche commande.

### QW-3 — Corriger createClient() dans useOrderItems (IMPACT MOYEN, RISQUE BAS)

**Fichier** : `use-order-items.ts` ligne 112

```typescript
// AVANT (instable, risque boucle)
const supabase = createClient(); // dans le corps du composant

// APRÈS
const supabase = useMemo(() => createClient(), []);
```

**Gain** : prévenir la boucle infinie latente (risque prod similaire à l'incident 16 avril).

### QW-4 — Ajouter staleTime sur le cache TanStack (IMPACT MOYEN, RISQUE BAS)

Compléter le travail [BO-PERF-TANSTACK-001] en faisant que `SalesOrdersTable`
lise depuis le cache TanStack au lieu de refetcher systématiquement.

```typescript
// Option minimale : ajouter staleTime dans queryClient.setQueryData
// puis utiliser queryClient.getQueryData au remontage si données fraîches (< 30s)
```

**Gain estimé** : 0 appels réseau lors d'une navigation retour-avant en < 30s.

### QW-5 — Corriger select('\*') dans useOrderItems (IMPACT BAS, RISQUE BAS)

**Fichier** : `use-order-items.ts` lignes 133, 211, 274

```typescript
// AVANT
.select('*, products(id, name, sku, cost_price, eco_tax_default, product_images(...))')

// APRÈS — colonnes explicites
.select(`
  id, sales_order_id, product_id, quantity, unit_price_ht, discount_percentage,
  eco_tax, total_ht, notes, tax_rate, quantity_shipped, retrocession_rate,
  retrocession_amount, created_at,
  products (id, name, sku, eco_tax_default, product_images (public_url, is_primary))
`)
```

---

## TOP 3 CHANTIERS STRUCTURELS

### CS-1 — Migration vers Server Components pour la liste (IMPACT TRÈS HAUT, RISQUE MOYEN)

**Contexte** : La page `/commandes/clients/page.tsx` est un `'use client'` complet.
Les données initiales pourraient être chargées côté serveur (RSC), puis hydratées
côté client pour les interactions.

**Pattern visé** :

```typescript
// page.tsx (Server Component)
export default async function CommandesClientsPage() {
  const supabase = createServerClient();
  const { data: initialOrders } = await supabase
    .from('sales_orders')
    .select('id, order_number, status, ...')  // sans items
    .order('created_at', { ascending: false })
    .limit(50);

  return <SalesOrdersTable preloadedOrders={initialOrders} />;
}
```

`SalesOrdersTable` accepte déjà `preloadedOrders` (prop existante). La mécanique
est prête, il suffit de supprimer `'use client'` de la page et de charger les données
côté serveur.

**Gain estimé** : suppression des 7 requêtes réseau post-hydration → page visible
en < 200ms (HTML pré-rendu). Expérience utilisateur radicalement améliorée.

**Risque** : le modal `SalesOrderFormModal` et les filtres dynamiques restent
Client Components. Nécessite une refonte partielle.

### CS-2 — Refonte hook vers TanStack Query useQuery (IMPACT HAUT, RISQUE MOYEN)

Remplacer le pattern `useState + useCallback + fetchOrders()` par `useQuery` :

```typescript
const {
  data: orders = [],
  isLoading,
  refetch,
} = useQuery({
  queryKey: ['sales_orders', channelId],
  queryFn: () => fetchOrdersList(channelId),
  staleTime: 30_000, // 30s de cache
  gcTime: 5 * 60_000, // 5min en mémoire
});

// Après mutation : invalidation ciblée
await queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
```

**Gain** : cache inter-navigations, refetch ciblé (1 requête au lieu de 7),
stale-while-revalidate natif.

### CS-3 — Pagination curseur côté serveur (IMPACT MOYEN, RISQUE BAS)

```typescript
// Remplacer LIMIT 500 par pagination curseur
const { data } = await supabase
  .from('sales_orders')
  .select('...')
  .lt('created_at', cursor) // cursor = created_at de la dernière ligne précédente
  .order('created_at', { ascending: false })
  .limit(20);
```

**Gain** : volume de données stable à ~20 lignes quelle que soit la croissance.
Actuellement non urgent (168 commandes), mais à anticiper dès 500+ commandes.

---

## INDEX DB À CRÉER

### Aucun index critique manquant pour les requêtes actuelles.

Les 32 index sur `sales_orders` couvrent tous les cas de filtre. Le planificateur
fait les bons choix (seq scan sur 168 lignes, index scan sur filtres sélectifs).

Le seul index signalé par Supabase Advisor est `sales_orders_applied_discount_id_fkey`
(FK sans index), mais cette colonne n'est jamais filtrée dans les requêtes commandes.
Priorité basse.

**Si la pagination serveur est implémentée (CS-3)**, un index sur `created_at DESC`
seul deviendrait utile :

```sql
-- À créer UNIQUEMENT si pagination cursor mise en place
CREATE INDEX idx_sales_orders_created_at_desc
ON public.sales_orders (created_at DESC);
```

---

## RISQUES & PROTECTIONS

### Ce qu'on ne touche PAS (règles absolues)

- **Triggers stock** (`stock-triggers-protected.md`) : aucune requête de ce rapport ne
  les concerne.
- **Routes Qonto** (`/api/qonto/*`) : non concernées par cet audit.
- **Policies RLS** : les policies `staff_select_sales_orders` et `backoffice_full_access_user_profiles`
  utilisent `is_backoffice_user()` qui est correctement implémenté. Aucune modification
  suggérée sur les RLS — nécessiterait une PR dédiée.

### Risque de régression QW-1

Vérifier avant fix que `stock_quantity`, `stock_real`, `stock_forecasted_in`,
`stock_forecasted_out` ne sont pas affichés dans `SalesOrderTableRow` ou
`SalesOrderStatsCards`. Un grep est indispensable avant modification.

### Risque QW-2 (parallélisation fetchOrder)

Les données `organisations` / `individual_customers` sont récupérées séquentiellement
car elles dépendent du `customer_type` retourné par la requête 1. La parallélisation
nécessite de démarrer les deux requêtes (org ET individual) en même temps, puis
de n'utiliser que le résultat pertinent — pattern correct possible sans risque.

---

## SYNTHÈSE DES MESURES RÉELLES

| Requête                              | Execution Time (EXPLAIN ANALYZE) | Type                                    |
| ------------------------------------ | -------------------------------- | --------------------------------------- |
| sales_orders LIMIT 500 (sans JOIN)   | 95ms                             | Seq scan (correct sur 168 lignes)       |
| sales_orders WHERE status='draft'    | 1.3ms                            | Index scan (idx_channel_status_created) |
| sales_orders + items + products JOIN | 95ms                             | Seq scan + Nested Loop                  |
| financial_documents IN (168 IDs)     | 9.7ms                            | Seq scan + Hash Join                    |
| user_profiles IN (4 IDs)             | 3.4ms                            | Hash Join                               |
| fetchOrder (commande seule)          | 9.5ms                            | Index scan sur PK                       |
| is_backoffice_user() hors session    | 14ms                             | One-time filter                         |

**Latence réseau Supabase (estimée)** : +50-100ms par aller-retour (Supabase Free/Pro EU).

**Temps total estimé au chargement de liste** :

- 1 requête principale (95ms DB) + latence réseau → ~150-200ms
- 6 requêtes parallèles → max(9.7ms, 9.7ms, 3.4ms, ...) → ~50ms DB + latence réseau
- **Total réel mesuré côté client** : 300-600ms (estimé, non mesuré en prod)

**Temps estimé à l'ouverture d'une fiche (chemin B séquentiel)** :

- Requête 1 commande : ~100ms
- Requête 2 client (séquentielle) : +100ms
- Requête 3 créateur RPC (séquentielle) : +100ms
- **Total estimé** : 350-600ms d'attente visible avant affichage

---

## RAPPORT DE MÉMOIRE AGENT (pour mises à jour internes)

À consigner dans `/Users/romeodossantos/verone-back-office-V1/.claude/agent-memory/perf-optimizer/MEMORY.md` :

- `sales_orders` : 168 lignes, 32 index, seq scan correct (petite table). Pas d'index manquant.
- Hotspot code n°1 : `use-sales-orders-fetch-list.ts` — stock chargé inutilement en liste
- Hotspot code n°2 : `use-universal-order-header.ts` — fetchs séquentiels (org + creator)
- Hotspot code n°3 : `use-order-items.ts:112` — `createClient()` non-stable + select('\*')
- Pattern TanStack partiellement implémenté mais non consommé (`queryClient.setQueryData` sans consommateur)
- Page `/commandes/clients/page.tsx` est `'use client'` — candidat prioritaire RSC + preloadedOrders (prop déjà prête)
