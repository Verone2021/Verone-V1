/**
 * catalogue-pricing-view.ts — assemble ce que la ligne du catalogue doit afficher
 * sur les prix : achat, revient, prix site, marge, coefficient, et les anomalies.
 *
 * Aucun calcul n'est défini ici : tout vient de `@verone/products`
 * (`resolveCost`, `evaluateCoefficient`, `computeLineMargin`, `evaluateChannelGap`).
 * Ce fichier ne fait que rassembler les entrées et nommer les alertes en français.
 *
 * Sprint : BO-PRICING-GOV-001.
 */

import type { Product } from '@verone/categories';
import type { ProductChannelPrices } from '@verone/channels';
import {
  type CoefficientHierarchy,
  type CoefficientVerdict,
  type CostOrigin,
  type ChannelGapVerdict,
  computeLineMargin,
  evaluateChannelGap,
  evaluateCoefficient,
  resolveCost,
} from '@verone/products/utils';

/** Gravité d'une anomalie de prix, du plus urgent au simple signalement. */
export type PricingSeverity = 'critical' | 'warning' | 'unknown' | 'ok';

export interface PricingAlert {
  severity: Exclude<PricingSeverity, 'ok'>;
  /** Texte court affiché en infobulle et dans le rapport. */
  message: string;
}

export interface CataloguePricingView {
  /** Prix d'achat fournisseur HT. */
  purchaseHt: number | null;
  /** Prix de revient HT retenu (manuel, sinon moyenne des achats, sinon achat nu). */
  landedHt: number | null;
  landedOrigin: CostOrigin;
  /** Vrai quand le revient retenu n'inclut pas les frais d'approche : marge optimiste. */
  landedWithoutFees: boolean;
  /** Prix HT réellement servi sur le site. */
  sitePriceHt: number | null;
  sitePriceSource: ProductChannelPrices['sitePriceSource'];
  /** Vrai si ce prix a été enregistré par un humain depuis un écran. */
  sitePriceDecided: boolean;
  /** Marge unitaire en euros sur le prix du site. */
  marginHt: number | null;
  /** Taux de marque en pourcentage du prix de vente. */
  marginPercent: number | null;
  /** Coefficient réellement obtenu sur le prix de revient. */
  coefficient: number | null;
  /** Comparaison au coefficient conseillé de la catégorie (informatif). */
  retailVerdict: CoefficientVerdict;
  /** Cohérence site ↔ LinkMe. */
  gapVerdict: ChannelGapVerdict;
  /** Gravité la plus élevée parmi les anomalies. */
  severity: PricingSeverity;
  alerts: PricingAlert[];
}

/**
 * Hiérarchie de coefficients du produit, du plus précis au plus général.
 * Le plus précis l'emporte ; un niveau vide passe la main au suivant.
 */
function hierarchyOf(product: Product): CoefficientHierarchy | null {
  const subcategory = product.subcategories;
  if (!subcategory) return null;

  const category = subcategory.category ?? null;
  const family = category?.family ?? null;

  return {
    subcategory: {
      retailCoefficient: subcategory.retail_coefficient,
      wholesaleCoefficient: subcategory.wholesale_coefficient,
    },
    category: category
      ? {
          retailCoefficient: category.retail_coefficient,
          wholesaleCoefficient: category.wholesale_coefficient,
        }
      : null,
    family: family
      ? {
          retailCoefficient: family.retail_coefficient,
          wholesaleCoefficient: family.wholesale_coefficient,
        }
      : null,
  };
}

/**
 * Construit la vue prix d'un produit du catalogue.
 *
 * Règle tenue partout : quand le prix de revient manque, la marge vaut `null` et
 * l'anomalie est de gravité `unknown`. On n'affiche jamais une marge égale au prix
 * de vente, qui ferait croire à 100 % de marge.
 */
