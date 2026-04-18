/**
 * Page Produit Site Internet - Layout 2 Colonnes 60/40
 * Inspiré Maisons du Monde + Westwing
 * Features:
 * - Layout responsive 60/40 (galerie/sidebar)
 * - Sticky sidebar avec prix + variantes + CTA
 * - Marque conditionnelle (SI renseignée)
 * - Éco-participation ligne séparée
 * - Accordions sections détaillées
 * - Cross-sell carrousel (mock)
 */

'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';

import type { CatalogueProduct } from '@/hooks/use-catalogue-products';
import { createClient } from '@/lib/supabase/client';
import { trackViewItem } from '@/components/analytics/GoogleAnalytics';
import { trackMetaViewContent } from '@/components/analytics/MetaPixel';
import { ShareButtons } from '@/components/product/ShareButtons';
import { StickyAddToCart } from '@/components/product/StickyAddToCart';
import { JsonLdProduct } from '@/components/seo/JsonLdProduct';
import { useReviewStats } from '@/hooks/use-reviews';
import { useCart } from '@/contexts/CartContext';

import { ProductReviews } from '@/components/product/ProductReviews';

import { ProductAccordions } from './components/ProductAccordions';
import { ProductCrossSell } from './components/ProductCrossSell';
import { ProductGallery } from './components/ProductGallery';
import { ProductSidebar } from './components/ProductSidebar';

interface VariantCard {
  product_id: string;
  slug: string;
  name: string;
  primary_image_url: string | null;
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const [stickyAdded, setStickyAdded] = useState(false);
  const supabase = createClient();
  const { addItem } = useCart();

  // ✅ Next.js 15 async params
  useEffect(() => {
    void params.then(({ id }) => setSlug(id));
  }, [params]);

