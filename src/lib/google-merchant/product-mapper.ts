/**
 * Google Merchant Product Mapper
 *
 * Transforme les produits Supabase en format Google Merchant Center ProductInput
 * Spec: https://developers.google.com/merchant/api/reference/rest/products_v1beta/ProductInput
 */

import { logger } from '@/lib/logger';
import type { Database } from '@verone/types';

// Types Supabase
type Product = Database['public']['Tables']['products']['Row'];
type ProductImage = Database['public']['Tables']['product_images']['Row'];
type Subcategory = Database['public']['Tables']['subcategories']['Row'] & {
  category: { name: string } | null;
};

// Constantes Configuration
const DEFAULT_MARGIN_PERCENTAGE = 30; // 30% margin par défaut si non spécifié
const MAX_ADDITIONAL_IMAGES = 10; // Google limite à 10 images supplémentaires
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Données produit complètes avec relations chargées
 */
export interface ProductWithRelations {
  product: Product;
  images: ProductImage[];
  subcategory: Subcategory | null;
}

/**
 * Google Merchant ProductInput
 * Spec: https://developers.google.com/merchant/api/reference/rest/products_v1beta/ProductInput
 */
/**
 * Google Merchant ProductInput (Content API v2.1)
 * Spec: https://developers.google.com/shopping-content/reference/rest/v2.1/products
 */
export interface GoogleMerchantProductInput {
  offerId: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  contentLanguage: string;
  targetCountry: string;
  channel: 'online' | 'local';
  availability: 'in stock' | 'out of stock' | 'preorder';
  condition: 'new' | 'refurbished' | 'used';
  price: {
    value: string;
    currency: string;
  };
  brand?: string;
  gtin?: string;
  mpn?: string;
  additionalImageLinks?: string[];
  productTypes?: string[];
  itemGroupId?: string;
}

/**
 * Configuration Google Merchant depuis env vars
 */
const GOOGLE_MERCHANT_CONFIG = {
  accountId: process.env.GOOGLE_MERCHANT_ACCOUNT_ID!,
  dataSourceId: process.env.GOOGLE_MERCHANT_DATA_SOURCE_ID!,
  contentLanguage: 'fr',
  targetCountry: 'FR', // Content API v2.1 utilise targetCountry au lieu de feedLabel
  currency: 'EUR',
};

/**
 * Mapping stock_status → Google Merchant availability
 * Phase 3.4 - Dual Status System (2025-11-04)
 */
const STOCK_STATUS_AVAILABILITY_MAP: Record<
  string,
  'in stock' | 'out of stock' | 'preorder'
> = {
  in_stock: 'in stock',
  out_of_stock: 'out of stock',
  coming_soon: 'preorder',
};

/**
 * Mapping product_status → Google Merchant availability fallback
 * Utilisé seulement si stock_status est invalide/null
 */
const PRODUCT_STATUS_AVAILABILITY_MAP: Record<
  string,
  'in stock' | 'out of stock' | 'preorder'
> = {
  active: 'in stock',
  draft: 'out of stock',
  preorder: 'preorder',
  discontinued: 'out of stock',
};

/**
 * Mapping Vérone condition → Google Merchant condition (Content API v2.1)
 */
const CONDITION_MAP: Record<string, 'new' | 'refurbished' | 'used'> = {
  new: 'new',
  refurbished: 'refurbished',
  used: 'used',
};

/**
 * Calcule le prix de vente à partir du cost_price et de la marge
 */
function calculateSellingPrice(
  costPrice: number,
  marginPercentage: number | null
): string {
  const margin = marginPercentage ?? DEFAULT_MARGIN_PERCENTAGE;
  const sellingPrice = costPrice * (1 + margin / 100);

  // Arrondi à 2 décimales et retourne string format Google ("123.45")
  return sellingPrice.toFixed(2);
}

/**
 * Génère l'URL publique du produit sur le site Vérone
 */
function generateProductUrl(product: Product): string {
  const slug = product.slug || product.sku.toLowerCase();
  return `${BASE_URL}/produits/${slug}`;
}

/**
 * Extrait les URLs d'images triées par display_order
 */
function extractImageUrls(images: ProductImage[]): {
  imageLink: string | null;
  additionalImageLinks: string[];
} {
  // Trier par display_order ASC
  const sortedImages = [...images].sort(
    (a, b) => (a.display_order || 0) - (b.display_order || 0)
  );

  // Filtrer images avec public_url valide
  const validImages = sortedImages.filter(
    img => img.public_url && img.public_url.trim().length > 0
  );

  if (validImages.length === 0) {
    return { imageLink: null, additionalImageLinks: [] };
  }

  const [primaryImage, ...additionalImages] = validImages;

  return {
    imageLink: primaryImage.public_url!,
    additionalImageLinks: additionalImages
      .slice(0, MAX_ADDITIONAL_IMAGES)
      .map(img => img.public_url!),
  };
}

/**
 * Génère les productTypes à partir de la catégorie et sous-catégorie
 * Format: ["Catégorie Parent > Sous-catégorie", "Catégorie Parent", "Sous-catégorie"]
 */
