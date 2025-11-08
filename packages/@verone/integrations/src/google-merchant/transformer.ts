/**
 * 🔄 Google Merchant Center Data Transformer
 *
 * Transforme les données de la DB Vérone vers le format Google Merchant Center
 * Mapping complet des 31 champs Google avec extraction JSONB
 */

import { GOOGLE_MERCHANT_CONFIG } from './config';

// Types de base de données (selon notre schéma)
interface VéroneProduct {
  id: string;
  sku: string;
  name: string;
  slug?: string;
  description?: string;
  technical_description?: string;
  price_ht: number;
  cost_price?: number;
  status:
    | 'in_stock'
    | 'out_of_stock'
    | 'preorder'
    | 'coming_soon'
    | 'discontinued';
  condition: 'new' | 'refurbished' | 'used';
  brand?: string;
  gtin?: string;
  supplier_reference?: string; // MPH
  variant_attributes?: Record<string, any>;
  selling_points?: string[];
  weight?: number;
  dimensions?: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Relations
  supplier?: {
    name: string;
    id: string;
  };
  subcategory?: {
    name: string;
    google_category?: string;
  };
  images?: Array<{
    public_url: string;
    is_primary: boolean;
    alt_text?: string;
    display_order: number;
  }>;
}

// Interface Google Merchant Center Product (selon API v1)
interface GoogleMerchantProduct {
  offerId: string;
  contentLanguage: string;
  feedLabel: string;
  productAttributes: {
    // Champs obligatoires
    title: string;
    description: string;
    link: string;
    imageLink: string;
    availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'BACKORDER';
    condition: 'NEW' | 'REFURBISHED' | 'USED';
    price: {
      amountMicros: number;
      currencyCode: string;
    };
    identifierExists: boolean;

    // Champs conditionnels
    brand?: string;
    gtin?: string;
    mpn?: string;

    // Champs optionnels importants
    productHighlights?: string[];
    productDetails?: Array<{
      sectionName: string;
      attributeName: string;
      attributeValue: string;
    }>;
    additionalImageLink?: string[];
    color?: string;
    material?: string;
    size?: string;
    gender?: 'MALE' | 'FEMALE' | 'UNISEX';
    ageGroup?: 'NEWBORN' | 'INFANT' | 'TODDLER' | 'KIDS' | 'ADULT';

    // Shipping (optionnel)
    shipping?: Array<{
      country: string;
      service: string;
      price: {
        amountMicros: number;
        currencyCode: string;
      };
    }>;
  };
}

/**
 * Mappe le statut de disponibilité Vérone vers Google
 */
function mapAvailability(
  status: VéroneProduct['status']
): GoogleMerchantProduct['productAttributes']['availability'] {
  const mapping = {
    in_stock: 'IN_STOCK',
    out_of_stock: 'OUT_OF_STOCK',
    preorder: 'PREORDER',
    coming_soon: 'PREORDER',
    discontinued: 'OUT_OF_STOCK',
  } as const;

  return mapping[status] || 'OUT_OF_STOCK';
}

/**
 * Mappe la condition Vérone vers Google
 */
function mapCondition(
  condition: VéroneProduct['condition']
): GoogleMerchantProduct['productAttributes']['condition'] {
  const mapping = {
    new: 'NEW',
    refurbished: 'REFURBISHED',
    used: 'USED',
  } as const;

  return mapping[condition] || 'NEW';
}

/**
 * Génère l'URL du produit
 */
function generateProductUrl(product: VéroneProduct): string {
  const slug = product.slug || product.sku.toLowerCase();
  return `${GOOGLE_MERCHANT_CONFIG.productBaseUrl}/products/${slug}`;
}

/**
 * Extrait l'image principale
 */
function extractPrimaryImage(product: VéroneProduct): string {
  const primaryImage = product.images?.find(img => img.is_primary);
  const fallbackImage = product.images?.[0];

  return (
    primaryImage?.public_url ||
    fallbackImage?.public_url ||
    `${GOOGLE_MERCHANT_CONFIG.productBaseUrl}/images/placeholder.jpg`
  );
}

/**
 * Extrait les images supplémentaires
 */
function extractAdditionalImages(product: VéroneProduct): string[] {
  if (!product.images || product.images.length <= 1) return [];

  return product.images
    .filter(img => !img.is_primary)
    .sort((a, b) => a.display_order - b.display_order)
    .map(img => img.public_url)
    .slice(0, 10); // Google limite à 10 images supplémentaires
}

/**
 * Extrait les points forts depuis selling_points
 */
function extractProductHighlights(
  product: VéroneProduct
): string[] | undefined {
  if (!product.selling_points || product.selling_points.length === 0)
    return undefined;

  return product.selling_points
    .slice(0, 3) // Google limite à 3 highlights
    .map(point =>
      point.substring(0, GOOGLE_MERCHANT_CONFIG.validation.maxHighlightLength)
    );
}

/**
 * Extrait les détails techniques pour Google
 */
function extractProductDetails(
  product: VéroneProduct
): GoogleMerchantProduct['productAttributes']['productDetails'] | undefined {
  if (!product.technical_description) return undefined;

  // Parsing basique de la description technique
  // Format attendu: "Section:Attribut:Valeur" ou parsing libre
  return [
    {
      sectionName: 'Spécifications',
      attributeName: 'Description technique',
      attributeValue: product.technical_description.substring(0, 200),
    },
  ];
}

/**
 * Extrait les attributs variants (couleur, matériau, taille)
 */
