import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  Wallet,
  FileText,
  Users,
  Truck,
  BarChart3,
  PieChart,
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  Percent,
  Target,
  Activity,
  type LucideIcon,
} from 'lucide-react';

import type { DashboardTab } from '../components/dashboard-tabs';

export type KPIPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type KPICategory = 'sales' | 'stock' | 'finance' | 'linkme' | 'general';

export interface KPIDefinition {
  id: string;
  label: string;
  description: string;
  category: KPICategory;
  icon: LucideIcon;
  defaultPeriod: KPIPeriod;
  availablePeriods: KPIPeriod[];
  dataKey: string; // Key to access data from metrics
  format: 'currency' | 'number' | 'percent';
  showTrend: boolean;
  defaultTabs: DashboardTab[]; // Tabs where this KPI appears by default
}

/**
 * Catalogue complet des KPIs disponibles pour le dashboard configurable
 * Chaque KPI peut être ajouté à n'importe quel onglet par l'utilisateur
 */
export const KPI_CATALOG: Record<string, KPIDefinition> = {
  // ═══════════════════════════════════════════════════════════════
  // VENTES & REVENUE
  // ═══════════════════════════════════════════════════════════════
  monthly_revenue: {
    id: 'monthly_revenue',
    label: 'CA du mois',
    description: "Chiffre d'affaires du mois en cours",
    category: 'sales',
    icon: DollarSign,
    defaultPeriod: 'month',
    availablePeriods: ['day', 'week', 'month', 'quarter', 'year'],
    dataKey: 'orders.monthRevenue',
    format: 'currency',
    showTrend: true,
    defaultTabs: ['apercu', 'ventes'],
  },

  daily_revenue: {
    id: 'daily_revenue',
    label: 'CA du jour',
    description: "Chiffre d'affaires du jour",
    category: 'sales',
    icon: TrendingUp,
    defaultPeriod: 'day',
    availablePeriods: ['day'],
    dataKey: 'orders.dayRevenue',
    format: 'currency',
    showTrend: true,
    defaultTabs: ['ventes'],
  },

  sales_orders_count: {
    id: 'sales_orders_count',
    label: 'Commandes ventes',
    description: 'Nombre de commandes clients actives',
    category: 'sales',
    icon: ShoppingCart,
    defaultPeriod: 'month',
    availablePeriods: ['day', 'week', 'month'],
    dataKey: 'orders.salesOrders',
    format: 'number',
    showTrend: true,
    defaultTabs: ['apercu', 'ventes'],
  },

  purchase_orders_count: {
    id: 'purchase_orders_count',
    label: 'Commandes achats',
    description: 'Nombre de commandes fournisseurs',
    category: 'sales',
    icon: Truck,
    defaultPeriod: 'month',
    availablePeriods: ['day', 'week', 'month'],
    dataKey: 'orders.purchaseOrders',
    format: 'number',
    showTrend: true,
    defaultTabs: ['apercu'],
  },

  average_order_value: {
    id: 'average_order_value',
    label: 'Panier moyen',
    description: 'Valeur moyenne des commandes',
    category: 'sales',
    icon: BarChart3,
    defaultPeriod: 'month',
    availablePeriods: ['week', 'month', 'quarter'],
    dataKey: 'orders.averageOrderValue',
    format: 'currency',
    showTrend: true,
    defaultTabs: ['ventes'],
  },

  orders_pending: {
    id: 'orders_pending',
    label: 'En attente',
    description: 'Commandes en attente de validation',
    category: 'sales',
    icon: Clock,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'orders.pending',
    format: 'number',
    showTrend: false,
    defaultTabs: ['ventes'],
  },

  orders_processing: {
    id: 'orders_processing',
    label: 'En cours',
    description: 'Commandes en cours de traitement',
    category: 'sales',
    icon: Activity,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'orders.processing',
    format: 'number',
    showTrend: false,
    defaultTabs: ['ventes'],
  },

  orders_completed: {
    id: 'orders_completed',
    label: 'Livrées',
    description: 'Commandes livrées ce mois',
    category: 'sales',
    icon: CheckCircle,
    defaultPeriod: 'month',
    availablePeriods: ['week', 'month'],
    dataKey: 'orders.completed',
    format: 'number',
    showTrend: true,
    defaultTabs: ['ventes'],
  },

  // ═══════════════════════════════════════════════════════════════
  // STOCK & INVENTAIRE
  // ═══════════════════════════════════════════════════════════════
  stock_value: {
    id: 'stock_value',
    label: 'Valeur stock',
    description: 'Valeur totale du stock',
    category: 'stock',
    icon: Package,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'stocks.totalValue',
    format: 'currency',
    showTrend: true,
    defaultTabs: ['apercu', 'stock'],
  },

  stock_alerts: {
    id: 'stock_alerts',
    label: 'Alertes stock',
    description: 'Produits en stock critique',
    category: 'stock',
    icon: AlertTriangle,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'stocks.lowStockItems',
    format: 'number',
    showTrend: false,
    defaultTabs: ['apercu', 'stock'],
  },

  stock_in_count: {
    id: 'stock_in_count',
    label: 'Entrées stock',
    description: 'Nombre de réceptions',
    category: 'stock',
    icon: ArrowUpDown,
    defaultPeriod: 'month',
    availablePeriods: ['week', 'month'],
    dataKey: 'stocks.inStock',
    format: 'number',
    showTrend: true,
    defaultTabs: ['stock'],
  },

  stock_out_count: {
    id: 'stock_out_count',
    label: 'Sorties stock',
    description: 'Nombre de sorties',
    category: 'stock',
    icon: ArrowUpDown,
    defaultPeriod: 'month',
    availablePeriods: ['week', 'month'],
    dataKey: 'stocks.outOfStock',
    format: 'number',
    showTrend: true,
    defaultTabs: ['stock'],
  },

  products_total: {
    id: 'products_total',
    label: 'Total produits',
    description: 'Nombre de produits au catalogue',
    category: 'stock',
    icon: Package,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'catalogue.totalProducts',
    format: 'number',
    showTrend: false,
    defaultTabs: ['stock'],
  },

  products_published: {
    id: 'products_published',
    label: 'Produits publiés',
    description: 'Produits visibles en ligne',
    category: 'stock',
    icon: CheckCircle,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'catalogue.publishedProducts',
    format: 'number',
    showTrend: false,
    defaultTabs: ['stock'],
  },

  samples_waiting: {
    id: 'samples_waiting',
    label: 'Échantillons',
    description: 'Échantillons en attente',
    category: 'stock',
    icon: Clock,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'sourcing.samplesWaiting',
    format: 'number',
    showTrend: false,
    defaultTabs: ['stock'],
  },

  // ═══════════════════════════════════════════════════════════════
  // FINANCES & TRÉSORERIE
  // ═══════════════════════════════════════════════════════════════
  cash_balance: {
    id: 'cash_balance',
    label: 'Trésorerie',
    description: 'Solde disponible (Qonto)',
    category: 'finance',
    icon: Wallet,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'treasury.balance',
    format: 'currency',
    showTrend: true,
    defaultTabs: ['apercu', 'finances'],
  },

  accounts_receivable: {
    id: 'accounts_receivable',
    label: 'Créances clients',
    description: 'Montant à recevoir (AR)',
    category: 'finance',
    icon: TrendingUp,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'treasury.accountsReceivable',
    format: 'currency',
    showTrend: false,
    defaultTabs: ['finances'],
  },

  accounts_payable: {
    id: 'accounts_payable',
    label: 'Dettes fournisseurs',
    description: 'Montant à payer (AP)',
    category: 'finance',
    icon: XCircle,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'treasury.accountsPayable',
    format: 'currency',
    showTrend: false,
    defaultTabs: ['finances'],
  },

  invoices_unpaid: {
    id: 'invoices_unpaid',
    label: 'Factures impayées',
    description: 'Nombre de factures en attente',
    category: 'finance',
    icon: FileText,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'treasury.unpaidInvoices',
    format: 'number',
    showTrend: false,
    defaultTabs: ['finances'],
  },

  burn_rate: {
    id: 'burn_rate',
    label: 'Burn rate',
    description: 'Dépenses moyennes mensuelles',
    category: 'finance',
    icon: Activity,
    defaultPeriod: 'month',
    availablePeriods: ['month', 'quarter'],
    dataKey: 'treasury.burnRate',
    format: 'currency',
    showTrend: true,
    defaultTabs: ['finances'],
  },

  // ═══════════════════════════════════════════════════════════════
  // LINKME & AFFILIÉS
  // ═══════════════════════════════════════════════════════════════
  linkme_commissions: {
    id: 'linkme_commissions',
    label: 'Commissions LinkMe',
    description: 'Total des commissions générées',
    category: 'linkme',
    icon: Percent,
    defaultPeriod: 'month',
    availablePeriods: ['week', 'month', 'quarter'],
    dataKey: 'linkme.totalCommissions',
    format: 'currency',
    showTrend: true,
    defaultTabs: ['linkme'],
  },

  linkme_orders: {
    id: 'linkme_orders',
    label: 'Commandes LinkMe',
    description: 'Commandes via affiliés',
    category: 'linkme',
    icon: ShoppingCart,
    defaultPeriod: 'month',
    availablePeriods: ['week', 'month'],
    dataKey: 'linkme.ordersCount',
    format: 'number',
    showTrend: true,
    defaultTabs: ['linkme'],
  },

  linkme_affiliates_active: {
    id: 'linkme_affiliates_active',
    label: 'Affiliés actifs',
    description: "Nombre d'affiliés avec ventes",
    category: 'linkme',
    icon: Users,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'linkme.activeAffiliates',
    format: 'number',
    showTrend: true,
    defaultTabs: ['linkme'],
  },

  linkme_conversion_rate: {
    id: 'linkme_conversion_rate',
    label: 'Taux conversion',
    description: 'Sélections → Commandes',
    category: 'linkme',
    icon: Target,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'linkme.conversionRate',
    format: 'percent',
    showTrend: true,
    defaultTabs: ['linkme'],
  },

  linkme_avg_margin: {
    id: 'linkme_avg_margin',
    label: 'Marge moyenne',
    description: 'Taux de marge moyen LinkMe',
    category: 'linkme',
    icon: PieChart,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'linkme.averageMargin',
    format: 'percent',
    showTrend: true,
    defaultTabs: ['linkme'],
  },

  // ═══════════════════════════════════════════════════════════════
  // ORGANISATIONS & CLIENTS
  // ═══════════════════════════════════════════════════════════════
  organisations_total: {
    id: 'organisations_total',
    label: 'Organisations',
    description: 'Total fournisseurs + clients B2B',
    category: 'general',
    icon: Users,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'organisations.totalOrganisations',
    format: 'number',
    showTrend: false,
    defaultTabs: [],
  },

  suppliers_count: {
    id: 'suppliers_count',
    label: 'Fournisseurs',
    description: 'Nombre de fournisseurs actifs',
    category: 'general',
    icon: Truck,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'organisations.suppliers',
    format: 'number',
    showTrend: false,
    defaultTabs: [],
  },

  customers_b2b_count: {
    id: 'customers_b2b_count',
    label: 'Clients B2B',
    description: 'Nombre de clients professionnels',
    category: 'general',
    icon: Users,
    defaultPeriod: 'month',
    availablePeriods: ['month'],
    dataKey: 'organisations.customersB2B',
    format: 'number',
    showTrend: false,
    defaultTabs: [],
  },
};

/**
 * Obtenir les KPIs par défaut pour un onglet donné
 */
export function getDefaultKPIsForTab(tab: DashboardTab): KPIDefinition[] {
  return Object.values(KPI_CATALOG).filter(kpi =>
    kpi.defaultTabs.includes(tab)
  );
}

/**
 * Obtenir les KPIs par catégorie
 */
export function getKPIsByCategory(category: KPICategory): KPIDefinition[] {
  return Object.values(KPI_CATALOG).filter(kpi => kpi.category === category);
}

/**
 * Labels pour les périodes
 */
export const PERIOD_LABELS: Record<KPIPeriod, string> = {
  day: 'Jour',
  week: 'Semaine',
  month: 'Mois',
  quarter: 'Trimestre',
  year: 'Année',
};

/**
 * Labels pour les catégories
 */
export const CATEGORY_LABELS: Record<KPICategory, string> = {
  sales: 'Ventes',
  stock: 'Stock',
  finance: 'Finances',
  linkme: 'LinkMe',
  general: 'Général',
};
