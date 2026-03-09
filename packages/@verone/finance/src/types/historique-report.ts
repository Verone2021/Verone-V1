export interface HistoriqueMovement {
  movement_type: 'IN' | 'OUT' | 'ADJUST';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  performed_at: string;
  product_name?: string;
  product_sku?: string;
  user_name?: string;
  reason_description?: string;
  notes?: string;
}

export interface HistoriqueReportData {
  summary: {
    total_movements: number;
    total_in: number;
    total_out: number;
    total_adjust: number;
    net_change: number;
  };
  by_type: Array<{ type: string; count: number; percentage: number }>;
  top_reasons: Array<{ code: string; description: string; count: number }>;
  movements: HistoriqueMovement[];
  generated_at: string;
}

export function buildHistoriqueReportData(
  movements: HistoriqueMovement[],
  stats: {
    byType: { IN: number; OUT: number; ADJUST: number };
    topReasons: Array<{ code: string; description: string; count: number }>;
  } | null
): HistoriqueReportData {
  const totalIn = stats?.byType.IN || 0;
  const totalOut = stats?.byType.OUT || 0;
  const totalAdjust = stats?.byType.ADJUST || 0;
  const totalMovements = totalIn + totalOut + totalAdjust;

  const byType = [
    {
      type: 'Entrees (IN)',
      count: totalIn,
      percentage: totalMovements > 0 ? (totalIn / totalMovements) * 100 : 0,
    },
    {
      type: 'Sorties (OUT)',
      count: totalOut,
      percentage: totalMovements > 0 ? (totalOut / totalMovements) * 100 : 0,
    },
    {
      type: 'Ajustements (ADJUST)',
      count: totalAdjust,
      percentage: totalMovements > 0 ? (totalAdjust / totalMovements) * 100 : 0,
    },
  ];

  const netChange = movements.reduce((sum, m) => {
    if (m.movement_type === 'IN') return sum + m.quantity_change;
    if (m.movement_type === 'OUT') return sum - m.quantity_change;
    return sum;
  }, 0);

  return {
    summary: {
      total_movements: totalMovements,
      total_in: totalIn,
      total_out: totalOut,
      total_adjust: totalAdjust,
      net_change: netChange,
    },
    by_type: byType,
    top_reasons: stats?.topReasons || [],
    movements,
    generated_at: new Date().toISOString(),
  };
}
