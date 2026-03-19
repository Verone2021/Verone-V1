# Audit Performance — Pricing & Commissions LinkMe

**Date** : 2026-03-18
**Scope** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/` + DB pricing/commissions
**Mode** : AUDIT READ-ONLY
**Agent** : perf-optimizer

---

## Résumé Exécutif

| Domaine                           | Problèmes trouvés                                              | Criticité max |
| --------------------------------- | -------------------------------------------------------------- | ------------- |
| Triggers DB (cascade)             | 2 triggers redondants sur `sales_order_items`                  | CRITIQUE      |
| Vue `linkme_orders_enriched`      | LATERAL subquery inefficace (113/134 ordres sans sélection)    | IMPORTANT     |
| Fonctions sans `search_path`      | 3 fonctions critiques exposées                                 | IMPORTANT     |
| Dead code pricing                 | `channel_pricing` JOIN inutile dans vue enrichie               | IMPORTANT     |
| Overfetch hooks                   | `select('*')` sur vue enrichie + `select('*')` sur `addresses` | IMPORTANT     |
| Pattern legacy (`taux de marque`) | Terminologie incohérente UI vs DB mais pas de code mort        | INFO          |
| Hook analytics legacy             | `useLinkMeAnalytics` = useState+useEffect (pattern proscrit)   | IMPORTANT     |
| Dashboard : fetch all orders      | `useLinkMeDashboard` charge toutes les commandes côté client   | IMPORTANT     |

---

## 1. Triggers DB — Double UPDATE sur `sales_orders` (CRITIQUE)

### Constat

Sur chaque `INSERT` ou `UPDATE` d'une ligne `sales_order_items`, **deux triggers AFTER** s'exécutent séquentiellement et font chacun un `UPDATE sales_orders` :

| Trigger                                  | Fonction                                | Événements             | UPDATE sales_orders                                                  |
| ---------------------------------------- | --------------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| `recalculate_sales_order_totals_trigger` | `recalculate_sales_order_totals()`      | INSERT, UPDATE, DELETE | `total_ht`, `total_ttc`                                              |
| `trg_update_affiliate_totals`            | `update_sales_order_affiliate_totals()` | INSERT, UPDATE, DELETE | `affiliate_total_ht`, `affiliate_total_ttc`, `total_ht`, `total_ttc` |

**Problème confirmé par introspection** :

```
recalculate_sales_order_totals :
  updates_sales_orders = true
  touches_total_ht     = true
  touches_total_ttc    = true
  touches_affiliate_total = false

update_sales_order_affiliate_totals :
  updates_sales_orders  = true
  touches_total_ht      = true  ← DOUBLON
  touches_total_ttc     = true  ← DOUBLON
  touches_affiliate_total = true
```

`update_sales_order_affiliate_totals` réécrit `total_ht` et `total_ttc` en plus de `affiliate_total_ht/ttc`. Cela signifie que sur chaque `INSERT` d'un `sales_order_item`, la table `sales_orders` reçoit **deux UPDATE distincts** au lieu d'un seul.

**Impact** : Pour une commande à N lignes, la création génère N×2 UPDATE sur `sales_orders`. Avec une cascade `trg_lock_prices_on_validation` + `trg_sync_commission_on_payment` + 15 triggers AFTER UPDATE sur `sales_orders`, chaque modification d'item peut déclencher jusqu'à 15+2 = 17 opérations supplémentaires.

**Sécurité supplémentaire** : `update_sales_order_affiliate_totals` est `SECURITY INVOKER` **sans** `SET search_path` (confirmé). Risque de schema hijacking si un attaquant contrôle le `search_path` de la session.

### Carte complète des triggers `sales_order_items`

```
INSERT sur sales_order_items :
  BEFORE : trg_calculate_retrocession          → SELECT linkme_selection_items (1 query)
  AFTER  : recalculate_sales_order_totals_trigger → UPDATE sales_orders (total_ht, total_ttc)
  AFTER  : trg_backfill_order_affiliate         → UPDATE sales_orders (created_by_affiliate_id)
  AFTER  : trg_update_affiliate_totals          → UPDATE sales_orders (affiliate_total_ht/ttc + total_ht/ttc)
  = 3 UPDATE sales_orders par ligne insérée

