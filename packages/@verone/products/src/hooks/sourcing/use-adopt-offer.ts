'use client';

import { useCallback, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import { readableRpcError } from './sourcing-rpc-error';
import { SAMPLE_CANDIDATES_QUERY_KEY } from './use-sample-draft-order';

/**
 * Retenir une offre fournisseur — [BO-SOURCING-OFFRES-004]
 *
 * `adopt_sourcing_offer` écrit le fournisseur, le prix d'achat et la quantité
 * minimale du produit, passe l'offre en « retenue », enregistre le prix et
 * journalise, le tout dans une seule transaction. Sans elle, il fallait
 * recopier ces valeurs à la main dans trois écrans différents.
 *
 * Effet de bord voulu : le produit gagne fournisseur + prix d'achat, donc la
 * porte « Commander l'échantillon » s'ouvre immédiatement.
 */
export function useAdoptOffer(
  productId: string,
  onChanged?: () => Promise<unknown>
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adoptingId, setAdoptingId] = useState<string | null>(null);

  const adoptOffer = useCallback(
    async (candidateId: string): Promise<boolean> => {
      setAdoptingId(candidateId);
      try {
        const supabase = createClient();
        const { error } = await supabase.rpc('adopt_sourcing_offer', {
          p_product_id: productId,
          p_candidate_id: candidateId,
        });

        if (error) {
          console.error('[useAdoptOffer] adoption failed:', error);
          toast({
            title: 'Offre non retenue',
            description: readableRpcError(
              error,
              "L'offre n'a pas pu être retenue. Réessayez."
            ),
            variant: 'destructive',
          });
          return false;
        }

        toast({
          title: 'Offre retenue',
          description:
            'Le fournisseur et le prix d’achat du produit ont été mis à jour.',
        });
        // La liste des produits commandables en échantillon dépend du prix
        // d'achat : elle vient de changer.
        await queryClient.invalidateQueries({
          queryKey: [SAMPLE_CANDIDATES_QUERY_KEY],
        });
        if (onChanged) await onChanged();
        return true;
      } finally {
        setAdoptingId(null);
      }
    },
    [productId, onChanged, queryClient, toast]
  );

  return { adoptOffer, adoptingId };
}
