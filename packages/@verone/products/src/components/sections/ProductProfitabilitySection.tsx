'use client';

import {
  ShoppingCart,
  Warehouse,
  TrendingUp,
  Package,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { useProductProfitability } from '../../hooks/use-product-profitability';
import { useProductSalesMargin } from '../../hooks/use-product-sales-margin';
import { PurchaseHistoryTable } from './profitability/PurchaseHistoryTable';
import { SalesHistoryTable } from './profitability/SalesHistoryTable';
import { fmtEur, fmtQty } from './profitability/profitability-format';

// ---------- KPI card ----------

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 truncate">{label}</p>
        <p className="text-sm font-semibold text-neutral-900 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

// ---------- Main component ----------

interface ProductProfitabilitySectionProps {
  productId: string;
  costNetAvg: number | null;
  stockReal: number | null;
}

export function ProductProfitabilitySection({
  productId,
  costNetAvg,
  stockReal,
}: ProductProfitabilitySectionProps): React.JSX.Element {
  const {
    purchases,
    kpis,
    loading: purchasesLoading,
    error: purchasesError,
  } = useProductProfitability(productId, costNetAvg, stockReal);

  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
  } = useProductSalesMargin(productId);

  const loading = purchasesLoading || salesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        <span className="ml-2 text-sm text-neutral-500">
          Chargement rentabilité…
        </span>
      </div>
    );
  }

  if (purchasesError ?? salesError) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700">
          {purchasesError ?? 'Erreur chargement rentabilité.'}
        </p>
      </div>
    );
  }

  const salesLines = salesData?.lines ?? [];
  const totalSoldQty = salesLines.reduce((s, l) => s + l.quantity, 0);
  const grossMargin = salesData
    ? salesLines.reduce<number | null>((acc, l) => {
        if (l.marginTotal == null) return null;
        return acc == null ? null : acc + l.marginTotal;
      }, 0)
    : null;

  const hasData = purchases.length > 0 || salesLines.length > 0;

  if (!hasData) {
    return (
      <p className="text-sm text-neutral-500 italic py-4">
        Aucun historique d&apos;achat ni de vente pour ce produit.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicateurs clés */}
      <div>
        <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
          Indicateurs clés
        </h4>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Qté achetée"
            value={fmtQty(kpis.totalPurchasedQty)}
            icon={ShoppingCart}
            color="bg-blue-500"
          />
          <KpiCard
            label="Qté vendue"
            value={fmtQty(totalSoldQty)}
            icon={TrendingUp}
            color="bg-green-500"
          />
          <KpiCard
            label="Marge brute"
            value={grossMargin != null ? fmtEur(grossMargin) : '—'}
            icon={Package}
            color="bg-amber-500"
          />
          <KpiCard
            label="Stock valorisé"
            value={kpis.stockValue != null ? fmtEur(kpis.stockValue) : '—'}
            icon={Warehouse}
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* Historique achats */}
      <div>
        <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
          Historique achats ({purchases.length})
        </h4>
        <PurchaseHistoryTable rows={purchases} />
      </div>

      {/* Historique ventes */}
      <div>
        <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
          Historique ventes ({salesLines.length})
        </h4>
        <SalesHistoryTable lines={salesLines} />
      </div>
    </div>
  );
}
