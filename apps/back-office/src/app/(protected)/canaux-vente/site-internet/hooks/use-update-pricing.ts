/**
 * Hook: useUpdatePricing (CORRIGÉ)
 * Mutation pour mettre à jour le pricing canal d'un produit
 * Gestion correcte contrainte pricing_mode_exclusive
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

interface UpdatePricingParams {
  product_id: string;
  channel_id: string;
  // Mode A: Prix fixe custom
  custom_price_ht?: number | null;
  // Mode B: Taux réduction (mutuellement exclusif avec Mode A)
  discount_rate?: number | null;
  // Champs optionnels
  min_quantity?: number | null;
  notes?: string | null;
  is_active?: boolean;
}

const supabase = createClient();

export function useUpdatePricing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: UpdatePricingParams) => {
      // ✅ LOGIQUE CORRECTE: Exactement UN mode actif (ou aucun)
      // Si discount_rate > 0 → Mode réduction (custom_price = null)
      // Sinon → Mode prix fixe (discount_rate = null)
      const hasDiscount =
        params.discount_rate != null && params.discount_rate > 0;

      const upsertData = {
        product_id: params.product_id,
        channel_id: params.channel_id,
        // Mode exclusif: custom_price OU discount_rate (jamais les deux)
        custom_price_ht: hasDiscount ? null : params.custom_price_ht,
        discount_rate: hasDiscount ? params.discount_rate : null,
        markup_rate: null, // Toujours null (mode non utilisé pour Site Internet)
        min_quantity: params.min_quantity ?? 1,
        notes: params.notes ?? null,
        is_active: params.is_active ?? true,
      };

      const { data, error } = await supabase
        .from('channel_pricing')
        .upsert(upsertData, {
          onConflict: 'product_id,channel_id,min_quantity',
        })
        .select();

      if (error) {
        console.error('❌ Erreur upsert channel_pricing:', error);
        throw error;
      }

      return data;
    },
    onSuccess: async (_, variables) => {
      toast({
        title: 'Prix mis à jour',
        description: 'La tarification du produit a été sauvegardée',
      });

      // Invalider cache
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-product-detail', variables.product_id],
      });
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-products'],
      });
    },
    onError: (error: Error) => {
      console.error('❌ Mutation ERROR pricing:', error);
      toast({
        title: 'Erreur lors de la sauvegarde',
        description: error.message || 'Impossible de sauvegarder le pricing',
        variant: 'destructive',
      });
    },
  });
}