function generateProductTypes(subcategory: Subcategory | null): string[] {
  if (!subcategory) {
    return [];
  }

  const types: string[] = [];

  // Format complet: "Mobilier > Chaises"
  if (subcategory.category?.name) {
    types.push(`${subcategory.category.name} > ${subcategory.name}`);
  }

  // Catégorie parent seule: "Mobilier"
  if (subcategory.category?.name) {
    types.push(subcategory.category.name);
  }

  // Sous-catégorie seule: "Chaises"
  types.push(subcategory.name);

  return types;
}

/**
 * Mappe un produit Supabase vers le format Google Merchant ProductInput
 *
 * @throws Error si données obligatoires manquantes
 */
export function mapSupabaseToGoogleMerchant(
  data: ProductWithRelations
): GoogleMerchantProductInput {
  const { product, images, subcategory } = data;

  // Validation données obligatoires
  if (!product.sku) {
    throw new Error(`Product ${product.id}: SKU manquant`);
  }

  if (!product.name || product.name.trim().length < 5) {
    throw new Error(`Product ${product.sku}: Nom invalide (min 5 caractères)`);
  }

  if (!product.cost_price || product.cost_price <= 0) {
    throw new Error(`Product ${product.sku}: Cost price invalide`);
  }

  // Extraction images
  const { imageLink, additionalImageLinks } = extractImageUrls(images);

  if (!imageLink) {
    throw new Error(
      `Product ${product.sku}: Aucune image disponible (imageLink obligatoire)`
    );
  }

  // Calcul selling price
  const sellingPrice = calculateSellingPrice(
    Number(product.cost_price),
    product.margin_percentage ? Number(product.margin_percentage) : null
  );

  // Mapping availability (priorité stock_status, fallback product_status)
  const availability =
    STOCK_STATUS_AVAILABILITY_MAP[product.stock_status || ''] ||
    PRODUCT_STATUS_AVAILABILITY_MAP[product.product_status || ''] ||
    'out of stock';

  // Mapping condition
  const condition = CONDITION_MAP[product.condition || 'new'] || 'new';

  // Génération URL produit
  const productUrl = generateProductUrl(product);

  // Génération product types
  const productTypes = generateProductTypes(subcategory);

  // Construction ProductInput (Content API v2.1 format plat)
  const productInput: GoogleMerchantProductInput = {
    offerId: product.sku,
    title: product.name,
    description: product.description || product.name, // Fallback sur title si pas de description
    link: productUrl,
    imageLink,
    contentLanguage: GOOGLE_MERCHANT_CONFIG.contentLanguage,
    targetCountry: GOOGLE_MERCHANT_CONFIG.targetCountry,
    channel: 'online',
    availability,
    condition,
    price: {
      value: sellingPrice,
      currency: GOOGLE_MERCHANT_CONFIG.currency,
    },
  };

  // Champs optionnels
  if (product.brand) {
    productInput.brand = product.brand;
  }

  if (product.gtin) {
    productInput.gtin = product.gtin;
  }

  if (product.supplier_reference) {
    productInput.mpn = product.supplier_reference;
  }

  if (additionalImageLinks.length > 0) {
    productInput.additionalImageLinks = additionalImageLinks;
  }

  if (productTypes.length > 0) {
    productInput.productTypes = productTypes;
  }

  // Item Group ID pour variants (IMPORTANT pour produits avec variantes)
  if (product.item_group_id) {
    productInput.itemGroupId = product.item_group_id;
  }

  logger.info('Product mapped to Google Merchant format', {
    operation: 'product_mapping',
    sku: product.sku,
    productName: product.name,
    sellingPrice,
    availability,
    hasImages: additionalImageLinks.length + 1,
    hasVariants: !!product.item_group_id,
  });

  return productInput;
}

/**
 * Mappe un batch de produits
 * Retourne succès + erreurs séparés
 */
export function mapProductsBatch(products: ProductWithRelations[]): {
  success: GoogleMerchantProductInput[];
  errors: Array<{ productId: string; sku: string; error: string }>;
} {
  const success: GoogleMerchantProductInput[] = [];
  const errors: Array<{ productId: string; sku: string; error: string }> = [];

  for (const productData of products) {
    try {
      const mapped = mapSupabaseToGoogleMerchant(productData);
      success.push(mapped);
    } catch (error) {
      errors.push({
        productId: productData.product.id,
        sku: productData.product.sku || 'UNKNOWN',
        error: error instanceof Error ? error.message : String(error),
      });

      logger.error('Failed to map product', undefined, {
        operation: 'product_mapping_batch',
        productId: productData.product.id,
        sku: productData.product.sku,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info('Batch mapping completed', {
    operation: 'product_mapping_batch',
    total: products.length,
    success: success.length,
    errors: errors.length,
  });

  return { success, errors };
}

/**
 * Validation helper: vérifie si un produit peut être synchronisé
 */
export function canProductBeSynced(product: Product): {
  canSync: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!product.sku) {
    reasons.push('SKU manquant');
  }

  if (!product.name || product.name.trim().length < 5) {
    reasons.push('Nom invalide (min 5 caractères)');
  }

  if (!product.cost_price || product.cost_price <= 0) {
    reasons.push('Prix invalide');
  }

  if (product.archived_at) {
    reasons.push('Produit archivé');
  }

  if (product.completion_status !== 'active') {
    reasons.push(`Statut completion invalide: ${product.completion_status}`);
  }

  return {
    canSync: reasons.length === 0,
    reasons,
  };
}