UPDATE sur sales_order_items :
  BEFORE : sales_order_items_updated_at         → SET updated_at
  BEFORE : trg_calculate_retrocession          → SELECT linkme_selection_items
  AFTER  : recalculate_sales_order_totals_trigger → UPDATE sales_orders
  AFTER  : trg_update_affiliate_totals          → UPDATE sales_orders
  AFTER  : trigger_handle_so_item_quantity_change_confirmed → UPDATE stock (si confirmed)
  = 2 UPDATE sales_orders par ligne modifiée
```

### Carte complète des triggers `sales_orders`

Un UPDATE sur `sales_orders` (déclenché par les triggers ci-dessus) déclenche à son tour **5 BEFORE** + **15 AFTER** triggers :

```
BEFORE UPDATE (5) :
  - sales_orders_updated_at
  - trg_recalculate_so_payment_on_total_change
  - trg_update_sales_order_manual_payment
  - trig_so_charges_recalc
  - trigger_prevent_so_direct_cancellation

AFTER UPDATE (15) :
  - audit_sales_orders
  - sales_order_status_change_trigger
  - trg_create_linkme_commission
  - trg_lock_prices_on_validation
  - trg_notify_affiliate_order_approved
  - trg_so_devalidation_forecasted_stock
  - trg_sync_commission_on_payment
  - trigger_order_cancelled_notification
  - trigger_order_confirmed_notification
  - trigger_order_shipped_notification
  - trigger_payment_received_notification
  - trigger_so_cancellation_rollback
  - trigger_so_delayed_notification
  - trigger_so_partial_shipped_notification
  - trigger_so_update_forecasted_out
```

La majorité de ces 15 triggers AFTER contiennent des guards `IF OLD.status = NEW.status THEN RETURN` — ils sont donc silencieux si le statut ne change pas. Cependant, `trg_create_linkme_commission` et `audit_sales_orders` **s'exécutent sur tout UPDATE**, sans guard sur le statut.

### Recommandation

Fusionner `recalculate_sales_order_totals` et `update_sales_order_affiliate_totals` en une seule fonction qui calcule `total_ht`, `total_ttc`, `affiliate_total_ht`, `affiliate_total_ttc` en un seul `UPDATE`. Déléguer à `database-architect`.

---

## 2. Vue `linkme_orders_enriched` — LATERAL Subquery inefficace (IMPORTANT)

### Constat

La vue `linkme_orders_enriched` (base de `linkme_orders_with_margins`) utilise une jointure LATERAL pour trouver la sélection d'un ordre :

```sql
LEFT JOIN LATERAL (
  SELECT soi.linkme_selection_item_id
  FROM sales_order_items soi
  WHERE soi.sales_order_id = so.id
    AND soi.linkme_selection_item_id IS NOT NULL
  LIMIT 1
) first_item ON (true)
LEFT JOIN linkme_selection_items lsi ON lsi.id = first_item.linkme_selection_item_id
LEFT JOIN linkme_selections ls ON ls.id = lsi.selection_id
LEFT JOIN linkme_affiliates la ON la.id = ls.affiliate_id
```

**Problème** : Cette chaîne de 4 jointures (`sales_order_items` → `linkme_selection_items` → `linkme_selections` → `linkme_affiliates`) pour récupérer le nom de l'affilié est inutilement complexe.

**Données confirmées** :

- 134 commandes LinkMe en production
- **115/134 ont un `created_by_affiliate_id` direct** dans `sales_orders`
- Seulement 21/134 ont un `linkme_selection_id` direct

La vue ignorait complètement `sales_orders.created_by_affiliate_id` et `sales_orders.linkme_selection_id`, deux colonnes **directement sur la table** qui permettraient d'obtenir affilié et sélection sans aucune jointure chaînée.

### Vue `linkme_orders_with_margins` : colonne `commission_rate` inutile

La vue `linkme_order_items_enriched` expose `commission_rate` via `channel_pricing`. Or :

- La table `channel_pricing` ne contient que **49 produits** pour le canal LinkMe
- Le `commission_rate` moyen est 61% (valeur incohérente, table vraisemblablement non maintenue)
- La commission réelle est toujours stockée dans `linkme_selection_items.margin_rate` et `sales_order_items.retrocession_rate`
- La colonne `commission_rate` de la vue vaut `0` pour tous les items sans entrée dans `channel_pricing`

La jointure `LEFT JOIN channel_pricing` est donc un **dead join** qui ne produit pas de données utiles en pratique.

### Colonnes exposées vs colonnes consommées

`linkme_order_items_enriched` expose **17 colonnes**. La page `/commandes/[id]/page.tsx` fait `select('*')` (voir section 4) — toutes les 17 colonnes sont ramenées y compris :

- `commission_rate` (dead join)
- `base_price_ht` (COALESCE complexe rarement utile en affichage)
- `product_image_url` (chargée même sur les pages sans image)

---

## 3. Fonctions sans `search_path` fixe (IMPORTANT)

Trois fonctions liées aux commissions sont `SECURITY INVOKER` sans `SET search_path` :

| Fonction                                   | security_type | search_path |
| ------------------------------------------ | ------------- | ----------- |
| `create_linkme_commission_on_order_update` | INVOKER       | ABSENT      |
| `get_linkme_orders`                        | INVOKER       | ABSENT      |
| `update_sales_order_affiliate_totals`      | INVOKER       | ABSENT      |

**Impact** :

- `create_linkme_commission_on_order_update` : créée à chaque INSERT/UPDATE de `sales_orders` → exposée à toutes les sessions. Sans `search_path`, si le `search_path` de la session est manipulé, la fonction pourrait résoudre les noms de tables vers un schéma malveillant.
- `get_linkme_orders` : RPC publique appelée par le back-office et potentiellement depuis des clients. Sans `search_path`, vulnérable au schema injection.
- `update_sales_order_affiliate_totals` : modifie les totaux financiers. C'est la plus critique des trois.

**Note** : `recalculate_sales_order_totals` a `search_path=public` — correct.

---

## 4. Overfetch Patterns dans les hooks et pages (IMPORTANT)

### 4.1 `select('*')` sur `linkme_order_items_enriched`

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/page.tsx` ligne 604

