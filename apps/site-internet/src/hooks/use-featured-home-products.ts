/**
 * useFeaturedHomeProducts
 *
 * Récupère les produits marqués is_featured_home=true pour la section
 * "Ce qui vient d'entrer" de la homepage.
 *
 * Fallback : si 0 produits featured, retourne les 4 plus récents publiés.
 *
 * Implementation note : la table `products` n'expose pas `primary_image_url`
 * ni `primary_cloudflare_image_id` (colonnes calculées). On passe donc par la
 * RPC `get_site_internet_products` (SECURITY DEFINER, accessible anon) pour
 * obtenir les images, puis on intersecte avec la liste des featured.
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

interface RpcProductRow {
  product_id: string;
  name: string;
  slug: string;
  price_ttc: number | null;
  primary_image_url: string | null;
  primary_cloudflare_image_id: string | null;
  is_published: boolean;
  publication_date: string | null;
}

interface FeaturedIdRow {
  id: string;
  commercial_name: string | null;
  publication_date: string | null;
}

export function useFeaturedHomeProducts() {
  const supabase = createUntypedClient();

  return useQuery({
    queryKey: ['featured_home_products'],
    queryFn: async (): Promise<FeaturedHomeProduct[]> => {
      // 1. Tirer la liste des IDs marqués is_featured_home (table products) —
      //    on prend uniquement les colonnes qui existent réellement.
      const { data: featuredIdsRaw, error: featuredError } = await supabase
        .from('products')
        .select('id, commercial_name, publication_date')
        .eq('is_featured_home', true)
        .eq('is_published_online', true)
        .limit(4);

      if (featuredError) {
        console.error(
          '[useFeaturedHomeProducts] featured ids error:',
          featuredError
        );
      }

      const featuredRows = (featuredIdsRaw ?? []) as FeaturedIdRow[];

      // 2. Récupérer le catalogue complet enrichi via RPC (images incluses).
      //    Le client est untyped (RPC retournant `any`) ; on capture en deux
      //    temps pour éviter le warning @typescript-eslint/no-unsafe-assignment
      //    sur la destructuration.
      const rpcResponse = await supabase.rpc('get_site_internet_products', {
        p_brand_slug: 'verone',
      });
      const rpcError = rpcResponse.error;
      const rpcDataRaw = rpcResponse.data as unknown;

      if (rpcError) {
        console.error('[useFeaturedHomeProducts] RPC error:', rpcError);
        return [];
      }

      const rpcRows = (rpcDataRaw ?? []) as RpcProductRow[];

      // 3. Cas 1 — au moins un featured : intersecter RPC avec ces IDs.
      if (featuredRows.length > 0) {
        const featuredById = new Map(featuredRows.map(f => [f.id, f]));
        const featured = rpcRows
          .filter(r => featuredById.has(r.product_id))
          .slice(0, 4)
          .map(r => ({
            id: r.product_id,
            name: r.name,
            commercial_name:
              featuredById.get(r.product_id)?.commercial_name ?? null,
            slug: r.slug,
            price_ttc: r.price_ttc,
            primary_image_url: r.primary_image_url,
            primary_cloudflare_image_id: r.primary_cloudflare_image_id,
            is_published_online: r.is_published,
          }));

        if (featured.length > 0) return featured;
      }

      // 4. Fallback — pas de featured ou intersection vide : 4 plus récents publiés.
      return rpcRows
        .filter(r => r.is_published)
        .sort((a, b) => {
          const da = a.publication_date ? Date.parse(a.publication_date) : 0;
          const db = b.publication_date ? Date.parse(b.publication_date) : 0;
          return db - da;
        })
        .slice(0, 4)
        .map(r => ({
          id: r.product_id,
          name: r.name,
          commercial_name: null,
          slug: r.slug,
          price_ttc: r.price_ttc,
          primary_image_url: r.primary_image_url,
          primary_cloudflare_image_id: r.primary_cloudflare_image_id,
          is_published_online: r.is_published,
        }));
    },
    staleTime: 60_000,
  });
}
