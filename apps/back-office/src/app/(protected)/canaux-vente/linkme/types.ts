/**
 * Types pour le module LinkMe Catalogue
 * Architecture: channel_pricing JOIN products
 *
 * ARCHITECTURE 2025-12 (Migration channel_pricing):
 * - channel_pricing.custom_price_ht = Prix de vente HT pour ce canal
 * - products.cost_price = Prix d'achat (confidentiel, lecture seule)
 * - channel_pricing = Paramètres spécifiques au canal (marges, toggles, metadata)
 *
 * MAPPING COLONNES:
 * - is_enabled (UI) → is_active (channel_pricing)
 * - linkme_commission_rate (UI) → channel_commission_rate (channel_pricing)
 * - selling_price_ht (UI) → custom_price_ht (channel_pricing)
 */

/**
 * Détail complet d'un produit LinkMe pour la page [id]
 */
export interface LinkMeProductDetail {
  /** ID dans channel_pricing */
  id: string;
  /** ID du produit source */
  product_id: string;
  /** SKU produit */
  sku: string;
  /** Nom du produit */
  name: string;

  // === PRICING ===
  /** Prix de vente HT LinkMe - custom_price_ht ou min_selling_price_ht si non défini */
  selling_price_ht: number | null;
  /** Tarif public HT - depuis channel_pricing.public_price_ht (éditable) */
  public_price_ht: number | null;
  /** Prix d'achat - READ-ONLY depuis products.cost_price (confidentiel) */
  cost_price: number | null;
  /** Prix minimum de vente HT calculé: (cost_price + eco_tax) × (1 + margin/100) - READ-ONLY */
  min_selling_price_ht: number | null;

  // === TOGGLES ===
  /** Activé dans le catalogue LinkMe (mapped from is_active) */
  is_enabled: boolean;
  /** Visible sur vitrine publique (non-connectés) */
  is_public_showcase: boolean;
  /** Produit vedette mis en avant */
  is_featured: boolean;
  /** Afficher fournisseur dans "Nos partenaires" */
  show_supplier: boolean;

  // === MARGES (pour affiliés) ===
  /** Marge minimum autorisée (%) */
  min_margin_rate: number;
  /** Marge maximum autorisée (%) */
  max_margin_rate: number;
  /** Marge suggérée par défaut (%) */
  suggested_margin_rate: number | null;
  /** Commission LinkMe sur ce produit (%) - mapped from channel_commission_rate */
  linkme_commission_rate: number | null;
  /** Marge de sécurité sous le prix public (décimal: 0.05 = 5%) */
  buffer_rate: number | null;

  // === METADATA CUSTOM ===
  /** Titre personnalisé pour LinkMe */
  custom_title: string | null;
  /** Description personnalisée pour LinkMe */
  custom_description: string | null;
  /** Arguments de vente personnalisés */
  custom_selling_points: string[] | null;

  // === VALEURS SOURCE PRODUIT (READ-ONLY, pour validation "copier") ===
  /** Description source depuis produit (read-only) */
  source_description: string | null;
  /** Arguments de vente source depuis produit (read-only) */
  source_selling_points: string[] | null;

  // === INFORMATIONS PRODUIT (READ-ONLY) ===
  /** URL image principale */
  primary_image_url: string | null;
  /** Stock réel */
  stock_real: number;
  /** Produit actif dans catalogue principal */
  product_is_active: boolean;
  /** Nom famille produit */
  product_family_name: string | null;
  /** Nom catégorie produit (sous-catégorie) */
  product_category_name: string | null;
  /** Nom fournisseur */
  product_supplier_name: string | null;

  // === PRODUITS SUR MESURE (READ-ONLY) ===
  /** ID enseigne si produit exclusif */
  enseigne_id: string | null;
  /** Nom de l'enseigne */
  enseigne_name: string | null;
  /** ID organisation si produit exclusif */
  assigned_client_id: string | null;
  /** Nom de l'organisation */
  assigned_client_name: string | null;
  /** true si produit exclusif à une enseigne ou organisation */
  is_sourced: boolean;

  // === PRODUITS AFFILIÉS ===
  /** ID affilié créateur (produit créé par affilié) */
  created_by_affiliate: string | null;
  /** Nom de l'affilié créateur */
  affiliate_name: string | null;
  /** Commission Vérone sur ce produit affilié (%) - depuis products.affiliate_commission_rate */
  affiliate_commission_rate: number | null;
  /** Montant que l'affilié encaisse par unité vendue (HT) - depuis products.affiliate_payout_ht */
  affiliate_payout_ht: number | null;
  /** Statut d'approbation du produit affilié */
  affiliate_approval_status:
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'rejected'
    | null;