```typescript
const { data: enrichedData } = await supabase
  .from('linkme_order_items_enriched')
  .select('*') // ← 17 colonnes ramenées
  .eq('sales_order_id', orderId);
```

La vue fait déjà 4 LEFT JOIN. Ramener `commission_rate` (dead join), `product_image_url`, et `base_price_ht` (COALESCE complexe) pour tous les items d'une commande est de l'overfetch.

**Colonnes réellement nécessaires pour cette page** (d'après l'analyse du rendu) :
`id, product_id, product_name, product_sku, quantity, unit_price_ht, total_ht, selling_price_ht, affiliate_margin, retrocession_rate, margin_rate, tax_rate`

Soit 12 colonnes sur 17 — **5 colonnes inutilement chargées** dont le dead join `channel_pricing`.

### 4.2 `select('*')` sur `addresses` (hook `use-organisation-addresses-bo.ts`)

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-organisation-addresses-bo.ts` ligne 95

```typescript
const baseQuery = supabase
  .from('addresses')
  .select('*') // ← colonnes inconnues, potentiellement nombreuses
  .eq('owner_type', 'organisation')
  .eq('owner_id', organisationId);
```

Aussi : `invalidateQueries` sans `await` dans ce même fichier (confirmé par l'audit précédent du 2026-03-11).

### 4.3 `select('*')` pour count dans `use-linkme-enseignes.ts` ligne 385

```typescript
.select('*', { count: 'exact', head: true })
```

Ce pattern est correct (`head: true` ne ramène pas les données) — **faux positif, pas un problème**.

### 4.4 `select('*')` dans `use-linkme-storage.ts` ligne 450

```typescript
.from('storage_pricing_tiers')
.select('*')
```

Mineur mais toutes les colonnes de `storage_pricing_tiers` sont chargées alors que seul un sous-ensemble est probablement utilisé.

### 4.5 `select()` sans colonnes dans `SelectionsSection.tsx` ligne 327

```typescript
.select()
.single();
```

Après un `update()`, `.select()` sans arguments ramène toutes les colonnes. Pattern d'overfetch post-mutation.

---

## 5. Hook `useLinkMeAnalytics` — Pattern Legacy useState+useEffect (IMPORTANT)

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-analytics.ts`

