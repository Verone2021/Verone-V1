'use client';

/**
 * LinkMeExpansionRows — sub-rows d'expansion du canal LinkMe dans le tableau
 * ChannelPricingDetailed. Affiche la décomposition commission + marge nette.
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { cn, formatPrice } from '@verone/utils';

interface LinkMeExpansionRowsProps {
  channelId: string;
  commissionRate: number;
  commissionAmount: number | null;
  grossMarginEur: number | null;
  netMarginEur: number | null;
  netMarginPercent: number | null;
}

export function LinkMeExpansionRows({
  channelId,
  commissionRate,
  commissionAmount,
  netMarginEur,
  netMarginPercent,
}: LinkMeExpansionRowsProps) {
  return (
    <>
      {/* Sub-row 1 : Commission canal */}
      <tr
        key={`${channelId}-commission`}
        className="bg-neutral-50 border-b border-neutral-50"
      >
        <td />
        <td colSpan={2} className="py-1.5 pl-9 text-xs text-neutral-500">
          Commission canal{' '}
          <span className="font-medium">−{commissionRate.toFixed(0)} %</span>
        </td>
        <td
          colSpan={5}
          className="py-1.5 pr-2 text-right text-xs text-red-600 font-medium tabular-nums"
        >
          {commissionAmount != null ? `−${formatPrice(commissionAmount)}` : '—'}
        </td>
      </tr>

      {/* Sub-row 2 : Marge nette estimée */}
      <tr
        key={`${channelId}-netmargin`}
        className="bg-neutral-50 border-b border-neutral-100"
      >
        <td />
        <td colSpan={2} className="py-1.5 pl-9 text-xs text-neutral-500">
          Marge nette estimée
        </td>
        <td colSpan={5} className="py-1.5 pr-2 text-right text-xs tabular-nums">
          <span
            className={cn(
              'font-medium',
              netMarginEur != null && netMarginEur >= 0
                ? 'text-green-700'
                : 'text-red-600'
            )}
          >
            {netMarginEur != null
              ? `${netMarginEur >= 0 ? '+' : ''}${formatPrice(netMarginEur)}`
              : '—'}
          </span>
          {netMarginPercent != null && (
            <span className="text-neutral-400 ml-1.5">
              ({netMarginPercent >= 0 ? '+' : ''}
              {netMarginPercent.toFixed(0)} %)
            </span>
          )}
        </td>
      </tr>
    </>
  );
}