  // === INFORMATIONS PRODUIT SUPPLÉMENTAIRES (READ-ONLY) ===
  /** ID sous-catégorie */
  subcategory_id: string | null;
  /** ID fournisseur */
  supplier_id: string | null;
  /** Poids en kg */
  weight_kg: number | null;
  /** Dimensions (jsonb) */
  dimensions_cm: Record<string, number | string> | null;
  /** Pièces d'habitation */
  room_types: string[] | null;

  // === STATISTIQUES ===
  /** Nombre de vues */
  views_count: number;
  /** Nombre de sélections/ajouts panier */
  selections_count: number;
  /** Ordre d'affichage */
  display_order: number;
}

/**
 * Variante d'un produit (lecture seule)
 */
export interface ProductVariant {
  id: string;
  sku: string | null;
  name: string | null;
  variant_attributes: Record<string, string> | null;
  stock_real: number;
  cost_price: number | null;
  /** URL image principale de la variante */
  image_url: string | null;
}

/**
 * Données pour mise à jour des marges dans channel_pricing
 * Note: custom_price_ht peut être mis à jour pour définir un prix spécifique au canal
 */
export interface LinkMePricingUpdate {
  min_margin_rate?: number;
  max_margin_rate?: number;
  suggested_margin_rate?: number | null;
  /** Commission LinkMe (sera sauvé comme channel_commission_rate) */
  channel_commission_rate?: number | null;
  /** Prix de vente HT spécifique au canal */
  custom_price_ht?: number | null;
  /** Tarif public HT */
  public_price_ht?: number | null;
  /** Marge de sécurité (décimal: 0.05 = 5%) */
  buffer_rate?: number | null;
}

/**
 * Données pour mise à jour metadata
 */
export interface LinkMeMetadataUpdate {
  custom_title?: string | null;
  custom_description?: string | null;
  custom_selling_points?: string[] | null;
}

/**
 * Calcul de marge
 * @param costPrice Prix coûtant
 * @param sellingPrice Prix de vente
 * @returns Marge en pourcentage ou null si calcul impossible
 */
export function calculateMargin(
  costPrice: number,
  sellingPrice: number | null
): number | null {
  if (!sellingPrice || costPrice <= 0) return null;
  return ((sellingPrice - costPrice) / costPrice) * 100;
}

/**
 * Vérifie si la marge est dans les limites autorisées
 */
export function isMarginValid(
  margin: number | null,
  minRate: number,
  maxRate: number
): boolean {
  if (margin === null) return false;
  return margin >= minRate && margin <= maxRate;
}

/**
 * Champs requis pour la complétude LinkMe
 * - custom_title: Titre validé (copié depuis source ou personnalisé)
 * - custom_description: Description validée
 * - custom_selling_points: Arguments de vente validés
 * - selling_price_ht: Prix de vente défini
 */
export interface CompletenessField {
  key: string;
  label: string;
  isComplete: boolean;
  hasSourceValue: boolean;
}

/**
 * Calcule le taux de complétude d'un produit LinkMe
 * Un champ est "complet" si:
 * - Il a une valeur custom (l'utilisateur a validé/personnalisé)
 * - OU selling_price_ht est défini (pour le prix)
 */
export function calculateCompleteness(product: LinkMeProductDetail): {
  percentage: number;
  fields: CompletenessField[];
  completedCount: number;
  totalCount: number;
} {
  const fields: CompletenessField[] = [
    {
      key: 'custom_title',
      label: 'Titre',
      isComplete: !!product.custom_title,
      hasSourceValue: !!product.name,
    },
    {
      key: 'custom_description',
      label: 'Description',
      isComplete: !!product.custom_description,
      hasSourceValue: !!product.source_description,
    },
    {
      key: 'custom_selling_points',
      label: 'Arguments de vente',
      isComplete: !!(
        product.custom_selling_points &&
        product.custom_selling_points.length > 0
      ),
      hasSourceValue: !!(
        product.source_selling_points &&
        product.source_selling_points.length > 0
      ),
    },
    {
      key: 'selling_price_ht',
      label: 'Prix de vente',
      isComplete:
        product.selling_price_ht !== null && product.selling_price_ht > 0,
      hasSourceValue:
        product.min_selling_price_ht !== null &&
        product.min_selling_price_ht > 0,
    },
  ];

  const completedCount = fields.filter(f => f.isComplete).length;
  const totalCount = fields.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return { percentage, fields, completedCount, totalCount };
}

