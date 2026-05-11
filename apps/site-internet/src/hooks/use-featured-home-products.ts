/**
 * useFeaturedHomeProducts
 *
 * Récupère les produits marqués is_featured_home=true pour la section
 * "Ce qui vient d'entrer" de la homepage.
 *
 * Fallback : si 0 produits featured, retourne les 4 plus récents publiés.
 */

import { useQuery } from '@tanstack/react-query';

import { createUntypedClient } from '@/lib/supabase/untyped-client';

export interface FeaturedHomeProduct {
  id: string;
  name: string;
  commercial_name: string | null;
  slug: string | null;
  price_ttc: number | null;
  primary_image_url: string | null;
  primary_cloudflare_image_id: string | null;
  is_published_online: boolean;
}

interface ProductRow {
  id: string;
  name: string;
  commercial_name: string | null;
  slug: string | null;
  primary_image_url: string | null;
}

interface ChannelPricingRow {
  custom_price_ht: number | null;
}

// Taux TVA par défaut (20 %) — utilisé uniquement comme fallback si channel_pricing absent
const DEFAULT_VAT_RATE = 1.2;

export function useFeaturedHomeProducts() {
  const supabase = createUntypedClient();

  return useQuery({
    queryKey: ['featured_home_products'],
    queryFn: async (): Promise<FeaturedHomeProduct[]> => {
      // 1. Tenter les produits marqués is_featured_home
      const { data: featured, error: featuredError } = await supabase
        .from('products')
        .select(
          'id, name, commercial_name, slug, primary_image_url, primary_cloudflare_image_id, is_published_online'
        )
        .eq('is_featured_home', true)
        .eq('is_published_online', true)
        .limit(4);

      if (featuredError) {
        console.error('[useFeaturedHomeProducts] fetch error:', featuredError);
      }

      const rows = (featured ?? []) as Array<
        ProductRow & {
          primary_cloudflare_image_id: string | null;
          is_published_online: boolean;
        }
      >;

      // 2. Fallback : 4 derniers publiés si aucun featured
      if (rows.length === 0) {
        const { data: fallback, error: fallbackError } = await supabase
          .from('products')
          .select(
            'id, name, commercial_name, slug, primary_image_url, primary_cloudflare_image_id, is_published_online'
          )
          .eq('is_published_online', true)
          .order('publication_date', { ascending: false })
          .limit(4);

        if (fallbackError) {
          console.error(
            '[useFeaturedHomeProducts] fallback fetch error:',
            fallbackError
          );
          return [];
        }

        return ((fallback ?? []) as typeof rows).map(p => ({
          id: p.id,
          name: p.name,
          commercial_name: p.commercial_name,
          slug: p.slug,
          price_ttc: null,
          primary_image_url: p.primary_image_url,
          primary_cloudflare_image_id: p.primary_cloudflare_image_id,
          is_published_online: p.is_published_online,
        }));
      }

      // 3. Récupérer les prix canal site_internet pour les produits featured
      const productIds = rows.map(p => p.id);
      const { data: channelId } = await supabase
        .from('sales_channels')
        .select('id')
        .eq('code', 'site_internet')
        .single();

      let priceMap: Record<string, number | null> = {};

      if (channelId && typeof channelId === 'object' && 'id' in channelId) {
        const { data: pricingRows } = await supabase
          .from('channel_pricing')
          .select('product_id, custom_price_ht')
          .eq('channel_id', (channelId as { id: string }).id)
          .in('product_id', productIds)
          .limit(4);

        priceMap = Object.fromEntries(
          (
            (pricingRows ?? []) as Array<
              ChannelPricingRow & { product_id: string }
            >
          ).map(r => [
            r.product_id,
            r.custom_price_ht != null
              ? Math.round(r.custom_price_ht * DEFAULT_VAT_RATE * 100) / 100
              : null,
          ])
        );
      }

      return rows.map(p => ({
        id: p.id,
        name: p.name,
        commercial_name: p.commercial_name,
        slug: p.slug,
        price_ttc: priceMap[p.id] ?? null,
        primary_image_url: p.primary_image_url,
        primary_cloudflare_image_id: p.primary_cloudflare_image_id,
        is_published_online: p.is_published_online,
      }));
    },
    staleTime: 60_000,
  });
}
