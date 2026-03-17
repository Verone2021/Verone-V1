'use client';

import Link from 'next/link';

import { Heart, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { CardProductLuxury } from '@/components/ui/CardProductLuxury';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useWishlist } from '@/hooks/use-wishlist';
import type { CatalogueProduct } from '@/hooks/use-catalogue-products';
import { createClient } from '@/lib/supabase/client';

export default function FavorisPage() {
  const { user, isLoading: userLoading } = useAuthUser();
  const { items: wishlistItems, isLoading: wishlistLoading } = useWishlist(
    user?.id
  );

  const supabase = createClient();
  const productIds = wishlistItems.map(item => item.product_id);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['wishlist-products', productIds],
    queryFn: async (): Promise<CatalogueProduct[]> => {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase.rpc('get_site_internet_products');

      if (error) {
        console.error('[FavorisPage] fetch products error:', error);
        return [];
      }

      return ((data as CatalogueProduct[]) ?? []).filter(p =>
        productIds.includes(p.product_id)
      );
    },
    enabled: productIds.length > 0,
    staleTime: 60000,
  });

  const isLoading = userLoading || wishlistLoading || productsLoading;

  // Redirect to login if not authenticated
  if (!userLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-24 text-center">
        <Heart className="h-12 w-12 text-verone-gray-300 mx-auto mb-4" />
        <h1 className="font-playfair text-2xl font-bold text-verone-black mb-3">
          Connectez-vous pour voir vos favoris
        </h1>
        <p className="text-sm text-verone-gray-500 mb-6">
          Cr&eacute;ez un compte pour sauvegarder vos produits
          pr&eacute;f&eacute;r&eacute;s.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 bg-verone-black text-verone-white px-8 py-3 text-sm uppercase tracking-wide hover:bg-verone-gray-800 transition-colors"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-verone-gray-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link
              href="/compte"
              className="hover:text-verone-black transition-colors"
            >
              Mon compte
            </Link>
          </li>
          <li>/</li>
          <li className="text-verone-black">Favoris</li>
        </ol>
      </nav>

      <h1 className="font-playfair text-3xl font-bold text-verone-black mb-8">
        Mes favoris
        {!isLoading && (
          <span className="text-lg font-normal text-verone-gray-400 ml-3">
            ({products.length})
          </span>
        )}
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-verone-gray-200 h-80" />
              <div className="p-6 space-y-3">
                <div className="h-6 bg-verone-gray-200 rounded w-3/4" />
                <div className="h-4 bg-verone-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((p, index) => (
            <CardProductLuxury
              key={p.product_id}
              id={p.product_id}
              name={p.name}
              description={p.seo_meta_description ?? undefined}
              price={p.price_ttc}
              imageUrl={p.primary_image_url}
              href={`/produit/${p.slug}`}
              priority={index < 3}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-verone-gray-100 rounded-lg">
          <Heart className="h-10 w-10 text-verone-gray-300 mx-auto mb-4" />
          <p className="text-sm text-verone-gray-500 mb-4">
            Vous n'avez pas encore de favoris.
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 px-8 py-3 border border-verone-black text-verone-black text-sm uppercase tracking-wide hover:bg-verone-black hover:text-verone-white transition-all duration-300"
          >
            D&eacute;couvrir le catalogue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
