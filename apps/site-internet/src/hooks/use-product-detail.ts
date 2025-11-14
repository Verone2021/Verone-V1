import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { SiteInternetProductDetail } from '@/types/cms';

/**
 * Hook useProductDetail
 *
 * Récupère les détails complets d'un produit par son slug
 * via la RPC function get_site_internet_product_detail()
 *
 * WORKFLOW :
 * 1. Résout slug → product_id (query products table)
 * 2. Appelle RPC get_site_internet_product_detail(p_product_id)
 *
 * Retourne :
 * - Informations produit complètes (CMS waterfall pricing)
 * - Images multiples triées
 * - Variantes par groupe (couleur, taille, etc.)
 * - Métadonnées SEO canal
 */

interface UseProductDetailOptions {
  slug: string;
}

export function useProductDetail({ slug }: UseProductDetailOptions) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['product-detail', slug],
    queryFn: async () => {
      // Étape 1 : Résoudre slug → product_id
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .eq('is_published_online', true)
        .single();

      if (productError) {
        console.error('Error fetching product by slug:', productError);
        throw new Error(`Produit non trouvé: ${productError.message}`);
      }

      if (!product) {
        throw new Error('Produit non trouvé ou non publié');
      }

      // Étape 2 : Appeler RPC get_site_internet_product_detail
      const { data: detail, error: detailError } = await supabase.rpc(
        'get_site_internet_product_detail',
        { p_product_id: product.id }
      );

      if (detailError) {
        console.error('Error fetching product detail:', detailError);
        throw new Error(
          `Détails produit non disponibles: ${detailError.message}`
        );
      }

      if (!detail) {
        throw new Error('Détails produit introuvables');
      }

      // La RPC retourne un JSONB, on le cast en SiteInternetProductDetail
      return detail as unknown as SiteInternetProductDetail;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Ne pas retry si produit non trouvé
  });
}
