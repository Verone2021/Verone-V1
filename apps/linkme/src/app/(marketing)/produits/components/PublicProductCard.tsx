'use client';

/**
 * Carte produit du catalogue public LinkMe.
 *
 * Visiteur SANS compte → aucun prix. On affiche image, catégorie, nom et un
 * libellé « Prix sur accès ». Un clic ouvre la fiche produit `/produits/[slug]`.
 *
 * @module produits/PublicProductCard
 * @since 2026-07-23 - LM-PUB-CATALOG-001
 */

import Link from 'next/link';

import { ShoppingBag, Sparkles } from 'lucide-react';

import { CloudflareImage } from '@verone/ui';

import type { PublicProduct } from '@/lib/linkme-public-products';

interface PublicProductCardProps {
  product: PublicProduct;
}

export function PublicProductCard({
  product,
}: PublicProductCardProps): JSX.Element {
  const hasImage = Boolean(product.cloudflareImageId ?? product.imageUrl);
  const href = product.slug ? `/produits/${product.slug}` : '/produits';

  return (
    <Link
      href={href}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {hasImage ? (
          <CloudflareImage
            cloudflareId={product.cloudflareImageId}
            fallbackSrc={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <ShoppingBag className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {product.isFeatured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-[#5DBEBB] text-white text-xs font-medium rounded-full shadow-sm">
            <Sparkles className="h-3 w-3" />
            Coup de cœur
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <div className="text-xs text-[#5DBEBB] font-medium mb-1">
            {product.category}
          </div>
        )}
        <h3 className="font-bold text-[#183559] mb-3 line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm font-medium text-[#183559]/50">
            Prix sur accès
          </span>
          <span className="text-xs font-medium text-[#5DBEBB] group-hover:translate-x-0.5 transition-transform">
            Voir la fiche →
          </span>
        </div>
      </div>
    </Link>
  );
}
