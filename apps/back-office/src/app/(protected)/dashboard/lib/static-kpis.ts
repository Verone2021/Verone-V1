/**
 * Configuration statique des KPIs du dashboard
 * Les KPIs sont hardcodés et identiques pour tous les utilisateurs
 */

import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Wallet,
  Truck,
  Percent,
  Users,
  type LucideIcon,
} from 'lucide-react';

// Types des onglets du dashboard (définis ici car dashboard-tabs.tsx a été supprimé)
export type DashboardTab =
  | 'apercu'
  | 'ventes'
  | 'stock'
  | 'finances'
  | 'linkme';

export type KPIFormat = 'currency' | 'number' | 'percent';
export type KPICategory = 'sales' | 'stock' | 'finance' | 'linkme' | 'general';

export interface StaticKPIDefinition {
  id: string;
  label: string;
  description: string;
  category: KPICategory;
  icon: LucideIcon;
  dataKey: string;
  format: KPIFormat;
  showTrend: boolean;
}

/**
 * Catalogue des KPIs statiques
 */
export const STATIC_KPI_CATALOG: Record<string, StaticKPIDefinition> = {
  monthly_revenue: {
    id: 'monthly_revenue',
    label: 'CA du mois',
    description: "Chiffre d'affaires du mois en cours",
    category: 'sales',
    icon: DollarSign,
    dataKey: 'orders.monthRevenue',
    format: 'currency',
    showTrend: true,
  },
  sales_orders_count: {
    id: 'sales_orders_count',
    label: 'Commandes ventes',
    description: 'Nombre de commandes clients actives',
    category: 'sales',
    icon: ShoppingCart,
    dataKey: 'orders.salesOrders',
    format: 'number',
    showTrend: true,
  },
  purchase_orders_count: {
    id: 'purchase_orders_count',
    label: 'Commandes achats',
    description: 'Nombre de commandes fournisseurs',
    category: 'sales',
    icon: Truck,
    dataKey: 'orders.purchaseOrders',
    format: 'number',
    showTrend: true,
  },
  stock_value: {
    id: 'stock_value',
    label: 'Valeur stock',
    description: 'Valeur totale du stock',
    category: 'stock',
    icon: Package,
    dataKey: 'stocks.totalValue',
    format: 'currency',
    showTrend: false,
  },
  stock_alerts: {
    id: 'stock_alerts',
    label: 'Alertes stock',
    description: 'Produits en stock critique',
    category: 'stock',
    icon: AlertTriangle,
    dataKey: 'stocks.lowStockItems',
    format: 'number',
    showTrend: false,
  },
  cash_balance: {
    id: 'cash_balance',
    label: 'Trésorerie',
    description: 'Solde disponible (Qonto)',
    category: 'finance',
    icon: Wallet,
    dataKey: 'treasury.balance',
    format: 'currency',
    showTrend: false,
  },
  linkme_commissions: {
    id: 'linkme_commissions',
    label: 'Commissions LinkMe',
    description: 'Total des commissions générées',
    category: 'linkme',
    icon: Percent,
    dataKey: 'linkme.totalCommissions',
    format: 'currency',
    showTrend: true,
  },
  linkme_orders: {
    id: 'linkme_orders',
    label: 'Commandes LinkMe',
    description: 'Commandes via affiliés',
    category: 'linkme',
    icon: ShoppingCart,
    dataKey: 'linkme.ordersCount',
    format: 'number',
    showTrend: true,
  },
  linkme_affiliates_active: {
    id: 'linkme_affiliates_active',
    label: 'Affiliés actifs',
    description: "Nombre d'affiliés avec ventes",
    category: 'linkme',
    icon: Users,
    dataKey: 'linkme.activeAffiliates',
    format: 'number',
    showTrend: true,
  },
};

/**
 * Configuration des KPIs par onglet (hardcodé)
 * Preset "Direction" - Vue synthétique pour dirigeants
 */
export const KPIS_BY_TAB: Record<DashboardTab, string[]> = {
  apercu: [
    'monthly_revenue',
    'sales_orders_count',
    'purchase_orders_count',
    'stock_value',
    'stock_alerts',
    'cash_balance',
  ],
  ventes: ['monthly_revenue', 'sales_orders_count', 'purchase_orders_count'],
  stock: ['stock_value', 'stock_alerts'],
  finances: ['cash_balance', 'monthly_revenue'],
  linkme: ['linkme_commissions', 'linkme_orders', 'linkme_affiliates_active'],
};

/**
 * Récupère les définitions de KPIs pour un onglet donné
 */
export function getKPIsForTab(tab: DashboardTab): StaticKPIDefinition[] {
  const kpiIds = KPIS_BY_TAB[tab] || [];
  return kpiIds
    .map(id => STATIC_KPI_CATALOG[id])
    .filter((kpi): kpi is StaticKPIDefinition => kpi !== undefined);
}

/**
 * Mapping des catégories vers les chemins de trend dans les métriques
 */
export const TREND_PATHS: Record<string, string> = {
  sales: 'orders.trend',
  stock: 'stocks.trend',
  finance: 'treasury.trend',
  linkme: 'linkme.trend',
  general: 'products.trend',
};
