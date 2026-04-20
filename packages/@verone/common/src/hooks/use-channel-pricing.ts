import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import { useToast } from './use-toast';

export interface ChannelPricingEntry {
  id: string | null;
  product_id: string;
  channel_id: string;
  channel_code: string;
  channel_name: string;
  custom_price_ht: number | null;
  public_price_ht: number | null;
  discount_rate: number | null;
  markup_rate: number | null;
  min_quantity: number;
  is_active: boolean;
  notes: string | null;
  updated_at: string | null;
}

const CHANNEL_CODES_SUPPORTED = [
  'site-internet',
  'linkme',
  'google-merchant',
  'meta-commerce',
] as const;

export const channelPricingQueryKey = (productId: string) =>
  ['channel-pricing', 'by-product', productId] as const;

export function useChannelPricing(productId: string | null | undefined) {
  const supabase = createClient();

  return useQuery({
    enabled: !!productId,
    queryKey: channelPricingQueryKey(productId ?? ''),
    queryFn: async (): Promise<ChannelPricingEntry[]> => {
      if (!productId) return [];

      const { data: channels, error: channelsError } = await supabase
        .from('sales_channels')
        .select('id, code, name, is_active')
        .in('code', [...CHANNEL_CODES_SUPPORTED])
        .order('name');

      if (channelsError) {
        throw new Error(`Canaux: ${channelsError.message}`);
      }

      const { data: pricing, error: pricingError } = await supabase
        .from('channel_pricing')
        .select(
          'id, product_id, channel_id, custom_price_ht, public_price_ht, discount_rate, markup_rate, min_quantity, is_active, notes, updated_at'
        )
        .eq('product_id', productId);

      if (pricingError) {
        throw new Error(`Tarifs canal: ${pricingError.message}`);
      }

      return (channels ?? []).map(channel => {
        const row = (pricing ?? []).find(p => p.channel_id === channel.id);
        return {
          id: row?.id ?? null,
          product_id: productId,
          channel_id: channel.id,
          channel_code: channel.code,
          channel_name: channel.name,
          custom_price_ht: row?.custom_price_ht ?? null,
          public_price_ht: row?.public_price_ht ?? null,
          discount_rate: row?.discount_rate ?? null,
          markup_rate: row?.markup_rate ?? null,
          min_quantity: row?.min_quantity ?? 1,
          is_active: row?.is_active ?? false,
          notes: row?.notes ?? null,
          updated_at: row?.updated_at ?? null,
        };
      });
    },
  });
}

export interface UpdateChannelPriceInput {
  product_id: string;
  channel_id: string;
  custom_price_ht?: number | null;
  discount_rate?: number | null;
  min_quantity?: number;
  notes?: string | null;
  is_active?: boolean;
  override_minimum?: boolean;
}

export interface UpdateChannelPriceResult {
  ok: boolean;
  channel_pricing_id?: string;
  minimum_selling_price?: number;
  error?: string;
}

export function useUpdateChannelPrice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<UpdateChannelPriceResult, Error, UpdateChannelPriceInput>({
    mutationFn: async input => {
      const response = await fetch('/api/channel-pricing/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const body = (await response.json()) as UpdateChannelPriceResult;

      if (!response.ok || !body.ok) {
        throw new Error(
          body.error ?? `Echec mise à jour prix canal (HTTP ${response.status})`
        );
      }

      return body;
    },
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: channelPricingQueryKey(variables.product_id),
      });
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-product-detail', variables.product_id],
      });
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-products'],
      });
      toast({
        title: 'Prix canal mis à jour',
        description: 'La tarification a été sauvegardée.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de sauvegarde',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
