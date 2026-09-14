'use client';

/**
 * Hook de lecture et d'enregistrement de l'évaluation produit (BO-SOURCING-P4B-001).
 *
 * Lecture : la plus récente évaluation du produit (au plus une, en pratique).
 * Écriture : insert si absente, update sinon. Après enregistrement, une entrée
 * « note » est ajoutée au journal sourcing via le callback `addJournalEntry`
 * passé par le parent — aucun second chemin d'écriture.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import {
  evaluationJournalSummary,
  type SafetyCheck,
} from '../../utils/product-evaluation';
import type { NewSourcingJournalEntry } from './use-sourcing-notebook';

export const PRODUCT_EVALUATION_QUERY_KEY = 'product-evaluation';

export interface ProductEvaluationRow {
  id: string;
  product_id: string;
  purchase_order_item_id: string | null;
  supplier_id: string | null;
  score_conformity: number | null;
  score_build_finish: number | null;
  score_packaging: number | null;
  safety_check: string;
  notes: string | null;
  evaluated_at: string;
  evaluated_by: string | null;
}

export interface SaveEvaluationInput {
  score_conformity: number | null;
  score_build_finish: number | null;
  score_packaging: number | null;
  safety_check: SafetyCheck;
  notes: string | null;
  supplierId?: string | null;
  purchaseOrderItemId?: string | null;
}

/**
 * Lit et enregistre l'évaluation de l'échantillon d'un produit sourcing.
 *
 * @param productId  - ID du produit
 * @param addJournalEntry - Callback notebook.addCommunication pour le journal
 */
export function useProductEvaluation(
  productId: string | null,
  addJournalEntry?: (entry: NewSourcingJournalEntry) => Promise<void>
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [PRODUCT_EVALUATION_QUERY_KEY, productId],
    enabled: Boolean(productId),
    staleTime: 30_000,
    queryFn: async (): Promise<ProductEvaluationRow | null> => {
      if (!productId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('product_evaluations')
        .select(
          'id, product_id, purchase_order_item_id, supplier_id, score_conformity, score_build_finish, score_packaging, safety_check, notes, evaluated_at, evaluated_by'
        )
        .eq('product_id', productId)
        .order('evaluated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (input: SaveEvaluationInput): Promise<void> => {
      if (!productId) throw new Error('productId is required');
      const supabase = createClient();
      const payload = {
        product_id: productId,
        score_conformity: input.score_conformity,
        score_build_finish: input.score_build_finish,
        score_packaging: input.score_packaging,
        safety_check: input.safety_check as string,
        notes: input.notes,
        supplier_id: input.supplierId ?? null,
        purchase_order_item_id: input.purchaseOrderItemId ?? null,
        evaluated_at: new Date().toISOString(),
      };

      const existing = query.data;
      if (existing) {
        const { error } = await supabase
          .from('product_evaluations')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_evaluations')
          .insert(payload);
        if (error) throw error;
      }
    },

    onSuccess: async (_result, input) => {
      await queryClient.invalidateQueries({
        queryKey: [PRODUCT_EVALUATION_QUERY_KEY, productId],
      });

      if (addJournalEntry) {
        const summary = evaluationJournalSummary({
          score_conformity: input.score_conformity,
          score_build_finish: input.score_build_finish,
          score_packaging: input.score_packaging,
          safety_check: input.safety_check,
        });
        await addJournalEntry({ entry_type: 'note', summary });
      }
    },

    onError: (error: unknown) => {
      const description =
        error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Impossible d'enregistrer l'évaluation",
        description,
        variant: 'destructive',
      });
    },
  });

  return {
    evaluation: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    saveEvaluation: mutation.mutateAsync,
    saving: mutation.isPending,
  };
}