/**
 * Calcule la complétude simplifiée pour les cartes catalogue
 * Inclut TOUS les 9 champs obligatoires:
 * - Info (3): custom_title, custom_description, custom_selling_points
 * - Pricing (6): public_price_ht, custom_price_ht, min_margin_rate, max_margin_rate, suggested_margin_rate, channel_commission_rate
 */
export function calculateSimpleCompleteness(product: {
  // Info
  custom_title: string | null;
  custom_description: string | null;
  custom_selling_points: string[] | null;
  // Pricing
  public_price_ht: number | null;
  product_selling_price_ht: number | null;
  min_margin_rate: number | null;
  max_margin_rate: number | null;
  suggested_margin_rate: number | null;
  channel_commission_rate: number | null;
}): number {
  let completed = 0;
  const total = 9;

  // Info (3 champs)
  if (product.custom_title) completed++;
  if (product.custom_description) completed++;
  if (product.custom_selling_points && product.custom_selling_points.length > 0)
    completed++;

  // Pricing (6 champs)
  if (product.public_price_ht !== null && product.public_price_ht > 0)
    completed++;
  if (
    product.product_selling_price_ht !== null &&
    product.product_selling_price_ht > 0
  )
    completed++;
  if (product.min_margin_rate !== null) completed++;
  if (product.max_margin_rate !== null) completed++;
  if (product.suggested_margin_rate !== null) completed++;
  if (product.channel_commission_rate !== null) completed++;

  return Math.round((completed / total) * 100);
}

// ============================================================================
// CALCUL AUTOMATIQUE DES MARGES LINKME
// ============================================================================

/**
 * Entrées pour le calcul automatique des marges
 *
 * FORMULE CORRECTE (source: Calcul-marge-linkme.md):
 *
 * 1. r_cap_total = (publicPriceHT - basePriceHT) / basePriceHT
 *    → Capacité totale de marge disponible
 *
 * 2. maxRate = r_cap_total - platformFeeRate - bufferRate (SOUSTRACTION!)
 *    → Marge maximum que l'affilié peut prendre
 *
 * 3. suggestedRate = maxRate / 3
 *    → Top de la zone verte (prix très compétitif)
 *
 * 4. minRate = 0.01 (1% constant)
 *
 * PRIX FINAL:
 * P_vente = basePriceHT × (1 + platformFeeRate + affiliateMarginRate)
 *
 * EXEMPLE: base=100€, public=150€, commission=5%, buffer=5%
 * - r_cap_total = (150 - 100) / 100 = 50%
 * - maxRate = 50% - 5% - 5% = 40%
 * - suggestedRate = 40% / 3 = 13.3%
 * - Si marge affilié = 10%, prix final = 100 × 1.15 = 115€
 */
export interface MarginCalculationInput {
  /** Prix de vente catalogue HT (selling_price_ht ou custom_price_ht) */
  basePriceHT: number;
  /** Tarif public HT (channel_pricing.public_price_ht) */
  publicPriceHT: number;
  /** Commission LinkMe en décimal (0.05 = 5%) */
  platformFeeRate: number;
  /** Marge de sécurité sous prix public en décimal (défaut: 0.05 = 5%) */
  bufferRate?: number;
}

/**
 * Résultat du calcul automatique des marges
 */
export interface MarginCalculationResult {
  /** Marge minimum en décimal (0.01 = 1%) - toujours constant */
  minRate: number;
  /** Marge maximum calculée en décimal */
  maxRate: number;
  /** Marge suggérée en décimal (maxRate / 3) */
  suggestedRate: number;
  /** True si le produit est vendable (maxRate > minRate) */
  isProductSellable: boolean;
  /** Fin de la zone verte (0 → suggestedRate) */
  greenZoneEnd: number;
  /** Fin de la zone orange (suggestedRate → orangeZoneEnd) */
  orangeZoneEnd: number;
}

