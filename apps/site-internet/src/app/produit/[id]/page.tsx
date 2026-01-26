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

import { useQuery } from '@tanstack/react-query';

import type { CatalogueProduct } from '@/hooks/use-catalogue-products';
import { createClient } from '@/lib/supabase/client';

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
  const supabase = createClient();

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
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb (optionnel, à implémenter plus tard)
      <nav className="mb-6 text-sm text-muted-foreground">
        <ol className="flex items-center gap-2">
          <li><Link href="/">Accueil</Link></li>
          <li>/</li>
          <li><Link href="/catalogue">Catalogue</Link></li>
          <li>/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>
      */}

      {/* Layout 2 colonnes 60/40 */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12">
        {/* ===== COLONNE GAUCHE (60%) ===== */}
        <div className="space-y-8">
          {/* Galerie photos avec lightbox */}
          <ProductGallery
            images={product.image_urls || []}
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
            brand: product.brand, // Affichage conditionnel dans composant
            price_ttc: product.price_ttc,
            discount_rate: product.discount_rate,
            eco_participation_amount: product.eco_participation_amount,
            requires_assembly: product.requires_assembly,
            assembly_price: product.assembly_price,
            delivery_delay_weeks_min: product.delivery_delay_weeks_min,
            delivery_delay_weeks_max: product.delivery_delay_weeks_max,
            variant_group_id: product.variant_group_id,
            eligible_variants_count: product.eligible_variants_count,
          }}
          variants={variants}
          currentProductId={product.product_id}
        />
      </div>

      {/* ===== CROSS-SELL (Mock) ===== */}
      <ProductCrossSell />
    </div>
  );
}
