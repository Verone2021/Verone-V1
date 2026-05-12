'use client';

/**
 * FormulaExplainerCard — explique la formule de calcul du prix minimum de vente.
 * Formule : Prix min vente = prix de revient × (1 + marge %) + éco-taxe
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { formatPrice } from '@verone/utils';
import { Lightbulb } from 'lucide-react';

interface FormulaExplainerCardProps {
  landedCost: number | null;
  marginPercent: number;
  ecoTax: number;
  minSellingPriceHt: number | null;
  minSellingPriceTtc: number | null;
}

export function FormulaExplainerCard({
  landedCost,
  marginPercent,
  ecoTax,
  minSellingPriceHt,
  minSellingPriceTtc,
}: FormulaExplainerCardProps) {
  const hasValues = landedCost != null && landedCost > 0 && marginPercent > 0;

  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-lg px-4 py-3">
      <div className="flex items-start gap-2">
        <Lightbulb
          className="h-4 w-4 text-blue-500 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-blue-800 leading-relaxed">
            <span className="font-medium">Prix min vente</span>
            {' = '}
            {hasValues ? (
              <>
                prix de revient{' '}
                <span className="font-semibold">
                  {formatPrice(landedCost ?? 0)}
                </span>
                {' × (1 + marge '}
                <span className="font-semibold">
                  {marginPercent.toFixed(0)} %
                </span>
                {')'}
                {ecoTax > 0 && (
                  <>
                    {' + éco-taxe '}
                    <span className="font-semibold">{formatPrice(ecoTax)}</span>
                  </>
                )}
                {minSellingPriceHt != null && (
                  <>
                    {' = '}
                    <span className="font-bold text-blue-900">
                      {formatPrice(minSellingPriceHt)} HT
                    </span>
                    {minSellingPriceTtc != null && (
                      <>
                        {' · TTC '}
                        <span className="font-bold text-blue-900">
                          {formatPrice(minSellingPriceTtc)}
                        </span>
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {' prix de revient × (1 + marge %) + éco-taxe'}
                <span className="text-blue-500 italic ml-1">
                  (configurer marge et prix de revient)
                </span>
              </>
            )}
          </p>
          {/* TODO(BO-UI-PROD-PRICING-002) : ouvrir un dialog explicatif au clic */}
          <span
            className="text-[11px] text-blue-600 underline cursor-help mt-1 block"
            aria-label="Le prix de revient (landed cost) inclut le prix d'achat fournisseur + les frais logistiques (transport, douane, assurance) amortis sur les 12 derniers mois d'achats. C'est la vraie base de coût, plus réaliste que le prix d'achat brut."
            title="Le prix de revient (landed cost) inclut le prix d'achat fournisseur + les frais logistiques (transport, douane, assurance) amortis sur les 12 derniers mois d'achats. C'est la vraie base de coût, plus réaliste que le prix d'achat brut."
          >
            Pourquoi pas le prix d'achat brut ? →
          </span>
        </div>
      </div>
    </div>
  );
}
