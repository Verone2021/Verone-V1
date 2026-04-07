'use client';

import { useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export function useAffiliateReceptions() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger les réceptions affiliés en attente (reference_type='affiliate_product')
   * Ces réceptions sont créées lors de l'approbation d'un produit affilié
   */
  const loadAffiliateProductReceptions = useCallback(
    async (filters?: { status?: string; search?: string }) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('purchase_order_receptions')
          .select(
            `
            id,
            reference_type,
            product_id,
            quantity_expected,
            quantity_received,
            status,
            notes,
            received_at,
            received_by,
            created_at,
            affiliate_id,
            products!left (
              id,
              name,
              sku,
              stock_real,
              product_images!left (
                public_url,
                is_primary
              )
            ),
            linkme_affiliates!left (
              id,
              display_name,
              enseigne_id,
              enseignes!left (
                id,
                name
              )
            )
          `
          )
          .eq('reference_type', 'affiliate_product')
          .order('created_at', { ascending: false });

        // Filtre par statut
        if (filters?.status === 'completed') {
          // Historique: réceptions complétées ou annulées
          query = query.in('status', ['completed', 'cancelled']);
        } else if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        } else {
          // Par défaut: réceptions en attente ou partielles
          query = query.in('status', ['pending', 'partial']);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          console.error('Erreur chargement réceptions affiliés:', fetchError);
          setError(fetchError.message);
          return [];
        }

        // Mapper les données pour un format cohérent
        type ReceptionRow = NonNullable<typeof data>[number];
        type ImageRow = { public_url: string; is_primary: boolean };
        const mappedData = (data ?? []).map((reception: ReceptionRow) => {
          const affiliateData = reception.linkme_affiliates as {
            display_name?: string;
            enseignes?: { name?: string } | null;
          } | null;
          const productData = reception.products as {
            name?: string;
            sku?: string;
            product_images?: ImageRow[];
          } | null;
          return {
            ...reception,
            affiliate_name: affiliateData?.display_name ?? 'Affilié inconnu',
            enseigne_name:
              affiliateData?.enseignes?.name ?? 'Enseigne inconnue',
            product_name: productData?.name ?? 'Produit inconnu',
            product_sku: productData?.sku ?? 'N/A',
            product_image_url:
              productData?.product_images?.find(img => img.is_primary)
                ?.public_url ??
              productData?.product_images?.[0]?.public_url ??
              null,
          };
        });

        return mappedData;
      } catch (err) {
        console.error('Exception chargement réceptions affiliés:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Confirmer réception produit affilié (via RPC)
   */
  const confirmAffiliateReception = useCallback(
    async (
      receptionId: string,
      quantityReceived: number,
      notes?: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setValidating(true);
        setError(null);

        /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */
        const { error: rpcError } = await (supabase.rpc as any)(
          'confirm_affiliate_reception',
          {
            p_reception_id: receptionId,
            p_quantity_received: quantityReceived,
            p_notes: notes,
          }
        );
        /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */

        if (rpcError) {
          throw new Error((rpcError as { message: string }).message);
        }

        return { success: true };
      } catch (err) {
        console.error('Erreur confirmation réception affilié:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setValidating(false);
      }
    },
    [supabase]
  );

  /**
   * Annule le reliquat d'une reception affilie
   * - Decremente stock_forecasted_in
   * - Marque la reception comme completed/cancelled
   */
  const cancelAffiliateRemainder = useCallback(
    async (
      receptionId: string,
      reason?: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setValidating(true);
        setError(null);

        /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */
        const { error: rpcError } = await (supabase.rpc as any)(
          'cancel_affiliate_remainder',
          {
            p_reception_id: receptionId,
            p_reason: reason,
          }
        );
        /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */

        if (rpcError) {
          throw new Error((rpcError as { message: string }).message);
        }

        return { success: true };
      } catch (err) {
        console.error('Erreur annulation reliquat affilie:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setValidating(false);
      }
    },
    [supabase]
  );

  return {
    loading,
    validating,
    error,
    loadAffiliateProductReceptions,
    confirmAffiliateReception,
    cancelAffiliateRemainder,
  };
}
