'use client';

interface StockDashboardKPIsProps {
  totalQuantity: number;
  totalValue: number;
  alertsCount: number;
  rotation7j: number;
}

export function StockDashboardKPIs({
  totalQuantity,
  totalValue,
  alertsCount,
  rotation7j,
}: StockDashboardKPIsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide">
          Stock total
        </p>
        <p className="text-base font-bold text-gray-900">
          {totalQuantity.toLocaleString('fr-FR')}
        </p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide">
          Valeur stock
        </p>
        <p className="text-base font-bold text-gray-900">
          {(totalValue ?? 0).toLocaleString('fr-FR')} &euro;
        </p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide">
          Alertes
        </p>
        <p className="text-base font-bold text-gray-900">{alertsCount}</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide">
          Rotation 7j
        </p>
        <p className="text-base font-bold text-gray-900">{rotation7j}</p>
      </div>
    </div>
  );
}
