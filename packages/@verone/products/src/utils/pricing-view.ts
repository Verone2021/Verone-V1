/**
 * pricing-view.ts — assemble ce qu'une ligne de produit doit afficher sur les
 * prix : achat, revient, prix site, marge, coefficient, et les anomalies.
 *
 * Aucun calcul n'est défini ici : tout vient de `pricing-governance` et de
 * `product-sales-margin`. Ce fichier rassemble les entrées et nomme les alertes
 * en français.
 *
 * Volontairement indépendant de `@verone/categories` et `@verone/channels` : la
 * liste du catalogue et la liste du canal Site Internet n'ont pas le même type
 * de produit, mais doivent rendre le MÊME verdict. Chacune fournit l'entrée
 * ci-dessous, personne ne recopie la règle.
 *
 * Sprint : BO-PRICING-GOV-001.
 */

import {
  type ChannelGapVerdict,
  type CoefficientHierarchy,
  type CoefficientVerdict,
  computeLineMargin,
  evaluateChannelGap,
  evaluateCoefficient,
} from './pricing-governance';
import { type CostOrigin, resolveCost } from './product-sales-margin';

/** D'où vient le prix servi sur le site (miroir de `get_site_internet_products`). */
export type SitePriceSource = 'channel_pricing' | 'base_price' | 'none';

/** Tout ce dont la vue a besoin, quelle que soit la liste d'origine. */
export interface PricingViewInput {
  /** Prix d'achat fournisseur HT. */
  costPrice: number | null;
  /** Moyenne pondérée des achats, frais d'approche inclus. */
  costNetAvg: number | null;
  /** Prix de revient saisi à la main, prioritaire sur les deux autres. */
  costNetManual: number | null;
  ecoTaxHt: number | null;
  isPublishedOnline: boolean;
  hierarchy: CoefficientHierarchy | null;
  sitePriceHt: number | null;
  sitePriceSource: SitePriceSource;
  /** Date à laquelle un humain a validé ce prix ; `null` = jamais décidé. */
  sitePriceValidatedAt: string | null;
  linkmePriceHt: number | null;
}

/** Forme minimale d'un niveau de la hiérarchie telle qu'elle vient de la base. */
interface RawLevel {
  retail_coefficient: number | null;
  wholesale_coefficient: number | null;
}

/**
 * Construit la hiérarchie de coefficients depuis les colonnes brutes.
 * Le plus précis l'emporte ; un niveau absent passe la main au suivant.
 */
export function coefficientHierarchyOf(levels: {
  subcategory?: RawLevel | null;
  category?: RawLevel | null;
  family?: RawLevel | null;
}): CoefficientHierarchy | null {
  const map = (level: RawLevel | null | undefined) =>
    level
      ? {
          retailCoefficient: level.retail_coefficient,
          wholesaleCoefficient: level.wholesale_coefficient,
        }
      : null;

  const subcategory = map(levels.subcategory);
  const category = map(levels.category);
  const family = map(levels.family);
  if (!subcategory && !category && !family) return null;

  return { subcategory, category, family };
}

/** Gravité d'une anomalie de prix, du plus urgent au simple signalement. */
export type PricingSeverity = 'critical' | 'warning' | 'unknown' | 'ok';

export interface PricingAlert {
  severity: Exclude<PricingSeverity, 'ok'>;
  /** Texte court affiché en infobulle et dans le rapport. */
  message: string;
}

export interface PricingView {
  /** Prix d'achat fournisseur HT. */
  purchaseHt: number | null;
  /** Prix de revient HT retenu (manuel, sinon moyenne des achats, sinon achat nu). */
  landedHt: number | null;
  landedOrigin: CostOrigin;
  /** Vrai quand le revient retenu n'inclut pas les frais d'approche : marge optimiste. */
  landedWithoutFees: boolean;
  /** Prix HT réellement servi sur le site. */
  sitePriceHt: number | null;
  sitePriceSource: SitePriceSource;
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
 * Construit la vue prix d'un produit.
 *
 * Règle tenue partout : quand le prix de revient manque, la marge vaut `null` et
 * l'anomalie est de gravité `unknown`. On n'affiche jamais une marge égale au prix
 * de vente, qui ferait croire à 100 % de marge.
 */
export function buildPricingView(input: PricingViewInput): PricingView {
  const cost = resolveCost({
    costNetAvg: input.costNetAvg,
    costPrice: input.costPrice,
    costNetManual: input.costNetManual,
  });

  const hierarchy = input.hierarchy;
  const ecoTaxHt = input.ecoTaxHt;

  const retailVerdict = evaluateCoefficient({
    priceHt: input.sitePriceHt,
    unitCostHt: cost.cost,
    ecoTaxHt,
    scale: 'retail',
    hierarchy,
  });

  const margin = computeLineMargin({
    unitPriceHt: input.sitePriceHt ?? 0,
    quantity: 1,
    unitCostHt: cost.cost,
  });

  const gapVerdict = evaluateChannelGap({
    sitePriceHt: input.sitePriceHt,
    linkmePriceHt: input.linkmePriceHt,
    hierarchy,
  });

  const alerts: PricingAlert[] = [];
  const isOnline = input.isPublishedOnline;
  const sitePriceDecided = input.sitePriceValidatedAt != null;

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

  if (isOnline && input.sitePriceSource === 'base_price') {
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
    purchaseHt: input.costPrice,
    landedHt: cost.cost,
    landedOrigin: cost.origin,
    landedWithoutFees: !cost.missing && !cost.includesFees,
    sitePriceHt: input.sitePriceHt,
    sitePriceSource: input.sitePriceSource,
    sitePriceDecided,
    marginHt: input.sitePriceHt != null ? margin.marginHt : null,
    marginPercent: input.sitePriceHt != null ? margin.marginPercent : null,
    coefficient: input.sitePriceHt != null ? margin.coefficient : null,
    retailVerdict,
    gapVerdict,
    severity: highestSeverity(alerts),
    alerts,
  };
}

export function highestSeverity(
  alerts: readonly PricingAlert[]
): PricingSeverity {
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
export const SITE_SOURCE_LABEL: Record<SitePriceSource, string> = {
  channel_pricing: 'prix du canal Site Internet',
  base_price: 'repli automatique (prix d’achat × 1,5)',
  none: 'aucun prix',
};