/**
 * Calcule automatiquement les marges LinkMe à partir du prix de vente et du tarif public
 *
 * FORMULE CORRECTE (source: Calcul-marge-linkme.md):
 * - r_cap_total = (publicPrice - basePrice) / basePrice
 * - maxRate = r_cap_total - platformFeeRate - bufferRate (SOUSTRACTION!)
 * - suggestedRate = maxRate / 3
 *
 * PRIX FINAL CLIENT:
 * P_vente = basePrice × (1 + platformFeeRate + affiliateMarginRate)
 *
 * ZONES DE COULEUR (Traffic Light System):
 * - VERT (compétitif): 0% → maxRate/3
 * - ORANGE (correct): maxRate/3 → 2×maxRate/3
 * - ROUGE (proche public): 2×maxRate/3 → maxRate
 *
 * @example
 * // Exemple avec base=100€, public=150€, commission=5%, buffer=5%
 * const result = calculateLinkMeMargins({
 *   basePriceHT: 100,
 *   publicPriceHT: 150,
 *   platformFeeRate: 0.05,
 *   bufferRate: 0.05
 * });
 * // r_cap_total = (150 - 100) / 100 = 50%
 * // maxRate = 50% - 5% - 5% = 40%
 * // suggestedRate = 40% / 3 = 13.3%
 */
export function calculateLinkMeMargins(
  input: MarginCalculationInput
): MarginCalculationResult {
  const {
    basePriceHT,
    publicPriceHT,
    platformFeeRate,
    bufferRate = 0.05,
  } = input;

  // Cas invalides → produit non vendable
  if (
    !publicPriceHT ||
    publicPriceHT <= 0 ||
    !basePriceHT ||
    basePriceHT <= 0
  ) {
    return {
      minRate: 0.01,
      maxRate: 0,
      suggestedRate: 0,
      isProductSellable: false,
      greenZoneEnd: 0,
      orangeZoneEnd: 0,
    };
  }

  // FORMULE CORRECTE (Calcul-marge-linkme.md):
  // Étape 1: Prix client LinkMe = prix de vente HT × (1 + commission%)
  const prixClientLinkMe = basePriceHT * (1 + platformFeeRate);

  // Étape 2: Prix plafond avec buffer de sécurité (5% SOUS le prix public en euros)
  // Ex: 180€ × 0.95 = 171€
  const prixPlafondSecurite = publicPriceHT * (1 - bufferRate);

  // Étape 3: Marge max affilié = (prix plafond - prix client) / prix client
  // Ex: (171 - 137.61) / 137.61 = 24.3%
  const maxRate = Math.max(
    0,
    (prixPlafondSecurite - prixClientLinkMe) / prixClientLinkMe
  );

  // Étape 4: Division en 3 zones égales (vert, orange, rouge)
  const suggestedRate = maxRate / 3;

  return {
    minRate: 0.01, // 1% constant
    maxRate: Math.round(maxRate * 10000) / 10000, // 4 décimales
    suggestedRate: Math.round(suggestedRate * 10000) / 10000,
    isProductSellable: maxRate > 0.01,
    greenZoneEnd: suggestedRate,
    orangeZoneEnd: suggestedRate * 2,
  };
}

/**
 * Calcule le prix de vente final client avec TAUX DE MARQUE
 *
 * FORMULE TAUX DE MARQUE:
 * 1. Prix avec marge = basePriceHT / (1 - affiliateMarginRate)
 * 2. Prix final = Prix avec marge × (1 + platformFeeRate)
 *
 * @param basePriceHT Prix de vente catalogue HT
 * @param platformFeeRate Commission LinkMe en décimal (0.05 = 5%)
 * @param affiliateMarginRate Taux de marque affilié en décimal (0.15 = 15%)
 * @returns Prix final client HT
 *
 * @example
 * // base=55.50€, commission=5%, taux de marque=15%
 * // Prix avec marge = 55.50 / 0.85 = 65.29€
 * // Prix final = 65.29 × 1.05 = 68.55€
 * calculateFinalClientPrice(55.50, 0.05, 0.15) // → 68.55€
 */
export function calculateFinalClientPrice(
  basePriceHT: number,
  platformFeeRate: number,
  affiliateMarginRate: number
): number {
  // Taux de marque: PVHT = PAHT / (1 - taux%)
  const priceWithMargin = basePriceHT / (1 - affiliateMarginRate);
  // Commission appliquée sur le prix avec marge
  return priceWithMargin * (1 + platformFeeRate);
}

/**
 * Détermine la couleur d'une marge dans le système de feux tricolores
 * @param marginRate Le taux de marge actuel (décimal)
 * @param result Le résultat du calcul des marges
 * @returns 'green' | 'orange' | 'red'
 */
export function getMarginColor(
  marginRate: number,
  result: MarginCalculationResult
): 'green' | 'orange' | 'red' {
  if (marginRate <= result.greenZoneEnd) return 'green';
  if (marginRate <= result.orangeZoneEnd) return 'orange';
  return 'red';
}
