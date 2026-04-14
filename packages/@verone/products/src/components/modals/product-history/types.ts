'use client';

import type { StockReasonCode } from '@verone/stock/hooks';

export interface HistoryFilters {
  dateRange: 'all' | 'today' | '7days' | '30days';
  movementTypes: string[];
}

export interface StockMovement {
  id: string;
  performed_at: string;
  movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reason_code?: StockReasonCode;
  notes?: string;
  reference_type?: string;
  reference_id?: string;
  user_profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface HistoryStats {
  total: number;
  totalIn: number;
  totalOut: number;
  totalAdjust: number;
  netChange: number;
}

export const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  IN: 'bg-black text-white',
  OUT: 'bg-gray-700 text-white',
  ADJUST: 'bg-gray-500 text-white',
  TRANSFER: 'bg-gray-400 text-white',
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  IN: 'Entrée',
  OUT: 'Sortie',
  ADJUST: 'Ajustement',
  TRANSFER: 'Transfert',
};

export function getMovementTypeLabel(type: string): string {
  return MOVEMENT_TYPE_LABELS[type] ?? type;
}

export function getMovementTypeColor(type: string): string {
  return MOVEMENT_TYPE_COLORS[type] ?? 'bg-gray-300 text-black';
}

export function filterMovements(
  movements: StockMovement[],
  filters: HistoryFilters
): StockMovement[] {
  let filtered = [...movements];

  if (filters.dateRange !== 'all') {
    const now = new Date();
    let startDate: Date;

    switch (filters.dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    filtered = filtered.filter(m => new Date(m.performed_at) >= startDate);
  }

  if (filters.movementTypes.length > 0) {
    filtered = filtered.filter(m =>
      filters.movementTypes.includes(m.movement_type)
    );
  }

  return filtered;
}

export function computeStats(movements: StockMovement[]): HistoryStats {
  const totalIn = movements
    .filter(m => m.movement_type === 'IN')
    .reduce((sum, m) => sum + m.quantity_change, 0);

  const totalOut = movements
    .filter(m => m.movement_type === 'OUT')
    .reduce((sum, m) => sum + Math.abs(m.quantity_change), 0);

  const totalAdjust = movements
    .filter(m => m.movement_type === 'ADJUST')
    .reduce((sum, m) => sum + m.quantity_change, 0);

  return {
    total: movements.length,
    totalIn,
    totalOut,
    totalAdjust,
    netChange: totalIn - totalOut + totalAdjust,
  };
}

export function getSourceInfo(movement: StockMovement) {
  if (movement.reference_type === 'order' && movement.reference_id) {
    return {
      type: 'order',
      label: 'Commande',
      link: `/commandes/${movement.reference_id}`,
    };
  }
  if (movement.reference_type === 'sale' && movement.reference_id) {
    return {
      type: 'sale',
      label: 'Vente',
      link: `/commandes/${movement.reference_id}`,
    };
  }
  return { type: 'manual', label: 'Manuel', link: null };
}

export function getPerformerName(movement: StockMovement): string {
  if (movement.user_profiles) {
    const { first_name, last_name } = movement.user_profiles;
    if (first_name ?? last_name) {
      return `${first_name ?? ''} ${last_name ?? ''}`.trim();
    }
  }
  return 'Admin';
}
