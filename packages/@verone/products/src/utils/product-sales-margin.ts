/**
 * product-sales-margin.ts — calculs purs de marge LinkMe et par canal.
 * Aucun accès réseau. Toutes les fonctions sont pures.
 *
 * Sprint : BO-PRODUCTS-PROFIT-001 / PROFIT-002
 */

// ---------- Constants ----------

/** Canal LinkMe UUID — source de vérité : sales_channels.code = 'linkme' */
export const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/** Statuts de vente comptabilisés dans les marges */
export const VALID_SALE_STATUSES = [
  'validated',
  'partially_shipped',
  'shipped',
  'delivered',
  'closed',
] as const;

export type ValidSaleStatus = (typeof VALID_SALE_STATUSES)[number];

// ---------- CostSource ----------

/**
 * Sources du coût unitaire stockées dans sales_order_item_costs.
 * 'missing' = aucun coût disponible à la vente.
 */
export type CostSource =
  | 'validation'
  | 'purchase_history'
  | 'current_cost_net_avg'
  | 'current_cost_price'
  | 'missing';

/**
 * Type étendu pour l'affichage : inclut 'current_not_frozen' pour les lignes
 * sans coût figé (on retombe sur le coût produit actuel, non figé à la vente).
 */
export type CostSourceDisplay = CostSource | 'current_not_frozen';

// ---------- Input types ----------

export interface LockedCostInput {
  costUnitHt: number | null;
  source: CostSource;
  includesFees: boolean;
}

export interface SaleLineInput {
  orderId: string;
  orderNumber: string;
  orderDate: string | null;
  channelId: string | null;
  channelCode: string | null;
  channelName: string | null;
  status: string;
  quantity: number;
  unitPriceHt: number;
  totalHt: number | null;
  basePriceLocked: number | null;
  sellingPriceLocked: number | null;
  retrocessionAmount: number | null;
  affiliateId: string | null;
  affiliateName: string | null;
  /** Coût figé à la vente (provient de sales_order_item_costs). null si absent. */
  lockedCost: LockedCostInput | null;
  /** Identifiant client de la commande (organisations.id ou individual_customers.id) */
  customerId?: string | null;
  /** Nom affiché du client (trade_name/legal_name ou prénom+nom) */
  customerName?: string | null;
}

export interface ProductCostInput {
  costNetAvg: number | null;
  costPrice: number | null;
  createdByAffiliate: boolean;
  affiliateCommissionRate: number | null;
}

// ---------- Output types ----------

/**
 * D'où vient le coût retenu. Sert à afficher la provenance à l'écran : une marge
 * calculée sur un prix d'achat nu (`purchase_price`) est trop belle, il faut le dire.
 */
export type CostOrigin =
  | 'manual'
  | 'weighted_average'
  | 'purchase_price'
  | 'missing';

export interface ResolvedCost {
  cost: number | null;
  includesFees: boolean;
  missing: boolean;
  /** Provenance du coût retenu. */
  origin: CostOrigin;
}

export interface ComputedSaleLine {
  orderId: string;
  orderNumber: string;
  orderDate: string | null;
  channelId: string | null;
  channelCode: string | null;
  channelName: string | null;
  status: string;
  quantity: number;
  isLinkMe: boolean;
  /** Vrai si le produit a été créé par un affilié (commission Vérone au lieu de marge) */
  isAffiliateProduct: boolean;
  veroneUnitPrice: number;
  veroneRevenue: number;
  clientRevenue: number;
  affiliateCommission: number;
  veroneCommission: number | null;
  affiliateId: string | null;
  affiliateName: string | null;
  /** Identifiant client de la commande */
  customerId: string | null;
  /** Nom affiché du client */
  customerName: string | null;
  /** Coût unitaire effectif (figé si disponible, actuel sinon) */
  costUnit: number | null;
  /** Source du coût utilisé */
  costSource: CostSourceDisplay | null;
  /** Vrai si le coût inclut les frais d'approche */
  costIncludesFees: boolean | null;
  marginTotal: number | null;
  marginUnit: number | null;
  marginPercent: number | null;
  coefficient: number | null;
}

