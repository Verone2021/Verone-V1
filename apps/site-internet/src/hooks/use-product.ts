import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { SiteInternetProduct } from '@/types/cms';

/**
 * Hook useProduct
 *
 * Récupère les détails complets d'un produit par son slug
 * via query directe (TODO: utiliser RPC get_site_internet_product_detail si besoin)
 *
 * Retourne:
 * - Toutes les informations produit
 * - Images multiples
 * - Variantes si applicable
 * - Prix, stock, métadonnées SEO
 */

export interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price_ht: number | null;
  price_ttc: number | null;
  stock_quantity: number;
  color: string | null;
  size: string | null;
  attributes: Record<string, any> | null;
}

// Type produit étendu avec images et variantes
export interface Product extends Omit<SiteInternetProduct, 'images' | 'image_urls'> {
  // Description
  short_description: string | null;
  long_description: string | null;

  // Images (format étendu)
  images: ProductImage[];

  // Stock
  stock_quantity: number;
  stock_status: string | null;

  // Variantes (format étendu)
  variants: ProductVariant[];

  // Catégories / Collections
  category_id: string | null;
  category_name: string | null;
}

interface UseProductOptions {
  slug: string;
}

export function useProduct({ slug }: UseProductOptions) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      // Récupérer le produit via RPC (à créer)
      // Pour l'instant, on utilise une query directe
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(
          `
          id,
          sku,
          name,
          slug,
          status,
          short_description,
          long_description,
          seo_title,
          seo_meta_description,
          metadata,
          price_ht,
          price_ttc,
          stock_quantity,
          is_published_online,
          publication_date,
          created_at,
          updated_at
        `
        )
        .eq('slug', slug)
        .eq('is_published_online', true) // ✅ Filtre CMS : seulement produits publiés
        .single<any>();

      if (productError) {
        console.error('Error fetching product:', productError);
        throw new Error(`Produit non trouvé: ${productError.message}`);
      }

      if (!product) {
        throw new Error('Produit non trouvé');
      }

      // Récupérer les images
      const { data: images } = await supabase
        .from('product_images')
        .select<any>('id, url, alt_text, display_order, is_primary')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });

      // Récupérer les variantes (si applicable)
      const { data: variants } = await supabase
        .from('product_variants')
        .select(
          'id, name, sku, price_ht, price_ttc, stock_quantity, color, size, attributes'
        )
        .eq('product_id', product.id)
        .eq('is_active', true);

      // Récupérer la catégorie
      const { data: category } = await supabase
        .from('product_category_assignments')
        .select<any>(
          `
          categories (
            id,
            name,
            slug
          )
        `
        )
        .eq('product_id', product.id)
        .limit(1)
        .single();

      // Construire l'objet produit complet
      const fullProduct: Product = {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        status: product.status,
        short_description: product.short_description,
        long_description: product.long_description,
        seo_title: product.seo_title,
        seo_meta_description: product.seo_meta_description,
        metadata: product.metadata,
        price_ht: product.price_ht,
        price_ttc: product.price_ttc,
        price_source: 'product',
        primary_image_url: (images as any)?.[0]?.url || null,
        images: (images || []) as ProductImage[],
        stock_quantity: product.stock_quantity || 0,
        stock_status:
          (product.stock_quantity || 0) > 0 ? 'in_stock' : 'out_of_stock',
        is_published: product.is_published_online ?? false, // ✅ Utilise champ CMS correct
        publication_date: product.publication_date || product.created_at,
        has_variants: (variants?.length || 0) > 0,
        variants_count: variants?.length || 0,
        variants: (variants || []) as ProductVariant[],
        category_id: (category as any)?.categories?.id || null,
        category_name: (category as any)?.categories?.name || null,
        is_eligible: true,
        ineligibility_reasons: [],
      };

      return fullProduct;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Ne pas retry si produit non trouvé
  });
}
