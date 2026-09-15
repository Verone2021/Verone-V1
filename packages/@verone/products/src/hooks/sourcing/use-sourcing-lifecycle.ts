'use client';

import { useCallback, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@verone/common/hooks';
import { invalidateMenuCounts } from '@verone/utils/query';
import { createClient } from '@verone/utils/supabase/client';

import type {
  SourcingLifecycleAction,
  SourcingStage,
} from '../../utils/sourcing-stage';
import { readableRpcError } from './sourcing-rpc-error';

const SUCCESS_TITLES: Record<SourcingLifecycleAction, string> = {
  set_stage: 'Étape mise à jour',
  pause: 'Produit mis en pause',
  resume: 'Sourcing repris',
  refuse: 'Produit refusé',
  reopen: 'Sourcing réouvert',
  validate: 'Produit validé : il rejoint le catalogue en brouillon',
  withdraw: 'Produit retiré',
  restore: 'Produit restauré',
};

export interface SourcingLifecycleInput {
  action: SourcingLifecycleAction;
  toStage?: SourcingStage;
  reason?: string;
}

/**
 * Seule porte d'entrée de l'écran vers le cycle de vie sourcing
 * (apply_product_lifecycle_action) : la base vérifie la transition, écrit le
 * statut et l'entrée du journal dans la même transaction.
 */
export function useSourcingLifecycle(
  productId: string,
  onChanged?: () => Promise<unknown>
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] =
    useState<SourcingLifecycleAction | null>(null);

  const applyAction = useCallback(
    async ({
      action,
      toStage,
      reason,
    }: SourcingLifecycleInput): Promise<boolean> => {
      setPendingAction(action);
      try {
        const supabase = createClient();
        const { error } = await supabase.rpc('apply_product_lifecycle_action', {
          p_product_id: productId,
          p_action: action,
          p_to_stage: toStage,
          p_reason: reason,
        });

        if (error) {
          console.error('[useSourcingLifecycle] action failed:', action, error);
          toast({
            title: 'Action impossible',
            description: readableRpcError(
              error,
              "L'action n'a pas pu être enregistrée. Réessayez."
            ),
            variant: 'destructive',
          });
          return false;
        }

        toast({ title: SUCCESS_TITLES[action] });
        await invalidateMenuCounts(queryClient, 'sourcing');
        if (onChanged) await onChanged();
        return true;
      } finally {
        setPendingAction(null);
      }
    },
    [productId, onChanged, queryClient, toast]
  );

  return { applyAction, pendingAction };
}
