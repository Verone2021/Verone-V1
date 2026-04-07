/**
 * Hooks toggle avec optimistic update pour le catalogue LinkMe
 * 4 toggles: enabled, showcase, featured, show_supplier
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LinkMeCatalogProduct } from './types';
import { getSupabaseClient } from './constants';

/**
 * Hook: toggle activation produit (is_active dans channel_pricing)
 */
export function useToggleProductEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      isEnabled,
    }: {
      catalogProductId: string;
      isEnabled: boolean;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
        .update({ is_active: isEnabled }) // Map is_enabled → is_active
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onMutate: async ({ catalogProductId, isEnabled }) => {
      await queryClient.cancelQueries({
        queryKey: ['linkme-catalog-products'],
      });

      const previousData = queryClient.getQueryData<LinkMeCatalogProduct[]>([
        'linkme-catalog-products',
      ]);

      if (previousData) {
        queryClient.setQueryData<LinkMeCatalogProduct[]>(
          ['linkme-catalog-products'],
          old =>
            old?.map(product =>
              product.id === catalogProductId
                ? { ...product, is_enabled: isEnabled }
                : product
            ) ?? []
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['linkme-catalog-products'],
          context.previousData
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['linkme-catalog-products'],
      });
    },
  });
}

/**
 * Hook: toggle visibilité vitrine (is_public_showcase)
 */
export function useToggleProductShowcase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      isPublicShowcase,
    }: {
      catalogProductId: string;
      isPublicShowcase: boolean;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
        .update({ is_public_showcase: isPublicShowcase })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onMutate: async ({ catalogProductId, isPublicShowcase }) => {
      await queryClient.cancelQueries({
        queryKey: ['linkme-catalog-products'],
      });

      const previousData = queryClient.getQueryData<LinkMeCatalogProduct[]>([
        'linkme-catalog-products',
      ]);

      if (previousData) {
        queryClient.setQueryData<LinkMeCatalogProduct[]>(
          ['linkme-catalog-products'],
          old =>
            old?.map(product =>
              product.id === catalogProductId
                ? { ...product, is_public_showcase: isPublicShowcase }
                : product
            ) ?? []
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['linkme-catalog-products'],
          context.previousData
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['linkme-catalog-products'],
      });
    },
  });
}

/**
 * Hook: toggle produit vedette (is_featured)
 */
export function useToggleProductFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      isFeatured,
    }: {
      catalogProductId: string;
      isFeatured: boolean;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
        .update({ is_featured: isFeatured })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onMutate: async ({ catalogProductId, isFeatured }) => {
      await queryClient.cancelQueries({
        queryKey: ['linkme-catalog-products'],
      });

      const previousData = queryClient.getQueryData<LinkMeCatalogProduct[]>([
        'linkme-catalog-products',
      ]);

      if (previousData) {
        queryClient.setQueryData<LinkMeCatalogProduct[]>(
          ['linkme-catalog-products'],
          old =>
            old?.map(product =>
              product.id === catalogProductId
                ? { ...product, is_featured: isFeatured }
                : product
            ) ?? []
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['linkme-catalog-products'],
          context.previousData
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['linkme-catalog-products'],
      });
    },
  });
}

/**
 * Hook: toggle affichage fournisseur (show_supplier)
 * Contrôle si le fournisseur de ce produit apparaît dans "Nos partenaires"
 */
export function useToggleShowSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      showSupplier,
    }: {
      catalogProductId: string;
      showSupplier: boolean;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
        .update({ show_supplier: showSupplier })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onMutate: async ({ catalogProductId, showSupplier }) => {
      await queryClient.cancelQueries({
        queryKey: ['linkme-catalog-products'],
      });

      const previousData = queryClient.getQueryData<LinkMeCatalogProduct[]>([
        'linkme-catalog-products',
      ]);

      if (previousData) {
        queryClient.setQueryData<LinkMeCatalogProduct[]>(
          ['linkme-catalog-products'],
          old =>
            old?.map(product =>
              product.id === catalogProductId
                ? { ...product, show_supplier: showSupplier }
                : product
            ) ?? []
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['linkme-catalog-products'],
          context.previousData
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['linkme-catalog-products'],
      });
    },
  });
}
