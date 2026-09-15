'use client';

import { useState } from 'react';

import Link from 'next/link';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { ResponsiveDataView } from '@verone/ui';

import type { ComputedSaleLine } from '../../../hooks/use-product-sales-margin';
import {
  clrMargin,
  fmtDate,
  fmtEur,
  fmtPct,
  fmtQty,
} from './profitability-format';

/** Libellés canaux */
const CHANNEL_LABELS: Record<string, string> = {
  linkme: 'LinkMe',
  manuel: 'Manuel',
  site_internet: 'Site',
};

function channelLabel(line: ComputedSaleLine): string {
  const code = line.channelCode ?? '';
  return CHANNEL_LABELS[code] ?? line.channelName ?? code ?? '—';
}

const INITIAL_ROWS = 5;

interface Props {
  lines: ComputedSaleLine[];
}

export function SalesHistoryTable({ lines }: Props): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? lines : lines.slice(0, INITIAL_ROWS);

  if (lines.length === 0) {
    return (
      <p className="text-sm text-neutral-500 italic">
        Aucune vente enregistrée pour ce produit.
      </p>
    );
  }

  return (
    <div>
      <ResponsiveDataView
        data={visible}
        emptyMessage="Aucune vente enregistrée pour ce produit."
        breakpoint="md"
        renderTable={rows => (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">
                <tr>
                  <th className="px-3 py-2 w-[100px]">Date</th>
                  <th className="px-3 py-2 min-w-[140px]">N° commande</th>
                  <th className="px-3 py-2">Canal</th>
                  <th className="px-3 py-2 text-right w-[70px]">Qté</th>
                  <th className="px-3 py-2 text-right hidden lg:table-cell">
                    PV Vérone HT
                  </th>
                  <th className="px-3 py-2 text-right hidden lg:table-cell">
                    Marge unit.
                  </th>
                  <th className="px-3 py-2 text-right hidden xl:table-cell">
                    Marge %
                  </th>
                  <th className="px-3 py-2 text-right w-[120px]">
                    Total Vérone
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((s, i) => (
                  <tr key={`${s.orderId}-${i}`} className="hover:bg-neutral-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtDate(s.orderDate)}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/commandes/clients?id=${s.orderId}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {s.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-neutral-500">
                        {channelLabel(s)}
                        {s.isLinkMe && s.affiliateName && (
                          <span className="ml-1 text-violet-500">
                            ({s.affiliateName})
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtQty(s.quantity)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden lg:table-cell">
                      {fmtEur(s.veroneUnitPrice)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden lg:table-cell">
                      {s.marginUnit != null ? (
                        <span className={clrMargin(s.marginUnit)}>
                          {fmtEur(s.marginUnit)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden xl:table-cell">
                      {s.marginPercent != null ? (
                        <span className={clrMargin(s.marginPercent)}>
                          {fmtPct(s.marginPercent)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {fmtEur(s.veroneRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        renderCard={(s, i) => (
          <div
            key={`${s.orderId}-${i}`}
            className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/commandes/clients?id=${s.orderId}`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {s.orderNumber}
              </Link>
              <span className="text-xs text-neutral-500">
                {fmtDate(s.orderDate)}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              {channelLabel(s)}
              {s.isLinkMe && s.affiliateName ? ` (${s.affiliateName})` : ''}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-600">
              <span>
                {fmtQty(s.quantity)} × {fmtEur(s.veroneUnitPrice)}
              </span>
              <span className="font-medium">
                Total Vérone : {fmtEur(s.veroneRevenue)}
              </span>
              {s.marginUnit != null && (
                <span className={clrMargin(s.marginUnit)}>
                  Marge : {fmtEur(s.marginUnit)} / pièce ·{' '}
                  {fmtPct(s.marginPercent)}
                </span>
              )}
            </div>
          </div>
        )}
      />
      {lines.length > INITIAL_ROWS && (
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
              {lines.length - INITIAL_ROWS} autres
            </>
          )}
        </button>
      )}
    </div>
  );
}
