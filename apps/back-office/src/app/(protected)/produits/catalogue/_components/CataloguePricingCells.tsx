'use client';

/**
 * Cellules de prix de la ligne catalogue : Revient HT, Prix site, Marge.
 *
 * La colonne « Achat HT » reste dans `CatalogueProductRow` : elle porte l'édition
 * rapide du prix d'achat, déjà en place.
 *
 * Sprint : BO-PRICING-GOV-001.
 */

import { cn } from '@verone/utils';
import { AlertTriangle, HelpCircle } from 'lucide-react';

import {
  LANDED_ORIGIN_LABEL,
  SITE_SOURCE_LABEL,
  type CataloguePricingView,
} from '../_lib/catalogue-pricing-view';

function euros(value: number | null): string {
  return value != null ? `${value.toFixed(2)} €` : '—';
}

/** Une seule infobulle par ligne : toutes les anomalies mises bout à bout. */
function alertsTitle(view: CataloguePricingView): string | undefined {
  if (view.alerts.length === 0) return undefined;
  return view.alerts.map(a => `• ${a.message}`).join('\n');
}

export function LandedCostCell({ view }: { view: CataloguePricingView }) {
  return (
    <td className="py-2 px-2 text-right hidden lg:table-cell">
      <div className="flex items-center justify-end gap-1">
        <span
          className={cn(
            'text-sm',
            view.landedHt == null
              ? 'text-gray-400'
              : view.landedWithoutFees
                ? 'text-orange-600'
                : 'font-medium text-black'
          )}
          title={`Prix de revient ${LANDED_ORIGIN_LABEL[view.landedOrigin]}`}
        >
          {euros(view.landedHt)}
        </span>
        {view.landedOrigin === 'manual' && (
          <span
            className="text-[9px] font-semibold text-indigo-600 uppercase"
            title="Prix de revient saisi à la main"
          >
            main
          </span>
        )}
        {view.landedWithoutFees && (
          <AlertTriangle
            className="h-3 w-3 text-orange-500 shrink-0"
            aria-label="Sans frais d’approche"
          />
        )}
      </div>
    </td>
  );
}

export function SitePriceCell({ view }: { view: CataloguePricingView }) {
  const isFallback = view.sitePriceSource === 'base_price';

  return (
    <td className="py-2 px-2 text-right">
      <div className="flex items-center justify-end gap-1">
        <span
          className={cn(
            'text-sm font-semibold',
            view.sitePriceHt == null
              ? 'text-gray-400'
              : isFallback
                ? 'text-red-600'
                : 'text-black'
          )}
          title={SITE_SOURCE_LABEL[view.sitePriceSource]}
        >
          {euros(view.sitePriceHt)}
        </span>
        {isFallback && (
          <span
            className="text-[9px] font-semibold text-red-600 uppercase"
            title={SITE_SOURCE_LABEL.base_price}
          >
            repli
          </span>
        )}
        {!isFallback && view.sitePriceHt != null && !view.sitePriceDecided && (
          <span
            className="text-[9px] font-semibold text-orange-500 uppercase"
            title="Prix posé par un traitement automatique, jamais revu"
          >
            auto
          </span>
        )}
      </div>
    </td>
  );
}

export function MarginCell({ view }: { view: CataloguePricingView }) {
  const title = alertsTitle(view);
  const conseille = view.retailVerdict.recommended;

  return (
    <td className="py-2 px-2 text-right hidden lg:table-cell">
      <div className="flex items-center justify-end gap-1" title={title}>
        {view.marginPercent == null ? (
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <HelpCircle className="h-3 w-3" aria-hidden="true" />
            <span>—</span>
          </span>
        ) : (
          <span
            className={cn(
              'text-sm font-semibold',
              view.severity === 'critical'
                ? 'text-red-600'
                : view.severity === 'warning'
                  ? 'text-orange-600'
                  : 'text-green-600'
            )}
          >
            {view.marginPercent.toFixed(0)} %
          </span>
        )}
        {view.coefficient != null && (
          <span
            className="text-[10px] text-gray-500"
            title={`Coefficient obtenu ×${view.coefficient.toFixed(2)} — conseillé ×${conseille.value.toFixed(2)}${conseille.source === 'fallback' ? ' (réglage général)' : ''}`}
          >
            ×{view.coefficient.toFixed(2)}
          </span>
        )}
        {view.alerts.length > 0 && view.marginPercent != null && (
          <AlertTriangle
            className={cn(
              'h-3 w-3 shrink-0',
              view.severity === 'critical' ? 'text-red-500' : 'text-orange-500'
            )}
            aria-label="Anomalie de prix"
          />
        )}
      </div>
    </td>
  );
}
