/**
 * Hook: useLinkMeCatalog
 * Gestion du catalogue LinkMe (produits disponibles pour les affiliés)
 *
 * ARCHITECTURE : Utilise `channel_pricing` (table générique multi-canaux)
 * Le canal LinkMe a l'ID: 93c68db1-5a30-4168-89ec-6383152be405
 *
 * MIGRATION 2025-12-02:
 * - Remplace linkme_catalog_products (OBSOLÈTE) par channel_pricing
 * - is_enabled → is_active
 * - linkme_commission_rate → channel_commission_rate
 * - selling_price_ht → custom_price_ht
 *
 * REFACTORING 2026-04-03:
 * Barrel re-export — le code source est dans ./catalog/
 * Aucun import existant ne doit être modifié.
 */

// Types
export type {
  LinkMeCatalogProduct,
  EligibleProduct,
  AddProductWithPricing,
  ProductVariant,
  SourcingProduct,
  ProductSelectionPresence,
} from './catalog/types';

// Query hooks (liste, éligibles, stats)
export {
  useLinkMeCatalogProducts,
  useEligibleProducts,
  useLinkMeCatalogStats,
} from './catalog/use-catalog-queries';

// Mutation hooks (ajout/suppression catalogue)
export {
  useAddProductsToCatalog,
  useRemoveProductFromCatalog,
} from './catalog/use-catalog-mutations';

// Toggle hooks avec optimistic update
export {
  useToggleProductEnabled,
  useToggleProductShowcase,
  useToggleProductFeatured,
  useToggleShowSupplier,
} from './catalog/use-catalog-toggles';

// Metadata hooks (marges, custom metadata)
export {
  useUpdateMarginSettings,
  useUpdateCustomMetadata,
} from './catalog/use-catalog-metadata';

// Detail page hooks
export {
  useLinkMeProductDetail,
  useUpdateLinkMePricing,
  useUpdateLinkMeMetadata,
  useUpdateAffiliateCommission,
  useToggleLinkMeProductField,
} from './catalog/use-product-detail';

// Product variants
export { useLinkMeProductVariants } from './catalog/use-product-variants';

// Sourcing products
export { useSourcingProducts } from './catalog/use-sourcing-products';

// Price propagation & deletion
export {
  useProductSelections,
  usePropagatePrice,
  useDeleteLinkMeCatalogProduct,
} from './catalog/use-price-propagation';
