'use client';

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useProductDetail } from '@/hooks/use-product-detail';
import { useCartStore } from '@/store/cart-store';
import { ProductImageGallery } from './ProductImageGallery';
import { VariantSelector } from './VariantSelector';

/**
 * ProductDetail - Page produit détaillée style WestWing
 *
 * Layout :
 * - 2 colonnes desktop (60/40)
 * - Images gauche (sticky)
 * - Infos droite (scrollable)
 *
 * Données :
 * - Provient du CMS via RPC get_site_internet_product_detail()
 * - Waterfall pricing (channel_pricing > base)
 * - Métadonnées SEO canal
 * - Variantes multi-groupes
 */

interface ProductDetailProps {
  slug: string;
}

export function ProductDetail({ slug }: ProductDetailProps) {
  const router = useRouter();
  const { data: productDetail, isLoading, error } = useProductDetail({ slug });
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );

  const addItem = useCartStore((state) => state.addItem);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image skeleton */}
            <div>
              <div className="bg-gray-200 aspect-[3/4] mb-4 animate-pulse rounded-lg" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-200 aspect-square animate-pulse rounded-md"
                  />
                ))}
              </div>
            </div>

            {/* Info skeleton */}
            <div className="space-y-6">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !productDetail) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Produit introuvable
          </h1>
          <p className="text-gray-600 mb-8">
            Le produit que vous recherchez n'existe pas ou n'est plus
            disponible.
          </p>
          <Link
            href="/catalogue"
            className="inline-block px-6 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const { product, variants } = productDetail;

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product.price_ttc) return;

    setIsAddingToCart(true);

    try {
      addItem({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        price: product.price_ttc,
        imageUrl: product.images?.[0]?.url || null,
        maxStock: 999, // TODO: récupérer stock réel
        quantity,
        variantId: selectedVariantId,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push('/panier');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert("Erreur lors de l'ajout au panier");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const hasVariants = variants && variants.length > 0;
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(product.price_ttc);

  return (
    <>
      {/* SEO Metadata */}
      <Head>
        <title>{product.seo_title}</title>
        <meta name="description" content={product.seo_meta_description} />
      </Head>

      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-gray-600">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="hover:text-gray-900">
                  Accueil
                </Link>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li>
                <Link href="/catalogue" className="hover:text-gray-900">
                  Catalogue
                </Link>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li className="text-gray-900 font-medium">{product.name}</li>
            </ol>
          </nav>

          {/* Layout 2 colonnes WestWing */}
          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-12">
            {/* Colonne gauche : Images (sticky) */}
            <div className="lg:sticky lg:top-8 lg:h-fit">
              <ProductImageGallery
                images={product.images || []}
                productName={product.name}
              />
            </div>

            {/* Colonne droite : Informations produit */}
            <div className="space-y-8">
              {/* Titre + Prix */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {formattedPrice}
                  </span>
                </div>

                {/* SKU */}
                {product.sku && (
                  <p className="text-sm text-gray-500">Réf. {product.sku}</p>
                )}
              </div>

              {/* Statut publication */}
              {product.is_published_online && (
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-700 font-medium">
                    Disponible
                  </span>
                </div>
              )}

              {/* Sélecteur variantes */}
              {hasVariants && (
                <div className="border-t border-b border-gray-200 py-6">
                  <VariantSelector
                    variants={variants}
                    onSelectVariant={(variantId) =>
                      setSelectedVariantId(variantId)
                    }
                  />
                </div>
              )}

              {/* Quantité + Bouton panier */}
              <div className="space-y-4">
                {/* Quantité */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Quantité
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-md hover:border-gray-500 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-lg font-medium w-12 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-md hover:border-gray-500 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Bouton ajouter au panier */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="w-full py-4 bg-black text-white font-semibold text-lg rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isAddingToCart ? 'Ajout en cours...' : 'Ajouter au panier'}
                </button>
              </div>

              {/* Trust badges */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">
                      Livraison gratuite
                    </p>
                    <p className="text-gray-600">Dès 100€ d'achat</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">
                      Retours gratuits
                    </p>
                    <p className="text-gray-600">Sous 30 jours</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="border-t border-gray-200 pt-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Description
                  </h2>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p className="whitespace-pre-wrap">{product.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
