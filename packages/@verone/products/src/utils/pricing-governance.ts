/**
 * pricing-governance.ts — calculs purs de gouvernance du prix de vente.
 *
 * Aucun accès réseau, aucune dépendance React. Une seule définition de chacune de
 * ces notions dans tout le dépôt :
 *
 *   - le coefficient conseillé d'un produit (catégorie, puis repli global) ;
 *   - le prix de vente conseillé qui en découle, par canal ;
 *   - la marge d'une ligne de vente, port de livraison déduit ;
 *   - la règle de cohérence « LinkMe moins cher que le site ».
 *
 * Sprint : BO-PRICING-GOV-001 (décisions produit de Roméo du 2026-09-17).
 *
 * Règles métier fixées par Roméo :
 *   1. Vérone = boutique de détail, LinkMe = grossiste. Deux coefficients par
 *      catégorie, conseillés et JAMAIS bloquants : passer dessous produit un
 *      message, pas un refus.
 *   2. LinkMe doit rester au moins 5 % sous le prix du site. Ces 5 % sont un refus
 *      dur ; la cible conseillée est l'écart naturel des deux coefficients (~30 %).
 *   3. Le transport entre dans le calcul : à l'achat il forme le prix de revient
 *      (déjà fait en base par `allocate_po_fees_and_calculate_unit_cost`), à la
 *      vente il se déduit de la marge.
 */

// ---------- Constantes ----------

/**
 * Écart minimum imposé entre le prix du site et le prix LinkMe.
 * Le prix LinkMe ne peut pas dépasser `prix site × (1 − 0,05)`.
 *
 * Correspond à `channel_pricing.buffer_rate`, réglé à 0,05 sur les 49 lignes LinkMe
 * depuis l'origine : cette constante est le même 5 %, appliqué au bon repère (le
 * prix du site) au lieu de `public_price_ht`, qui valait `prix LinkMe × 1,5`.
 */
export const LINKME_MIN_GAP_RATE = 0.05;

/** Coefficients de repli quand la catégorie n'en définit pas (miroir d'`app_settings.pricing_default_coefficients`). */
export const FALLBACK_COEFFICIENTS = {
  retail: 2.5,
  wholesale: 1.7,
} as const;

/** Taux de TVA appliqué à l'affichage TTC du back-office. */
export const DEFAULT_VAT_RATE = 0.2;

// ---------- Types ----------

/** Les deux échelles de prix de Vérone. */
export type PriceScale = 'retail' | 'wholesale';

/** Coefficients portés par un niveau de la hiérarchie produit. */
export interface CoefficientLevel {
  retailCoefficient: number | null;
  wholesaleCoefficient: number | null;
}

/**
 * Hiérarchie produit, du plus précis au plus général.
 * Chaque niveau est facultatif : un niveau vide laisse la main au suivant.
 */
export interface CoefficientHierarchy {
  subcategory?: CoefficientLevel | null;
  category?: CoefficientLevel | null;
  family?: CoefficientLevel | null;
}

/** Niveau d'où provient le coefficient retenu. */
export type CoefficientSource =
  | 'subcategory'
  | 'category'
  | 'family'
  | 'fallback';

export interface ResolvedCoefficient {
  value: number;
  source: CoefficientSource;
  scale: PriceScale;
}

/** Comparaison d'un prix réel au coefficient conseillé de sa catégorie. */
export interface CoefficientVerdict {
  /** Coefficient réellement pratiqué (prix ÷ revient). null si le revient manque. */
  actual: number | null;
  /** Coefficient conseillé retenu. */
  recommended: ResolvedCoefficient;
  /** Prix conseillé qui découle du coefficient. null si le revient manque. */
  recommendedPrice: number | null;
  /**
   * Écart au prix conseillé, en points de pourcentage du prix conseillé.
   * Négatif = le prix pratiqué est sous le conseil. null si le revient manque.
   */
  gapPercent: number | null;
  /** Vrai si le prix est sous le coefficient conseillé. Informatif, jamais bloquant. */
  belowRecommended: boolean;
  /** Vrai si aucune marge n'est calculable (prix de revient absent). */
  costMissing: boolean;
}