export function buildPricingView(
  product: Product,
  prices: ProductChannelPrices
): CataloguePricingView {
  const cost = resolveCost({
    costNetAvg: product.cost_net_avg ?? null,
    costPrice: product.cost_price ?? null,
    costNetManual: product.cost_net_manual ?? null,
  });

  const hierarchy = hierarchyOf(product);
  const ecoTaxHt = product.eco_tax_default ?? null;

  const retailVerdict = evaluateCoefficient({
    priceHt: prices.sitePriceHt,
    unitCostHt: cost.cost,
    ecoTaxHt,
    scale: 'retail',
    hierarchy,
  });

  const margin = computeLineMargin({
    unitPriceHt: prices.sitePriceHt ?? 0,
    quantity: 1,
    unitCostHt: cost.cost,
  });

  const gapVerdict = evaluateChannelGap({
    sitePriceHt: prices.sitePriceHt,
    linkmePriceHt: prices.linkmePriceHt,
    hierarchy,
  });

  const alerts: PricingAlert[] = [];
  const isOnline = product.is_published_online === true;
  const sitePriceDecided = prices.sitePriceValidatedAt != null;

  if (cost.missing) {
    alerts.push({
      severity: 'unknown',
      message:
        'Prix de revient inconnu : la marge de ce produit n’est pas calculable.',
    });
  } else if (!cost.includesFees) {
    alerts.push({
      severity: 'warning',
      message:
        'Prix de revient sans frais d’approche (transport, douane) : la marge affichée est optimiste.',
    });
  }

  if (isOnline && prices.sitePriceSource === 'base_price') {
    alerts.push({
      severity: 'critical',
      message:
        'En ligne au prix de repli automatique (prix d’achat × 1,5), jamais décidé.',
    });
  } else if (isOnline && !sitePriceDecided) {
    alerts.push({
      severity: 'warning',
      message:
        'En ligne à un prix posé par un traitement automatique, jamais revu.',
    });
  }

  if (gapVerdict.violatesHardFloor) {
    alerts.push({
      severity: 'critical',
      message:
        'Prix LinkMe trop élevé : il doit rester au moins 5 % sous le prix du site.',
    });
  } else if (gapVerdict.belowRecommendedGap) {
    alerts.push({
      severity: 'warning',
      message: `Écart site / LinkMe de ${gapVerdict.gapPercent?.toFixed(0)} %, sous l’écart conseillé de ${gapVerdict.recommendedGapPercent?.toFixed(0)} %.`,
    });
  }

  if (
    retailVerdict.belowRecommended &&
    retailVerdict.recommendedPrice != null
  ) {
    alerts.push({
      severity: 'warning',
      message: `Sous le coefficient conseillé de la catégorie (prix conseillé ${retailVerdict.recommendedPrice.toFixed(2)} € HT).`,
    });
  }

  return {
    purchaseHt: product.cost_price ?? null,
    landedHt: cost.cost,
    landedOrigin: cost.origin,
    landedWithoutFees: !cost.missing && !cost.includesFees,
    sitePriceHt: prices.sitePriceHt,
    sitePriceSource: prices.sitePriceSource,
    sitePriceDecided,
    marginHt: prices.sitePriceHt != null ? margin.marginHt : null,
    marginPercent: prices.sitePriceHt != null ? margin.marginPercent : null,
    coefficient: prices.sitePriceHt != null ? margin.coefficient : null,
    retailVerdict,
    gapVerdict,
    severity: highestSeverity(alerts),
    alerts,
  };
}

function highestSeverity(alerts: readonly PricingAlert[]): PricingSeverity {
  if (alerts.some(a => a.severity === 'critical')) return 'critical';
  if (alerts.some(a => a.severity === 'unknown')) return 'unknown';
  if (alerts.some(a => a.severity === 'warning')) return 'warning';
  return 'ok';
}

/** Libellé court de la provenance du prix de revient, pour l'infobulle. */
export const LANDED_ORIGIN_LABEL: Record<CostOrigin, string> = {
  manual: 'saisi à la main',
  weighted_average: 'moyenne des achats, frais inclus',
  purchase_price: 'prix d’achat seul, sans frais',
  missing: 'inconnu',
};

/** Libellé court de la provenance du prix du site. */
export const SITE_SOURCE_LABEL: Record<
  ProductChannelPrices['sitePriceSource'],
  string
> = {
  channel_pricing: 'prix du canal Site Internet',
  base_price: 'repli automatique (prix d’achat × 1,5)',
  none: 'aucun prix',
};
