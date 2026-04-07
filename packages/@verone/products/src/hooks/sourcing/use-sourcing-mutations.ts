'use client';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

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
  const supabase = createClient();

  // Valider un produit sourcing (passage au catalogue)
  const validateSourcing = async (productId: string) => {
    try {
      // 🔥 FIX: Vérifications business rules complètes
      const product = products.find(p => p.id === productId);

      if (!product) {
        toast({
          title: 'Erreur',
          description: 'Produit introuvable',
          variant: 'destructive',
        });
        return false;
      }

      // Vérification prix OBLIGATOIRE
      if (!product.cost_price || product.cost_price <= 0) {
        toast({
          title: 'Erreur',
          description:
            "Le prix d'achat doit être défini et > 0€ avant validation",
          variant: 'destructive',
        });
        return false;
      }

      // Vérification fournisseur OBLIGATOIRE
      if (!product.supplier_id) {
        toast({
          title: 'Erreur',
          description: 'Un fournisseur doit être lié avant la validation',
          variant: 'destructive',
        });
        return false;
      }

      // Produit validé = ACTIF (visible immédiatement au catalogue)
      // completion_status est recalculé automatiquement par le trigger DB
      const { error } = await supabase
        .from('products')
        .update({
          product_status: 'active',
          stock_status: 'out_of_stock',
          creation_mode: 'complete',
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

      toast({
        title: 'Produit publié',
        description: 'Le produit est maintenant visible au catalogue',
      });

      await refetch();
      return true;
    } catch (_err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de valider le produit',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Approuver échantillon - Transférer vers catalogue
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

  // Archiver un produit sourcing (Annuler)
  const archiveSourcingProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ archived_at: new Date().toISOString() })
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
        title: 'Produit archivé',
        description: 'Le produit sourcing a été annulé et archivé',
      });

      await refetch();
      return true;
    } catch (_err) {
      toast({
        title: 'Erreur',
        description: "Impossible d'archiver le produit",
        variant: 'destructive',
      });
      return false;
    }
  };

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
    deleteSourcingProduct,
  };
}
