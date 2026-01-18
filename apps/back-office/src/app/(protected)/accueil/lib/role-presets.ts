/**
 * Présets de dashboard par rôle utilisateur
 * Chaque préset définit les KPIs par défaut pour un profil métier
 */

import type { DashboardTab } from '../components/dashboard-tabs';
import type { DashboardWidget } from '../hooks/use-dashboard-preferences';

export type UserRole =
  | 'direction'
  | 'commercial'
  | 'logistique'
  | 'comptabilite'
  | 'linkme_manager'
  | 'custom';

export interface RolePreset {
  id: UserRole;
  label: string;
  description: string;
  icon: string; // Emoji for simplicity
  tabs: Record<DashboardTab, DashboardWidget[]>;
}

// ============================================================================
// PRÉSETS PAR RÔLE
// ============================================================================

export const ROLE_PRESETS: Record<UserRole, RolePreset> = {
  // ═══════════════════════════════════════════════════════════════
  // DIRECTION - Vision globale, KPIs stratégiques
  // ═══════════════════════════════════════════════════════════════
  direction: {
    id: 'direction',
    label: 'Direction',
    description: "Vision globale de l'entreprise, KPIs stratégiques",
    icon: '👔',
    tabs: {
      apercu: [
        {
          type: 'kpi',
          kpi_id: 'monthly_revenue',
          period: 'month',
          position: 0,
        },
        { type: 'kpi', kpi_id: 'cash_balance', period: 'month', position: 1 },
        {
          type: 'kpi',
          kpi_id: 'sales_orders_count',
          period: 'month',
          position: 2,
        },
        { type: 'kpi', kpi_id: 'stock_alerts', period: 'month', position: 3 },
      ],
      ventes: [
        {
          type: 'kpi',
          kpi_id: 'monthly_revenue',
          period: 'month',
          position: 0,
        },
        {
          type: 'kpi',
          kpi_id: 'average_order_value',
          period: 'month',
          position: 1,
        },
        {
          type: 'kpi',
          kpi_id: 'sales_orders_count',
          period: 'month',
          position: 2,
        },
        {
          type: 'kpi',
          kpi_id: 'orders_completed',
          period: 'month',
          position: 3,
        },
      ],
      stock: [
        { type: 'kpi', kpi_id: 'stock_value', period: 'month', position: 0 },
        { type: 'kpi', kpi_id: 'stock_alerts', period: 'month', position: 1 },
        { type: 'kpi', kpi_id: 'products_total', period: 'month', position: 2 },
        {
          type: 'kpi',
          kpi_id: 'samples_waiting',
          period: 'month',
          position: 3,
        },
      ],
      finances: [
        { type: 'kpi', kpi_id: 'cash_balance', period: 'month', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'accounts_receivable',
          period: 'month',
          position: 1,
        },
        {
          type: 'kpi',
          kpi_id: 'accounts_payable',
          period: 'month',
          position: 2,
        },
        { type: 'kpi', kpi_id: 'burn_rate', period: 'month', position: 3 },
      ],
      linkme: [
        {
          type: 'kpi',
          kpi_id: 'linkme_commissions',
          period: 'month',
          position: 0,
        },
        { type: 'kpi', kpi_id: 'linkme_orders', period: 'month', position: 1 },
        {
          type: 'kpi',
          kpi_id: 'linkme_affiliates_active',
          period: 'month',
          position: 2,
        },
        {
          type: 'kpi',
          kpi_id: 'linkme_conversion_rate',
          period: 'month',
          position: 3,
        },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // COMMERCIAL - Focus ventes et clients
  // ═══════════════════════════════════════════════════════════════
  commercial: {
    id: 'commercial',
    label: 'Commercial',
    description: 'Focus sur les ventes, commandes et clients',
    icon: '💼',
    tabs: {
      apercu: [
        { type: 'kpi', kpi_id: 'daily_revenue', period: 'day', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'sales_orders_count',
          period: 'week',
          position: 1,
        },
        { type: 'kpi', kpi_id: 'orders_pending', period: 'month', position: 2 },
        {
          type: 'kpi',
          kpi_id: 'average_order_value',
          period: 'month',
          position: 3,
        },
      ],
      ventes: [
        { type: 'kpi', kpi_id: 'daily_revenue', period: 'day', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'monthly_revenue',
          period: 'month',
          position: 1,
        },
        { type: 'kpi', kpi_id: 'orders_pending', period: 'month', position: 2 },
        {
          type: 'kpi',
          kpi_id: 'orders_processing',
          period: 'month',
          position: 3,
        },
        {
          type: 'kpi',
          kpi_id: 'orders_completed',
          period: 'month',
          position: 4,
        },
        {
          type: 'kpi',
          kpi_id: 'average_order_value',
          period: 'month',
          position: 5,
        },
      ],
      stock: [
        { type: 'kpi', kpi_id: 'products_total', period: 'month', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'products_published',
          period: 'month',
          position: 1,
        },
        { type: 'kpi', kpi_id: 'stock_alerts', period: 'month', position: 2 },
      ],
      finances: [
        {
          type: 'kpi',
          kpi_id: 'monthly_revenue',
          period: 'month',
          position: 0,
        },
        {
          type: 'kpi',
          kpi_id: 'invoices_unpaid',
          period: 'month',
          position: 1,
        },
      ],
      linkme: [
        { type: 'kpi', kpi_id: 'linkme_orders', period: 'month', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'linkme_commissions',
          period: 'month',
          position: 1,
        },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // LOGISTIQUE - Focus stock et expéditions
  // ═══════════════════════════════════════════════════════════════
  logistique: {
    id: 'logistique',
    label: 'Logistique',
    description: 'Gestion du stock, réceptions et expéditions',
    icon: '📦',
    tabs: {
      apercu: [
        { type: 'kpi', kpi_id: 'stock_alerts', period: 'month', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'purchase_orders_count',
          period: 'month',
          position: 1,
        },
        {
          type: 'kpi',
          kpi_id: 'orders_processing',
          period: 'month',
          position: 2,
        },
        {
          type: 'kpi',
          kpi_id: 'samples_waiting',
          period: 'month',
          position: 3,
        },
      ],
      ventes: [
        { type: 'kpi', kpi_id: 'orders_pending', period: 'month', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'orders_processing',
          period: 'month',
          position: 1,
        },
        {
          type: 'kpi',
          kpi_id: 'orders_completed',
          period: 'week',
          position: 2,
        },
      ],
      stock: [
        { type: 'kpi', kpi_id: 'stock_value', period: 'month', position: 0 },
        { type: 'kpi', kpi_id: 'stock_alerts', period: 'month', position: 1 },
        { type: 'kpi', kpi_id: 'stock_in_count', period: 'month', position: 2 },
        {
          type: 'kpi',
          kpi_id: 'stock_out_count',
          period: 'month',
          position: 3,
        },
        { type: 'kpi', kpi_id: 'products_total', period: 'month', position: 4 },
        {
          type: 'kpi',
          kpi_id: 'samples_waiting',
          period: 'month',
          position: 5,
        },
      ],
      finances: [
        { type: 'kpi', kpi_id: 'stock_value', period: 'month', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'purchase_orders_count',
          period: 'month',
          position: 1,
        },
      ],
      linkme: [
        { type: 'kpi', kpi_id: 'linkme_orders', period: 'month', position: 0 },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // COMPTABILITÉ - Focus finances et trésorerie
  // ═══════════════════════════════════════════════════════════════
  comptabilite: {
    id: 'comptabilite',
    label: 'Comptabilité',
    description: 'Trésorerie, factures et finances',
    icon: '📊',
    tabs: {
      apercu: [
        { type: 'kpi', kpi_id: 'cash_balance', period: 'month', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'accounts_receivable',
          period: 'month',
          position: 1,
        },
        {
          type: 'kpi',
          kpi_id: 'accounts_payable',
          period: 'month',
          position: 2,
        },
        {
          type: 'kpi',
          kpi_id: 'invoices_unpaid',
          period: 'month',
          position: 3,
        },
      ],
      ventes: [
        {
          type: 'kpi',
          kpi_id: 'monthly_revenue',
          period: 'month',
          position: 0,
        },
        {
          type: 'kpi',
          kpi_id: 'sales_orders_count',
          period: 'month',
          position: 1,
        },
        {
          type: 'kpi',
          kpi_id: 'invoices_unpaid',
          period: 'month',
          position: 2,
        },
      ],
      stock: [
        { type: 'kpi', kpi_id: 'stock_value', period: 'month', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'purchase_orders_count',
          period: 'month',
          position: 1,
        },
      ],
      finances: [
        { type: 'kpi', kpi_id: 'cash_balance', period: 'month', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'accounts_receivable',
          period: 'month',
          position: 1,
        },
        {
          type: 'kpi',
          kpi_id: 'accounts_payable',
          period: 'month',
          position: 2,
        },
        {
          type: 'kpi',
          kpi_id: 'invoices_unpaid',
          period: 'month',
          position: 3,
        },
        { type: 'kpi', kpi_id: 'burn_rate', period: 'month', position: 4 },
        {
          type: 'kpi',
          kpi_id: 'monthly_revenue',
          period: 'month',
          position: 5,
        },
      ],
      linkme: [
        {
          type: 'kpi',
          kpi_id: 'linkme_commissions',
          period: 'month',
          position: 0,
        },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // LINKME MANAGER - Focus affiliés et commissions
  // ═══════════════════════════════════════════════════════════════
  linkme_manager: {
    id: 'linkme_manager',
    label: 'LinkMe Manager',
    description: 'Gestion des affiliés et commissions',
    icon: '🔗',
    tabs: {
      apercu: [
        {
          type: 'kpi',
          kpi_id: 'linkme_commissions',
          period: 'month',
          position: 0,
        },
        { type: 'kpi', kpi_id: 'linkme_orders', period: 'month', position: 1 },
        {
          type: 'kpi',
          kpi_id: 'linkme_affiliates_active',
          period: 'month',
          position: 2,
        },
        {
          type: 'kpi',
          kpi_id: 'linkme_conversion_rate',
          period: 'month',
          position: 3,
        },
      ],
      ventes: [
        { type: 'kpi', kpi_id: 'linkme_orders', period: 'month', position: 0 },
        {
          type: 'kpi',
          kpi_id: 'monthly_revenue',
          period: 'month',
          position: 1,
        },
      ],
      stock: [
        {
          type: 'kpi',
          kpi_id: 'products_published',
          period: 'month',
          position: 0,
        },
        { type: 'kpi', kpi_id: 'products_total', period: 'month', position: 1 },
      ],
      finances: [
        {
          type: 'kpi',
          kpi_id: 'linkme_commissions',
          period: 'month',
          position: 0,
        },
        {
          type: 'kpi',
          kpi_id: 'accounts_payable',
          period: 'month',
          position: 1,
        },
      ],
      linkme: [
        {
          type: 'kpi',
          kpi_id: 'linkme_commissions',
          period: 'month',
          position: 0,
        },
        { type: 'kpi', kpi_id: 'linkme_orders', period: 'month', position: 1 },
        {
          type: 'kpi',
          kpi_id: 'linkme_affiliates_active',
          period: 'month',
          position: 2,
        },
        {
          type: 'kpi',
          kpi_id: 'linkme_conversion_rate',
          period: 'month',
          position: 3,
        },
        {
          type: 'kpi',
          kpi_id: 'linkme_avg_margin',
          period: 'month',
          position: 4,
        },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CUSTOM - Configuration personnalisée (vide par défaut)
  // ═══════════════════════════════════════════════════════════════
  custom: {
    id: 'custom',
    label: 'Personnalisé',
    description: 'Configuration libre, commencez de zéro',
    icon: '⚙️',
    tabs: {
      apercu: [],
      ventes: [],
      stock: [],
      finances: [],
      linkme: [],
    },
  },
};

/**
 * Obtenir le préset par défaut (Direction)
 */
export function getDefaultPreset(): RolePreset {
  return ROLE_PRESETS.direction;
}

/**
 * Obtenir tous les présets disponibles (excluant custom)
 */
export function getAvailablePresets(): RolePreset[] {
  return Object.values(ROLE_PRESETS).filter(preset => preset.id !== 'custom');
}

/**
 * Obtenir les widgets d'un préset pour un onglet donné
 */
export function getPresetWidgetsForTab(
  role: UserRole,
  tab: DashboardTab
): DashboardWidget[] {
  const preset = ROLE_PRESETS[role];
  return preset?.tabs[tab] || [];
}
