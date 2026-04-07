'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { EnseigneChannel, EnseigneProduct } from '../types';

export function useEnseigneProductsChannels(enseigneId: string) {
  const supabase = createClient();

  const [enseigneProducts, setEnseigneProducts] = useState<EnseigneProduct[]>(
    []
  );
  const [productsLoading, setProductsLoading] = useState(false);
  const [enseigneChannels, setEnseigneChannels] = useState<EnseigneChannel[]>(
    []
  );

  // Charger les produits de cette enseigne
  useEffect(() => {
    async function fetchEnseigneProducts() {
      if (!enseigneId) return;
      setProductsLoading(true);
      try {
        const { data } = await supabase
          .from('products')
          .select(
            `id, name, sku, product_status, created_at,
            product_images!left(public_url, is_primary)`
          )
          .eq('enseigne_id', enseigneId)
          .order('created_at', { ascending: false });

        const mappedProducts: EnseigneProduct[] = (data ?? []).map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          product_status: p.product_status,
          created_at: p.created_at,
          primary_image_url:
            (
              p.product_images as { public_url: string; is_primary: boolean }[]
            )?.find(img => img.is_primary)?.public_url ?? null,
        }));
        setEnseigneProducts(mappedProducts);
      } catch (err) {
        console.error('Erreur chargement produits enseigne:', err);
      } finally {
        setProductsLoading(false);
      }
    }
    void fetchEnseigneProducts().catch(error => {
      console.error('[EnseigneDetail] Fetch products failed:', error);
    });
  }, [enseigneId, supabase]);

  // Charger les canaux de vente de cette enseigne
  useEffect(() => {
    async function fetchEnseigneChannels() {
      if (!enseigneId) return;

      const channels: EnseigneChannel[] = [];

      try {
        // Vérifier si compte LinkMe existe
        const { data: linkmeAffiliate } = await supabase
          .from('linkme_affiliates')
          .select(
            `
            id,
            status,
            organisation:organisations!organisation_id(enseigne_id)
          `
          )
          .not('organisation_id', 'is', null)
          .single();

        if (linkmeAffiliate) {
          const org = linkmeAffiliate.organisation as {
            enseigne_id: string | null;
          };
          if (org?.enseigne_id === enseigneId) {
            channels.push({
              code: 'linkme',
              name: 'LinkMe',
              link: `/canaux-vente/linkme/enseignes/${enseigneId}`,
              isActive: linkmeAffiliate.status === 'active',
            });
          }
        }

        // TODO: Vérifier autres canaux (Site Internet, etc.)
        setEnseigneChannels(channels);
      } catch (err) {
        console.error('Erreur chargement canaux enseigne:', err);
      }
    }
    void fetchEnseigneChannels().catch(error => {
      console.error('[EnseigneDetail] Fetch channels failed:', error);
    });
  }, [enseigneId, supabase]);

  return {
    enseigneProducts,
    productsLoading,
    enseigneChannels,
  };
}