export interface ChannelSummary {
  channelId: string | null;
  channelCode: string | null;
  channelName: string | null;
  quantity: number;
  veroneRevenue: number;
  avgVeronePrice: number | null;
  /** Somme des marges sur lignes couvertes. null si aucune ligne couverte. */
  marginTotal: number | null;
  /** Marge / revenu couvert × 100. null si coveredRevenue = 0. */
  marginPercent: number | null;
  /** Revenu couvert ÷ coût total. null si costTotal = 0. */
  coefficient: number | null;
  coveredLines: number;
  uncoveredLines: number;
  withoutFeesLines: number;
  costTotal: number;
  coveredRevenue: number;
  orderCount: number;
}

export interface AffiliateSummary {
  affiliateId: string;
  name: string;
  quantity: number;
  veroneRevenue: number;
  marginTotal: number | null;
}

export interface TheoreticalMargin {
  amount: number | null;
  percent: number | null;
  coefficient: number | null;
}

export interface LinkMeSummary {
  quantity: number;
  veroneRevenue: number;
  avgVeronePrice: number | null;
  /** Somme des marges sur lignes couvertes. null si aucune ligne couverte. */
  marginTotal: number | null;
  /** Marge / revenu couvert × 100. null si coveredRevenue = 0. */
  marginPercent: number | null;
  /** Revenu couvert ÷ coût total. null si costTotal = 0. */
  coefficient: number | null;
  coveredLines: number;
  uncoveredLines: number;
  withoutFeesLines: number;
  affiliateProductLines: number;
  costTotal: number;
  coveredRevenue: number;
  affiliateCommissionTotal: number;
  clientRevenue: number;
  veroneCommissionTotal: number;
  orderCount: number;
  sellingAffiliateCount: number;
  offeringAffiliateCount: number;
  byAffiliate: AffiliateSummary[];
  theoreticalUnitMargin: TheoreticalMargin;
}

// ---------- Pure functions ----------

/**
 * Résout le prix de revient d'un produit.
 *
 * Priorité : saisie manuelle > moyenne pondérée des achats > prix d'achat nu.
 *
 * La saisie manuelle passe devant parce qu'elle existe précisément pour les produits
 * qu'aucun achat ne renseigne (50 produits actifs au 17/09/2026). Elle ne remplace
 * pas `cost_net_avg` en base : le déclencheur PMP continue de l'écrire, la valeur
 * manuelle la couvre seulement à la lecture. Voir migration
 * `20260917235000_bo_pricing_gov_001_cost_net_manual.sql`.
 *
 * `includesFees` dit si le coût retenu comprend les frais d'approche (transport,
 * douane, assurance). Un coût sans frais produit une marge optimiste : l'appelant
 * doit le signaler à l'écran, jamais le masquer.
 */
export function resolveCost(input: {
  costNetAvg: number | null;
  costPrice: number | null;
  /** Prix de revient saisi à la main (`products.cost_net_manual`). */
  costNetManual?: number | null;
}): ResolvedCost {
  if (input.costNetManual != null && input.costNetManual > 0) {
    return {
      cost: input.costNetManual,
      includesFees: true,
      missing: false,
      origin: 'manual',
    };
  }
  if (input.costNetAvg != null && input.costNetAvg > 0) {
    return {
      cost: input.costNetAvg,
      includesFees: true,
      missing: false,
      origin: 'weighted_average',
    };
  }
  if (input.costPrice != null && input.costPrice > 0) {
    return {
      cost: input.costPrice,
      includesFees: false,
      missing: false,
      origin: 'purchase_price',
    };
  }
  return {
    cost: null,
    includesFees: false,
    missing: true,
    origin: 'missing',
  };
}

/** Filtre les lignes sur les statuts de vente valables */
export function isValidLine(line: Pick<SaleLineInput, 'status'>): boolean {
  return (VALID_SALE_STATUSES as ReadonlyArray<string>).includes(line.status);
}

