# Formules de Calcul - Vérone

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Phase** : 5 - Métriques et Monitoring
**Mainteneur** : Vérone Documentation Team

---

## Table des matières

- [Vue d'Ensemble](#vue-densemble)
- [Formules Trends (5)](#formules-trends-5)
- [Formules Stock (4)](#formules-stock-4)
- [Formules Revenue & Orders (3)](#formules-revenue--orders-3)
- [Formules Engagement (2)](#formules-engagement-2)
- [Formules Alertes (3)](#formules-alertes-3)
- [Formules Agrégation (4)](#formules-agrégation-4)
- [Edge Cases & Validation](#edge-cases--validation)

---

## Vue d'Ensemble

Ce document répertorie **21 formules mathématiques** utilisées dans le système Vérone pour calculer KPIs, trends, et métriques business.

**Conventions** :
- Arrondi trends : 1 décimale (`Math.round(trend * 10) / 10`)
- Arrondi montants : 2 décimales (`Math.round(amount * 100) / 100`)
- Division par zéro : Retourne 0 (pas d'erreur)
- Valeurs négatives : `MAX(value, 0)` pour stocks disponibles

---

## Formules Trends (5)

### 1. Product Trend (7 jours glissants)

**Formule** :
```
trend = ((recent7d - previous7d) / previous7d) × 100

Variables:
- recent7d: COUNT(products WHERE created_at >= NOW() - 7 days)
- previous7d: COUNT(products WHERE created_at BETWEEN NOW() - 14 days AND NOW() - 7 days)
```

**Implémentation TypeScript** :
```typescript
const today = new Date()
const sevenDaysAgo = new Date(today)
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
const fourteenDaysAgo = new Date(today)
fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

const { count: recentCount } = await supabase
  .from('products')
  .select('id', { count: 'exact', head: true })
  .gte('created_at', sevenDaysAgo.toISOString())

const { count: previousCount } = await supabase
  .from('products')
  .select('id', { count: 'exact', head: true })
  .gte('created_at', fourteenDaysAgo.toISOString())
  .lt('created_at', sevenDaysAgo.toISOString())

let trend = 0
if (previousCount > 0) {
  trend = ((recentCount - previousCount) / previousCount) * 100
} else if (recentCount > 0) {
  trend = 100  // 100% d'augmentation
}

trend = Number.isFinite(trend) ? Math.round(trend * 10) / 10 : 0
```

**Exemple Calcul** :
```
Input:
- recent7d = 25 produits (7 derniers jours)
- previous7d = 20 produits (7 jours précédents)

Calcul:
trend = ((25 - 20) / 20) × 100 = (5 / 20) × 100 = 25.0%

Output: +25.0%
```

**Edge Cases** :
- `previous7d = 0, recent7d = 0` → trend = 0%
- `previous7d = 0, recent7d > 0` → trend = 100%
- `previous7d > 0, recent7d = 0` → trend = -100%

---

### 2. User Trend (hebdomadaire)

**Formule** :
```
trend = (newUsers7d / totalUsers) × 100

Variables:
- newUsers7d: COUNT(user_profiles WHERE created_at >= NOW() - 7 days)
- totalUsers: COUNT(user_profiles)
```

**Exemple** :
```
Input: newUsers7d = 5, totalUsers = 50

Calcul: trend = (5 / 50) × 100 = 10.0%

Output: +10.0% (croissance hebdomadaire utilisateurs)
```

---

### 3. Activity Trend (quotidien)

**Formule** :
```
trend = ((today - yesterday) / yesterday) × 100

Variables:
- today: COUNT(actions WHERE created_at >= START_OF_TODAY)
- yesterday: COUNT(actions WHERE created_at BETWEEN START_OF_YESTERDAY AND START_OF_TODAY)

Actions = products created/updated + collections created/updated + users registered
```

**Exemple** :
```
Input: today = 45 actions, yesterday = 30 actions

Calcul: trend = ((45 - 30) / 30) × 100 = 50.0%

Output: +50.0% activité vs hier
```

---

### 4. Revenue Trend (mensuel)

**Formule** :
```
trend = ((currentMonth - previousMonth) / previousMonth) × 100

Variables:
- currentMonth: SUM(sales_orders.total_ht WHERE created_at >= START_OF_MONTH AND status IN ('confirmed', 'partially_shipped', 'shipped', 'delivered'))
- previousMonth: SUM(sales_orders.total_ht WHERE created_at BETWEEN START_OF_PREVIOUS_MONTH AND END_OF_PREVIOUS_MONTH AND status IN (...))
```

**Exemple** :
```
Input:
- currentMonth = 15000€ (octobre 2025)
- previousMonth = 12000€ (septembre 2025)

Calcul: trend = ((15000 - 12000) / 12000) × 100 = 25.0%

Output: +25.0% CA vs mois précédent
```

---

### 5. Order Trend (30 jours glissants)

**Formule** :
```
trend = ((current30d - previous30d) / previous30d) × 100

Variables:
- current30d: COUNT(sales_orders WHERE created_at >= NOW() - 30 days)
- previous30d: COUNT(sales_orders WHERE created_at BETWEEN NOW() - 60 days AND NOW() - 30 days)
```

**Exemple** :
```
Input: current30d = 120 commandes, previous30d = 100 commandes

Calcul: trend = ((120 - 100) / 100) × 100 = 20.0%

Output: +20.0% commandes vs période précédente
```

---

## Formules Stock (4)

### 6. Stock Value (Valeur Inventaire)

**Formule** :
```
stock_value = SUM(stock_real × cost_price)

Pour chaque produit:
  value = (stock_real || stock_quantity || 0) × (cost_price || 0)

Total = SUM(value pour tous produits non archivés)
```

**Implémentation** :
```typescript
const { data: products } = await supabase
  .from('products')
  .select('stock_real, stock_quantity, cost_price')
  .is('archived_at', null)

const totalValue = products.reduce((sum, p) =>
  sum + ((p.stock_real || p.stock_quantity || 0) * (p.cost_price || 0)),
  0
)
```

**Exemple** :
```
Input (3 produits):
- Produit A: stock_real = 10, cost_price = 50€ → value = 500€
- Produit B: stock_real = 5, cost_price = 120€ → value = 600€
- Produit C: stock_real = 0, cost_price = 80€ → value = 0€

Total stock_value = 500 + 600 + 0 = 1100€
```

---

### 7. Stock Available (Prévisionnel)

**Formule** :
```
total_available = SUM(MAX(stock_real - stock_forecasted_out, 0))

Pour chaque produit:
  available = MAX(stock_real - stock_forecasted_out, 0)
  // Évite stocks négatifs
```

**Exemple** :
```
Input:
- Produit A: stock_real = 20, stock_forecasted_out = 5 → available = MAX(20-5, 0) = 15
- Produit B: stock_real = 3, stock_forecasted_out = 10 → available = MAX(3-10, 0) = 0
- Produit C: stock_real = 50, stock_forecasted_out = 0 → available = MAX(50-0, 0) = 50

Total available = 15 + 0 + 50 = 65 unités disponibles
```

---

### 8. Classification Stock Status

**Formule** :
```
FOR EACH product:
  stock = stock_real || stock_quantity
  min = min_stock || 5  // Seuil par défaut

  IF stock = 0:
    status = 'rupture'
    severity = 'critical'
  ELSE IF stock > 0 AND stock ≤ 2:
    status = 'critique'
    severity = 'critical'
  ELSE IF stock > 0 AND stock ≤ min:
    status = 'faible'
    severity = 'warning'
  ELSE:
    status = 'ok'
    severity = 'info'
```

**Exemple** :
```
Input: stock_real = 3, min_stock = 10

Evaluation:
- stock = 3 (> 0)
- stock ≤ 2? Non
- stock ≤ min_stock (10)? Oui → status = 'faible', severity = 'warning'
```

---

### 9. Shortage Quantity (Quantité à Réapprovisionner)

**Formule** :
```
shortage_quantity = CASE alert_type:
  WHEN 'no_stock_but_ordered':
    = stock_forecasted_out  // Doit couvrir commandes clients
  WHEN 'out_of_stock':
    = min_stock  // Restaurer seuil minimum
  WHEN 'low_stock':
    = min_stock - stock_real  // Combler différence
```

**Exemples** :
```
Cas 1 - Commandé sans stock:
Input: stock_real = 0, stock_forecasted_out = 15, min_stock = 10
Output: shortage_quantity = 15 (priorité absolue)

Cas 2 - Rupture simple:
Input: stock_real = 0, stock_forecasted_out = 0, min_stock = 10
Output: shortage_quantity = 10

Cas 3 - Stock faible:
Input: stock_real = 3, stock_forecasted_out = 0, min_stock = 10
Output: shortage_quantity = 10 - 3 = 7
```

---

## Formules Revenue & Orders (3)

### 10. Average Order Value (AOV / Panier Moyen)

**Formule** :
```
AOV = monthRevenue / monthOrdersCount

Variables:
- monthRevenue: SUM(sales_orders.total_ht WHERE created_at >= START_OF_MONTH AND status IN ('confirmed', 'partially_shipped', 'shipped', 'delivered'))
- monthOrdersCount: COUNT(sales_orders WHERE created_at >= START_OF_MONTH AND status IN (...))
```

**Implémentation** :
```typescript
const averageOrderValue = monthOrders && monthOrders.length > 0
  ? month / monthOrders.length
  : 0

// Arrondi 2 décimales
const aov = Math.round(averageOrderValue * 100) / 100
```

**Exemple** :
```
Input:
- monthRevenue = 45000€
- monthOrdersCount = 30 commandes

Calcul: AOV = 45000 / 30 = 1500.00€

Output: Panier moyen = 1500.00€
```

**Edge Cases** :
- `monthOrdersCount = 0` → AOV = 0€ (évite division par zéro)

---

### 11. Revenue by Status

**Formule** :
```
validatedRevenue = SUM(sales_orders.total_ht WHERE status IN ('confirmed', 'partially_shipped', 'shipped', 'delivered'))

Statuts exclus: 'draft', 'cancelled'
```

**Exemple** :
```
Input (5 commandes):
- SO-001: total_ht = 1000€, status = 'confirmed' ✅
- SO-002: total_ht = 1500€, status = 'shipped' ✅
- SO-003: total_ht = 800€, status = 'draft' ❌
- SO-004: total_ht = 1200€, status = 'delivered' ✅
- SO-005: total_ht = 900€, status = 'cancelled' ❌

validatedRevenue = 1000 + 1500 + 1200 = 3700€
```

---

### 12. Revenue Chart Aggregation (par jour)

**Formule** :
```
revenueByDay = sales_orders.reduce((acc, order) => {
  date = order.created_at.split('T')[0]  // "2025-10-12"
  acc[date] = (acc[date] || 0) + order.total_ttc
  return acc
}, {})

Transform pour Recharts:
[{ date: "12 Oct", revenue: 1250 }, { date: "13 Oct", revenue: 1800 }, ...]
```

**Exemple** :
```
Input (3 commandes):
- SO-001: created_at = "2025-10-12T10:30", total_ttc = 1200€
- SO-002: created_at = "2025-10-12T15:45", total_ttc = 800€
- SO-003: created_at = "2025-10-13T09:00", total_ttc = 1500€

Grouping:
{
  "2025-10-12": 1200 + 800 = 2000€,
  "2025-10-13": 1500€
}

Output Recharts:
[
  { date: "12 Oct", revenue: 2000 },
  { date: "13 Oct", revenue: 1500 }
]
```

---

## Formules Engagement (2)

### 13. Engagement Score (Utilisateur)

**Formule** :
```
engagement_score = (sessions_count × 10) + (actions_count × 2) + (modules_variety × 5)

Normalisé sur 100: LEAST(engagement_score, 100)

Variables:
- sessions_count: COUNT(user_sessions WHERE user_id = p_user_id AND session_start >= NOW() - p_days)
- actions_count: COUNT(user_activity_logs WHERE user_id = p_user_id AND created_at >= NOW() - p_days)
- modules_variety: COUNT(DISTINCT module_key) depuis time_per_module JSONB
```

**Implémentation SQL** :
```sql
v_score := (v_sessions_count * 10) + (v_actions_count * 2) + (v_modules_variety * 5);
RETURN LEAST(v_score, 100);
```

**Exemple** :
```
Input (période 30 jours):
- sessions_count = 5 sessions
- actions_count = 120 actions
- modules_variety = 4 modules (dashboard, catalogue, stocks, commandes)

Calcul:
score = (5 × 10) + (120 × 2) + (4 × 5)
      = 50 + 240 + 20
      = 310

Normalisé: engagement_score = MIN(310, 100) = 100 (max)

Output: Score engagement = 100/100 (utilisateur très actif)
```

**Barème Interprétation** :
- 0-20 : Utilisateur inactif
- 21-50 : Utilisateur occasionnel
- 51-80 : Utilisateur actif
- 81-100 : Utilisateur très actif (power user)

---

### 14. Session Duration Average

**Formule** :
```
avg_session_duration = AVG(session_end - session_start)

Pour sessions actives (session_end NULL):
  estimated_duration = last_activity - session_start
```

**Exemple** :
```
Input (3 sessions):
- Session 1: start = 10:00, end = 10:15 → duration = 15 min
- Session 2: start = 14:00, end = 14:45 → duration = 45 min
- Session 3: start = 16:00, end = NULL, last_activity = 16:20 → duration = 20 min (estimée)

avg_duration = (15 + 45 + 20) / 3 = 26.67 min
```

---

## Formules Alertes (3)

### 15. Alert Priority Score

**Formule** :
```
priority = CASE:
  WHEN alert_type = 'no_stock_but_ordered' AND stock_forecasted_out > 10:
    priority = 3  // CRITIQUE URGENT
  WHEN alert_type = 'no_stock_but_ordered' AND stock_forecasted_out > 0:
    priority = 2  // CRITIQUE
  WHEN alert_type = 'out_of_stock':
    priority = 2  // CRITIQUE
  WHEN alert_type = 'low_stock' AND stock_real ≤ 2:
    priority = 1  // IMPORTANT
  WHEN alert_type = 'low_stock':
    priority = 0  // NORMAL
```

**Exemple** :
```
Input: alert_type = 'no_stock_but_ordered', stock_forecasted_out = 15

Evaluation:
- Type critique? Oui
- stock_forecasted_out > 10? Oui → priority = 3

Output: Alerte CRITIQUE URGENT (TOP priorité réapprovisionnement)
```

---

### 16. Stock Movement Severity

**Formule** :
```
severity = CASE:
  WHEN NEW.stock_real < 5:
    severity = 'critical'
  WHEN NEW.stock_real < 10:
    severity = 'warning'
  ELSE:
    severity = 'info'
```

**Exemple** :
```
Input: NEW.stock_real = 3 (après mouvement sortie)

Evaluation:
- stock_real < 5? Oui → severity = 'critical'

Output: Log avec severity='critical' + notification owners
```

---

### 17. Notification Type Routing

**Formule** :
```
type = CASE event:
  WHEN stock < min_stock:
    type = 'business', severity = 'urgent'
  WHEN order.status = 'confirmed':
    type = 'business', severity = 'important'
  WHEN payment_status = 'paid':
    type = 'operations', severity = 'important'
  WHEN error_critical:
    type = 'system', severity = 'urgent'
```

---

## Formules Agrégation (4)

### 18. Products Chart (par semaine)

**Formule** :
```
productsByWeek = products.reduce((acc, product) => {
  date = new Date(product.created_at)
  weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())  // Dimanche
  weekKey = weekStart.toISOString().split('T')[0]
  acc[weekKey] = (acc[weekKey] || 0) + 1
  return acc
}, {})

Label semaine: `S${Math.ceil(new Date(week).getDate() / 7)}`
```

**Exemple** :
```
Input (5 produits créés):
- P1: created_at = "2025-10-08" (semaine du 06/10 - dimanche)
- P2: created_at = "2025-10-09"
- P3: created_at = "2025-10-10"
- P4: created_at = "2025-10-15" (semaine du 13/10)
- P5: created_at = "2025-10-16"

Grouping:
{
  "2025-10-06": 3 produits (P1, P2, P3),
  "2025-10-13": 2 produits (P4, P5)
}

Output Recharts:
[
  { week: "S2", count: 3 },
  { week: "S3", count: 2 }
]
```

---

### 19. Stock Movements Aggregation

**Formule** :
```
movementsByDay[date] = { entrees: 0, sorties: 0 }

FOR EACH movement:
  IF movement_type IN ('in', 'purchase_order'):
    movementsByDay[date].entrees += ABS(quantity_change)
  ELSE IF movement_type IN ('out', 'sales_order'):
    movementsByDay[date].sorties += ABS(quantity_change)
```

**Exemple** :
```
Input (3 mouvements le 2025-10-12):
- M1: type='in', quantity_change=10
- M2: type='out', quantity_change=-5
- M3: type='purchase_order', quantity_change=20

Calcul:
entrees = ABS(10) + ABS(20) = 30
sorties = ABS(-5) = 5

Output: { date: "12 Oct", entrees: 30, sorties: 5 }
```

---

### 20. Module Time Aggregation

**Formule** :
```
time_per_module = jsonb_set(
  user_sessions.time_per_module,
  ARRAY[v_module],
  to_jsonb(COALESCE((user_sessions.time_per_module->v_module)::int, 0) + 1)
)

Incrémente temps passé par module (en secondes ou actions)
```

**Exemple** :
```
Input:
- time_per_module (avant) = {"dashboard": 120, "catalogue": 300}
- Nouvelle action: v_module = 'dashboard'

Calcul:
time_per_module['dashboard'] = 120 + 1 = 121

Output: {"dashboard": 121, "catalogue": 300}
```

---

### 21. Most Used Module

**Formule** :
```
most_used_module = (
  SELECT module FROM (
    SELECT
      module_key as module,
      SUM((time_per_module->module_key)::int) as total_time
    FROM user_sessions
    WHERE user_id = p_user_id AND session_start >= NOW() - p_days
    GROUP BY module_key
    ORDER BY total_time DESC
    LIMIT 1
  )
)
```

**Exemple** :
```
Input (time_per_module agrégé sur 3 sessions):
- Session 1: {"dashboard": 60, "catalogue": 180}
- Session 2: {"dashboard": 90, "stocks": 120}
- Session 3: {"catalogue": 240, "stocks": 60}

Sommes par module:
- dashboard: 60 + 90 = 150
- catalogue: 180 + 240 = 420
- stocks: 120 + 60 = 180

Tri DESC: catalogue (420), stocks (180), dashboard (150)

Output: most_used_module = 'catalogue'
```

---

## Edge Cases & Validation

### Division par Zéro

**Stratégie** : Toujours vérifier dénominateur avant division

```typescript
const trend = previousValue > 0
  ? ((currentValue - previousValue) / previousValue) * 100
  : currentValue > 0 ? 100 : 0
```

**Cas couverts** :
- `previousValue = 0, currentValue = 0` → 0%
- `previousValue = 0, currentValue > 0` → 100%
- `previousValue > 0, currentValue = 0` → -100%

---

### Valeurs Infinies / NaN

**Validation** :
```typescript
trend = Number.isFinite(trend) ? Math.round(trend * 10) / 10 : 0
```

**Cas couverts** :
- `Infinity` → 0
- `-Infinity` → 0
- `NaN` → 0

---

### Stocks Négatifs

**Protection** :
```typescript
const available = Math.max(stock_real - stock_forecasted_out, 0)
```

Garantit stock disponible ≥ 0 (jamais négatif affiché)

---

### Arrondis Cohérents

**Règles** :
- **Trends** : 1 décimale (`Math.round(value * 10) / 10`)
- **Montants €** : 2 décimales (`Math.round(value * 100) / 100`)
- **Compteurs** : Entiers (`Math.floor(value)`)
- **Pourcentages** : 1 décimale

---

**Retour** : [Documentation Métriques](/Users/romeodossantos/verone-back-office-V1/docs/metrics/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
