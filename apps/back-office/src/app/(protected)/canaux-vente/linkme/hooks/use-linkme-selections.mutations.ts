'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

import type {
  AddProductData,
  UpdateSelectionData,
  UpdateSelectionItemData,
} from './use-linkme-selections.types';

const supabase = createClient();

/**
 * Hook: Mettre à jour une sélection
 */
export function useUpdateSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      selectionId,
      data,
    }: {
      selectionId: string;
      data: UpdateSelectionData;
    }) => {
      let slug: string | undefined;
      if (data.name) {
        const baseSlug = data.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        slug = baseSlug;
        let suffix = 2;
        while (true) {
          const { data: existing } = await supabase
            .from('linkme_selections')
            .select('id')
            .eq('slug', slug)
            .neq('id', selectionId)
            .maybeSingle();
          if (!existing) break;
          slug = `${baseSlug}-${suffix}`;
          suffix++;
        }
      }

      const { error } = await supabase
        .from('linkme_selections')
        .update({
          ...data,
          ...(slug ? { slug } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectionId);

      if (error) throw error;
    },
    onSuccess: async (_, { selectionId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['linkme-selection', selectionId],
        }),
        queryClient.invalidateQueries({ queryKey: ['linkme-selections'] }),
      ]);
      toast({
        title: 'Sélection mise à jour',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: error => {
      console.error('Error updating selection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la sélection.',
        variant: 'destructive',
      });
    },
  });
}

// API response types
interface AddItemApiResponse {
  item?: { id: string };
  message?: string;
}

/**
 * Hook: Ajouter un produit à la sélection
 */
export function useAddProductToSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      selectionId,
      productData,
    }: {
      selectionId: string;
      productData: AddProductData;
    }) => {
      const response = await fetch('/api/linkme/selections/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection_id: selectionId,
          product_id: productData.product_id,
          base_price_ht: productData.base_price_ht,
          margin_rate: productData.margin_rate,
        }),
      });

      const data = (await response.json()) as AddItemApiResponse;

      if (!response.ok) {
        throw new Error(data.message ?? 'Erreur ajout produit');
      }

      return data.item?.id;
    },
    onSuccess: async (_, { selectionId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['linkme-selection', selectionId],
        }),
        queryClient.invalidateQueries({ queryKey: ['linkme-selections'] }),
      ]);
      toast({
        title: 'Produit ajouté',
        description: 'Le produit a été ajouté à la sélection.',
      });
    },
    onError: (error: Error) => {
      console.error('Error adding product:', error);
      toast({
        title: 'Erreur',
        description: error.message ?? "Impossible d'ajouter le produit.",
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Retirer un produit de la sélection (Hard Delete)
 */
export function useRemoveProductFromSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      selectionId,
      itemId,
    }: {
      selectionId: string;
      itemId: string;
    }) => {
      const { error } = await supabase
        .from('linkme_selection_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await supabase.rpc('decrement_selection_products_count', {
        p_selection_id: selectionId,
      });
    },
    onSuccess: async (_, { selectionId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['linkme-selection', selectionId],
        }),
        queryClient.invalidateQueries({ queryKey: ['linkme-selections'] }),
      ]);
      toast({
        title: 'Produit retiré',
        description: 'Le produit a été retiré de la sélection.',
      });
    },
    onError: (error: unknown) => {
      console.error('Error removing product:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: JSON.stringify(error, null, 2),
      });
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Impossible de retirer le produit.';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Mettre à jour le taux de marque d'un produit
 */
export function useUpdateProductMargin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
      marginRate,
    }: {
      itemId: string;
      marginRate: number;
      selectionId: string;
    }) => {
      const { error } = await supabase
        .from('linkme_selection_items')
        .update({
          margin_rate: marginRate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: async (_, { selectionId }) => {
      await queryClient.invalidateQueries({
        queryKey: ['linkme-selection', selectionId],
      });
      toast({
        title: 'Marge mise à jour',
        description: 'Le taux de marque a été enregistré.',
      });
    },
    onError: (error: unknown) => {
      console.error('Error updating margin:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: JSON.stringify(error, null, 2),
      });
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Impossible de mettre à jour la marge.';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Mettre à jour un item de sélection
 */
export function useUpdateSelectionItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
      selectionId: _selectionId,
      data,
    }: {
      itemId: string;
      selectionId: string;
      data: UpdateSelectionItemData;
    }) => {
      const { error } = await supabase
        .from('linkme_selection_items')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: async (_, { selectionId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['linkme-selection', selectionId],
        }),
        queryClient.invalidateQueries({ queryKey: ['linkme-selections'] }),
      ]);
      toast({
        title: 'Produit mis à jour',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: error => {
      console.error('Error updating selection item:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le produit.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Supprimer une sélection
 */
export function useDeleteSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (selectionId: string) => {
      const { error } = await supabase
        .from('linkme_selections')
        .delete()
        .eq('id', selectionId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-selections'] });
      toast({
        title: 'Sélection supprimée',
        description: 'La sélection a été supprimée définitivement.',
      });
    },
    onError: error => {
      console.error('Error deleting selection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la sélection.',
        variant: 'destructive',
      });
    },
  });
}

// API response type for toggle visibility
interface ToggleVisibilityApiResponse {
  success?: boolean;
  message?: string;
  item_id?: string;
  is_hidden_by_staff?: boolean;
}

/**
 * Hook: Masquer/afficher un produit dans une sélection publique
 */
export function useToggleSelectionItemVisibility() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
      isHidden,
    }: {
      itemId: string;
      isHidden: boolean;
      selectionId: string;
    }) => {
      const response = await fetch(
        '/api/linkme/selections/toggle-item-visibility',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: itemId,
            is_hidden: isHidden,
          }),
        }
      );

      const data = (await response.json()) as ToggleVisibilityApiResponse;

      if (!response.ok) {
        throw new Error(data.message ?? 'Erreur toggle visibilité');
      }

      return data;
    },
    onSuccess: async (data, { selectionId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['linkme-selection', selectionId],
        }),
        queryClient.invalidateQueries({ queryKey: ['linkme-selections'] }),
      ]);
      toast({
        title: data.is_hidden_by_staff ? 'Produit masqué' : 'Produit visible',
        description: data.is_hidden_by_staff
          ? 'Le produit est masqué de la sélection publique.'
          : 'Le produit est à nouveau visible publiquement.',
      });
    },
    onError: (error: Error) => {
      console.error('Error toggling visibility:', error);
      toast({
        title: 'Erreur',
        description: error.message ?? 'Impossible de modifier la visibilité.',
        variant: 'destructive',
      });
    },
  });
}
