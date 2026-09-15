'use client';

import { useState } from 'react';

import { Loader2, AlertCircle, ArrowRightLeft } from 'lucide-react';

import { Button, ResponsiveDataView } from '@verone/ui';

import { useProductSalesMargin } from '../../../hooks/use-product-sales-margin';
import type { ChannelSummary } from '../../../utils/product-sales-margin';
import {
  clrMargin,
  fmtCoef,
  fmtEur,
  fmtPct,
  fmtQty,
} from './profitability-format';
import { UsePriceDialog } from './UsePriceDialog';

const CHANNEL_LABELS: Record<string, string> = {
  linkme: 'LinkMe (hors commission affiliés)',
  manuel: 'Manuel',
  site_internet: 'Site internet',
  google_merchant: 'Google Merchant',
  meta_commerce: 'Meta Commerce',
};

function channelLabel(row: ChannelSummary): string {
  const code = row.channelCode ?? '';
  return CHANNEL_LABELS[code] ?? row.channelName ?? code ?? '—';
}

interface Props {
  productId: string;
}

export function SalesByChannelCard({ productId }: Props): React.JSX.Element {
  const { data, isLoading, error } = useProductSalesMargin(productId);
  const [dialogChannel, setDialogChannel] = useState<ChannelSummary | null>(
    null
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-neutral-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Chargement…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
        <p className="text-sm text-red-700">
          Impossible de charger les ventes par canal.
        </p>
      </div>
    );
  }

  const { byChannel, cost, targetPrice } = data;
  const totalWithoutFees = byChannel.reduce(
    (s, r) => s + r.withoutFeesLines,
    0
  );
  const totalUncovered = byChannel.reduce((s, r) => s + r.uncoveredLines, 0);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
      <h3 className="text-sm font-semibold text-neutral-900">
        Ventes par canal
      </h3>

      <ResponsiveDataView
        data={byChannel}
        emptyMessage="Aucune vente enregistrée pour ce produit."
        breakpoint="md"
        renderTable={rows => (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">
                <tr>
                  <th className="px-3 py-2 min-w-[160px]">Canal</th>
                  <th className="px-3 py-2 text-right w-[80px]">Pièces</th>
                  <th className="px-3 py-2 text-right w-[120px]">
                    Encaissé Vérone
                  </th>
                  <th className="px-3 py-2 text-right w-[100px] hidden lg:table-cell">
                    Prix moyen
                  </th>
                  <th className="px-3 py-2 text-right w-[100px] hidden lg:table-cell">
                    Marge €
                  </th>
                  <th className="px-3 py-2 text-right w-[80px] hidden xl:table-cell">
                    Marge %
                  </th>
                  <th className="px-3 py-2 text-right w-[80px] hidden lg:table-cell">
                    Coef.
                  </th>
                  <th className="px-3 py-2 text-right w-[80px] hidden xl:table-cell">
                    Commandes
                  </th>
                  <th className="px-3 py-2 w-[44px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row, i) => (
                  <tr
                    key={row.channelId ?? String(i)}
                    className="hover:bg-neutral-50"
                  >
                    <td className="px-3 py-2 font-medium">
                      {channelLabel(row)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtQty(row.quantity)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtEur(row.veroneRevenue)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden lg:table-cell">
                      {fmtEur(row.avgVeronePrice)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden lg:table-cell">
                      <span className={clrMargin(row.marginTotal)}>
                        {fmtEur(row.marginTotal)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden xl:table-cell">
                      <span className={clrMargin(row.marginPercent)}>
                        {fmtPct(row.marginPercent)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden lg:table-cell">
                      {fmtCoef(row.coefficient)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden xl:table-cell">
                      {row.orderCount}
                    </td>
                    <td className="px-3 py-1 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Utiliser ce prix"
                        aria-label="Utiliser ce prix"
                        className="h-11 w-11 md:h-9 md:w-9"
                        onClick={() => setDialogChannel(row)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        renderCard={(row, i) => (
          <div
            key={row.channelId ?? String(i)}
            className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{channelLabel(row)}</p>
              <Button
                variant="ghost"
                size="icon"
                title="Utiliser ce prix"
                aria-label="Utiliser ce prix"
                className="h-11 w-11 md:h-9 md:w-9 flex-shrink-0"
                onClick={() => setDialogChannel(row)}
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-600">
              <span>{fmtQty(row.quantity)} pièces</span>
              <span>Encaissé : {fmtEur(row.veroneRevenue)}</span>
              {row.marginTotal != null && (
                <span className={clrMargin(row.marginTotal)}>
                  Marge : {fmtEur(row.marginTotal)} ·{' '}
                  {fmtPct(row.marginPercent)} · {fmtCoef(row.coefficient)}
                </span>
              )}
            </div>
          </div>
        )}
      />

      {totalWithoutFees > 0 && (
        <p className="text-xs text-amber-600">
          ⚠ {totalWithoutFees} ligne{totalWithoutFees > 1 ? 's' : ''} au prix
          d&apos;achat seul (frais d&apos;approche non inclus, marge
          surestimée).
        </p>
      )}
      {totalUncovered > 0 && (
        <p className="text-xs text-neutral-400">
          {totalUncovered} ligne{totalUncovered > 1 ? 's' : ''} sans prix de
          revient (marge partielle).
        </p>
      )}

      {dialogChannel != null && (
        <UsePriceDialog
          open
          onClose={() => setDialogChannel(null)}
          productId={productId}
          suggestedPrice={dialogChannel.avgVeronePrice}
          cost={cost}
          currentTargetPrice={targetPrice}
        />
      )}
    </div>
  );
}
