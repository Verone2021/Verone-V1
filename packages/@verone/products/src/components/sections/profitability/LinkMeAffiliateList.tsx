'use client';

import type { AffiliateSummary } from '../../../utils/product-sales-margin';
import { clrMargin, fmtEur, fmtQty } from './profitability-format';

interface LinkMeAffiliateListProps {
  byAffiliate: AffiliateSummary[];
}

export function LinkMeAffiliateList({
  byAffiliate,
}: LinkMeAffiliateListProps): React.JSX.Element | null {
  if (byAffiliate.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {byAffiliate.map(a => (
        <div
          key={a.affiliateId}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm"
        >
          <span
            className="font-medium text-neutral-800 truncate min-w-0"
            title={a.name}
          >
            {a.name}
          </span>
          <div className="flex items-center gap-4 text-xs text-neutral-600 shrink-0">
            <span>
              {fmtQty(a.quantity)} pièce{a.quantity > 1 ? 's' : ''}
            </span>
            <span className="font-medium">{fmtEur(a.veroneRevenue)}</span>
            {a.marginTotal != null && (
              <span className={clrMargin(a.marginTotal)}>
                {fmtEur(a.marginTotal)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
