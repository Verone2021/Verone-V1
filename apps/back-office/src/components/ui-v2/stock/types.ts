/**
 * 🎨 Stock UI Components - Types & Constants
 *
 * Types et constantes partagés pour les composants stock
 * Design System V2 - Vérone Back Office
 */

import {
  Building2,
  ShoppingCart,
  Store,
  Package,
  type LucideIcon,
} from 'lucide-react';

/**
 * Codes canaux de vente supportés
 */
export type ChannelCode = 'b2b' | 'ecommerce' | 'retail' | 'wholesale';

/**
 * Types de mouvements de stock
 */
export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';

/**
 * Configuration visuelle des canaux de vente
 * Couleurs conformes Design System V2
 */
export const CHANNEL_CONFIG = {
  b2b: {
    label: 'B2B',
    bgColor: 'bg-black',
    textColor: 'text-white',
    hoverColor: 'hover:bg-gray-900',
    icon: Building2,
  },
  ecommerce: {
    label: 'E-commerce',
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    hoverColor: 'hover:bg-blue-700',
    icon: ShoppingCart,
  },
  retail: {
    label: 'Retail',
    bgColor: 'bg-green-600',
    textColor: 'text-white',
    hoverColor: 'hover:bg-green-700',
    icon: Store,
  },
  wholesale: {
    label: 'Wholesale',
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    hoverColor: 'hover:bg-purple-700',
    icon: Package,
  },
} as const;

/**
 * Configuration visuelle des types de mouvements
 * Couleurs Design System V2
 */
export const MOVEMENT_CONFIG = {
  IN: {
    label: 'Entrée',
    borderColor: 'border-l-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    sign: '+',
  },
  OUT: {
    label: 'Sortie',
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    sign: '-',
  },
  ADJUST: {
    label: 'Ajustement',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    sign: '±',
  },
  TRANSFER: {
    label: 'Transfert',
    borderColor: 'border-l-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    sign: '⇄',
  },
} as const;

/**
 * Variantes KPI Card
 */
export type KPIVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Configuration visuelle des variantes KPI
 */
export const KPI_VARIANT_CONFIG = {
  default: {
    bgColor: 'bg-gray-100',
    iconBgColor: 'bg-gray-200',
    iconTextColor: 'text-gray-600',
  },
  success: {
    bgColor: 'bg-green-50',
    iconBgColor: 'bg-green-100',
    iconTextColor: 'text-green-600',
  },
  warning: {
    bgColor: 'bg-yellow-50',
    iconBgColor: 'bg-yellow-100',
    iconTextColor: 'text-yellow-600',
  },
  danger: {
    bgColor: 'bg-red-50',
    iconBgColor: 'bg-red-100',
    iconTextColor: 'text-red-600',
  },
  info: {
    bgColor: 'bg-purple-50',
    iconBgColor: 'bg-purple-100',
    iconTextColor: 'text-purple-600',
  },
} as const;

/**
 * Tailles standard des composants
 */
export const SIZES = {
  sm: {
    height: '20px',
    padding: 'px-2 py-0.5',
    fontSize: 'text-xs',
    iconSize: 12,
  },
  md: {
    height: '24px',
    padding: 'px-2.5 py-1',
    fontSize: 'text-xs',
    iconSize: 14,
  },
  lg: {
    height: '28px',
    padding: 'px-3 py-1.5',
    fontSize: 'text-sm',
    iconSize: 16,
  },
} as const;

/**
 * Type helper pour icônes Lucide
 */
export type { LucideIcon };
