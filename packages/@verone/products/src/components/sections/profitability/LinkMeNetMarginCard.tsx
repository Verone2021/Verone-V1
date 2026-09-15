'use client';

import { AlertTriangle, Loader2, AlertCircle } from 'lucide-react';

import { useProductSalesMargin } from '../../../hooks/use-product-sales-margin';
import { LinkMeAffiliateList } from './LinkMeAffiliateList';
import { LinkMeRealSalesSection } from './LinkMeRealSalesSection';
import { ProfitabilityTile as Tile } from './ProfitabilityTile';
import { clrMargin, fmtCoef, fmtEur, fmtPct } from './profitability-format';

interface Props {
  productId: string;
}

function affiliatesLabel(offering: number, selling: number): string {
  const offeringVerb = offering > 1 ? 'proposent' : 'propose';
  const sellingVerb = selling > 1 ? 'ont vendu' : 'a vendu';
  return `${offering} ${offeringVerb} · ${selling} ${sellingVerb}`;
}

export function LinkMeNetMarginCard({ productId }: Props): React.JSX.Element {
  const { data, isLoading, error } = useProductSalesMargin(productId);

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
          Impossible de charger les données de rentabilité.
        </p>
      </div>
    );
  }

  const { linkme, cost, isAffiliateProduct, linkmePriceHt } = data;
  const { theoreticalUnitMargin: th } = linkme;

  const costTile = cost.missing ? (
    <span className="text-neutral-400">Manquant</span>
  ) : (
    <span>
      {fmtEur(cost.cost)}
      {!cost.includesFees && (
        <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-amber-500" />
      )}
    </span>
  );

  const marginTile =
    th.amount != null ? (
      <span className={clrMargin(th.amount)}>
        {fmtEur(th.amount)} · {fmtPct(th.percent)}
      </span>
    ) : (
      <span className="text-neutral-400">—</span>
    );

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">
          Rentabilité LinkMe — marge nette Vérone
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          Prix LinkMe − prix de revient. La commission des affiliés n&apos;est
          pas comptée dans la marge.
        </p>
      </div>

      {/* Tuiles prix actuel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile
          label="Prix LinkMe fixé"
          value={
            linkmePriceHt != null ? (
              fmtEur(linkmePriceHt)
            ) : (
              <span className="text-neutral-400">Non fixé</span>
            )
          }
        />
        <Tile
          label="Prix de revient"
          value={costTile}
          sub={
            !cost.missing && !cost.includesFees
              ? 'Prix d’achat seul, frais non inclus'
              : undefined
          }
        />
        {isAffiliateProduct ? (
          <Tile
            label="Commission Vérone"
            value={<span className="text-violet-600">Produit affilié</span>}
          />
        ) : (
          <Tile
            label="Marge nette par pièce"
            value={marginTile}
            sub={th.coefficient != null ? fmtCoef(th.coefficient) : undefined}
          />
        )}
        <Tile
          label="Affiliés"
          value={affiliatesLabel(
            linkme.offeringAffiliateCount,
            linkme.sellingAffiliateCount
          )}
        />
      </div>

      <LinkMeRealSalesSection
        linkme={linkme}
        isAffiliateProduct={isAffiliateProduct}
      />

      {linkme.byAffiliate.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Par affilié
          </p>
          <LinkMeAffiliateList byAffiliate={linkme.byAffiliate} />
        </div>
      )}
    </div>
  );
}
