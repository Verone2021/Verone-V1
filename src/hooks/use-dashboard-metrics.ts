/**
 * Hook principal pour les métriques du dashboard
 * Architecture modulaire et évolutive pour faciliter l'ajout de nouvelles métriques
 * Performance: SLO < 2s pour le chargement initial
 */

'use client';

import useSWR from 'swr';
import { createBrowserClient } from '@supabase/ssr';
import { useProductMetrics } from './metrics/use-product-metrics';
import { useUserMetrics } from './metrics/use-user-metrics';
import { useStockMetrics } from './metrics/use-stock-metrics';
import { useActivityMetrics } from './metrics/use-activity-metrics';
import { useOrderMetrics } from './metrics/use-order-metrics';
import { useRevenueMetrics } from './metrics/use-revenue-metrics';

export interface DashboardMetrics {
  // Métriques actuelles
  products: {
    total: number;
    active: number;
    inactive: number;
    draft: number;
    trend: number; // Pourcentage d'évolution
  };
  stock: {
    inStock: number;
    outOfStock: number;
    lowStock: number;
    critical: number;
    alerts: Array<{
      id: string;
      name: string;
      stock: number;
      status: 'rupture' | 'critique' | 'faible';
    }>;
  };
  users: {
    total: number;
    active: number;
    new: number;
    byRole: {
      admin: number;
      catalog_manager: number;
      sales: number;
      partner_manager: number;
    };
    trend: number;
  };
  activity: {
    today: number;
    yesterday: number;
    trend: number;
    recentActions: Array<{
      type: string;
      description: string;
      timestamp: string;
      user?: string;
    }>;
  };
  // Métriques futures (valeurs par défaut pour l'instant)
  orders: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    trend: number;
    recentOrders: Array<{
      id: string;
      customer: string;
      amount: number;
      status: string;
    }>;
  };
  revenue: {
    today: number;
    month: number;
    year: number;
    trend: number;
    averageOrderValue: number;
  };
}

export interface DashboardMetricsState {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  performanceMetrics: {
    loadTime: number;
    cacheHit: boolean;
  };
}

// Configuration SWR
const SWR_CONFIG = {
  refreshInterval: 30000, // Refresh toutes les 30 secondes
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

export function useDashboardMetrics() {
  const startTime = performance.now();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Hooks modulaires pour chaque type de métrique
  const productMetrics = useProductMetrics();
  const userMetrics = useUserMetrics();
  const stockMetrics = useStockMetrics();
  const activityMetrics = useActivityMetrics();

  // Métriques futures (retournent des valeurs par défaut)
  const orderMetrics = useOrderMetrics();
  const revenueMetrics = useRevenueMetrics();

  // Fonction de récupération des métriques globales
  const fetcher = async () => {
    const metricsStartTime = performance.now();

    try {
      // Chargement parallèle de toutes les métriques
      const [products, users, stock, activity, orders, revenue] = await Promise.all([
        productMetrics.fetch(),
        userMetrics.fetch(),
        stockMetrics.fetch(),
        activityMetrics.fetch(),
        orderMetrics.fetch(),
        revenueMetrics.fetch(),
      ]);

      const loadTime = performance.now() - metricsStartTime;

      // Monitoring des performances
      if (loadTime > 2000) {
        console.warn(`⚠️ Dashboard SLO dépassé: ${Math.round(loadTime)}ms > 2000ms`);
      } else {
        console.log(`✅ Dashboard chargé en ${Math.round(loadTime)}ms`);
      }

      return {
        products,
        users,
        stock,
        activity,
        orders,
        revenue,
      };
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
      throw error;
    }
  };

  // Utilisation de SWR pour le cache et la revalidation
  const { data, error, isLoading, mutate } = useSWR(
    'dashboard-metrics',
    fetcher,
    SWR_CONFIG
  );

  // Calcul des métriques de performance
  const performanceMetrics = {
    loadTime: isLoading ? 0 : Math.round(performance.now() - startTime),
    cacheHit: !isLoading && !!data,
  };

  // Fonction de refresh manuel
  const refresh = async () => {
    console.log('🔄 Rafraîchissement manuel des métriques...');
    await mutate();
  };

  // Fonction pour obtenir les métriques en temps réel
  const subscribeToRealtime = () => {
    // Configuration pour les futures mises à jour en temps réel
    const channel = supabase
      .channel('dashboard-metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products'
      }, () => {
        console.log('📊 Mise à jour temps réel détectée');
        mutate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    metrics: data || null,
    isLoading,
    error,
    lastUpdated: data ? new Date() : null,
    performanceMetrics,
    refresh,
    subscribeToRealtime,

    // Helpers pour accéder rapidement aux métriques
    quickStats: {
      totalProducts: data?.products?.total || 0,
      activeUsers: data?.users?.active || 0,
      stockAlerts: data?.stock?.alerts?.length || 0,
      todayActivity: data?.activity?.today || 0,
      pendingOrders: data?.orders?.pending || 0,
      monthRevenue: data?.revenue?.month || 0,
    },
  };
}

// Export des types pour utilisation dans d'autres composants
export type { DashboardMetrics, DashboardMetricsState };