'use client';

import React, { useState } from 'react';

import Link from 'next/link';

import type {
  PurchaseRow,
  SaleRow,
  ProfitabilityKpis,
  ProfitabilitySummary,
} from '../../hooks/use-product-profitability';
import { useProductProfitability } from '../../hooks/use-product-profitability';

import {
  ShoppingCart,
  TrendingUp,
  Package,
  Warehouse,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// ---------- Helpers ----------

const fmtEur = (v: number | null | undefined): string => {
  if (v == null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(v);
};

const fmtPct = (v: number | null | undefined): string => {
  if (v == null) return '—';
  return `${v.toFixed(1)} %`;
};

const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const fmtQty = (v: number): string => new Intl.NumberFormat('fr-FR').format(v);

// ---------- Sub-components ----------

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
}) {
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

function KpiCards({ kpis }: { kpis: ProfitabilityKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard
        label="Qte achetee"
        value={fmtQty(kpis.totalPurchasedQty)}
        icon={ShoppingCart}
        color="bg-blue-500"
      />
      <KpiCard
        label="Qte vendue"
        value={fmtQty(kpis.totalSoldQty)}
        icon={TrendingUp}
        color="bg-green-500"
      />
      <KpiCard
        label="Marge brute"
        value={fmtEur(kpis.grossMargin)}
        icon={Package}
        color="bg-amber-500"
      />
      <KpiCard
        label="Stock valorise"
        value={fmtEur(kpis.stockValue)}
        icon={Warehouse}
        color="bg-purple-500"
      />
    </div>
  );
}

// ---------- Purchases table ----------

const INITIAL_ROWS = 5;

function PurchasesTable({ rows }: { rows: PurchaseRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, INITIAL_ROWS);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-500 italic">
        Aucun achat enregistre pour ce produit.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">N&deg; commande</th>
              <th className="px-3 py-2">Fournisseur</th>
              <th className="px-3 py-2 text-right">Qte</th>
              <th className="px-3 py-2 text-right">PU HT</th>
              <th className="px-3 py-2 text-right">Cout NET</th>
              <th className="px-3 py-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {visible.map((p, i) => (
              <tr key={`${p.orderId}-${i}`} className="hover:bg-neutral-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  {fmtDate(p.date)}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/achats/commandes/${p.orderId}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {p.orderNumber}
                  </Link>
                </td>
                <td className="px-3 py-2 truncate max-w-[160px]">
                  {p.supplierName}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmtQty(p.quantity)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmtEur(p.unitPriceHt)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmtEur(p.unitCostNet)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">
                  {fmtEur(p.totalHt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > INITIAL_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Voir les{' '}
              {rows.length - INITIAL_ROWS} autres
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ---------- Sales table ----------

function SalesTable({
  rows,
  costNetAvg,
}: {
  rows: SaleRow[];
  costNetAvg: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, INITIAL_ROWS);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-500 italic">
        Aucune vente enregistree pour ce produit.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">N&deg; commande</th>
              <th className="px-3 py-2 text-right">Qte</th>
              <th className="px-3 py-2 text-right">PV HT</th>
              <th className="px-3 py-2 text-right">Cout NET</th>
              <th className="px-3 py-2 text-right">Marge unit</th>
              <th className="px-3 py-2 text-right">Marge %</th>
              <th className="px-3 py-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {visible.map((s, i) => (
              <tr key={`${s.orderId}-${i}`} className="hover:bg-neutral-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  {fmtDate(s.date)}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/ventes/commandes/${s.orderId}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {s.orderNumber}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmtQty(s.quantity)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmtEur(s.unitPriceHt)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmtEur(costNetAvg)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {s.marginUnit != null ? (
                    <span
                      className={
                        s.marginUnit >= 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {fmtEur(s.marginUnit)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {s.marginPercent != null ? (
                    <span
                      className={
                        s.marginPercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {fmtPct(s.marginPercent)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">
                  {fmtEur(s.totalHt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > INITIAL_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Voir les{' '}
              {rows.length - INITIAL_ROWS} autres
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ---------- Margin summary ----------

function MarginSummary({ summary }: { summary: ProfitabilitySummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs text-neutral-500">CA total HT</p>
        <p className="text-sm font-semibold text-neutral-900">
          {fmtEur(summary.totalRevenueHt)}
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs text-neutral-500">Marge brute totale</p>
        <p className="text-sm font-semibold text-neutral-900">
          {summary.totalGrossMargin != null ? (
            <span
              className={
                summary.totalGrossMargin >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }
            >
              {fmtEur(summary.totalGrossMargin)}
            </span>
          ) : (
            '—'
          )}
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs text-neutral-500">Marge moy. / unite</p>
        <p className="text-sm font-semibold text-neutral-900">
          {fmtEur(summary.avgMarginPerUnit)}
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs text-neutral-500">Taux de marge moyen</p>
        <p className="text-sm font-semibold text-neutral-900">
          {summary.avgMarginPercent != null ? (
            <span
              className={
                summary.avgMarginPercent >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }
            >
              {fmtPct(summary.avgMarginPercent)}
            </span>
          ) : (
            '—'
          )}
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
}: ProductProfitabilitySectionProps) {
  const { purchases, sales, kpis, summary, loading, error } =
    useProductProfitability(productId, costNetAvg, stockReal);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        <span className="ml-2 text-sm text-neutral-500">
          Chargement rentabilite...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const hasData = purchases.length > 0 || sales.length > 0;

  if (!hasData) {
    return (
      <p className="text-sm text-neutral-500 italic py-4">
        Aucun historique d&apos;achat ni de vente pour ce produit.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div>
        <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
          Indicateurs cles
        </h4>
        <KpiCards kpis={kpis} />
      </div>

      {/* Purchases history */}
      <div>
        <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
          Historique achats ({purchases.length})
        </h4>
        <PurchasesTable rows={purchases} />
      </div>

      {/* Sales history */}
      <div>
        <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
          Historique ventes ({sales.length})
        </h4>
        <SalesTable rows={sales} costNetAvg={costNetAvg} />
      </div>

      {/* Margin summary */}
      {sales.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
            Resume marge
          </h4>
          <MarginSummary summary={summary} />
        </div>
      )}
    </div>
  );
}