```typescript
// ❌ PATTERN PROSCRIT selon .claude/rules/frontend/async-patterns.md
export function useLinkMeAnalytics(...) {
  const [data, setData] = useState<LinkMeAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => { ... }, [...]);

  useEffect(() => {
    void fetchAnalytics().catch(...);
  }, [fetchAnalytics]);
}
```

**Problèmes** :

1. Pattern `useState + useEffect + fetch` explicitement proscrit par `.claude/rules/frontend/async-patterns.md`
2. Pas de `staleTime` → re-fetch à chaque montage du composant
3. Pas de cache React Query → si deux composants utilisent `useLinkMeAnalytics`, deux requêtes réseau parallèles
4. Requêtes exécutées **séquentiellement** (fetch commissions, puis fetch sélections) au lieu d'être parallèles avec `Promise.all`
5. Le hook fait des calculs d'agrégation côté client (6 `.filter().reduce()` sur le tableau `commissions`) que PostgreSQL pourrait faire

Ce hook devrait être migré vers `useQuery` (React Query) avec un `queryFn` approprié.

---

## 6. Hook `useLinkMeDashboard` — Charge toutes les commandes en mémoire (IMPORTANT)

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-dashboard.ts`

```typescript
// KPI 1 & 4: CA + Orders count
const { data: allOrders } = await supabase
  .from('linkme_orders_with_margins')
  .select('id, total_ht, total_affiliate_margin, created_at')
  .order('created_at', { ascending: true })
  .returns<LinkMeOrderWithMargins[]>(); // ← PAS de limit, PAS de filtre date
```

**Problèmes** :

1. Charge **toutes les commandes LinkMe depuis l'origine** (134 actuellement, croissance illimitée) pour calculer une moyenne mensuelle côté client
2. La vue `linkme_orders_with_margins` est déjà une vue complexe (dépend de `linkme_orders_enriched` qui fait 4 LEFT JOIN + `linkme_order_items_enriched` qui fait 4 autres LEFT JOIN + `linkme_commissions`)
3. Le filtrage du mois courant et le calcul de moyenne sont faits en JavaScript au lieu de PostgreSQL
4. `refetchInterval: 120000` (toutes les 2 minutes) + `refetchIntervalInBackground: false` — acceptable mais avec la charge de la vue, c'est lourd

**Calcul de complexité** : Pour chaque appel au dashboard, `linkme_orders_with_margins` génère :

- 1 scan de `sales_orders` (134 lignes filtrées par channel_id)
- Pour chaque order : 1 lookup dans `linkme_order_items_enriched` (qui fait lui-même 4 LEFT JOIN)
- 1 LEFT JOIN `linkme_commissions`
- Total estimé : ~800+ operations pour 134 commandes

**Alternative recommandée** : Créer une RPC `get_linkme_dashboard_kpis(p_month DATE)` qui calcule directement les 4 KPIs en SQL, avec une seule passe sur les données.

---

## 7. Hook `useLinkMeEnseignes` — Select('\*') orphelin sur `linkme_selections` (INFO)

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-enseignes.ts` ligne 98

```typescript
supabase.from('linkme_selections').select('affiliate_id'),
```

Seule la colonne `affiliate_id` est demandée — **correct, pas d'overfetch ici**. C'est le pattern recommandé.

Mais plus bas, `useLinkMeEnseignesStats` appelle `fetchEnseignesWithStats()` qui elle-même déclenche les 3 requêtes parallèles. Si `useLinkMeEnseignes` et `useLinkMeEnseignesStats` sont montés simultanément, `fetchEnseignesWithStats` est appelée **deux fois** (queryKey différentes : `['linkme-enseignes']` vs `['linkme-enseignes-stats']`). Duplication de charge.

---

## 8. Dead Code lié à l'ancien modèle de pricing (INFO)

### 8.1 Terminologie "taux de marque" dans l'UI

Les occurrences trouvées dans l'UI :

- `use-linkme-selections.ts` ligne 547 : commentaire JSDoc "Mettre à jour le taux de marque d'un produit"
- `selections/[id]/page.tsx` lignes 611, 812, 815 : labels UI "taux de marque"
- `SelectionProductDetailModal.tsx` lignes 115, 181 : commentaires de calcul

