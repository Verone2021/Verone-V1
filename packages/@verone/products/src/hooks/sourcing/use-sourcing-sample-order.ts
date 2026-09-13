'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@verone/common/hooks';
import { invalidateMenuCounts } from '@verone/utils/query';
import { createClient } from '@verone/utils/supabase/client';

import { readableRpcError } from './sourcing-rpc-error';
import { SAMPLE_STATE_QUERY_KEY } from './use-sample-state';

interface UseSourcingSampleOrderParams {
  refetch: () => Promise<void>;
}

interface SampleOrderPayload {
  po_number: string;
  order_created: boolean;
}

function isSampleOrderPayload(value: unknown): value is SampleOrderPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'po_number' in value &&
    typeof value.po_number === 'string' &&
    'order_created' in value &&
    typeof value.order_created === 'boolean'
  );
}

/**
 * Commande d'échantillon via request_sample_order (BO-SOURCING-P3-001, D6) :
 * la base refuse un deuxième échantillon tant qu'une commande échantillon non
 * annulée contient le produit (VS001), réutilise la commande brouillon du
 * fournisseur et laisse le déclencheur existant recalculer les totaux.
 * Le statut sourcing n'est plus modifié : l'état échantillon se lit dans la
 * commande (useSampleState).
 */
export function useSourcingSampleOrder({
  refetch,
}: UseSourcingSampleOrderParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const orderSample = async (productId: string): Promise<boolean> => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('request_sample_order', {
      p_product_id: productId,
    });

    // Créée ou déjà existante : l'état échantillon affiché doit suivre
    await queryClient.invalidateQueries({
      queryKey: [SAMPLE_STATE_QUERY_KEY, productId],
    });

    if (error) {
      console.error('[useSourcingSampleOrder] request failed:', error);
      toast({
        title:
          error.code === 'VS001'
            ? 'Échantillon déjà commandé'
            : 'Commande impossible',
        description: readableRpcError(
          error,
          "La commande d'échantillon n'a pas pu être créée. Réessayez."
        ),
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Échantillon commandé',
      description: isSampleOrderPayload(data)
        ? data.order_created
          ? `Nouvelle commande fournisseur ${data.po_number} créée`
          : `Ajouté à la commande fournisseur ${data.po_number}`
        : undefined,
    });

    await refetch();
    await invalidateMenuCounts(queryClient, 'sourcing');
    return true;
  };

  return { orderSample };
}
