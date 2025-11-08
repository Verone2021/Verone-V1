// ===== LOCAL HOOKS ONLY =====
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

// Note: Specialized hooks are now imported directly from their packages
// Example: import { useProducts } from '@verone/products/hooks';
