/**
 * Catalogue des Graphiques Dashboard V2
 * Graphiques Recharts pour visualisation des données
 *
 * @created 2026-01-12
 */

import {
  TrendingUp,
  PieChart,
  BarChart3,
  LineChart,
  Activity,
  Wallet,
  Package,
  Users,
  DollarSign,
  Calendar,
  type LucideIcon,
} from 'lucide-react';

import type { KPICategory } from './kpi-catalog';
import type { DashboardTab } from '../components/dashboard-tabs';

export type ChartType = 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radar';
export type ChartSize = 'small' | 'medium' | 'large' | 'full';

export interface ChartDefinition {
  id: string;
  label: string;
  description: string;
  category: KPICategory;
  icon: LucideIcon;
  type: ChartType;
  size: ChartSize;
  defaultTabs: DashboardTab[];
  // Données
  hookName: string;
  dataKey: string; // Clé principale des données
  xAxisKey?: string; // Clé pour l'axe X (si applicable)
  // Options visuelles
  colors?: string[]; // Couleurs personnalisées
  showLegend?: boolean;
  showGrid?: boolean;
  animated?: boolean;
}

/**
 * Palette de couleurs Verone
 */
export const CHART_COLORS = {
  primary: '#2563eb', // Blue-600
  secondary: '#7c3aed', // Violet-600
  success: '#16a34a', // Green-600
  warning: '#ea580c', // Orange-600
  danger: '#dc2626', // Red-600
  info: '#0891b2', // Cyan-600
  // Palette étendue pour graphiques multi-séries
  palette: [
    '#2563eb',
    '#7c3aed',
    '#16a34a',
    '#ea580c',
    '#0891b2',
    '#db2777',
    '#4f46e5',
    '#059669',
  ],
};

/**
 * Catalogue complet des graphiques disponibles
 * Organisé par priorité d'implémentation (P0, P1, P2, P3)
 */