export interface LineMarginInput {
  /** Prix de vente HT de la ligne, hors transport. */
  unitPriceHt: number;
  quantity: number;
  /** Prix de revient unitaire HT (achat + frais d'approche). null si inconnu. */
  unitCostHt: number | null;
  /**
   * Quote-part du transport de livraison client imputée à cette ligne, en euros
   * pour la ligne entière (pas par unité). Voir `allocateShippingToLines`.
   */
  allocatedShippingHt?: number;
}

export interface LineMargin {
  revenueHt: number;
  costHt: number | null;
  shippingHt: number;
  /** Marge nette = chiffre d'affaires − coût − transport de livraison. */
  marginHt: number | null;
  /** Marge en pourcentage du prix de vente (taux de marque). */
  marginPercent: number | null;
  /** Coefficient réellement obtenu sur le prix de revient. */
  coefficient: number | null;
}

export interface ChannelGapVerdict {
  sitePriceHt: number | null;
  linkmePriceHt: number | null;
  /** Écart réel, en pourcentage du prix du site. Positif = LinkMe est moins cher. */
  gapPercent: number | null;
  /** Prix LinkMe maximum autorisé (`prix site × 0,95`). */
  maxLinkmePriceHt: number | null;
  /** Écart conseillé d'après les deux coefficients de la catégorie, en pourcentage. */
  recommendedGapPercent: number | null;
  /** Le refus dur : LinkMe dépasse le plafond des 5 %. */
  violatesHardFloor: boolean;
  /** Informatif : l'écart est conforme aux 5 % mais sous la cible conseillée. */
  belowRecommendedGap: boolean;
  /** Impossible de comparer (un des deux prix manque). */
  notComparable: boolean;
}

// ---------- Arrondis ----------

