# 📊 Architecture du Système de Métriques du Dashboard

> **Version**: 1.0.0
> **Date**: 14 Janvier 2025
> **Statut**: ✅ Implémenté et Évolutif

## 🎯 Objectif

Créer un système de métriques **dynamique et évolutif** pour le dashboard Vérone qui :
- Utilise les données réelles disponibles aujourd'hui
- S'enrichit automatiquement avec les nouvelles fonctionnalités
- Respecte les SLOs de performance (<2s)
- Maintient une architecture modulaire et maintenable

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                   Dashboard Component                     │
│                  (src/app/dashboard/page.tsx)            │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              useDashboardMetrics Hook                     │
│         (src/hooks/use-dashboard-metrics.ts)             │
│                                                           │
│  • Cache avec SWR (30s refresh)                          │
│  • Coordination des sous-hooks                           │
│  • Monitoring des performances                           │
│  • Support temps réel (Supabase Realtime)               │
└────────────────────────┬─────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  Métriques Live  │          │ Métriques Future │
│                  │          │    (Mocked)      │
├──────────────────┤          ├──────────────────┤
│ • Products       │          │ • Orders         │
│ • Users          │          │ • Revenue        │
│ • Stock          │          │ • Conversions    │
│ • Activity       │          │                  │
└──────────────────┘          └──────────────────┘
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│   Supabase DB    │          │  Default Values  │
│  (PostgreSQL)    │          │   (Dev Mode)     │
└──────────────────┘          └──────────────────┘
```

## 📦 Structure des Hooks

### Hook Principal : `useDashboardMetrics`

```typescript
interface DashboardMetrics {
  // Métriques actuelles (données réelles)
  products: ProductMetrics;
  stock: StockMetrics;
  users: UserMetrics;
  activity: ActivityMetrics;

  // Métriques futures (valeurs par défaut)
  orders: OrderMetrics;
  revenue: RevenueMetrics;
}
```

### Sous-Hooks Spécialisés

| Hook | Statut | Tables utilisées | Description |
|------|--------|------------------|-------------|
| `useProductMetrics` | ✅ Live | `products` | Stats produits, tendances |
| `useUserMetrics` | ✅ Live | `user_profiles` | Utilisateurs actifs, rôles |
| `useStockMetrics` | ✅ Live | `products` | Alertes stock, ruptures |
| `useActivityMetrics` | ✅ Live | Multiple | Activité journalière |
| `useOrderMetrics` | 🔮 Future | `orders` (n/a) | Commandes en cours |
| `useRevenueMetrics` | 🔮 Future | `invoices` (n/a) | CA et tendances |

## 🚀 Performance et Optimisation

### Stratégies Implémentées

1. **Requêtes Parallèles**
   ```typescript
   const [products, users, stock] = await Promise.all([
     productMetrics.fetch(),
     userMetrics.fetch(),
     stockMetrics.fetch()
   ]);
   ```

2. **Cache SWR**
   - Refresh automatique : 30 secondes
   - Deduplication : 5 secondes
   - Retry on error : 3 tentatives

3. **Fonctions PostgreSQL**
   - `get_product_stats()` : Agrégations produits optimisées
   - `get_stock_alerts()` : Top 10 alertes critiques
   - `get_daily_activity()` : Activité avec JSON aggregation
   - `get_user_stats()` : Stats utilisateurs par rôle

4. **Indexes Database**
   ```sql
   CREATE INDEX idx_products_status ON products(status);
   CREATE INDEX idx_products_created_at ON products(created_at);
   CREATE INDEX idx_user_profiles_role ON user_profiles(role);
   ```

### Monitoring des Performances

```typescript
// Tracking automatique dans le hook
if (loadTime > 2000) {
  console.warn(`⚠️ Dashboard SLO dépassé: ${loadTime}ms > 2000ms`);
}
```

## 🔄 Évolution Future

### Phase 1 : Actuelle (Janvier 2025)
- ✅ Métriques produits depuis `products`
- ✅ Métriques utilisateurs depuis `user_profiles`
- ✅ Alertes stock simulées
- ✅ Activité basique

### Phase 2 : Commandes (Q2 2025)
```typescript
// Nouveau hook à créer
useOrderMetrics() {
  // Requête vers table 'orders'
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending');
}
```

### Phase 3 : Finances (Q3 2025)
```typescript
// Nouveau hook à créer
useRevenueMetrics() {
  // Requête vers tables 'invoices', 'payments'
  const revenue = await calculateMonthlyRevenue();
}
```

## 📝 Guide d'Ajout de Nouvelles Métriques

### 1. Créer le Sous-Hook

```typescript
// src/hooks/metrics/use-new-metric.ts
export function useNewMetric() {
  const fetch = async () => {
    // Logique de récupération
    return { /* métriques */ };
  };
  return { fetch };
}
```

### 2. Intégrer au Hook Principal

```typescript
// src/hooks/use-dashboard-metrics.ts
import { useNewMetric } from './metrics/use-new-metric';

// Dans la fonction
const newMetric = useNewMetric();
const [/*...*/, newData] = await Promise.all([
  /*...*/,
  newMetric.fetch()
]);
```

### 3. Mettre à Jour les Types

```typescript
interface DashboardMetrics {
  // Ajouter le nouveau type
  newMetric: NewMetricType;
}
```

### 4. Créer la Fonction SQL (Optionnel)

```sql
CREATE OR REPLACE FUNCTION get_new_metric_stats()
RETURNS TABLE (...) AS $$
BEGIN
  -- Logique d'agrégation
END;
$$ LANGUAGE plpgsql;
```

## 🔐 Sécurité

- **RLS (Row-Level Security)** : Toutes les requêtes respectent les policies
- **Fonctions SECURITY DEFINER** : Exécution avec droits contrôlés
- **Validation des données** : Types TypeScript stricts
- **Gestion d'erreurs** : Fallback sur valeurs par défaut

## 📊 Métriques Disponibles

### Produits
- Total produits
- Produits actifs/inactifs
- Tendance d'évolution
- Status par catégorie

### Stock
- Produits en stock
- Ruptures de stock
- Stock critique (<5 unités)
- Top 10 alertes

### Utilisateurs
- Total utilisateurs
- Utilisateurs actifs (30j)
- Nouveaux (7j)
- Répartition par rôle

### Activité
- Actions aujourd'hui
- Actions hier
- Tendance %
- 10 dernières actions

## 🛠️ Technologies Utilisées

- **React 18** : Composants et hooks
- **SWR 2.3** : Cache et revalidation
- **Supabase** : Backend et temps réel
- **PostgreSQL** : Fonctions d'agrégation
- **TypeScript** : Type safety

## 📈 Roadmap

| Trimestre | Fonctionnalité | Impact |
|-----------|----------------|--------|
| Q1 2025 | ✅ Métriques de base | MVP fonctionnel |
| Q2 2025 | Métriques commandes | +40% insights |
| Q3 2025 | Métriques financières | +60% insights |
| Q4 2025 | Analytics avancées | Full BI |

## 🔧 Maintenance

### Tests de Performance
```bash
# Vérifier les temps de chargement
npm run test:performance

# Analyser les requêtes SQL
npm run analyze:queries
```

### Monitoring
- Grafana Dashboard : Supabase metrics
- Console logs : Performance warnings
- Sentry : Error tracking (à configurer)

## 📚 Ressources

- [SWR Documentation](https://swr.vercel.app/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Optimization](https://www.postgresql.org/docs/current/performance-tips.html)

---

*Ce document est la référence technique pour le système de métriques du dashboard Vérone. Il doit être mis à jour à chaque évolution majeure de l'architecture.*