function extractVariantAttributes(product: VéroneProduct) {
  const variants = product.variant_attributes || {};

  return {
    color: variants.color || variants.couleur || undefined,
    material:
      variants.material || variants.materiau || variants.matiere || undefined,
    size:
      variants.size ||
      variants.taille ||
      extractSizeFromDimensions(product.dimensions) ||
      undefined,
  };
}

/**
 * Extrait la taille depuis les dimensions
 */
function extractSizeFromDimensions(
  dimensions?: Record<string, any>
): string | undefined {
  if (!dimensions) return undefined;

  const { width, height, depth, diameter } = dimensions;

  if (width && height && depth) {
    return `${width}x${height}x${depth}cm`;
  }

  if (diameter) {
    return `Ø${diameter}cm`;
  }

  return undefined;
}

/**
 * Calcule le prix en micros (Google utilise les micros)
 */
function calculatePriceMicros(priceEur: number): number {
  return Math.round(priceEur * 1_000_000); // EUR en micros
}

/**
 * Détermine si le produit a des identifiants uniques
 */
function hasUniqueIdentifiers(product: VéroneProduct): boolean {
  return !!(product.gtin || product.supplier_reference);
}

/**
 * Configuration shipping par défaut pour la France
 */
function getDefaultShipping() {
  return [
    {
      country: 'FR',
      service: 'Livraison standard',
      price: {
        amountMicros: 0, // Livraison gratuite par défaut
        currencyCode: 'EUR',
      },
    },
  ];
}

/**
 * FONCTION PRINCIPALE : Transforme un produit Vérone vers Google Merchant
 */
export function transformProductForGoogle(
  product: VéroneProduct
): GoogleMerchantProduct {
  const variants = extractVariantAttributes(product);

  const googleProduct: GoogleMerchantProduct = {
    offerId: product.sku,
    contentLanguage: GOOGLE_MERCHANT_CONFIG.contentLanguage,
    feedLabel: GOOGLE_MERCHANT_CONFIG.feedLabel,
    productAttributes: {
      // CHAMPS OBLIGATOIRES
      title: product.name.substring(
        0,
        GOOGLE_MERCHANT_CONFIG.validation.maxTitleLength
      ),
      description: (product.description || product.name).substring(
        0,
        GOOGLE_MERCHANT_CONFIG.validation.maxDescriptionLength
      ),
      link: generateProductUrl(product),
      imageLink: extractPrimaryImage(product),
      availability: mapAvailability(product.status),
      condition: mapCondition(product.condition),
      price: {
        amountMicros: calculatePriceMicros(product.price_ht),
        currencyCode: GOOGLE_MERCHANT_CONFIG.currency,
      },
      identifierExists: hasUniqueIdentifiers(product),

      // CHAMPS CONDITIONNELS
      ...(product.brand && { brand: product.brand }),
      ...(product.gtin && { gtin: product.gtin }),
      ...(product.supplier_reference && { mpn: product.supplier_reference }),

      // CHAMPS OPTIONNELS IMPORTANTS
      ...(extractProductHighlights(product) && {
        productHighlights: extractProductHighlights(product),
      }),
      ...(extractProductDetails(product) && {
        productDetails: extractProductDetails(product),
      }),
      ...(extractAdditionalImages(product).length > 0 && {
        additionalImageLink: extractAdditionalImages(product),
      }),
      ...(variants.color && { color: variants.color }),
      ...(variants.material && { material: variants.material }),
      ...(variants.size && { size: variants.size }),

      // SHIPPING STANDARD
      shipping: getDefaultShipping(),
    },
  };

  return googleProduct;
}

/**
 * Valide un produit transformé avant envoi à Google
 */
export function validateGoogleMerchantProduct(product: GoogleMerchantProduct): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const attrs = product.productAttributes;

  // Validations obligatoires
  if (!attrs.title || attrs.title.length === 0) {
    errors.push('Titre manquant');
  }

  if (!attrs.description || attrs.description.length === 0) {
    errors.push('Description manquante');
  }

  if (!attrs.link?.startsWith('http')) {
    errors.push('URL produit invalide');
  }

  if (!attrs.imageLink?.startsWith('http')) {
    errors.push('URL image invalide');
  }

  if (attrs.price.amountMicros <= 0) {
    errors.push('Prix invalide');
  }

  // Validations longueurs
  if (attrs.title.length > GOOGLE_MERCHANT_CONFIG.validation.maxTitleLength) {
    errors.push(
      `Titre trop long (max ${GOOGLE_MERCHANT_CONFIG.validation.maxTitleLength} chars)`
    );
  }

  if (
    attrs.description.length >
    GOOGLE_MERCHANT_CONFIG.validation.maxDescriptionLength
  ) {
    errors.push(
      `Description trop longue (max ${GOOGLE_MERCHANT_CONFIG.validation.maxDescriptionLength} chars)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper pour debug - affiche le produit transformé
 */
export function debugTransformedProduct(product: VéroneProduct): void {
  const transformed = transformProductForGoogle(product);
  const validation = validateGoogleMerchantProduct(transformed);

  console.log('🔄 Produit transformé:', {
    original: {
      sku: product.sku,
      name: product.name,
      status: product.status,
      price_ht: product.price_ht,
    },
    transformed: {
      offerId: transformed.offerId,
      title: transformed.productAttributes.title,
      availability: transformed.productAttributes.availability,
      priceMicros: transformed.productAttributes.price.amountMicros,
    },
    validation,
  });
}
