'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@verone/common/hooks';
import { invalidateMenuCounts } from '@verone/utils/query';
import { createClient } from '@verone/utils/supabase/client';

import type { SourcingLifecycleAction } from '../../utils/sourcing-stage';
import { readableRpcError } from './sourcing-rpc-error';
import type { SourcingProduct } from './types';

interface UseSourcingMutationsParams {
  products: SourcingProduct[];
  refetch: () => Promise<void>;
}

export function useSourcingMutations({
  products,
  refetch,
}: UseSourcingMutationsParams) {
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

  // Approuver échantillon - Transférer vers catalogue
  // Seul appelant : SampleValidationSimple (@verone/ui-business), écran retiré
  // avec le ménage P6 (BO-SOURCING-P6-001), qui supprimera aussi cette fonction.
  const approveSample = async (productId: string) => {
    try {
      // 1. Récupérer les infos du produit
      const product = products.find(p => p.id === productId);

      if (!product) {
        toast({
          title: 'Erreur',
          description: 'Produit introuvable',
          variant: 'destructive',
        });
        return false;
      }

      // Vérifications business rules
      if (!product.supplier_id) {
        toast({
          title: 'Erreur',
          description: 'Un fournisseur doit être lié avant validation',
          variant: 'destructive',
        });
        return false;
      }

      if (!product.cost_price || product.cost_price <= 0) {
        toast({
          title: 'Erreur',
          description: "Le prix d'achat doit être défini",
          variant: 'destructive',
        });
        return false;
      }

      // 2. Mettre à jour produit: statut actif + completion 100%
      // ✅ FIX: Ne PAS toucher stock_real - il sera mis à jour par les triggers
      // lors de la réception réelle de l'échantillon (purchase_order_receptions)
      const { error } = await supabase
        .from('products')
        .update({
          product_status: 'active', // ✅ Visible au catalogue
          // stock_status sera mis à jour automatiquement par trigger selon stock_real
          completion_status: 'complete', // Produit complet
          creation_mode: 'complete',
          completion_percentage: 100,
          // ❌ SUPPRIMÉ: stock_real: 1 - Géré par triggers réceptions
          stock_forecasted_in: 0,
        })
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      // 3. Notifier utilisateur
      toast({
        title: 'Échantillon approuvé',
        description: 'Le produit a été ajouté au catalogue avec statut actif',
      });

      // 4. Recharger liste sourcing
      await refetch();
      await invalidateMenuCounts(queryClient, 'sourcing');
      return true;
    } catch (err: unknown) {
      console.error('Erreur approbation échantillon:', err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "Impossible d'approuver l'échantillon";
      toast({
        title: 'Erreur',
        description: errMsg,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Rejeter échantillon - Auto-archivage non désarchivable
  // Seul appelant : SampleValidationSimple (@verone/ui-business), retiré en P6.
  const rejectSample = async (productId: string, reason?: string) => {
    try {
      // 1. Auto-archivage avec mention rejet
      const { error } = await supabase
        .from('products')
        .update({
          product_status: 'discontinued',
          archived_at: new Date().toISOString(),
          rejection_reason:
            reason ?? 'Échantillon refusé lors de la validation',
        })
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      // 2. Notifier utilisateur
      toast({
        title: 'Échantillon rejeté',
        description:
          'Le produit a été archivé automatiquement et ne peut pas être désarchivé',
      });

      // 3. Recharger liste sourcing
      await refetch();
      await invalidateMenuCounts(queryClient, 'sourcing');
      return true;
    } catch (err: unknown) {
      console.error('Erreur rejet échantillon:', err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "Impossible de rejeter l'échantillon";
      toast({
        title: 'Erreur',
        description: errMsg,
        variant: 'destructive',
      });
      return false;
    }
  };

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
    approveSample,
    rejectSample,
    archiveSourcingProduct,
    unarchiveSourcingProduct,
    deleteSourcingProduct,
  };
}
