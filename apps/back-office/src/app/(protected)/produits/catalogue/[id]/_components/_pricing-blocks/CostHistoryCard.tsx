'use client';

/**
 * CostHistoryCard — résumé statistique de l'historique des prix de revient.
 * Affiche : Moyenne pondérée / Min-Max / Dernier prix + date / Volume 12 mois
 * + mini sparkline symbolique en CSS bars.
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { cn, formatPrice } from '@verone/utils';
import type { CostStats, PurchaseOrderRow } from '@verone/products';

interface CostHistoryCardProps {
  costStats: CostStats;
  purchases: PurchaseOrderRow[];
  onViewAll?: () => void;
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

/** Génère jusqu'à 12 points de hauteur relative pour la sparkline */
function buildSparklineBars(
  purchases: PurchaseOrderRow[],
  count: number
): number[] {
  const sorted = [...purchases]
    .filter(p => p.unitCostNet != null && p.unitCostNet > 0)
    .sort((a, b) => {
      if (!a.orderDate) return 1;
      if (!b.orderDate) return -1;
      return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
    })
    .slice(-count);

  if (sorted.length === 0) return [];

  const values = sorted.map(p => p.unitCostNet as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) return values.map(() => 50);
  return values.map(v => Math.round(((v - min) / range) * 70 + 20));
}

export function CostHistoryCard({
  costStats,
  purchases,
  onViewAll,
}: CostHistoryCardProps) {
  const bars = buildSparklineBars(purchases, 12);

  const rows: Array<{
    label: string;
    value: string;
    sub?: string;
    accent?: boolean;
  }> = [
    {
      label: 'Moyenne pondérée',
      value:
        costStats.costNetAvg != null ? formatPrice(costStats.costNetAvg) : '—',
      accent: true,
    },
    {
      label: 'Min – Max',
      value:
        costStats.costNetMin != null && costStats.costNetMax != null
          ? `${formatPrice(costStats.costNetMin)} – ${formatPrice(costStats.costNetMax)}`
          : '—',
    },
    {
      label: 'Dernier prix',
      value:
        costStats.costNetLast != null
          ? formatPrice(costStats.costNetLast)
          : '—',
      sub: formatDateShort(costStats.lastPurchaseDate),
    },
    {
      label: 'Volume 12 mois',
      value: `${costStats.totalQty12m} unité${costStats.totalQty12m !== 1 ? 's' : ''}`,
      sub: `${costStats.purchasesCount} commande${costStats.purchasesCount !== 1 ? 's' : ''}`,
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Historique prix de revient
        </h3>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs text-neutral-500 underline hover:text-neutral-700"
          >
            Voir tout →
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div className="space-y-2">
        {rows.map(row => (
          <div
            key={row.label}
            className="flex items-center justify-between py-1 border-b border-neutral-50 last:border-0"
          >
            <span className="text-xs text-neutral-500">{row.label}</span>
            <div className="text-right">
              <span
                className={cn(
                  'text-sm tabular-nums',
                  row.accent
                    ? 'font-semibold text-neutral-900'
                    : 'text-neutral-700'
                )}
              >
                {row.value}
              </span>
              {row.sub && (
                <span className="text-[10px] text-neutral-400 ml-1.5">
                  {row.sub}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mini sparkline */}
      {bars.length > 1 && (
        <div className="mt-3 pt-3 border-t border-neutral-50">
          <div className="text-[10px] text-neutral-400 mb-1.5">
            Évolution (plus ancien → récent)
          </div>
          <div className="flex items-end gap-0.5 h-8">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-indigo-200 hover:bg-indigo-400 transition-colors"
                style={{ height: `${h}%` }}
                title={`Achat ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {bars.length === 0 && (
        <div className="mt-3 text-xs text-neutral-400 italic">
          Aucun historique disponible
        </div>
      )}
    </div>
  );
}
