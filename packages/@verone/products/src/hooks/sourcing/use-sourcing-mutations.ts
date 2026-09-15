'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@verone/common/hooks';
import { invalidateMenuCounts } from '@verone/utils/query';
import { createClient } from '@verone/utils/supabase/client';

import type { SourcingLifecycleAction } from '../../utils/sourcing-stage';
import { readableRpcError } from './sourcing-rpc-error';

interface UseSourcingMutationsParams {
  refetch: () => Promise<void>;
}

export function useSourcingMutations({ refetch }: UseSourcingMutationsParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Validation, retrait et restauration passent par la fonction unique du cycle
  // de vie (BO-SOURCING-P3-001 / P4-001) : transition vérifiée et journal écrit
  // dans la même transaction, aucune colonne de stock touchée.
  const runLifecycle = async (
    productId: string,
    action: Extract<
      SourcingLifecycleAction,
      'validate' | 'withdraw' | 'restore'
    >,
    success: { title: string; description: string },
    reason?: string
  ): Promise<boolean> => {
    const { error } = await supabase.rpc('apply_product_lifecycle_action', {
      p_product_id: productId,
      p_action: action,
      p_reason: reason,
    });

    if (error) {
      console.error('[useSourcingMutations] lifecycle failed:', action, error);
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

    toast(success);
    await refetch();
    await invalidateMenuCounts(queryClient, 'sourcing');
    return true;
  };

  // Valider un produit sourcing : il rejoint le catalogue en brouillon (non publié)
  const validateSourcing = (productId: string) =>
    runLifecycle(productId, 'validate', {
      title: 'Produit validé',
      description: 'Il rejoint le catalogue en brouillon, non publié',
    });

  // Retirer un produit sourcing : motif obligatoire, statut inchangé
  const archiveSourcingProduct = (productId: string, reason: string) =>
    runLifecycle(
      productId,
      'withdraw',
      {
        title: 'Produit retiré',
        description: 'Il reste consultable dans les produits retirés',
      },
      reason
    );

  // Restaurer un produit sourcing retiré (inverse exact du retrait)
  const unarchiveSourcingProduct = (productId: string) =>
    runLifecycle(productId, 'restore', {
      title: 'Produit restauré',
      description: 'Le produit sourcing est de nouveau dans la liste active',
    });

  // Supprimer définitivement un produit (seulement si archivé)
  const deleteSourcingProduct = async (productId: string) => {
    try {
      // Vérifier que le produit est archivé
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('archived_at')
        .eq('id', productId)
        .single();

      if (fetchError || !product) {
        toast({
          title: 'Erreur',
          description: 'Produit non trouvé',
          variant: 'destructive',
        });
        return false;
      }

      if (!product.archived_at) {
        toast({
          title: 'Action non autorisée',
          description: 'Seuls les produits archivés peuvent être supprimés',
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé définitivement',
      });

      await refetch();
      await invalidateMenuCounts(queryClient, 'sourcing');
      return true;
    } catch (_err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le produit',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    validateSourcing,
    archiveSourcingProduct,
    unarchiveSourcingProduct,
    deleteSourcingProduct,
  };
}
