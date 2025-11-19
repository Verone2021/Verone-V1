/**
 * ProductPreviewModal
 * Modal de prévisualisation produit Site Internet (remplace redirection externe)
 * Affiche aperçu complet : SEO, tarification, images, variantes, descriptions
 */

'use client';

import Image from 'next/image';

import { Badge } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { formatPrice } from '@verone/utils';

import type { SiteInternetProduct } from '../types';

interface ProductPreviewModalProps {
  product: SiteInternetProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductPreviewModal({
  product,
  isOpen,
  onClose,
}: ProductPreviewModalProps) {
  if (!product) return null;

  const hasDiscount =
    product.discount_rate != null && product.discount_rate > 0;

  const priceHT = product.price_ht ?? 0;
  const priceTTC = product.price_ttc ?? 0;
  const discountedPriceTTC = hasDiscount
    ? priceTTC * (1 - (product.discount_rate ?? 0))
    : priceTTC;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Aperçu Produit Site Internet</span>
            {product.is_published ? (
              <Badge variant="success">Publié</Badge>
            ) : (
              <Badge variant="secondary">Non publié</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          {/* Images */}
          <div>
            {/* Image principale */}
            {product.primary_image_url ? (
              <div className="relative h-96 rounded-lg overflow-hidden mb-4 bg-gray-100 border">
                <Image
                  src={product.primary_image_url}
                  alt={product.name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-96 rounded-lg bg-gray-200 mb-4 flex items-center justify-center border">
                <span className="text-gray-400">Aucune image</span>
              </div>
            )}

            {/* Miniatures */}
            <div className="grid grid-cols-4 gap-2">
              {product.image_urls && product.image_urls.length > 0 ? (
                product.image_urls.slice(0, 4).map((url, index) => (
                  <div
                    key={index}
                    className="relative h-20 rounded-lg overflow-hidden bg-gray-100 border"
                  >
                    <Image
                      src={url}
                      alt={`${product.name} - image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))
              ) : (
                <>
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="h-20 rounded-lg bg-gray-200 border"
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Détails produit */}
          <div className="space-y-6">
            {/* Titre SEO */}
            <div>
              <h2 className="text-3xl font-bold">{product.seo_title}</h2>
              {product.sku && (
                <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
              )}
            </div>

            {/* Prix */}
            <div className="border-t border-b py-4">
              {hasDiscount ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive" className="bg-red-500">
                      🏷️ PROMO -{Math.round((product.discount_rate ?? 0) * 100)}
                      %
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-600">
                      {formatPrice(discountedPriceTTC)}
                    </div>
                    <div className="text-lg text-gray-400 line-through">
                      {formatPrice(priceTTC)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Prix HT réduit :{' '}
                    {formatPrice(priceHT * (1 - (product.discount_rate ?? 0)))}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {formatPrice(priceTTC)}
                  </div>
                  <p className="text-sm text-gray-500">
                    Prix HT : {formatPrice(priceHT)}
                  </p>
                </div>
              )}
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {product.price_source === 'channel_pricing'
                    ? 'Prix canal personnalisé'
                    : 'Prix base catalogue'}
                </Badge>
              </div>
            </div>

            {/* Description SEO */}
            {product.seo_meta_description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600 text-sm">
                  {product.seo_meta_description}
                </p>
              </div>
            )}

            {/* Description longue */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Description détaillée</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* Points forts */}
            {product.selling_points && product.selling_points.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Points forts</h3>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  {product.selling_points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Caractéristiques */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.brand && (
                <div>
                  <span className="text-gray-500">Marque :</span>
                  <span className="ml-2 font-medium">{product.brand}</span>
                </div>
              )}
              {product.subcategory_name && (
                <div>
                  <span className="text-gray-500">Catégorie :</span>
                  <span className="ml-2 font-medium">
                    {product.subcategory_name}
                  </span>
                </div>
              )}
              {product.weight && (
                <div>
                  <span className="text-gray-500">Poids :</span>
                  <span className="ml-2 font-medium">{product.weight} kg</span>
                </div>
              )}
            </div>

            {/* Variantes */}
            {product.has_variants && (
              <div>
                <h3 className="font-semibold mb-2">Variantes disponibles</h3>
                <Badge variant="secondary">
                  {product.variants_count} variante
                  {product.variants_count > 1 ? 's' : ''}
                </Badge>
              </div>
            )}

            {/* Statut éligibilité */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Statut publication</h3>
              <div className="space-y-2">
                {product.is_eligible ? (
                  <Badge variant="success">✅ Éligible pour publication</Badge>
                ) : (
                  <div className="space-y-1">
                    <Badge variant="destructive">
                      ❌ Non éligible pour publication
                    </Badge>
                    {product.ineligibility_reasons &&
                      product.ineligibility_reasons.length > 0 && (
                        <ul className="text-sm text-red-600 ml-4 mt-2">
                          {product.ineligibility_reasons.map(
                            (reason, index) => (
                              <li key={index}>• {reason}</li>
                            )
                          )}
                        </ul>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
