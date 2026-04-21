'use client';

/**
 * PurchaseOrdersTable — tableau consolidé de tous les achats fournisseurs
 * pour ce produit. Colonnes : Réf PO / Date / Fournisseur / Prix unit HT /
 * Prix revient / Quantité.
 * Colonnes masquables progressivement sur mobile.
 * Pagination simple (affiche les N premiers, hint "+X plus").
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { useState, useCallback } from 'react';

import { cn, formatPrice } from '@verone/utils';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import type { PurchaseOrderRow } from '@verone/products';

interface PurchaseOrdersTableProps {
  purchases: PurchaseOrderRow[];
  isLoading: boolean;
}

const PAGE_SIZE = 6;

function formatDateFr(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PurchaseOrdersTable({
  purchases,
  isLoading,
}: PurchaseOrdersTableProps) {
  const [showAll, setShowAll] = useState(false);

  const toggleShowAll = useCallback(() => {
    setShowAll(prev => !prev);
  }, []);

  const handleExportCsv = useCallback(() => {
    if (purchases.length === 0) return;
    const header =
      'Réf PO,Date,Fournisseur,Prix achat HT,Prix revient,Quantité\n';
    const rows = purchases.map(p =>
      [
        p.poNumber,
        p.orderDate ?? '',
        p.supplierName,
        p.unitPriceHt.toFixed(2),
        p.unitCostNet?.toFixed(2) ?? '',
        p.quantity,
      ].join(',')
    );
    const blob = new Blob([header + rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'achats-produit.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [purchases]);

  const displayed = showAll ? purchases : purchases.slice(0, PAGE_SIZE);
  const remaining = purchases.length - PAGE_SIZE;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Tous les achats fournisseurs
        </h3>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={purchases.length === 0}
          className="inline-flex items-center gap-1.5 text-xs border border-neutral-200 rounded px-2 py-1 hover:bg-neutral-50 text-neutral-600 disabled:opacity-40"
        >
          <Download className="h-3 w-3" />
          Exporter CSV
        </button>
      </div>

      {isLoading && (
        <div className="text-sm text-neutral-400 py-4">Chargement…</div>
      )}

      {!isLoading && purchases.length === 0 && (
        <div className="text-sm text-neutral-400 py-4 italic">
          Aucun achat fournisseur enregistré.
        </div>
      )}

      {!isLoading && purchases.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-neutral-500 border-b border-neutral-100">
                  <th className="text-left py-2 font-medium">Réf PO</th>
                  <th className="text-left py-2 font-medium hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-left py-2 font-medium hidden lg:table-cell">
                    Fournisseur
                  </th>
                  <th className="text-right py-2 font-medium">Prix achat</th>
                  <th className="text-right py-2 font-medium hidden md:table-cell">
                    Prix revient
                  </th>
                  <th className="text-right py-2 font-medium">Qté</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50"
                  >
                    <td className="py-2 font-mono text-xs text-neutral-700">
                      {row.poNumber}
                    </td>
                    <td className="py-2 text-xs text-neutral-500 hidden md:table-cell">
                      {formatDateFr(row.orderDate)}
                    </td>
                    <td
                      className={cn(
                        'py-2 text-xs text-neutral-600 hidden lg:table-cell max-w-[140px] truncate'
                      )}
                    >
                      {row.supplierName}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs">
                      {formatPrice(row.unitPriceHt)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs hidden md:table-cell">
                      {row.unitCostNet != null ? (
                        <span className="font-medium text-indigo-700">
                          {formatPrice(row.unitCostNet)}
                        </span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs text-neutral-700">
                      {row.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination hint */}
          {purchases.length > PAGE_SIZE && (
            <div className="mt-2 pt-2 border-t border-neutral-50 text-center">
              <button
                type="button"
                onClick={toggleShowAll}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Réduire
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />+{remaining} plus ancie
                    {remaining > 1 ? 'nnes' : 'nne'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Footer note */}
          <p className="mt-3 text-[10px] text-neutral-400 italic leading-relaxed">
            Le prix de revient inclut transport, douane, assurance amortis sur
            les 12 derniers mois.
          </p>
        </>
      )}
    </div>
  );
}
