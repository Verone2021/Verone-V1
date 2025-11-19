/**
 * 📦 @verone/ui-stock - Barrel Export
 *
 * Package composants stock Design System V2
 * Vérone Back Office - Phase 3.1 Stock Multi-Canal
 *
 * @example
 * ```tsx
 * import {
 *   ChannelBadge,
 *   ChannelFilter,
 *   StockMovementCard,
 *   StockKPICard,
 *   type ChannelCode,
 *   type MovementType
 * } from '@/components/ui-v2/stock'
 * ```
 */

// Components (fonctionnels sans dépendances externes)
export { ChannelBadge } from './ChannelBadge';
export type { ChannelBadgeProps } from './ChannelBadge';

// Composants Stock - Phase 2 Activés
export { StockKPICard } from './StockKPICard';
export type { StockKPICardProps } from './StockKPICard';

export { StockMovementCard } from './StockMovementCard';
export type { StockMovementCardProps } from './StockMovementCard';

export { ChannelFilter } from './ChannelFilter';
export type { ChannelFilterProps } from './ChannelFilter';

// Types & Constants
export type {
  ChannelCode,
  MovementType,
  KPIVariant,
  LucideIcon,
} from './types';

export {
  CHANNEL_CONFIG,
  MOVEMENT_CONFIG,
  KPI_VARIANT_CONFIG,
  SIZES,
} from './types';
