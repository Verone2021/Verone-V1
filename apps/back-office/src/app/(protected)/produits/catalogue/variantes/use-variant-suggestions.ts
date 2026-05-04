'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { createClient } from '@verone/utils/supabase/client';

export interface VariantSuggestion {
  stem: string;
  supplier_id: string;
  supplier_name: string | null;
  product_count: number;
  product_ids: string[];
  product_names: string[];
  product_skus: string[];
  product_cloudflare_image_ids: (string | null)[];
  product_image_urls: (string | null)[];
  detected_axis:
    | 'color'
    | 'material'
    | 'dimensions'
    | 'style'
    | 'weight'
    | 'mixed';
  has_common_supplier: boolean;
  has_common_cost_price: boolean;
  common_cost_price: number | null;
  has_common_weight: boolean;
  common_weight: number | null;
  confidence: 'high' | 'medium' | 'low';
}

export function useVariantSuggestions() {
  const supabase = createClient();

  return useQuery<VariantSuggestion[]>({
    queryKey: ['variant-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('suggest_variant_groups');
      if (error) {
        console.error('[VariantSuggestions] RPC failed:', error);
        throw new Error(error.message);
      }
      return (data ?? []) as VariantSuggestion[];
    },
    staleTime: 30 * 1000,
  });
}

export interface ApplySuggestionInput {
  name: string;
  base_sku: string;
  subcategory_id: string;
  supplier_id: string;
  variant_type: VariantSuggestion['detected_axis'];
  product_ids: string[];
  has_common_cost_price: boolean;
  common_cost_price: number | null;
  has_common_weight: boolean;
  common_weight: number | null;
}

export function useApplyVariantSuggestion() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApplySuggestionInput) => {
      const { data: group, error: insertErr } = await supabase
        .from('variant_groups')
        .insert({
          name: input.name,
          base_sku: input.base_sku,
          subcategory_id: input.subcategory_id,
          supplier_id: input.supplier_id,
          has_common_supplier: true,
          variant_type:
            input.variant_type === 'mixed' ? null : input.variant_type,
          has_common_cost_price: input.has_common_cost_price,
          common_cost_price: input.has_common_cost_price
            ? input.common_cost_price
            : null,
          has_common_weight: input.has_common_weight,
          common_weight: input.has_common_weight ? input.common_weight : null,
        })
        .select('id')
        .single();

      if (insertErr || !group) {
        throw new Error(insertErr?.message ?? 'Création du groupe impossible');
      }

      const { error: updateErr } = await supabase
        .from('products')
        .update({ variant_group_id: group.id })
        .in('id', input.product_ids);

      if (updateErr) {
        throw new Error(
          `Groupe créé mais produits non rattachés : ${updateErr.message}`
        );
      }

      return group.id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['variant-suggestions'],
      });
      await queryClient.invalidateQueries({ queryKey: ['variant-groups'] });
      toast.success('Groupe variante créé avec succès');
    },
    onError: (err: Error) => {
      console.error('[VariantSuggestions] Apply failed:', err);
      toast.error(err.message);
    },
  });
}

export function getStemAsTitle(stem: string): string {
  return stem
    .split(' ')
    .map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function getAxisLabel(axis: VariantSuggestion['detected_axis']): string {
  switch (axis) {
    case 'color':
      return 'Couleur';
    case 'material':
      return 'Matière';
    case 'dimensions':
      return 'Dimensions';
    case 'style':
      return 'Style';
    case 'weight':
      return 'Poids';
    case 'mixed':
      return 'Mixte';
  }
}

export function getConfidenceLabel(c: VariantSuggestion['confidence']): {
  label: string;
  color: string;
} {
  switch (c) {
    case 'high':
      return { label: 'Confiance haute', color: 'bg-green-100 text-green-700' };
    case 'medium':
      return {
        label: 'Confiance moyenne',
        color: 'bg-amber-100 text-amber-700',
      };
    case 'low':
      return { label: 'À valider', color: 'bg-slate-100 text-slate-600' };
  }
}
