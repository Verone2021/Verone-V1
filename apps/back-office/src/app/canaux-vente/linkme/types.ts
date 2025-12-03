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
  cost_price: number;
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
 * FORMULE (Commission NITMI s'ajoute au prix de vente):
 * 1. Prix max client = publicPriceHT × (1 - bufferRate)
 * 2. Prix max affilié = Prix max client / (1 + platformFeeRate)
 *    → Car: prix_affilié × (1 + commission) = prix_client
 * 3. maxMarginAmount = Prix max affilié - costPriceHT
 * 4. maxRate = maxMarginAmount / costPriceHT
 * 5. suggestedRate = maxRate / 3 (top de la zone verte)
 * 6. minRate = 0.01 (1% constant)
 *
 * EXEMPLE: cost=40€, public=100€, buffer=5%, commission=5%
 * - Prix max client = 100 × 0.95 = 95€
 * - Prix max affilié = 95 / 1.05 = 90.48€
 * - Marge max = 90.48 - 40 = 50.48€ (126.2%)
 */
export interface MarginCalculationInput {
  /** Prix d'achat HT (products.cost_price) */
  costPriceHT: number;
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
 * Calcule automatiquement les marges LinkMe à partir du prix d'achat et du tarif public
 *
 * LOGIQUE: La commission NITMI s'ajoute au prix de vente affilié pour donner le prix client.
 * Donc: prix_client = prix_affilié × (1 + commission)
 *
 * ZONES DE COULEUR (Traffic Light System):
 * - VERT (compétitif): 0 → maxRate/3
 * - ORANGE (correct): maxRate/3 → 2×maxRate/3
 * - ROUGE (proche public): 2×maxRate/3 → maxRate
 *
 * @example
 * // Exemple avec cost_price=40€, public_price=100€, commission=5%, buffer=5%
 * const result = calculateLinkMeMargins({
 *   costPriceHT: 40,
 *   publicPriceHT: 100,
 *   platformFeeRate: 0.05,
 *   bufferRate: 0.05
 * });
 * // Prix max client = 100 × 0.95 = 95€
 * // Prix max affilié = 95 / 1.05 = 90.48€
 * // Marge max = (90.48 - 40) / 40 = 126.2%
 */
export function calculateLinkMeMargins(
  input: MarginCalculationInput
): MarginCalculationResult {
  const {
    costPriceHT,
    publicPriceHT,
    platformFeeRate,
    bufferRate = 0.05,
  } = input;

  // Cas invalides → produit non vendable
  if (
    !publicPriceHT ||
    publicPriceHT <= 0 ||
    !costPriceHT ||
    costPriceHT <= 0
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

  // NOUVELLE FORMULE (Commission s'ajoute au prix de vente):
  // 1. Prix max que le client peut payer (avec buffer sous le prix public)
  const maxCustomerPrice = publicPriceHT * (1 - bufferRate);

  // 2. Prix max que l'affilié peut facturer (avant ajout commission)
  //    Car: prix_affilié × (1 + commission) = prix_client
  //    Donc: prix_affilié = prix_client / (1 + commission)
  const maxAffiliatePrice = maxCustomerPrice / (1 + platformFeeRate);

  // 3. Marge maximum en euros
  const maxMarginAmount = maxAffiliatePrice - costPriceHT;

  // 4. Taux de marge maximum
  const maxRate = maxMarginAmount / costPriceHT;

  // Clamp à 0 minimum et calcul des zones
  const clampedMaxRate = Math.max(0, maxRate);
  const suggestedRate = clampedMaxRate / 3;

  return {
    minRate: 0.01, // 1% constant
    maxRate: Math.round(clampedMaxRate * 10000) / 10000, // 4 décimales
    suggestedRate: Math.round(suggestedRate * 10000) / 10000,
    isProductSellable: clampedMaxRate > 0.01,
    greenZoneEnd: suggestedRate,
    orangeZoneEnd: suggestedRate * 2,
  };
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
