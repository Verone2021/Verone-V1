'use client';

import { useState } from 'react';

import Link from 'next/link';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { ResponsiveDataView } from '@verone/ui';

import type { PurchaseRow } from '../../../hooks/use-product-profitability';
import { fmtDate, fmtEur, fmtQty } from './profitability-format';

const INITIAL_ROWS = 5;

interface Props {
  rows: PurchaseRow[];
}

export function PurchaseHistoryTable({ rows }: Props): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, INITIAL_ROWS);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-500 italic">
        Aucun achat enregistré pour ce produit.
      </p>
    );
  }

  return (
    <div>
      <ResponsiveDataView
        data={visible}
        emptyMessage="Aucun achat enregistré pour ce produit."
        breakpoint="md"
        renderTable={tableRows => (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">
                <tr>
                  <th className="px-3 py-2 w-[100px]">Date</th>
                  <th className="px-3 py-2 min-w-[140px]">N° commande</th>
                  <th className="px-3 py-2">Fournisseur</th>
                  <th className="px-3 py-2 text-right w-[70px]">Qté</th>
                  <th className="px-3 py-2 text-right hidden lg:table-cell">
                    PU HT
                  </th>
                  <th className="px-3 py-2 text-right hidden lg:table-cell">
                    Coût net
                  </th>
                  <th className="px-3 py-2 text-right w-[110px]">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {tableRows.map((p, i) => (
                  <tr key={`${p.orderId}-${i}`} className="hover:bg-neutral-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtDate(p.date)}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/commandes/fournisseurs?id=${p.orderId}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {p.orderNumber}
                      </Link>
                    </td>
                    <td
                      className="px-3 py-2 truncate max-w-[180px]"
                      title={p.supplierName}
                    >
                      {p.supplierName}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtQty(p.quantity)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden lg:table-cell">
                      {fmtEur(p.unitPriceHt)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden lg:table-cell">
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
        )}
        renderCard={(p, i) => (
          <div
            key={`${p.orderId}-${i}`}
            className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/commandes/fournisseurs?id=${p.orderId}`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {p.orderNumber}
              </Link>
              <span className="text-xs text-neutral-500">
                {fmtDate(p.date)}
              </span>
            </div>
            <p
              className="truncate text-xs text-neutral-500"
              title={p.supplierName}
            >
              {p.supplierName}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-600">
              <span>
                {fmtQty(p.quantity)} × {fmtEur(p.unitPriceHt)}
              </span>
              <span>Coût net : {fmtEur(p.unitCostNet)}</span>
              <span className="font-medium">Total : {fmtEur(p.totalHt)}</span>
            </div>
          </div>
        )}
      />
      {rows.length > INITIAL_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="mt-2 flex h-11 items-center gap-1 text-xs text-blue-600 hover:text-blue-800 md:h-auto"
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
