'use client';

import type { LinkMeSummary } from '../../../utils/product-sales-margin';
import { ProfitabilityTile as Tile } from './ProfitabilityTile';
import {
  clrMargin,
  fmtCoef,
  fmtEur,
  fmtPct,
  fmtQty,
} from './profitability-format';

interface Props {
  linkme: LinkMeSummary;
  isAffiliateProduct: boolean;
}

/** Ventes LinkMe réelles : encaissé Vérone, marge nette, coefficient, commissions exclues */
export function LinkMeRealSalesSection({
  linkme,
  isAffiliateProduct,
}: Props): React.JSX.Element {
  const ordersLabel = `${linkme.orderCount} commande${linkme.orderCount > 1 ? 's' : ''}`;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
        Ventes réelles (commandes validées à clôturées)
      </p>

      {linkme.quantity === 0 ? (
        <p className="text-sm text-neutral-400 italic">
          Aucune vente LinkMe pour ce produit.
        </p>
      ) : isAffiliateProduct ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Tile
            label="Pièces vendues"
            value={fmtQty(linkme.quantity)}
            sub={ordersLabel}
          />
          <Tile
            label="Commission Vérone totale"
            value={
              <span className="text-violet-600">
                {fmtEur(linkme.veroneCommissionTotal)}
              </span>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile
              label="Pièces vendues"
              value={fmtQty(linkme.quantity)}
              sub={ordersLabel}
            />
            <Tile
              label="Encaissé par Vérone"
              value={fmtEur(
                linkme.coveredRevenue > 0
                  ? linkme.coveredRevenue
                  : linkme.veroneRevenue
              )}
            />
            <Tile
              label="Marge nette Vérone"
              value={
                <span className={clrMargin(linkme.marginTotal)}>
                  {fmtEur(linkme.marginTotal)}{' '}
                  {linkme.marginPercent != null &&
                    `· ${fmtPct(linkme.marginPercent)}`}
                </span>
              }
            />
            <Tile
              label="Coefficient"
              value={
                linkme.coefficient != null ? (
                  <span className="text-neutral-800">
                    {fmtCoef(linkme.coefficient)}
                  </span>
                ) : (
                  <span className="text-neutral-400">—</span>
                )
              }
            />
          </div>
          <div className="text-xs text-neutral-400 space-y-0.5 pl-1">
            <p>
              Commissions affiliés (exclues) :{' '}
              <span className="font-medium">
                {fmtEur(linkme.affiliateCommissionTotal)}
              </span>
            </p>
            <p>
              Payé par les clients finaux :{' '}
              <span className="font-medium">
                {fmtEur(linkme.clientRevenue)}
              </span>
            </p>
            {linkme.withoutFeesLines > 0 && (
              <p className="text-amber-600">
                ⚠ {linkme.withoutFeesLines} ligne
                {linkme.withoutFeesLines > 1 ? 's' : ''} au prix d&apos;achat
                seul (frais d&apos;approche non inclus).
              </p>
            )}
            {linkme.uncoveredLines > 0 && (
              <p>
                {linkme.uncoveredLines} ligne
                {linkme.uncoveredLines > 1 ? 's' : ''} sans prix de revient (non
                comptées dans la marge).
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
