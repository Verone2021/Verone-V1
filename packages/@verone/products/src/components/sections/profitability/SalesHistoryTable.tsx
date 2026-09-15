'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { ResponsiveDataView } from '@verone/ui';

import type { ComputedSaleLine } from '../../../hooks/use-product-sales-margin';
import { summarizeFilteredLines } from '../../../utils/product-sales-margin';
import { CostSourceBadge } from './CostSourceBadge';
import { SalesHistoryFiltersBar } from './SalesHistoryFiltersBar';
import {
  clrMargin,
  fmtCoef,
  fmtDate,
  fmtEur,
  fmtPct,
  fmtQty,
} from './profitability-format';

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
  const [periodFilter, setPeriodFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const l of lines) {
      if (l.orderDate) {
        const y = new Date(l.orderDate).getFullYear();
        if (!Number.isNaN(y)) years.add(y);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [lines]);

  const clientOptions = useMemo(() => {
    const names = new Set<string>();
    for (const l of lines) {
      if (l.customerName) names.add(l.customerName);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [lines]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return lines.filter(l => {
      if (channelFilter && l.channelCode !== channelFilter) return false;
      if (clientFilter && l.customerName !== clientFilter) return false;
      if (periodFilter === 'all') return true;
      if (!l.orderDate) return false;
      const t = new Date(l.orderDate).getTime();
      if (periodFilter === '12m') return t >= now - 365 * 24 * 3600 * 1000;
      if (periodFilter === 'current_year')
        return new Date(l.orderDate).getFullYear() === new Date().getFullYear();
      return new Date(l.orderDate).getFullYear() === Number(periodFilter);
    });
  }, [lines, periodFilter, clientFilter, channelFilter]);

  const totals = useMemo(() => summarizeFilteredLines(filtered), [filtered]);
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_ROWS);

  if (lines.length === 0) {
    return (
      <p className="text-sm text-neutral-500 italic">
        Aucune vente enregistrée pour ce produit.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <SalesHistoryFiltersBar
        periodFilter={periodFilter}
        clientFilter={clientFilter}
        channelFilter={channelFilter}
        availableYears={availableYears}
        clientOptions={clientOptions}
        onPeriod={setPeriodFilter}
        onClient={setClientFilter}
        onChannel={setChannelFilter}
      />

      <ResponsiveDataView
        data={visible}
        emptyMessage="Aucun résultat pour ces filtres."
        breakpoint="md"
        renderTable={rows => (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">
                <tr>
                  <th className="px-3 py-2 w-[100px]">Date</th>
                  <th className="px-3 py-2 min-w-[140px]">N° commande</th>
                  <th className="px-3 py-2 hidden lg:table-cell min-w-[140px]">
                    Client
                  </th>
                  <th className="px-3 py-2">Canal</th>
                  <th className="px-3 py-2 text-right w-[70px]">Qté</th>
                  <th className="px-3 py-2 text-right hidden lg:table-cell">
                    PV Vérone HT
                  </th>
                  <th className="px-3 py-2 text-right hidden lg:table-cell">
                    Coût
                  </th>
                  <th className="px-3 py-2 text-right hidden lg:table-cell">
                    Marge unit.
                  </th>
                  <th className="px-3 py-2 text-right hidden xl:table-cell">
                    Marge %
                  </th>
                  <th className="px-3 py-2 text-right hidden xl:table-cell">
                    Coef.
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
                    <td
                      className="px-3 py-2 hidden lg:table-cell truncate max-w-[160px]"
                      title={s.customerName ?? undefined}
                    >
                      {s.customerName ?? '—'}
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
                      <div className="flex flex-col items-end gap-0.5">
                        <span>{fmtEur(s.costUnit)}</span>
                        {s.costSource != null && (
                          <CostSourceBadge source={s.costSource} />
                        )}
                      </div>
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
                    <td className="px-3 py-2 text-right tabular-nums hidden xl:table-cell">
                      {fmtCoef(s.coefficient)}
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
            {s.customerName && (
              <p
                className="text-xs text-neutral-600 truncate"
                title={s.customerName}
              >
                {s.customerName}
              </p>
            )}
            <p className="text-xs text-neutral-500">
              {channelLabel(s)}
              {s.isLinkMe && s.affiliateName ? ` (${s.affiliateName})` : ''}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-600">
              <span>
                {fmtQty(s.quantity)} × {fmtEur(s.veroneUnitPrice)}
              </span>
              {s.costUnit != null && (
                <span className="flex items-center gap-1">
                  Coût : {fmtEur(s.costUnit)}
                  {s.costSource != null && (
                    <CostSourceBadge source={s.costSource} />
                  )}
                </span>
              )}
              <span className="font-medium">
                Total Vérone : {fmtEur(s.veroneRevenue)}
              </span>
              {s.marginUnit != null && (
                <span className={clrMargin(s.marginUnit)}>
                  Marge : {fmtEur(s.marginUnit)} / pièce ·{' '}
                  {fmtPct(s.marginPercent)} · {fmtCoef(s.coefficient)}
                </span>
              )}
            </div>
          </div>
        )}
      />

      {/* Totaux filtrés */}
      <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600 flex flex-wrap gap-x-4 gap-y-0.5">
        <span className="font-medium">
          {filtered.length} vente{filtered.length > 1 ? 's' : ''} ·{' '}
          {fmtQty(totals.quantity)} pièces
        </span>
        <span>Encaissé : {fmtEur(totals.veroneRevenue)}</span>
        {totals.marginTotal != null && (
          <span className={clrMargin(totals.marginTotal)}>
            Marge : {fmtEur(totals.marginTotal)} ·{' '}
            {fmtPct(totals.marginPercent)} · {fmtCoef(totals.coefficient)}
          </span>
        )}
      </div>

      {filtered.length > INITIAL_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex h-11 items-center gap-1 text-xs text-blue-600 hover:text-blue-800 md:h-auto"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Voir les{' '}
              {filtered.length - INITIAL_ROWS} autres
            </>
          )}
        </button>
      )}
    </div>
  );
}