export const CHART_CATALOG: Record<string, ChartDefinition> = {
  // ═══════════════════════════════════════════════════════════════
  // P0 - PRIORITÉ CRITIQUE
  // ═══════════════════════════════════════════════════════════════

  revenue_30d: {
    id: 'revenue_30d',
    label: 'CA 30 jours',
    description: "Évolution du chiffre d'affaires sur 30 jours",
    category: 'sales',
    icon: TrendingUp,
    type: 'area',
    size: 'large',
    defaultTabs: ['apercu', 'ventes'],
    hookName: 'useDashboardAnalytics',
    dataKey: 'revenue',
    xAxisKey: 'date',
    colors: [CHART_COLORS.primary],
    showLegend: false,
    showGrid: true,
    animated: true,
  },

  treasury_12m: {
    id: 'treasury_12m',
    label: 'Trésorerie 12 mois',
    description: 'Évolution de la trésorerie sur 12 mois',
    category: 'finance',
    icon: Wallet,
    type: 'line',
    size: 'large',
    defaultTabs: ['apercu', 'finances'],
    hookName: 'useTreasuryStats',
    dataKey: 'balance',
    xAxisKey: 'month',
    colors: [CHART_COLORS.success, CHART_COLORS.danger],
    showLegend: true,
    showGrid: true,
    animated: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // P1 - PRIORITÉ HAUTE
  // ═══════════════════════════════════════════════════════════════

  channel_split: {
    id: 'channel_split',
    label: 'Répartition par canal',
    description: 'CA par canal de vente (Site, LinkMe, B2B)',
    category: 'sales',
    icon: PieChart,
    type: 'donut',
    size: 'medium',
    defaultTabs: ['ventes'],
    hookName: 'useChannelPerformance',
    dataKey: 'revenue',
    colors: CHART_COLORS.palette,
    showLegend: true,
    animated: true,
  },

  abc_analysis: {
    id: 'abc_analysis',
    label: 'Classification ABC',
    description: 'Répartition valeur stock (A: 80%, B: 15%, C: 5%)',
    category: 'stock',
    icon: BarChart3,
    type: 'bar',
    size: 'medium',
    defaultTabs: ['stock'],
    hookName: 'useABCAnalysis',
    dataKey: 'value',
    xAxisKey: 'category',
    colors: [CHART_COLORS.primary, CHART_COLORS.warning, CHART_COLORS.info],
    showLegend: true,
    showGrid: true,
    animated: true,
  },

  aging_report: {
    id: 'aging_report',
    label: 'Vieillissement créances',
    description: 'Répartition des créances par ancienneté',
    category: 'finance',
    icon: Calendar,
    type: 'bar',
    size: 'medium',
    defaultTabs: ['finances'],
    hookName: 'useAgingReport',
    dataKey: 'amount',
    xAxisKey: 'period',
    colors: [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger],
    showLegend: true,
    showGrid: true,
    animated: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // P2 - PRIORITÉ MOYENNE
  // ═══════════════════════════════════════════════════════════════

  stock_evolution: {
    id: 'stock_evolution',
    label: 'Évolution stock',
    description: 'Évolution de la valeur du stock sur 6 mois',
    category: 'stock',
    icon: Package,
    type: 'area',
    size: 'medium',
    defaultTabs: ['stock'],
    hookName: 'useStockAnalytics',
    dataKey: 'value',
    xAxisKey: 'month',
    colors: [CHART_COLORS.secondary],
    showGrid: true,
    animated: true,
  },

  linkme_performance: {
    id: 'linkme_performance',
    label: 'Performance affiliés',
    description: 'CA par affilié (top 10)',
    category: 'linkme',
    icon: Users,
    type: 'bar',
    size: 'medium',
    defaultTabs: ['linkme'],
    hookName: 'useLinkmeAnalytics',
    dataKey: 'revenue',
    xAxisKey: 'affiliate',
    colors: [CHART_COLORS.info],
    showLegend: false,
    showGrid: true,
    animated: true,
  },

  expenses_category: {
    id: 'expenses_category',
    label: 'Dépenses par catégorie',
    description: 'Répartition des dépenses mensuelles',
    category: 'finance',
    icon: DollarSign,
    type: 'donut',
    size: 'medium',
    defaultTabs: ['finances'],
    hookName: 'useExpenses',
    dataKey: 'amount',
    colors: CHART_COLORS.palette,
    showLegend: true,
    animated: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // P3 - PRIORITÉ BASSE
  // ═══════════════════════════════════════════════════════════════

  budget_vs_actual: {
    id: 'budget_vs_actual',
    label: 'Budget vs Réel',
    description: 'Comparaison budget prévu vs dépenses réelles',
    category: 'finance',
    icon: BarChart3,
    type: 'bar',
    size: 'large',
    defaultTabs: [],
    hookName: 'useBudgets',
    dataKey: 'amount',
    xAxisKey: 'category',
    colors: [CHART_COLORS.primary, CHART_COLORS.secondary],
    showLegend: true,
    showGrid: true,
    animated: true,
  },

  stock_forecast: {
    id: 'stock_forecast',
    label: 'Prévisions stock',
    description: 'Projection des niveaux de stock',
    category: 'stock',
    icon: LineChart,
    type: 'line',
    size: 'large',
    defaultTabs: [],
    hookName: 'useStockForecast',
    dataKey: 'quantity',
    xAxisKey: 'date',
    colors: [CHART_COLORS.primary, CHART_COLORS.info],
    showLegend: true,
    showGrid: true,
    animated: true,
  },

  orders_trend: {
    id: 'orders_trend',
    label: 'Tendance commandes',
    description: 'Évolution du nombre de commandes sur 30 jours',
    category: 'sales',
    icon: Activity,
    type: 'line',
    size: 'medium',
    defaultTabs: [],
    hookName: 'useDashboardAnalytics',
    dataKey: 'ordersCount',
    xAxisKey: 'date',
    colors: [CHART_COLORS.secondary],
    showGrid: true,
    animated: true,
  },
};

/**
 * Obtenir les graphiques par défaut pour un onglet donné
 */
export function getDefaultChartsForTab(tab: DashboardTab): ChartDefinition[] {
  return Object.values(CHART_CATALOG).filter(chart =>
    chart.defaultTabs.includes(tab)
  );
}

/**
 * Obtenir les graphiques par catégorie
 */
export function getChartsByCategory(category: KPICategory): ChartDefinition[] {
  return Object.values(CHART_CATALOG).filter(
    chart => chart.category === category
  );
}

/**
 * Obtenir les graphiques par type
 */
export function getChartsByType(type: ChartType): ChartDefinition[] {
  return Object.values(CHART_CATALOG).filter(chart => chart.type === type);
}

/**
 * Labels pour les types de graphiques
 */
export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  line: 'Ligne',
  area: 'Aire',
  bar: 'Barres',
  pie: 'Camembert',
  donut: 'Anneau',
  radar: 'Radar',
};

/**
 * Labels pour les tailles de graphiques
 */
export const CHART_SIZE_LABELS: Record<ChartSize, string> = {
  small: 'Petit',
  medium: 'Moyen',
  large: 'Grand',
  full: 'Pleine largeur',
};

/**
 * Colonnes grid pour chaque taille
 */
export const CHART_SIZE_COLUMNS: Record<ChartSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-2',
  large: 'col-span-3',
  full: 'col-span-6',
};
