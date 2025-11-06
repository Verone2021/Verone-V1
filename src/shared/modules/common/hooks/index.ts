// ===== EXISTING LOCAL HOOKS =====
export { useBaseHook } from './use-base-hook';
export { useImageUpload, type UseImageUploadProps } from './use-image-upload';
export { useInlineEdit, type EditableSection } from './use-inline-edit';
export { useLogoUpload } from './use-logo-upload';
export { useSectionLocking } from './use-section-locking';
export { useSimpleImageUpload } from './use-simple-image-upload';
export { useSmartSuggestions } from './use-smart-suggestions';
export { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
export { useToast } from './use-toast';
export { useToggleFavorite } from './use-toggle-favorite';

// ===== RE-EXPORTS FROM SPECIALIZED MODULES =====

// Categories hooks
export {
  useFamilies,
  useCategories,
  useSubcategories
} from '@/shared/modules/categories/hooks';

// Consultations hooks
export {
  useConsultations,
  useConsultationImages,
  useConsultationItems
} from '@/shared/modules/consultations/hooks';

// Products hooks & constants
export {
  useProducts,
  useProductImages,
  PRODUCT_STATUS_OPTIONS
} from '@/shared/modules/products/hooks';

// Organisations hooks & types
export {
  useOrganisations,
  type Contact
} from '@/shared/modules/organisations/hooks';

// Finance hooks & constants
export {
  ABC_CLASSES,
  AGING_BUCKETS
} from '@/shared/modules/finance/hooks';
