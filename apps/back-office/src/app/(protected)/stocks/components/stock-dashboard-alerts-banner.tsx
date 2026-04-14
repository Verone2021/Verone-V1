'use client';

import Link from 'next/link';

import { AlertTriangle, ArrowRight } from 'lucide-react';

interface StockDashboardAlertsBannerProps {
  realAlertsCount: number;
  criticalCount: number;
  productsOutOfStock: number;
}

export function StockDashboardAlertsBanner({
  realAlertsCount,
  criticalCount,
  productsOutOfStock,
}: StockDashboardAlertsBannerProps) {
  const totalAlerts =
    (realAlertsCount > 0 ? 1 : 0) + (productsOutOfStock > 0 ? 1 : 0);

  if (totalAlerts === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        <span className="text-xs font-semibold text-amber-900">
          A traiter ({realAlertsCount + productsOutOfStock})
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {realAlertsCount > 0 && (
          <Link
            href="/stocks/alertes"
            className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-sm text-gray-900">
                <strong>{realAlertsCount}</strong> produit(s) sous le seuil
                minimum
                {criticalCount > 0 && (
                  <span className="text-red-600 ml-1">
                    dont {criticalCount} critique(s)
                  </span>
                )}
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
          </Link>
        )}
        {productsOutOfStock > 0 && (
          <Link
            href="/stocks/inventaire"
            className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-sm text-gray-900">
                <strong>{productsOutOfStock}</strong> produit(s) en rupture de
                stock
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
          </Link>
        )}
      </div>
    </div>
  );
}
