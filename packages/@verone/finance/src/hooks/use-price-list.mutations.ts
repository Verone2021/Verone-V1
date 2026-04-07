/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@verone/common/hooks';
import { logger } from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

import type {
  CreatePriceListData,
  PriceList,
  UpdatePriceListData,
} from './use-price-lists.types';

export function useCreatePriceList() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePriceListData): Promise<PriceList> => {
      try {
        const { data: user } = await supabase.auth.getUser();

        const { data: priceList, error } = await (
          supabase as { from: CallableFunction }
        )
          .from('price_lists')
          .insert({
            code: data.code,
            name: data.name,
            description: data.description ?? null,
            list_type: data.list_type,
            priority: data.priority ?? 100,
            currency: data.currency ?? 'EUR',
            valid_from: data.valid_from ?? null,
            valid_until: data.valid_until ?? null,
            is_active: data.is_active ?? true,
            created_by: user.user?.id ?? null,
          })
          .select('id')
          .single();

        if (error) {
          logger.error('Failed to create price list', undefined, {
            operation: 'createPriceList',
            error: error.message,
            data,
          });
          throw error;
        }

        if (!priceList) {
          throw new Error('Price list creation returned null');
        }

        logger.info('Price list created successfully', {
          operation: 'createPriceList',
          priceListId: priceList.id,
        });

        return priceList as unknown as PriceList;
      } catch (error) {
        logger.error('Exception in createPriceList', undefined, {
          operation: 'createPriceList',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      toast({
        title: 'Succès',
        description: 'Liste de prix créée avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de créer la liste de prix',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePriceList() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      priceListId,
      data,
    }: {
      priceListId: string;
      data: UpdatePriceListData;
    }): Promise<PriceList> => {
      try {
        const { data: user } = await supabase.auth.getUser();

        const { data: priceList, error } = await (
          supabase as { from: CallableFunction }
        )
          .from('price_lists')
          .update({
            ...data,
            updated_by: user.user?.id ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', priceListId)
          .select('id')
          .single();

        if (error) {
          logger.error('Failed to update price list', undefined, {
            operation: 'updatePriceList',
            priceListId,
            error: error.message,
          });
          throw error;
        }

        logger.info('Price list updated successfully', {
          operation: 'updatePriceList',
          priceListId,
        });

        return priceList as unknown as PriceList;
      } catch (error) {
        logger.error('Exception in updatePriceList', undefined, {
          operation: 'updatePriceList',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      await queryClient.invalidateQueries({
        queryKey: ['price-list', variables.priceListId],
      });
      toast({
        title: 'Succès',
        description: 'Liste de prix mise à jour avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de mettre à jour la liste de prix',
        variant: 'destructive',
      });
    },
  });
}

export function useDeletePriceList() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (priceListId: string): Promise<void> => {
      try {
        const { error } = await (supabase as { from: CallableFunction })
          .from('price_lists')
          .delete()
          .eq('id', priceListId);

        if (error) {
          logger.error('Failed to delete price list', undefined, {
            operation: 'deletePriceList',
            priceListId,
            error: error.message,
          });
          throw error;
        }

        logger.info('Price list deleted successfully', {
          operation: 'deletePriceList',
          priceListId,
        });
      } catch (error) {
        logger.error('Exception in deletePriceList', undefined, {
          operation: 'deletePriceList',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      toast({
        title: 'Succès',
        description: 'Liste de prix supprimée avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de supprimer la liste de prix',
        variant: 'destructive',
      });
    },
  });
}