**Diagnostic** : En DB, la colonne s'appelle `margin_rate` (taux de marge). Le terme "taux de marque" dans l'UI est une **incohérence terminologique** héritée, pas du dead code. Les calculs restent corrects car ils utilisent `margin_rate` en DB.

Il n'existe pas de colonne `markup_rate` ou `taux_de_marque` en DB — l'ancien modèle pricing a bien été nettoyé au niveau schema.

### 8.2 `channel_pricing` — Table vivante mais contenu suspect

- **49 entrées** pour le canal LinkMe
- Commission moyenne : 61% (aberrant — probablement des données de test)
- La vue `linkme_order_items_enriched` expose `commission_rate` via cette table mais **aucune page ne semble consommer cette colonne** pour un calcul réel
- La commission réelle passe par `margin_rate` dans `linkme_selection_items`

`channel_pricing` pour LinkMe semble être du **dead data** (données jamais lues en pratique), mais la table est active. À confirmer avec Romeo.

### 8.3 `_totalRetrocession` variable inutilisée dans `use-linkme-orders.ts`

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-orders.ts` ligne 527

```typescript
let _totalRetrocession = 0;
// ...
_totalRetrocession +=
  item.unit_price_ht * item.quantity * item.retrocession_rate;
```

La variable `_totalRetrocession` (préfixée `_` pour indiquer qu'elle est intentionnellement inutilisée) est calculée mais **jamais utilisée**. Le calcul en lui-même est potentiellement faux aussi (utilise `unit_price_ht` qui inclut déjà la commission, au lieu de `selling_price_ht_locked`). Cette variable est du dead code résiduel.

---

## 9. Modèle de calcul de prix — Cohérence après migration 2026-03-18

### Constat : 3 chemins de création de commande

| Chemin                    | Fonction                                          | Prix calculé                                  |
| ------------------------- | ------------------------------------------------- | --------------------------------------------- |
| Back-office via RPC       | `create_affiliate_order()`                        | `selling_price_ht * (1 + margin_rate/100)` ✅ |
| Site public via RPC       | `create_public_linkme_order()`                    | `selling_price_ht * (1 + margin_rate/100)` ✅ |
| Back-office direct (hook) | `createLinkMeOrder()` dans `use-linkme-orders.ts` | `unit_price_ht * (1 + retrocession_rate)` ⚠️  |

Le hook `createLinkMeOrder` (ligne 532-542) calcule `clientUnitPrice = Math.round(item.unit_price_ht * (1 + item.retrocession_rate) * 100) / 100` où `item.unit_price_ht` provient du formulaire. Si le formulaire envoie déjà `selling_price_ht` (prix Verone), la formule est correcte. Mais si le formulaire envoie un `unit_price_ht` qui **inclut déjà** la commission (cas après la migration 2026-03-18), le prix client est double-compté.

**Risque** : Ce chemin est distinct des 2 RPCs et ne passe pas par `create_affiliate_order()`. La logique de calcul doit être auditée côté UI pour vérifier ce que le formulaire `CreateLinkMeOrderModal.tsx` envoie réellement comme `unit_price_ht`.

### `calculate_retrocession_amount()` — Deux branches de calcul

```sql
-- Branche 1 : produit catalogue (linkme_selection_item_id présent)
retrocession_amount = selling_price_ht * (margin_rate / 100) * quantity  ✅

