/**
 * Google Merchant Hooks - Index
 *
 * Exports centralisés pour tous les hooks Google Merchant
 */

export { useGoogleMerchantEligibleProducts } from './use-google-merchant-eligible-products';
export type { GoogleMerchantEligibleProduct } from './use-google-merchant-eligible-products';

export { useAddProductsToGoogleMerchant } from './use-add-products-to-google-merchant';
export { useUpdateGoogleMerchantPrice } from './use-update-google-merchant-price';
export { useUpdateGoogleMerchantMetadata } from './use-update-google-merchant-metadata';
export { useRemoveFromGoogleMerchant } from './use-remove-from-google-merchant';
export { useToggleGoogleMerchantVisibility } from './use-toggle-google-merchant-visibility';
export { usePollGoogleMerchantStatuses } from './use-poll-google-merchant-statuses';
