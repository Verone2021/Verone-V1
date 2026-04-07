import type { MovementType, StockReasonCode } from './use-stock-movements';

export type { MovementType, StockReasonCode };

export interface MovementHistoryFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  movementTypes?: MovementType[];
  reasonCodes?: StockReasonCode[];
  userIds?: string[];
  productSearch?: string;
  affects_forecast?: boolean;
  forecast_type?: 'in' | 'out';
  channelId?: string | null; // Filtre par canal de vente (accepte null et undefined)
  limit?: number;
  offset?: number;
}

export interface MovementWithDetails {
  id: string;
  product_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUST';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  reason_code?: string;
  affects_forecast: boolean;
  forecast_type?: 'in' | 'out';
  performed_by: string;
  performed_at: string;
  created_at: string;

  // Données enrichies
  product_name?: string;
  product_sku?: string;
  product_image_url?: string | null;
  user_name?: string;
  user_first_name?: string;
  user_last_name?: string;
  reason_description?: string;

  // Données canal de vente (pour mouvements liés aux commandes clients)
  channel_id?: string | null;
  channel_name?: string | null;
  channel_code?: string | null;
}

export interface MovementsStats {
  totalMovements: number;
  movementsToday: number;
  movementsThisWeek: number;
  movementsThisMonth: number;

  byType: {
    IN: number;
    OUT: number;
    ADJUST: number;
  };

  realMovements?: number;
  forecastMovements?: number;

  topReasons: Array<{
    code: string;
    description: string;
    count: number;
  }>;

  topUsers: Array<{
    user_id: string;
    user_name: string;
    count: number;
  }>;
}

/**
 * Options pour le hook useMovementsHistory
 * Permet d'initialiser les filtres dès le montage (ex: page ajustements = ADJUST uniquement)
 */
export interface UseMovementsHistoryOptions {
  /** Filtres initiaux appliqués au montage (ex: { movementTypes: ['ADJUST'] }) */
  initialFilters?: Partial<MovementHistoryFilters>;
}
