/**
 * Catalogue des Widgets Dashboard V2
 * Widgets de type "liste" affichant des données tabulaires/liste
 *
 * @created 2026-01-12
 */

import {
  ShoppingCart,
  FileText,
  AlertTriangle,
  Activity,
  TrendingUp,
  ArrowUpDown,
  Package,
  CreditCard,
  Users,
  Truck,
  type LucideIcon,
} from 'lucide-react';

import type { KPICategory } from './kpi-catalog';
import type { DashboardTab } from '../components/dashboard-tabs';

export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetDefinition {
  id: string;
  label: string;
  description: string;
  category: KPICategory;
  icon: LucideIcon;
  defaultLimit: number; // Nombre d'items par défaut
  size: WidgetSize; // Taille par défaut du widget
  defaultTabs: DashboardTab[]; // Onglets où le widget apparaît par défaut
  // Hooks et données
  hookName: string; // Nom du hook à utiliser
  dataFilter?: Record<string, unknown>; // Filtres optionnels
}

/**
 * Catalogue complet des widgets disponibles
 * Organisé par priorité d'implémentation (P0, P1, P2, P3)
 */
export const WIDGET_CATALOG: Record<string, WidgetDefinition> = {
  // ═══════════════════════════════════════════════════════════════
  // P0 - PRIORITÉ CRITIQUE
  // ═══════════════════════════════════════════════════════════════

  recent_orders: {
    id: 'recent_orders',
    label: 'Commandes récentes',
    description: 'Les 5 dernières commandes clients',
    category: 'sales',
    icon: ShoppingCart,
    defaultLimit: 5,
    size: 'medium',
    defaultTabs: ['apercu', 'ventes'],
    hookName: 'useSalesOrders',
    dataFilter: { limit: 5, orderBy: 'created_at', orderDirection: 'desc' },
  },

  unpaid_invoices: {
    id: 'unpaid_invoices',
    label: 'Factures impayées',
    description: 'Factures en attente de paiement',
    category: 'finance',
    icon: FileText,
    defaultLimit: 5,
    size: 'medium',
    defaultTabs: ['apercu', 'finances'],
    hookName: 'useInvoices',
    dataFilter: { status: ['draft', 'sent', 'overdue'] },
  },

  stock_alerts: {
    id: 'stock_alerts',
    label: 'Alertes stock',
    description: 'Produits en stock critique ou épuisé',
    category: 'stock',
    icon: AlertTriangle,
    defaultLimit: 5,
    size: 'medium',
    defaultTabs: ['apercu', 'stock'],
    hookName: 'useStockAlerts',
    dataFilter: { critical: true },
  },

  // ═══════════════════════════════════════════════════════════════
  // P1 - PRIORITÉ HAUTE
  // ═══════════════════════════════════════════════════════════════

  recent_activity: {
    id: 'recent_activity',
    label: 'Activité récente',
    description: 'Les 10 dernières actions utilisateurs',
    category: 'general',
    icon: Activity,
    defaultLimit: 10,
    size: 'medium',
    defaultTabs: ['apercu'],
    hookName: 'useRecentActivity',
  },

  top_products: {
    id: 'top_products',
    label: 'Top produits',
    description: 'Produits les plus vendus ce mois',
    category: 'sales',
    icon: TrendingUp,
    defaultLimit: 5,
    size: 'medium',
    defaultTabs: ['ventes'],
    hookName: 'useTopProducts',
    dataFilter: { period: 'month', limit: 5 },
  },

  stock_movements: {
    id: 'stock_movements',
    label: 'Mouvements stock',
    description: 'Les 10 derniers mouvements de stock',
    category: 'stock',
    icon: ArrowUpDown,
    defaultLimit: 10,
    size: 'medium',
    defaultTabs: ['stock'],
    hookName: 'useStockMovements',
    dataFilter: { limit: 10, orderBy: 'created_at', orderDirection: 'desc' },
  },

  // ═══════════════════════════════════════════════════════════════
  // P2 - PRIORITÉ MOYENNE
  // ═══════════════════════════════════════════════════════════════

  linkme_orders: {
    id: 'linkme_orders',
    label: 'Commandes LinkMe',
    description: 'Commandes affiliés à traiter',
    category: 'linkme',
    icon: Package,
    defaultLimit: 5,
    size: 'medium',
    defaultTabs: ['linkme'],
    hookName: 'useLinkmeOrders',
    dataFilter: { status: ['pending', 'validated'] },
  },

  linkme_payments: {
    id: 'linkme_payments',
    label: 'Paiements LinkMe',
    description: 'Demandes de paiement en attente',
    category: 'linkme',
    icon: CreditCard,
    defaultLimit: 5,
    size: 'medium',
    defaultTabs: ['linkme'],
    hookName: 'useLinkmePayments',
    dataFilter: { status: ['pending', 'invoice_received'] },
  },

  purchase_orders_pending: {
    id: 'purchase_orders_pending',
    label: 'PO en cours',
    description: 'Commandes fournisseurs en attente',
    category: 'stock',
    icon: Truck,
    defaultLimit: 5,
    size: 'medium',
    defaultTabs: ['stock'],
    hookName: 'usePurchaseOrders',
    dataFilter: { status: ['draft', 'validated', 'sent'] },
  },

  // ═══════════════════════════════════════════════════════════════
  // P3 - PRIORITÉ BASSE
  // ═══════════════════════════════════════════════════════════════

  sourcing_samples: {
    id: 'sourcing_samples',
    label: 'Échantillons',
    description: 'Échantillons en attente de validation',
    category: 'stock',
    icon: Package,
    defaultLimit: 5,
    size: 'small',
    defaultTabs: [],
    hookName: 'useSourcingSamples',
    dataFilter: { status: 'pending' },
  },

  linkme_affiliates: {
    id: 'linkme_affiliates',
    label: 'Affiliés actifs',
    description: 'Liste des affiliés avec commandes récentes',
    category: 'linkme',
    icon: Users,
    defaultLimit: 5,
    size: 'small',
    defaultTabs: [],
    hookName: 'useLinkmeAffiliates',
    dataFilter: { status: 'active', hasRecentOrders: true },
  },
};

/**
 * Obtenir les widgets par défaut pour un onglet donné
 */
export function getDefaultWidgetsForTab(tab: DashboardTab): WidgetDefinition[] {
  return Object.values(WIDGET_CATALOG).filter(widget =>
    widget.defaultTabs.includes(tab)
  );
}

/**
 * Obtenir les widgets par catégorie
 */
export function getWidgetsByCategory(
  category: KPICategory
): WidgetDefinition[] {
  return Object.values(WIDGET_CATALOG).filter(
    widget => widget.category === category
  );
}

/**
 * Labels pour les tailles de widgets
 */
export const SIZE_LABELS: Record<WidgetSize, string> = {
  small: 'Petit',
  medium: 'Moyen',
  large: 'Grand',
};

/**
 * Colonnes grid pour chaque taille
 */
export const SIZE_COLUMNS: Record<WidgetSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-2',
  large: 'col-span-3',
};