/** Calcule les métriques de marge pour une ligne de vente */
export function computeSaleLine(
  line: SaleLineInput,
  product: ProductCostInput,
  cost: ResolvedCost
): ComputedSaleLine {
  const isLinkMe = line.channelId === LINKME_CHANNEL_ID;
  const qty = line.quantity;

  let veroneUnitPrice: number;
  let veroneRevenue: number;
  let clientRevenue: number;
  let affiliateCommission: number;

  if (isLinkMe) {
    veroneUnitPrice = line.basePriceLocked ?? line.unitPriceHt;
    veroneRevenue = veroneUnitPrice * qty;
    clientRevenue = line.totalHt ?? line.unitPriceHt * qty;
    const sellingUnit = line.sellingPriceLocked ?? line.unitPriceHt;
    affiliateCommission =
      line.retrocessionAmount ??
      Math.max(0, sellingUnit - veroneUnitPrice) * qty;
  } else {
    clientRevenue = line.totalHt ?? line.unitPriceHt * qty;
    veroneRevenue = clientRevenue;
    veroneUnitPrice = qty > 0 ? veroneRevenue / qty : line.unitPriceHt;
    affiliateCommission = 0;
  }

  let veroneCommission: number | null = null;
  if (product.createdByAffiliate && isLinkMe) {
    veroneCommission =
      (line.unitPriceHt * qty * (product.affiliateCommissionRate ?? 0)) / 100;
  }

  // Coût effectif : coût figé (sales_order_item_costs) prioritaire sur coût produit actuel
  let effectiveCost: ResolvedCost;
  let costSource: CostSourceDisplay;

  if (line.lockedCost != null) {
    const lc = line.lockedCost;
    const isMissing = lc.source === 'missing' || lc.costUnitHt == null;
    effectiveCost = {
      cost: isMissing ? null : lc.costUnitHt,
      includesFees: lc.includesFees,
      missing: isMissing,
      // Coût figé à la vente : sa provenance est déjà portée par `costSource`
      // (colonne `sales_order_item_costs.cost_source`), plus précise que `origin`.
      origin: isMissing
        ? 'missing'
        : lc.includesFees
          ? 'weighted_average'
          : 'purchase_price',
    };
    costSource = lc.source;
  } else {
    effectiveCost = cost;
    costSource = cost.missing ? 'missing' : 'current_not_frozen';
  }

  let marginTotal: number | null = null;
  let marginUnit: number | null = null;
  let marginPercent: number | null = null;
  let coefficient: number | null = null;

  if (!product.createdByAffiliate && effectiveCost.cost != null) {
    marginUnit = veroneUnitPrice - effectiveCost.cost;
    marginTotal = marginUnit * qty;
    marginPercent =
      veroneRevenue > 0 ? (marginTotal / veroneRevenue) * 100 : null;
    coefficient =
      effectiveCost.cost > 0 ? veroneUnitPrice / effectiveCost.cost : null;
  }

  return {
    orderId: line.orderId,
    orderNumber: line.orderNumber,
    orderDate: line.orderDate,
    channelId: line.channelId,
    channelCode: line.channelCode,
    channelName: line.channelName,
    status: line.status,
    quantity: qty,
    isLinkMe,
    isAffiliateProduct: Boolean(product.createdByAffiliate),
    veroneUnitPrice,
    veroneRevenue,
    clientRevenue,
    affiliateCommission,
    veroneCommission,
    affiliateId: line.affiliateId,
    affiliateName: line.affiliateName,
    customerId: line.customerId ?? null,
    customerName: line.customerName ?? null,
    costUnit: effectiveCost.cost,
    costSource,
    costIncludesFees: effectiveCost.missing ? null : effectiveCost.includesFees,
    marginTotal,
    marginUnit,
    marginPercent,
    coefficient,
  };
}

// Synthèses dans un fichier séparé pour respecter la limite < 400 lignes
export {
  summarizeByChannel,
  summarizeLinkMe,
  summarizeFilteredLines,
} from './product-sales-margin-summaries';
export type { FilteredSummary } from './product-sales-margin-summaries';
