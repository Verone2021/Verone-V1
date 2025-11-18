import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';

/**
 * Hook useCatalogueProducts
 *
 * Récupère les produits publiés sur le canal Site Internet
 * via la RPC function get_site_internet_products()
 *
 * Retourne:
 * - Liste produits avec images, prix, statut
 * - Groupes variants si applicable
 * - Catégories/collections
 */

export interface CatalogueProduct {
  // Identifiant
  product_id: string;
  sku: string | null;
  name: string;
  slug: string;
  status: string;

  // SEO
  seo_title: string | null;
  seo_meta_description: string | null;
  metadata: any;

  // Prix
  price_ht: number | null;
  price_ttc: number | null;
  price_source: string | null;

  // Images
  primary_image_url: string | null;
  image_urls: string[] | null;

  // Publication
  is_published: boolean;
  publication_date: string | null;

  // Variantes
  has_variants: boolean;
  variants_count: number; // Total variantes (toutes)
  variant_group_id: string | null; // ✨ Ajouté 2025-11-19
  eligible_variants_count: number; // ✨ Ajouté 2025-11-19 - Uniquement variantes éligibles

  // Éligibilité
  is_eligible: boolean;
  ineligibility_reasons: string[] | null;

  // Champs produit supplémentaires (ajoutés 2025-11-17)
  description: string | null;
  technical_description: string | null;
  brand: string | null;
  selling_points: string[] | null;
  dimensions: any;
  weight: number | null;
  suitable_rooms: string[] | null;
  subcategory_id: string | null;
  subcategory_name: string | null;
  product_type: string | null;
  video_url: string | null;
  supplier_moq: number | null;
  discount_rate: number | null; // ✨ Ajouté 2025-11-18
}

interface UseCatalogueProductsOptions {
  categorySlug?: string;
  collectionSlug?: string;
  searchQuery?: string;
  sortBy?:
    | 'name_asc'
    | 'name_desc'
    | 'price_asc'
    | 'price_desc'
    | 'newest'
    | 'oldest';
  limit?: number;
  offset?: number;
}

export function useCatalogueProducts(
  options: UseCatalogueProductsOptions = {}
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['catalogue-products', options],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_site_internet_products');

      if (error) {
        console.error('Error fetching catalogue products:', error);
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      let products = (data || []) as CatalogueProduct[];

      // Filtres côté client

      // Filtre recherche texte
      if (options.searchQuery) {
        const query = options.searchQuery.toLowerCase();
        products = products.filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            p.seo_meta_description?.toLowerCase().includes(query) ||
            p.sku?.toLowerCase().includes(query)
        );
      }

      // Tri
      if (options.sortBy) {
        switch (options.sortBy) {
          case 'name_asc':
            products.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'name_desc':
            products.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case 'price_asc':
            products.sort((a, b) => (a.price_ttc ?? 0) - (b.price_ttc ?? 0));
            break;
          case 'price_desc':
            products.sort((a, b) => (b.price_ttc ?? 0) - (a.price_ttc ?? 0));
            break;
          case 'newest':
            products.sort(
              (a, b) =>
                new Date(b.publication_date ?? 0).getTime() -
                new Date(a.publication_date ?? 0).getTime()
            );
            break;
          case 'oldest':
            products.sort(
              (a, b) =>
                new Date(a.publication_date ?? 0).getTime() -
                new Date(b.publication_date ?? 0).getTime()
            );
            break;
        }
      }

      // Pagination côté client (optionnel)
      if (options.limit !== undefined && options.offset !== undefined) {
        products = products.slice(
          options.offset,
          options.offset + options.limit
        );
      }

      return products;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