/** Arrondi monétaire au centime, sans dérive de virgule flottante. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Arrondi d'un coefficient à deux décimales. */
function roundCoefficient(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ---------- Coefficients ----------

function levelValue(
  level: CoefficientLevel | null | undefined,
  scale: PriceScale
): number | null {
  const raw =
    scale === 'retail' ? level?.retailCoefficient : level?.wholesaleCoefficient;
  return raw != null && raw > 0 ? raw : null;
}

/**
 * Coefficient conseillé pour un produit : **le plus précis l'emporte**.
 *
 *   sous-catégorie  >  catégorie  >  famille  >  réglage général
 *
 * Un niveau laissé vide n'impose rien, il passe la main au niveau au-dessus. Il n'y
 * a donc à renseigner que les branches qui se vendent réellement différemment.
 *
 * Ne renvoie jamais null : il y a toujours un conseil à afficher, et `source` dit
 * d'où il vient pour que l'écran puisse l'expliquer.
 */
export function resolveCoefficient(
  scale: PriceScale,
  hierarchy: CoefficientHierarchy | null,
  fallback: { retail: number; wholesale: number } = FALLBACK_COEFFICIENTS
): ResolvedCoefficient {
  const chain: ReadonlyArray<
    [CoefficientSource, CoefficientLevel | null | undefined]
  > = [
    ['subcategory', hierarchy?.subcategory],
    ['category', hierarchy?.category],
    ['family', hierarchy?.family],
  ];

  for (const [source, level] of chain) {
    const value = levelValue(level, scale);
    if (value != null) return { value, source, scale };
  }

  return {
    value: scale === 'retail' ? fallback.retail : fallback.wholesale,
    source: 'fallback',
    scale,
  };
}

/**
 * Prix de vente conseillé = prix de revient × coefficient, éco-participation ajoutée
 * après coup (elle est reversée, elle ne se marge pas).
 *
 * Renvoie null quand le prix de revient est inconnu : on n'invente pas un prix à
 * partir de rien (`.claude/rules/no-phantom-data.md`).
 */
export function recommendedPrice(input: {
  unitCostHt: number | null;
  coefficient: number;
  ecoTaxHt?: number | null;
}): number | null {
  if (input.unitCostHt == null || input.unitCostHt <= 0) return null;
  if (input.coefficient <= 0) return null;
  return roundMoney(
    input.unitCostHt * input.coefficient + (input.ecoTaxHt ?? 0)
  );
}

/**
 * Compare un prix réel au coefficient conseillé de sa catégorie.
 * Purement informatif : aucun appelant ne doit bloquer une saisie sur ce verdict.
 */
export function evaluateCoefficient(input: {
  priceHt: number | null;
  unitCostHt: number | null;
  ecoTaxHt?: number | null;
  scale: PriceScale;
  hierarchy: CoefficientHierarchy | null;
  fallback?: { retail: number; wholesale: number };
}): CoefficientVerdict {
  const recommended = resolveCoefficient(
    input.scale,
    input.hierarchy,
    input.fallback
  );
  const target = recommendedPrice({
    unitCostHt: input.unitCostHt,
    coefficient: recommended.value,
    ecoTaxHt: input.ecoTaxHt,
  });

  const costMissing = input.unitCostHt == null || input.unitCostHt <= 0;

  if (costMissing || input.priceHt == null || target == null || target <= 0) {
    return {
      actual: null,
      recommended,
      recommendedPrice: target,
      gapPercent: null,
      belowRecommended: false,
      costMissing,
    };
  }

  const cost = input.unitCostHt as number;
  const actual = roundCoefficient(input.priceHt / cost);
  const gapPercent = roundCoefficient(
    ((input.priceHt - target) / target) * 100
  );

  return {
    actual,
    recommended,
    recommendedPrice: target,
    gapPercent,
    belowRecommended: input.priceHt < target,
    costMissing: false,
  };
}

// ---------- Transport de livraison réparti ----------

/**
 * Répartit le transport d'une commande sur ses lignes, au prorata du montant HT.
 *
 * Même principe qu'à l'achat (`allocate_po_fees_and_calculate_unit_cost`), y compris
 * le rattrapage du dernier centime sur la dernière ligne : la somme des quote-parts
 * est exactement égale au transport de départ, jamais un centime de plus ou de moins.
 *
 * Les lignes à montant nul ne portent aucun transport (sinon un article offert
 * absorberait du port et afficherait une marge négative sans raison). Si TOUTES les
 * lignes sont à zéro, le transport n'est imputé à personne : il n'y a pas de base de
 * répartition, et l'inventer serait arbitraire.
 */
export function allocateShippingToLines(
  lines: ReadonlyArray<{ unitPriceHt: number; quantity: number }>,
  totalShippingHt: number
): number[] {
  const amounts = lines.map(l => Math.max(0, l.unitPriceHt * l.quantity));
  const base = amounts.reduce((sum, a) => sum + a, 0);

  if (lines.length === 0) return [];
  if (totalShippingHt <= 0 || base <= 0) return lines.map(() => 0);

  const shipping = roundMoney(totalShippingHt);
  const allocated = amounts.map(a => roundMoney((a / base) * shipping));

  // Rattrapage : on colle l'écart d'arrondi sur la dernière ligne qui porte du port.
  const sum = roundMoney(allocated.reduce((s, a) => s + a, 0));
  const drift = roundMoney(shipping - sum);

  if (drift !== 0) {
    for (let i = allocated.length - 1; i >= 0; i -= 1) {
      if (amounts[i] > 0) {
        allocated[i] = roundMoney(allocated[i] + drift);
        break;
      }
    }
  }

  return allocated;
}

/**
 * Marge nette d'une ligne de vente : chiffre d'affaires − prix de revient −
 * quote-part du transport de livraison.
 *
 * Renvoie une marge nulle (null) quand le prix de revient manque : une marge
 * calculée sans coût serait égale au chiffre d'affaires, donc fausse et flatteuse.
 */
export function computeLineMargin(input: LineMarginInput): LineMargin {
  const revenueHt = roundMoney(input.unitPriceHt * input.quantity);
  const shippingHt = roundMoney(Math.max(0, input.allocatedShippingHt ?? 0));

  if (input.unitCostHt == null || input.unitCostHt <= 0) {
    return {
      revenueHt,
      costHt: null,
      shippingHt,
      marginHt: null,
      marginPercent: null,
      coefficient: null,
    };
  }

  const costHt = roundMoney(input.unitCostHt * input.quantity);
  const marginHt = roundMoney(revenueHt - costHt - shippingHt);

  return {
    revenueHt,
    costHt,
    shippingHt,
    marginHt,
    marginPercent:
      revenueHt > 0 ? roundCoefficient((marginHt / revenueHt) * 100) : null,
    coefficient: costHt > 0 ? roundCoefficient(revenueHt / costHt) : null,
  };
}

// ---------- Cohérence site ↔ LinkMe ----------

/** Prix LinkMe maximum autorisé pour un prix de site donné. */
export function maxLinkmePrice(sitePriceHt: number): number {
  return roundMoney(sitePriceHt * (1 - LINKME_MIN_GAP_RATE));
}

/**
 * Vérifie la règle « LinkMe moins cher que le site ».
 *
 * Deux niveaux, voulus par Roméo :
 *   - refus dur si LinkMe dépasse `prix site × 0,95` (`violatesHardFloor`) ;
 *   - message informatif si l'écart est conforme mais sous la cible conseillée par
 *     les coefficients de la catégorie (`belowRecommendedGap`).
 *
 * LinkMe est un prix de gros : un prix LinkMe sous le prix du site est la structure
 * normale, pas une anomalie. C'est l'inverse qui en est une.
 */
export function evaluateChannelGap(input: {
  sitePriceHt: number | null;
  linkmePriceHt: number | null;
  hierarchy: CoefficientHierarchy | null;
  fallback?: { retail: number; wholesale: number };
}): ChannelGapVerdict {
  const retail = resolveCoefficient('retail', input.hierarchy, input.fallback);
  const wholesale = resolveCoefficient(
    'wholesale',
    input.hierarchy,
    input.fallback
  );
  const recommendedGapPercent =
    retail.value > 0
      ? roundCoefficient((1 - wholesale.value / retail.value) * 100)
      : null;

  const { sitePriceHt, linkmePriceHt } = input;

  if (
    sitePriceHt == null ||
    sitePriceHt <= 0 ||
    linkmePriceHt == null ||
    linkmePriceHt <= 0
  ) {
    return {
      sitePriceHt,
      linkmePriceHt,
      gapPercent: null,
      maxLinkmePriceHt:
        sitePriceHt != null && sitePriceHt > 0
          ? maxLinkmePrice(sitePriceHt)
          : null,
      recommendedGapPercent,
      violatesHardFloor: false,
      belowRecommendedGap: false,
      notComparable: true,
    };
  }

  const ceiling = maxLinkmePrice(sitePriceHt);
  const gapPercent = roundCoefficient(
    ((sitePriceHt - linkmePriceHt) / sitePriceHt) * 100
  );
  const violatesHardFloor = linkmePriceHt > ceiling;

  return {
    sitePriceHt,
    linkmePriceHt,
    gapPercent,
    maxLinkmePriceHt: ceiling,
    recommendedGapPercent,
    violatesHardFloor,
    belowRecommendedGap:
      !violatesHardFloor &&
      recommendedGapPercent != null &&
      gapPercent < recommendedGapPercent,
    notComparable: false,
  };
}
