'use client';

import { useMemo } from 'react';

import Link from 'next/link';

import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';
import { Badge, Progress } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { IconButton } from '@verone/ui';
import { cn } from '@verone/utils';
import { Star, Loader2, Eye, StarOff, Package } from 'lucide-react';
import { toast } from 'sonner';

import {
  useLinkMeCatalogProducts,
  useToggleProductFeatured,
  type LinkMeCatalogProduct,
} from '../../hooks/use-linkme-catalog';
import { calculateSimpleCompleteness } from '../../types';

/**
 * Page Vedettes LinkMe
 *
 * Affiche uniquement les produits marqués comme "vedettes" (is_featured = true)
 * Permet de retirer un produit des vedettes
 */
export default function VedettesPage() {
  // Hooks
  const { data: catalogProducts, isLoading } = useLinkMeCatalogProducts();
  const toggleFeaturedMutation = useToggleProductFeatured();

  // Filtrer uniquement les vedettes
  const featuredProducts = useMemo(() => {
    return (catalogProducts || []).filter(p => p.is_featured);
  }, [catalogProducts]);

  // Handler pour retirer des vedettes
  const handleRemoveFromFeatured = async (product: LinkMeCatalogProduct) => {
    try {
      await toggleFeaturedMutation.mutateAsync({
        catalogProductId: product.id,
        isFeatured: false,
      });
      toast.success(`"${product.product_name}" retiré des vedettes`);
    } catch {
      toast.error('Erreur lors de la modification');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-yellow-600 animate-spin mx-auto" />
          <p className="text-gray-600">Chargement des vedettes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Produits Vedettes</h1>
              <p className="text-sm text-gray-500">
                {featuredProducts.length} produit
                {featuredProducts.length > 1 ? 's' : ''} mis en avant sur le
                site
              </p>
            </div>
          </div>

          <Link href="/canaux-vente/linkme/catalogue">
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-gray-50"
            >
              <Package className="h-3.5 w-3.5 mr-1" />
              Voir tout le catalogue
            </Badge>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {featuredProducts.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Aucun produit vedette</p>
            <p className="text-sm text-gray-500 mt-1">
              Marquez des produits comme &quot;Vedette&quot; depuis le catalogue
            </p>
            <Link
              href="/canaux-vente/linkme/catalogue"
              className="inline-block mt-4 text-sm text-purple-600 hover:text-purple-700 underline"
            >
              Aller au catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredProducts.map(product => (
              <Card
                key={product.id}
                className={cn(
                  'border-2 transition-all duration-150',
                  !product.is_enabled
                    ? 'border-gray-200 bg-gray-50 opacity-75'
                    : 'border-yellow-200 hover:border-yellow-300 bg-yellow-50/30'
                )}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header: Thumbnail + Info */}
                  <div className="flex items-start gap-3">
                    <ProductThumbnail
                      src={product.product_image_url}
                      alt={product.product_name}
                      size="md"
                      className="flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xs text-black truncate">
                        {product.product_name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        {product.product_reference}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50"
                        >
                          <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                          Vedette
                        </Badge>
                        {product.is_enabled ? (
                          <Badge variant="success" className="text-xs">
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inactif
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Complétude */}
                  {(() => {
                    const completeness = calculateSimpleCompleteness(product);
                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={cn(
                              completeness === 100
                                ? 'text-green-600'
                                : 'text-amber-600'
                            )}
                          >
                            {completeness}% complet
                          </span>
                          {completeness < 100 && (
                            <span className="text-gray-400">Non validé</span>
                          )}
                        </div>
                        <Progress
                          value={completeness}
                          className={cn(
                            'h-1.5',
                            completeness === 100
                              ? '[&>div]:bg-green-500'
                              : '[&>div]:bg-amber-500'
                          )}
                        />
                      </div>
                    );
                  })()}

                  {/* Footer: Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      <span>{product.views_count} vues</span>
                      <span className="mx-1">•</span>
                      <span>{product.selections_count} sél.</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconButton
                        variant="ghost"
                        size="sm"
                        icon={StarOff}
                        label="Retirer des vedettes"
                        onClick={() => handleRemoveFromFeatured(product)}
                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100"
                      />
                      <Link
                        href={`/canaux-vente/linkme/catalogue/${product.id}`}
                      >
                        <IconButton
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          label="Voir détails"
                        />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
