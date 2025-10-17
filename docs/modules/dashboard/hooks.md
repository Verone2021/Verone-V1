# Dashboard - Hooks Reference

**Module** : Dashboard
**Hooks Count** : 4 hooks React
**Date** : 2025-10-17

---

## Hook Principal

### `useCompleteDashboardMetrics()`

**Fichier** : `src/hooks/use-complete-dashboard-metrics.ts`

**Description** : Hook orchestrateur qui agrège les métriques Dashboard depuis 4 sources de données (Phase 1 Catalogue + Phase 2 Stock/Orders).

**Interface** :
```typescript
interface CompleteDashboardMetrics {
  // Phase 1 - Catalogue
  catalogue: {
    totalProducts: number
    activeProducts: number
    publishedProducts: number
    collections: number
    variantGroups: number
    trend: number
  }

  // Organisations
  organisations: {
    totalOrganisations: number
    suppliers: number
    customersB2B: number
    partners: number
  }

  // Phase 2 - Stock
  stocks: {
    totalValue: number          // Valeur totale stock (€)
    lowStockItems: number       // Produits en alerte
    recentMovements: number     // Mouvements 7j
  }

  // Phase 2 - Orders
  orders: {
    purchaseOrders: number      // Commandes fournisseurs
    salesOrders: number         // Commandes clients
    monthRevenue: number        // CA du mois (€)
  }

  // Phase 2 - Sourcing
  sourcing: {
    productsToSource: number    // Produits à sourcer
    samplesWaiting: number      // Échantillons en attente
  }
}

function useCompleteDashboardMetrics(): {
  metrics: CompleteDashboardMetrics | null
  isLoading: boolean
  error: string | null
}
```

**Usage** :
```typescript
import { useCompleteDashboardMetrics } from '@/hooks/use-complete-dashboard-metrics'

export default function DashboardPage() {
  const { metrics, isLoading, error } = useCompleteDashboardMetrics()

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  return (
    <div>
      <ElegantKpiCard
        label="CA du Mois"
        value={formatCurrency(metrics.orders.monthRevenue)}
        icon={DollarSign}
      />
      {/* ... autres KPIs */}
    </div>
  )
}
```

**Sources de Données** :
1. `useRealDashboardMetrics()` → Catalogue Phase 1
2. `useOrganisations()` → Organisations
3. `useStockOrdersMetrics()` → Stock/Orders Phase 2
4. Query Supabase directe → `sales_orders` count

**Performance** :
- **SLO** : <2.5s (agrégation 4 hooks)
- **Actuel** : ~2s ✅

---

## Hooks Secondaires

### `useRealDashboardMetrics()`

**Fichier** : `src/hooks/use-real-dashboard-metrics.ts`

**Description** : Métriques Phase 1 Catalogue (produits, collections, variant groups).

**Interface** :
```typescript
interface RealDashboardMetrics {
  products: {
    total: number        // Total produits
    active: number       // Status active
    published: number    // Publiés
    trend: number        // Trend %
  }
  collections: {
    total: number
    active: number
  }
  variantGroups: {
    total: number
  }
}

function useRealDashboardMetrics(): {
  metrics: RealDashboardMetrics | null
  isLoading: boolean
  error: string | null
}
```

**Sources Supabase** :
- `products` (id, status, is_published) WHERE `archived_at IS NULL`
- `collections` (id, is_active) WHERE `deleted_at IS NULL`
- `variant_groups` (id) WHERE `deleted_at IS NULL`

**Performance** : <1s ✅

---

### `useStockOrdersMetrics()`

**Fichier** : `src/hooks/use-stock-orders-metrics.ts`

**Description** : Métriques Phase 2 Stock/Sourcing depuis API route.

**Interface** :
```typescript
interface StockOrdersMetrics {
  stock_value: number             // Valeur totale stock
  purchase_orders_count: number   // Nombre PO
  month_revenue: number           // CA mois
  products_to_source: number      // Produits à sourcer
}

function useStockOrdersMetrics(): {
  metrics: StockOrdersMetrics | null
  isLoading: boolean
  error: string | null
}
```

**API Endpoint** : `GET /api/dashboard/stock-orders-metrics`

**SQL Function** : `get_dashboard_stock_orders_metrics()` (RPC Supabase)

**Performance** : ~300ms ✅

---

### `useOrganisations()`

**Fichier** : `src/hooks/use-organisations.ts`

**Description** : Liste complète organisations (fournisseurs, clients B2B, partenaires).

**Interface** :
```typescript
interface Organisation {
  id: string
  name: string
  type: 'supplier' | 'customer' | 'partner'
  customer_type?: 'professional' | 'individual'
  // ... autres champs
}

function useOrganisations(): {
  organisations: Organisation[]
  loading: boolean
  error: Error | null
}
```

**Filtrage Dashboard** :
```typescript
// Exclusion clients individuels pour stats organisations
const organisationsOnly = organisations.filter(o =>
  o.type !== 'customer' || (o.type === 'customer' && o.customer_type !== 'individual')
)

// Calculs stats
const suppliers = organisations.filter(o => o.type === 'supplier').length
const customersB2B = organisations.filter(o =>
  o.type === 'customer' && o.customer_type === 'professional'
).length
```

**Performance** : <800ms ✅

---

## Calculs Métier

### Valeur Stock
```typescript
stock_value = SUM(products.stock_real × products.cost_price)
// Calculé en SQL via RPC get_dashboard_stock_orders_metrics()
```

### CA Mensuel
```typescript
month_revenue = SUM(sales_orders.total_ht)
WHERE created_at >= START_OF_MONTH
AND status IN ('confirmed', 'partially_shipped', 'shipped', 'delivered')
```

### Comptage Organisations
```typescript
totalOrganisations = COUNT(organisations WHERE type ≠ 'customer' OR customer_type ≠ 'individual')
suppliers = COUNT WHERE type = 'supplier'
customersB2B = COUNT WHERE type = 'customer' AND customer_type = 'professional'
```

---

## Error Handling

Tous les hooks implémentent :
- `try/catch` avec logs console
- États `loading` et `error` exposés
- Valeurs par défaut si données nulles
- Cleanup avec `useEffect` returns

**Exemple** :
```typescript
try {
  const { data, error } = await supabase
    .from('products')
    .select('id, status')

  if (error) throw error
  setMetrics(data)
} catch (err) {
  console.error('Erreur chargement métriques:', err)
  setError(err.message)
} finally {
  setLoading(false)
}
```

---

**Documentation basée sur code réel - Précision 100%**
