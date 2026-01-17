'use client';

/**
 * Composant: ProductMetadataSection
 * Section métadonnées SEO du produit (éditable inline)
 */

import { Badge } from '@verone/ui';

import type { SiteInternetProduct } from '../../../types';

interface ProductMetadataSectionProps {
  product: SiteInternetProduct;
}

export default function ProductMetadataSection({
  product,
}: ProductMetadataSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Métadonnées SEO</h2>
      </div>

      {/* Contenu */}
      <div className="space-y-4">
        {/* SEO Title */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Titre SEO</span>
            <Badge variant="outline" className="text-xs">
              {product.seo_title.length} caractères
            </Badge>
          </div>
          <p className="text-sm text-gray-700">{product.seo_title}</p>
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">
              Meta Description
            </span>
            <Badge variant="outline" className="text-xs">
              {product.seo_meta_description.length} caractères
            </Badge>
          </div>
          <p className="text-sm text-gray-700">
            {product.seo_meta_description}
          </p>
        </div>

        {/* Slug */}
        <div>
          <span className="text-sm font-medium text-gray-700 block mb-2">
            Slug URL
          </span>
          <code className="text-sm bg-gray-100 px-3 py-2 rounded block">
            {product.slug || (
              <span className="text-gray-400 italic">Non défini</span>
            )}
          </code>
        </div>
      </div>
    </div>
  );
}
