'use client';

import { use, useEffect, useRef } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { createClient } from '@verone/utils/supabase/client';
import { ArrowLeft, Store, Package, ShoppingCart, Plus } from 'lucide-react';

const supabase = createClient();

import { useCart } from '../../../../components/cart/CartProvider';
import { useSelectionWithProducts } from '../../../../lib/hooks/use-linkme-public';

interface SelectionPageProps {
  params: Promise<{ affiliateSlug: string; selectionSlug: string }>;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export default function SelectionPage({ params }: SelectionPageProps) {
  const { affiliateSlug, selectionSlug } = use(params);
  const {
    data: selection,
    isLoading,
    error,
  } = useSelectionWithProducts(affiliateSlug, selectionSlug);
  const { addItem, setAffiliateInfo, setSelectionInfo, openCart } = useCart();

  // Set affiliate and selection info for cart attribution
  useEffect(() => {
    if (selection) {
      setAffiliateInfo(selection.affiliate_id, affiliateSlug);
      setSelectionInfo(selection.id, selectionSlug);
    }
  }, [
    selection,
    affiliateSlug,
    selectionSlug,
    setAffiliateInfo,
    setSelectionInfo,
  ]);

  // Track selection view (once per page load)
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (selection?.id && !hasTrackedView.current) {
      hasTrackedView.current = true;
      // Call RPC to increment views_count - fire and forget
      const trackView = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.rpc as any)('track_selection_view', {
            p_selection_id: selection.id,
          });
          // View tracked successfully (silent)
        } catch (err) {
          // Log error but don't block user experience
          console.warn('Failed to track view:', err);
        }
      };
      void trackView().catch(err => {
        console.warn('Failed to track view:', err);
      });
    }
  }, [selection?.id]);

  const handleAddToCart = (item: NonNullable<typeof selection>['items'][0]) => {
    addItem({
      id: item.id,
      product_id: item.product_id,
      selection_item_id: item.id,
      name: item.product.name,
      sku: item.product.sku,
      image_url: item.product.primary_image_url,
      base_price_ht: item.base_price_ht,
      selling_price_ht: item.selling_price_ht,
      margin_rate: item.margin_rate,
    });
    openCart();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
          <div className="h-64 bg-gray-200 rounded-lg mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !selection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Sélection introuvable
        </h1>
        <p className="text-gray-600 mb-8">
          Cette sélection n'existe pas ou n'est plus disponible.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Accueil
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              href={`/${affiliateSlug}`}
              className="text-gray-500 hover:text-gray-700"
            >
              {selection.affiliate.display_name}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">{selection.name}</span>
          </nav>
        </div>
      </div>

      {/* Selection Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image */}
            <div className="relative w-full md:w-80 h-48 md:h-64 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {selection.image_url ? (
                <Image
                  src={selection.image_url}
                  alt={selection.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="h-16 w-16" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Store className="h-4 w-4" />
                <Link
                  href={`/${affiliateSlug}`}
                  className="hover:text-blue-600"
                >
                  {selection.affiliate.display_name}
                </Link>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {selection.name}
              </h1>

              {selection.description && (
                <p className="text-gray-600 mb-4 max-w-2xl">
                  {selection.description}
                </p>
              )}

              <div className="text-sm text-gray-500">
                {selection.items.length} produits dans cette sélection
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Produits de la sélection
          </h2>

          {selection.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {selection.items.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    {item.product.primary_image_url ? (
                      <Image
                        src={item.product.primary_image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                    {item.is_featured && (
                      <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-1 rounded">
                        Vedette
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      {item.product.sku}
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(item.selling_price_ht)}
                      </span>
                      <span className="text-sm text-gray-500">HT</span>
                    </div>

                    {/* Stock indicator */}
                    {item.product.stock_real > 0 ? (
                      <p className="text-xs text-green-600 mb-4">En stock</p>
                    ) : (
                      <p className="text-xs text-orange-600 mb-4">
                        Sur commande
                      </p>
                    )}

                    {/* Add to cart button */}
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun produit dans cette sélection</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
