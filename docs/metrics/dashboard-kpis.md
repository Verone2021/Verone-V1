# Dashboard KPIs - Vérone Back Office

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Phase** : 5 - Métriques et Monitoring
**Mainteneur** : Vérone Documentation Team

---

## Table des matières

- [Vue d'Ensemble](#vue-densemble)
- [Hooks Métriques Catalogue](#hooks-métriques-catalogue)
- [Hooks Métriques Stock](#hooks-métriques-stock)
- [Hooks Métriques Commandes & Revenue](#hooks-métriques-commandes--revenue)
- [Hooks Métriques Activité](#hooks-métriques-activité)
- [Hooks Métriques Agrégés](#hooks-métriques-agrégés)
- [Performance & Troubleshooting](#performance--troubleshooting)

---

## Vue d'Ensemble

Le système de métriques Vérone repose sur **16 hooks React** qui récupèrent des KPIs en temps réel depuis Supabase pour alimenter les dashboards CRM/ERP.

### Architecture Globale

```
Dashboard Principal → 16 Hooks Métriques → Supabase (Tables + RPC + Triggers)
```

**Principes** :

- **Performance First** : SLA <2s via RPC optimisées
- **Real-time** : Données Supabase réelles (pas mock)
- **Fallback** : Requêtes SQL si RPC indisponible
- **Error Handling** : Valeurs défaut non-bloquantes

---

## Hooks Métriques Catalogue

### 1. use-product-metrics

**Fichier** : `apps/back-office/apps/back-office/src/hooks/metrics/use-product-metrics.ts`

**Description** : Statistiques produits catalogue (total, actifs, inactifs, brouillons) avec tendance 7j.

**Interface** :

```typescript
{ total, active, inactive, draft, trend: number }
```

**Formule Trend** :

```
trend = ((recent7d - previous7d) / previous7d) × 100
- recent7d: COUNT(products WHERE created_at >= NOW() - 7d)
- previous7d: COUNT(products WHERE created_at BETWEEN NOW() - 14d AND NOW() - 7d)
Edge case: previous7d = 0 ET recent7d > 0 → trend = 100%
```

**Sources** : `products` (status, created_at)

**Mapping Statuts** :

- active: `status IN ('in_stock')`
- inactive: `status IN ('out_of_stock', 'discontinued')`
- draft: `status IN ('coming_soon', 'preorder')`

**Optimisation** : RPC `get_products_status_metrics` ou parallel queries

**SLA** : <500ms | **Utilisé par** : Dashboard catalogue

---

### 2. use-user-metrics

**Fichier** : `apps/back-office/apps/back-office/src/hooks/metrics/use-user-metrics.ts`

**Description** : Stats utilisateurs (actifs 30j, nouveaux 7j, par rôle).

**Interface** :

```typescript
{ total, active, new, byRole: {admin, catalog_manager, sales, partner_manager}, trend }
```

**Formule Trend** :

```
trend = (new / total) × 100
- new: COUNT(user_profiles WHERE created_at >= NOW() - 7d)
- active: COUNT(user_profiles WHERE last_sign_in_at >= NOW() - 30d)
```

**Sources** : `user_profiles` (role, created_at, last_sign_in_at)

**Permissions** :

- Owner : ✅ Toutes métriques + Export CSV/PDF
- Admin : ✅ Agrégats seulement (pas détails utilisateurs)
- Autres : ❌ Non autorisé

**SLA** : <800ms | **Utilisé par** : Dashboard admin

---

### 3. use-real-dashboard-metrics

**Fichier** : `apps/back-office/apps/back-office/src/hooks/use-real-dashboard-metrics.ts`

**Description** : Métriques Phase 1 Catalogue réelles (produits, collections, variant groups).

**Interface** :

```typescript
{
  products: { total, active, published, trend },
  collections: { total, active },
  variantGroups: { total }
}
```

**Sources** :

- `products` : id, status, is_published | Filtre: `archived_at IS NULL`
- `collections` : id, is_active | Filtre: `deleted_at IS NULL`
- `variant_groups` : id | Filtre: `deleted_at IS NULL`

**Base de** : `use-complete-dashboard-metrics`

**SLA** : <1s

---

## Hooks Métriques Stock

### 4. use-stock-metrics

**Fichier** : `apps/back-office/apps/back-office/src/hooks/metrics/use-stock-metrics.ts`

**Description** : Métriques inventaire (in/out/low/critical stock) + TOP 10 alertes.

**Interface** :

```typescript
{ inStock, outOfStock, lowStock, critical, alerts: StockAlert[] }
```

**Classification Stock** :

```
FOR EACH product:
  stock = stock_real || stock_quantity
  min = min_stock || 5

  IF stock = 0: status = 'rupture'
  ELSE IF 0 < stock ≤ 2: status = 'critique'
  ELSE IF 0 < stock ≤ min: status = 'faible'
  ELSE: status = 'ok'
```

**Sources** :

- `products` : stock_quantity, stock_real, min_stock
- `stock_alerts_view` (vue matérialisée) : alert_status, alert_priority

**Optimisation** : RPC `get_stock_metrics_optimized` + filtrage JS (PostgREST limite comparaisons colonnes)

**Alertes** : Tri par `stock_quantity ASC, alert_priority DESC` LIMIT 10

**SLA** : <1s | **Utilisé par** : Dashboard Stock

---

### 5. use-stock-dashboard

**Fichier** : `apps/back-office/apps/back-office/src/hooks/use-stock-dashboard.ts`

**Description** : Dashboard ERP Stock professionnel (vue d'ensemble + mouvements + alertes + timeline).

**Interface** :

```typescript
{
  overview: StockOverview,  // Valeur stock, quantités, prévisionnels
  movements: MovementsSummary,  // 7 derniers jours
  low_stock_products: LowStockProduct[],
  recent_movements: RecentMovement[],
  incoming_orders: ForecastedOrder[],  // TOP 5 PO
  outgoing_orders: ForecastedOrder[]   // TOP 5 SO
}
```

**Formules Clés** :

**Valeur Totale Stock** :

```
total_value = SUM(stock_real × cost_price)
Calculé en JS après requête
```

**Stock Disponible Prévisionnel** :

```
total_available = SUM(MAX(stock_real - stock_forecasted_out, 0))
```

**Mouvements 7 Jours** :

```
entries: COUNT(stock_movements WHERE movement_type = 'IN' AND affects_forecast = false)
exits: COUNT(stock_movements WHERE movement_type = 'OUT')
adjustments: COUNT(stock_movements WHERE movement_type = 'ADJUST')
```

**Sources** :

- `products` : stock_real, cost_price, min_stock, stock_forecasted_in/out
- `stock_alerts_view` : Comptage ruptures/alertes
- `stock_movements` : movement_type, quantity_change, performed_at

**Auto-refresh** : useEffect montage + option refresh 5min

**SLA** : <2s | **Utilisé par** : Page `/stock`

---

### 6. use-stock-alerts

**Fichier** : `apps/back-office/apps/back-office/src/hooks/use-stock-alerts.ts`

**Description** : Système alertes stock intelligent 3 niveaux (low/out/ordered without stock).

**Types Alertes** :

```typescript
type StockAlertType = 'low_stock' | 'out_of_stock' | 'no_stock_but_ordered';
severity: 'critical' | 'warning' | 'info';
```

**Règles Business** :

1. **NO_STOCK_BUT_ORDERED** (critical) : `stock_real ≤ 0 AND stock_forecasted_out > 0`
   - Récupère commandes liées depuis `sales_orders`
2. **OUT_OF_STOCK** (critical) : `stock_real ≤ 0 AND stock_forecasted_out = 0`
3. **LOW_STOCK** (warning) : `0 < stock_real < min_stock`

**Formule Shortage** :

```
shortage_quantity = CASE alert_type:
  'no_stock_but_ordered' → stock_forecasted_out
  'out_of_stock' → min_stock
  'low_stock' → min_stock - stock_real
```

**Helpers** :

```typescript
const { criticalAlerts, warningAlerts, getAlertsByType } = useStockAlerts();
```

**SLA** : <1.5s (joins commandes)

---

## Hooks Métriques Commandes & Revenue

### 7. use-revenue-metrics

**Fichier** : `apps/back-office/apps/back-office/src/hooks/metrics/use-revenue-metrics.ts`

**Description** : CA (today/month/year), tendance mensuelle, Average Order Value.

**Interface** :

```typescript
{ today, month, year, trend, averageOrderValue: number }
```

**Formules** :

**Revenue Trend** :

```
trend = ((currentMonth - previousMonth) / previousMonth) × 100
Statuts validés: 'confirmed', 'partially_shipped', 'shipped', 'delivered'
```

**AOV (Panier Moyen)** :

```
AOV = monthRevenue / monthOrdersCount
Edge case: monthOrdersCount = 0 → AOV = 0
Arrondi: 2 décimales (centimes)
```

**Sources** : `sales_orders` (total_ht, created_at, status)

**Exclusions** : Commandes `draft` et `cancelled` non comptabilisées

**SLA** : <1s

---

### 8. use-order-metrics

**Fichier** : `apps/back-office/apps/back-office/src/hooks/metrics/use-order-metrics.ts`

**Description** : Stats commandes par statut + tendance 30j + 5 commandes récentes.

**Interface** :

```typescript
{
  pending, processing, completed, cancelled,
  trend,
  recentOrders: [{ id, customer, amount, status }]
}
```

**Mapping Statuts** :

```
pending = COUNT WHERE status IN ('draft', 'confirmed')
processing = COUNT WHERE status = 'partially_shipped'
completed = COUNT WHERE status IN ('shipped', 'delivered')
cancelled = COUNT WHERE status = 'cancelled'
```

**Formule Trend** :

```
trend = ((current30d - previous30d) / previous30d) × 100
current30d: COUNT WHERE created_at >= NOW() - 30d
previous30d: COUNT WHERE created_at BETWEEN NOW() - 60d AND NOW() - 30d
```

**Enrichissement Clients** :

```
IF customer_type = 'organization':
  customer = organisations.name
ELSE IF customer_type = 'individual':
  customer = individual_customers.first_name + last_name
ELSE: 'Client inconnu'
```

**Sources** :

- `sales_orders` : order_number, status, total_ht, customer_type, customer_id
- `organisations` : name
- `individual_customers` : first_name, last_name

**SLA** : <1.5s (joins async)

---

### 9. use-stock-orders-metrics

**Fichier** : `apps/back-office/apps/back-office/src/hooks/use-stock-orders-metrics.ts`

**Description** : Hook Phase 2 Stock/Sourcing (stock_value, PO count, revenue, sourcing).

**Interface** :

```typescript
{
  (stock_value, purchase_orders_count, month_revenue, products_to_source);
}
```

**Formules** :

```
stock_value = SUM(stock_real × cost_price)  // Même formule use-stock-dashboard
month_revenue = SUM(sales_orders.total_ht WHERE month & status validated)
```

**Sources** :

- `products` : stock_real, cost_price
- `purchase_orders` : id
- `sales_orders` : total_ht, created_at, status

**SLA** : <1s

---

## Hooks Métriques Activité

### 10. use-activity-metrics

**Fichier** : `apps/back-office/apps/back-office/src/hooks/metrics/use-activity-metrics.ts`

**Description** : Activité système (produits/collections/users créés/modifiés) aujourd'hui vs hier + timeline.

**Interface** :

```typescript
{
  today, yesterday, trend,
  recentActions: RecentAction[]
}
```

**Formule Trend** :

```
trend = ((today - yesterday) / yesterday) × 100
today: COUNT(actions WHERE created_at >= START_OF_TODAY)
yesterday: COUNT(actions WHERE created_at BETWEEN YESTERDAY START/END)

Actions = products created/updated + collections created/updated + users registered
```

**Sources** :

- `products` : created_at, updated_at
- `collections` : created_at, updated_at
- `user_profiles` : created_at

**Timeline** : TOP 10 dernières actions (tri timestamp DESC)

**SLA** : <800ms

---

### 11. use-user-activity-tracker

**Fichier** : `apps/back-office/apps/back-office/src/hooks/use-user-activity-tracker.ts`

**Description** : Tracking comportemental avec batching (clics, navigation, recherches, erreurs JS).

**Configuration** :

```
BATCH_SIZE = 10
BATCH_INTERVAL = 30000ms (30s)
```

**Événements Trackés** :

- Auto : `page_view`, `user_click` (throttle 1/s), `javascript_error`, `promise_rejection`
- Manuel : `trackFormSubmit`, `trackSearch`, `trackFilterApplied`, `trackPerformanceMetric`

**Session Tracking** :

```typescript
{
  start_time: (Date.now(),
    page_views,
    actions_count,
    last_activity,
    current_page);
}
sessionId = crypto.randomUUID(); // Unique par session
```

**Metadata Auto-enrichies** :

```
page_url, user_agent, session_duration, element_target, click_position, etc.
```

**Trigger DB** : Insertion → `trigger_update_session_on_activity` → MAJ `user_sessions`

**Formule Engagement** : Voir `database-triggers.md`

**Flush** : Auto tous les 30s OU après 10 événements

**SLA** : <50ms buffer client, <200ms batch insert

---

### 12. use-recent-activity

**Fichier** : `apps/back-office/apps/back-office/src/hooks/use-recent-activity.ts`

**Description** : Timeline activité récente utilisateur pour dashboard (RPC `get_user_recent_actions`).

**Interface** :

```typescript
TimelineItem[] : {
  id, type: 'order'|'product'|'stock'|'customer'|'system',
  title, description, timestamp, user, severity
}
```

**Mapping Actions → Timeline** :

```
'create_product' → type='product', title='Nouveau produit créé'
'update_order' → type='order', title='Commande mise à jour'
'stock_movement' → type='stock', title='Mouvement de stock'
'page_view' → type='system', description='Navigation: dashboard › catalogue'
```

**RPC Function** :

```sql
get_user_recent_actions(p_user_id uuid, p_limit int)
SELECT action, page_url, table_name, record_id, severity, created_at
FROM user_activity_logs
WHERE user_id = p_user_id
ORDER BY created_at DESC LIMIT p_limit
```

**SLA** : <300ms (index `user_id, created_at`)

---

## Hooks Métriques Agrégés

### 13. use-complete-dashboard-metrics

**Fichier** : `apps/back-office/apps/back-office/src/hooks/use-complete-dashboard-metrics.ts`

**Description** : Orchestrateur Phase 1 + Phase 2 (catalogue + stock/orders/sourcing).

**Composition** :

```
useCompleteDashboardMetrics() {
  catalogueMetrics = useRealDashboardMetrics()
  organisations = useOrganisations()
  stockOrdersMetrics = useStockOrdersMetrics()
  salesOrdersCount = custom query

  return { catalogue, organisations, stocks, orders, sourcing }
}
```

**Interface Complète** :

```typescript
{
  catalogue: { totalProducts, activeProducts, publishedProducts, collections, variantGroups, trend },
  organisations: { totalOrganisations, suppliers, customersB2B, partners },
  stocks: { totalValue, lowStockItems, recentMovements },
  orders: { purchaseOrders, salesOrders, monthRevenue },
  sourcing: { productsToSource, samplesWaiting }
}
```

**Calculs Organisations** :

```
organisationsOnly = filter(o => type !== 'customer' OR customer_type !== 'individual')
suppliers = COUNT WHERE type = 'supplier'
customersB2B = COUNT WHERE type = 'customer' AND customer_type = 'professional'
```

**Loading** : `isLoading = catalogueLoading OR organisationsLoading OR stockOrdersLoading OR salesOrdersLoading`

**SLA** : <2.5s (agrégation 4 hooks)

---

### 14. use-dashboard-analytics

**Fichier** : `apps/back-office/apps/back-office/src/hooks/use-dashboard-analytics.ts`

**Description** : Données temporelles pour 4 graphiques Recharts (30 derniers jours).

**Interface** :

```typescript
{
  revenue: RevenueDataPoint[],  // CA par jour
  products: ProductsDataPoint[],  // Produits par semaine
  stockMovements: StockMovementDataPoint[],  // Entrées/sorties par jour
  purchaseOrders: PurchaseOrderDataPoint[]  // PO par semaine
}
```

**Formules Agrégation** :

**1. Revenue Chart** :

```
revenueByDay = sales_orders.reduce((acc, order) => {
  date = order.created_at.split('T')[0]
  acc[date] += order.total_ttc
}, {})
→ [{ date: "12 Oct", revenue: 1250 }, ...]
```

**2. Products Chart** :

```
productsByWeek = products.reduce((acc, p) => {
  weekStart = getWeekStart(p.created_at)
  acc[weekStart] += 1
}, {})
→ [{ week: "S2", count: 5 }, ...]
```

**3. Stock Movements Chart** :

```
movementsByDay[date] = { entrees: 0, sorties: 0 }
IF movement_type IN ('in', 'purchase_order'): entrees += ABS(quantity_change)
IF movement_type IN ('out', 'sales_order'): sorties += ABS(quantity_change)
```

**4. Purchase Orders Chart** :

```
purchaseByWeek = purchase_orders.reduce((acc, po) => {
  weekStart = getWeekStart(po.created_at)
  acc[weekStart] += po.total_ht
}, {})
```

**Sources** :

- `sales_orders` : created_at, total_ttc | Période: ≥NOW()-30d | Exclusion: status='cancelled'
- `products` : created_at
- `stock_movements` : created_at, quantity_change, movement_type
- `purchase_orders` : created_at, total_ht

**SLA** : <3s (4 requêtes parallèles + agrégations JS)

---

## Hooks Métriques Utilitaires

### 15. use-stock-alerts-count

**Fichier** : `apps/back-office/apps/back-office/src/hooks/use-stock-alerts-count.ts`

**Description** : Compteur rapide alertes stock (badge navigation).

**Interface** : `{ count: number }`

**Formule** : `COUNT(stock_alerts_view WHERE alert_status IN ('low_stock', 'out_of_stock', 'no_stock_but_ordered'))`

**SLA** : <200ms (COUNT simple)

---

### 16. use-dashboard-notifications

**Fichier** : `apps/back-office/apps/back-office/src/hooks/use-dashboard-notifications.ts`

**Description** : Notifications temps réel dashboard (nouveaux messages, alertes critiques).

**Interface** :

```typescript
{
  unreadCount, notifications: Notification[]
}
```

**Sources** : `notifications` table (status='unread', created_at DESC)

**SLA** : <500ms

---

## Performance & Troubleshooting

### Stratégie RPC vs SQL

**Pattern** :

```typescript
try {
  const { data } = await supabase.rpc('optimized_function');
  if (data) return data;
} catch {
  // Fallback SQL
  const results = await Promise.all([...parallelQueries]);
  return computeMetrics(results);
}
```

**RPC Functions** :

- `get_products_status_metrics`, `get_stock_metrics_optimized`
- `get_user_recent_actions`, `calculate_engagement_score`

### SLA Performance

| Hook                | SLA Cible | Optimisations                  |
| ------------------- | --------- | ------------------------------ |
| Product Metrics     | <500ms    | RPC + COUNT head-only          |
| Stock Metrics       | <1s       | RPC + parallel queries         |
| Revenue Metrics     | <1s       | SUM agrégations simples        |
| Dashboard Analytics | <3s       | 4 queries parallèles           |
| Stock Dashboard     | <2s       | Vue stock_alerts + agrégats JS |

### Troubleshooting

**Trend = undefined%** :

```typescript
trend = Number.isFinite(trend) ? Math.round(trend * 10) / 10 : 0;
```

**RPC not found** : Hook utilise fallback SQL automatiquement

**Stock metrics lents** : Créer vue matérialisée + index sur `stock_quantity, min_stock`

**Recent activity vide** : Vérifier `use-user-activity-tracker` monté + table `user_activity_logs` contient données

**Dashboard loading infini** : Debug loading states + timeout 10s

---

**Retour** : [Documentation Métriques](/Users/romeodossantos/verone-back-office-V1/docs/metrics/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
