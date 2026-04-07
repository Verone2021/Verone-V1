/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@verone/common/hooks';
import { logger } from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

import type {
  CreatePriceListItemData,
  PriceListItem,
  UpdatePriceListItemData,
} from './use-price-lists.types';

export function useCreatePriceListItem() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      data: CreatePriceListItemData
    ): Promise<PriceListItem> => {
      try {
        const { data: item, error } = await (
          supabase as { from: CallableFunction }
        )
          .from('price_list_items')
          .insert({
            price_list_id: data.price_list_id,
            product_id: data.product_id,
            cost_price: data.cost_price,
            discount_rate: data.discount_rate ?? null,
            min_quantity: data.min_quantity ?? 1,
            max_quantity: data.max_quantity ?? null,
            margin_rate: data.margin_rate ?? null,
            currency: data.currency ?? 'EUR',
            valid_from: data.valid_from ?? null,
            valid_until: data.valid_until ?? null,
            is_active: data.is_active ?? true,
            notes: data.notes ?? null,
          })
          .select('id')
          .single();

        if (error) {
          logger.error('Failed to create price list item', undefined, {
            operation: 'createPriceListItem',
            error: error.message,
            data,
          });
          throw error;
        }

        if (!item) {
          throw new Error('Price list item creation returned null');
        }

        logger.info('Price list item created successfully', {
          operation: 'createPriceListItem',
          itemId: item.id,
        });

        return item as unknown as PriceListItem;
      } catch (error) {
        logger.error('Exception in createPriceListItem', undefined, {
          operation: 'createPriceListItem',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['price-list-items', variables.price_list_id],
      });
      await queryClient.invalidateQueries({ queryKey: ['pricing-v2'] });
      toast({
        title: 'Succès',
        description: 'Item de prix ajouté avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'ajouter l'item de prix",
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePriceListItem() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      priceListId: string; // Garde pour compatibilité interface mais non utilisé
      data: UpdatePriceListItemData;
    }): Promise<PriceListItem> => {
      try {
        const { data: item, error } = await (
          supabase as { from: CallableFunction }
        )
          .from('price_list_items')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId)
          .select('id')
          .single();

        if (error) {
          logger.error('Failed to update price list item', undefined, {
            operation: 'updatePriceListItem',
            itemId,
            error: error.message,
          });
          throw error;
        }

        logger.info('Price list item updated successfully', {
          operation: 'updatePriceListItem',
          itemId,
        });

        return item as unknown as PriceListItem;
      } catch (error) {
        logger.error('Exception in updatePriceListItem', undefined, {
          operation: 'updatePriceListItem',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['price-list-items', variables.priceListId],
      });
      await queryClient.invalidateQueries({ queryKey: ['pricing-v2'] });
      toast({
        title: 'Succès',
        description: 'Item de prix mis à jour avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour l'item de prix",
        variant: 'destructive',
      });
    },
  });
}

export function useDeletePriceListItem() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
    }: {
      itemId: string;
      priceListId: string; // Garde pour compatibilité interface mais non utilisé
    }): Promise<void> => {
      try {
        const { error } = await (supabase as { from: CallableFunction })
          .from('price_list_items')
          .delete()
          .eq('id', itemId);

        if (error) {
          logger.error('Failed to delete price list item', undefined, {
            operation: 'deletePriceListItem',
            itemId,
            error: error.message,
          });
          throw error;
        }

        logger.info('Price list item deleted successfully', {
          operation: 'deletePriceListItem',
          itemId,
        });
      } catch (error) {
        logger.error('Exception in deletePriceListItem', undefined, {
          operation: 'deletePriceListItem',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['price-list-items', variables.priceListId],
      });
      await queryClient.invalidateQueries({ queryKey: ['pricing-v2'] });
      toast({
        title: 'Succès',
        description: 'Item de prix supprimé avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer l'item de prix",
        variant: 'destructive',
      });
    },
  });
}