-- Branche 2 : produit affilié (pas de selection_item_id)
retrocession_amount = (unit_price_ht * quantity) * (retrocession_rate / 100)  ⚠️
```

La branche 2 utilise `retrocession_rate / 100`. Si `retrocession_rate` est stocké en décimal (0.10 pour 10%), cette division par 100 donne 0.001 — commission 100× trop faible. Si `retrocession_rate` est stocké en % entier (10 pour 10%), le calcul est correct.

Le schéma DB montre `retrocession_rate` avec default `0.00` (forme décimale). Dans `create_affiliate_order()`, l'insertion est `v_selection_item.margin_rate / 100` (conversion % → décimal). Donc `retrocession_rate = 0.10` en DB pour 10%.

Dans la branche 2 du trigger : `(unit_price_ht * quantity) * (retrocession_rate / 100)` = `(unit_price_ht * quantity) * 0.001` — **ERREUR** si `retrocession_rate` est en décimal. La commission serait 100× sous-estimée pour les produits affiliés.

**Ce bug n'affecte que les produits créés par l'affilié (`is_affiliate_product = true`)**, pas les produits catalogue.

---

## Recommandations Prioritaires

### CRITIQUE

**[PRICING-001]** Fusionner `recalculate_sales_order_totals` et `update_sales_order_affiliate_totals` en un seul trigger pour éliminer le double UPDATE sur `sales_orders`. Sur une commande à 5 lignes, cela représente 10 UPDATE → 5 UPDATE, réduisant la cascade de 50%.

- Déléguer à `database-architect`
- Migration requise (modifier fonction + supprimer un trigger)

### IMPORTANT

**[PRICING-002]** Corriger `update_sales_order_affiliate_totals` : ajouter `SET search_path = public` et évaluer si `SECURITY DEFINER` est nécessaire pour protéger les totaux financiers.

**[PRICING-003]** Corriger `create_linkme_commission_on_order_update` : ajouter `SET search_path = public`.

**[PRICING-004]** Vérifier la branche 2 de `calculate_retrocession_amount()` pour les produits affiliés (`retrocession_rate / 100` potentiellement erroné). Confirmer avec des données réelles si des commandes `is_affiliate_product` existent et si leurs `retrocession_amount` sont cohérentes.

**[PRICING-005]** Refactorer `useLinkMeDashboard` : remplacer le fetch de toutes les commandes par une RPC `get_linkme_dashboard_kpis()` côté SQL. Éliminer le calcul de moyenne mensuelle en JavaScript.

**[PRICING-006]** Refactorer `useLinkMeAnalytics` : migrer de `useState+useEffect` vers `useQuery` (React Query). Paralléliser les requêtes avec `Promise.all`. Déléguer les agrégations à PostgreSQL.

**[PRICING-007]** Remplacer `select('*')` dans `commandes/[id]/page.tsx` ligne 604 par les 12 colonnes réellement nécessaires (éliminer le dead join `channel_pricing`).

**[PRICING-008]** Supprimer la jointure `LEFT JOIN channel_pricing` de `linkme_order_items_enriched` si `commission_rate` n'est consommée par aucun composant actif. Confirmer avec `Grep` sur tous les consommateurs de la vue.

### SUGGESTION

**[PRICING-009]** Nettoyer la variable `_totalRetrocession` dans `createLinkMeOrder` (`use-linkme-orders.ts` ligne 527) — dead code.

**[PRICING-010]** Clarifier la terminologie "taux de marque" dans les labels UI pour l'aligner sur "taux de marge" (= `margin_rate` en DB). Purement cosmétique, aucun impact fonctionnel.

**[PRICING-011]** Vérifier et documenter l'utilité de `channel_pricing` pour le canal LinkMe (49 entrées avec une commission moyenne de 61% semble incohérent). Si la table n'est pas utilisée en pratique pour les calculs, la supprimer de la vue.

**[PRICING-012]** `useLinkMeEnseignesStats` recharge `fetchEnseignesWithStats()` au lieu de consommer le cache de `useLinkMeEnseignes`. Unifier sous la même `queryKey` avec un sélecteur.

---

## Résumé des colonnes DB critiques auditées

| Colonne                   | Table                               | Statut                                                      |
| ------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `retrocession_rate`       | `sales_order_items`                 | Actif, stocké en décimal (0.10 = 10%)                       |
| `retrocession_amount`     | `sales_order_items`                 | Actif, calculé par trigger BEFORE                           |
| `base_price_ht_locked`    | `sales_order_items`                 | Actif, verrouillé à la validation                           |
| `selling_price_ht_locked` | `sales_order_items`                 | Actif, verrouillé à la validation                           |
| `price_locked_at`         | `sales_order_items`                 | Actif, timestamp du verrouillage                            |
| `discount_percentage`     | `sales_order_items`                 | Présent, default 0, rarement utilisé en LinkMe              |
| `affiliate_total_ht`      | `sales_orders`                      | Actif, mis à jour par `update_sales_order_affiliate_totals` |
| `commission_rate`         | `linkme_order_items_enriched` (vue) | Suspect — source `channel_pricing` non maintenue            |