  // Récupérer produit par slug
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product-detail', slug],
    queryFn: async (): Promise<CatalogueProduct | null> => {
      if (!slug) return null;

      const { data, error } = await supabase.rpc('get_site_internet_products');

      if (error) {
        console.error('❌ Erreur fetch product detail:', error);
        throw error;
      }

      const product = ((data as CatalogueProduct[]) || []).find(
        (p: CatalogueProduct) => p.slug === slug
      );

      if (!product) {
        throw new Error(`Produit non trouvé: ${slug}`);
      }

      return product;
    },
    enabled: !!slug,
    staleTime: 60000,
    retry: 1,
  });

  // Récupérer variantes éligibles (si product has variant_group)
  const { data: variants = [] } = useQuery({
    queryKey: [
      'eligible-variants',
      product?.variant_group_id,
      product?.product_id,
    ],
    queryFn: async (): Promise<VariantCard[]> => {
      if (!product?.variant_group_id) return [];

      const { data, error } = await supabase.rpc('get_site_internet_products');

      if (error) {
        console.error('❌ Erreur fetch variants:', error);
        return [];
      }

      // Filtrer par variant_group_id et exclure produit actuel
      const variantsData = ((data as CatalogueProduct[]) || [])
        .filter(
          (p: CatalogueProduct) =>
            p.variant_group_id === product.variant_group_id &&
            p.product_id !== product.product_id
        )
        .map((p: CatalogueProduct) => ({
          product_id: p.product_id,
          slug: p.slug,
          name: p.name,
          primary_image_url: p.primary_image_url,
        }));

      return variantsData;
    },
    enabled:
      !!product?.variant_group_id &&
      (product?.eligible_variants_count || 0) > 1,
    staleTime: 60000,
  });

  // Review stats for JSON-LD
  const reviewStats = useReviewStats(product?.product_id);

  // GA4 + Meta Pixel: track view when product loads
  useEffect(() => {
    if (product) {
      trackViewItem({
        id: product.product_id,
        name: product.name,
        price: product.price_ttc ?? 0,
        brand: product.brand ?? undefined,
        category: product.subcategory_name ?? undefined,
      });
      trackMetaViewContent({
        id: product.product_id,
        name: product.name,
        price: product.price_ttc ?? 0,
        category: product.subcategory_name ?? undefined,
      });
    }
  }, [product]);

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 animate-pulse">
          {/* Skeleton galerie */}
          <div className="space-y-4">
            <div className="h-[500px] max-h-[60vh] bg-gray-200 rounded-lg" />
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-16 w-full bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>

          {/* Skeleton sidebar */}
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // ===== ERROR STATE =====
  if (error || !product) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">Produit non trouvé</h1>
        <p className="text-gray-600">
          Le produit que vous recherchez n'existe pas ou n'est plus disponible.
        </p>
      </div>
    );
  }

  // ===== PRODUCT PAGE LAYOUT =====
  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 pb-28 lg:pb-8">
      {/* JSON-LD Product Schema */}
      <JsonLdProduct
        name={product.name}
        description={product.description}
        slug={product.slug}
        price={product.price_ttc}
        imageUrl={product.primary_image_url}
        brand={product.brand}
        sku={product.sku}
        reviewCount={reviewStats.count}
        averageRating={reviewStats.average}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-verone-gray-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link
              href="/"
              className="hover:text-verone-black transition-colors"
            >
              Accueil
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href="/catalogue"
              className="hover:text-verone-black transition-colors"
            >
              Catalogue
            </Link>
          </li>
          <li>/</li>
          <li className="text-verone-black truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Layout 2 colonnes 60/40 */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12">
        {/* ===== COLONNE GAUCHE (60%) ===== */}
        <div className="space-y-8">
          {/* Galerie photos avec lightbox */}
          <ProductGallery
            images={product.image_urls ?? []}
            productName={product.name}
          />

          {/* Description courte (optionnel) */}
          {product.description && (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed line-clamp-3">
                {product.description}
              </p>
            </div>
          )}

          {/* Accordions sections détaillées */}
          <ProductAccordions
            product={{
              description: product.description,
              technical_description: product.technical_description,
              dimensions: product.dimensions,
              weight: product.weight,
              requires_assembly: product.requires_assembly,
            }}
          />
        </div>

        {/* ===== SIDEBAR DROITE (40%) - STICKY ===== */}
        <ProductSidebar
          product={{
            product_id: product.product_id,
            name: product.name,
            slug: product.slug,
            brand: product.brand,
            price_ttc: product.price_ttc,
            discount_rate: product.discount_rate,
            eco_participation_amount: product.eco_participation_amount,
            requires_assembly: product.requires_assembly,
            assembly_price: product.assembly_price,
            delivery_delay_weeks_min: product.delivery_delay_weeks_min,
            delivery_delay_weeks_max: product.delivery_delay_weeks_max,
            variant_group_id: product.variant_group_id,
            eligible_variants_count: product.eligible_variants_count,
            primary_image_url: product.primary_image_url,
            sku: product.sku,
          }}
          variants={variants}
          currentProductId={product.product_id}
        />
      </div>

      {/* Share + Cross-sell */}
      <div className="mt-8 flex justify-end">
        <ShareButtons
          url={`/produit/${product.slug}`}
          title={product.name}
          imageUrl={product.primary_image_url}
        />
      </div>

      <ProductCrossSell currentProductId={product.product_id} />

      {/* Reviews */}
      <ProductReviews
        productId={product.product_id}
        productName={product.name}
      />

      {/* Sticky mobile add-to-cart */}
      <StickyAddToCart
        productName={product.name}
        priceTTC={product.price_ttc ?? 0}
        isAdded={stickyAdded}
        onAddToCart={() => {
          void addItem({
            product_id: product.product_id,
            variant_group_id: product.variant_group_id,
            quantity: 1,
            include_assembly: false,
            name: product.name,
            slug: product.slug,
            price_ttc: product.price_ttc ?? 0,
            assembly_price: product.assembly_price ?? 0,
            eco_participation: product.eco_participation_amount ?? 0,
            primary_image_url: product.primary_image_url,
            sku: product.sku,
          })
            .then(() => {
              setStickyAdded(true);
              setTimeout(() => setStickyAdded(false), 2000);
            })
            .catch(error => {
              console.error('[StickyCart] Add failed:', error);
            });
        }}
      />
    </div>
  );
}
