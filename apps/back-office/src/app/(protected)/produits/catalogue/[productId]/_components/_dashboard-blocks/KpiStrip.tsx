'use client';

/**
 * KpiStrip — 4 tuiles KPI en haut du dashboard Général :
 * Coût unitaire · Prix de vente conseillé · Stock disponible · Prix Site Live.
 */

import { cn, formatPrice } from '@verone/utils';

interface KpiStripProps {
  costPrice: number | null;
  suggestedPriceTtc: number | null;
  stockAvailable: number;
  minStock: number | null;
  siteLivePriceHt: number | null;
  siteMarginPercent: number | null;
}

export function KpiStrip({
  costPrice,
  suggestedPriceTtc,
  stockAvailable,
  minStock,
  siteLivePriceHt,
  siteMarginPercent,
}: KpiStripProps) {
  const stockOk = minStock == null || stockAvailable > minStock;

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiTile
        kicker="Coût unitaire HT"
        value={costPrice != null ? formatPrice(costPrice) : '—'}
        sub="prix d'achat"
      />
      <KpiTile
        kicker="Prix vente conseillé"
        value={suggestedPriceTtc != null ? formatPrice(suggestedPriceTtc) : '—'}
        sub="TTC recommandé"
      />
      <KpiTile
        kicker="Stock disponible"
        value={stockAvailable.toString()}
        valueClassName={cn(stockOk ? 'text-green-700' : 'text-red-600')}
        sub={minStock != null ? `seuil ${minStock}` : 'seuil non défini'}
      />
      <KpiTile
        kicker="Prix Site Live"
        value={siteLivePriceHt != null ? formatPrice(siteLivePriceHt) : '—'}
        valueClassName="text-blue-700"
        sub={
          siteMarginPercent != null
            ? `marge +${siteMarginPercent.toFixed(0)}%`
            : 'non publié'
        }
        subChipClassName={
          siteMarginPercent != null
            ? 'bg-green-50 text-green-700 border-green-200'
            : undefined
        }
      />
    </section>
  );
}

interface KpiTileProps {
  kicker: string;
  value: string;
  valueClassName?: string;
  sub: string;
  subChipClassName?: string;
}

function KpiTile({
  kicker,
  value,
  valueClassName,
  sub,
  subChipClassName,
}: KpiTileProps) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
        {kicker}
      </div>
      <div
        className={cn(
          'text-2xl font-semibold tabular-nums mt-1 text-neutral-900',
          valueClassName
        )}
      >
        {value}
      </div>
      {subChipClassName ? (
        <span
          className={cn(
            'inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border',
            subChipClassName
          )}
        >
          {sub}
        </span>
      ) : (
        <div className="text-xs text-neutral-500 mt-1">{sub}</div>
      )}
    </div>
  );
}
