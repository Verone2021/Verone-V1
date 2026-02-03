'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from '@verone/ui';
import {
  Package,
  Building2,
  FolderTree,
  Scale,
  Ruler,
  Home,
  Layers,
} from 'lucide-react';

import type { LinkMeProductDetail, ProductVariant } from '../types';

interface ProductReadOnlyCardProps {
  product: LinkMeProductDetail;
  variants?: ProductVariant[];
  variantsLoading?: boolean;
}

/**
 * Section lecture seule affichant les informations produit non modifiables
 * depuis le canal de vente LinkMe
 */
export function ProductReadOnlyCard({
  product,
  variants = [],
  variantsLoading = false,
}: ProductReadOnlyCardProps) {
  // Formater les dimensions
  const formatDimensions = (
    dimensions: Record<string, number | string> | null
  ) => {
    if (!dimensions) return null;
    const parts: string[] = [];
    if (dimensions.length) parts.push(`L: ${dimensions.length} cm`);
    if (dimensions.width) parts.push(`l: ${dimensions.width} cm`);
    if (dimensions.height) parts.push(`H: ${dimensions.height} cm`);
    if (dimensions.depth) parts.push(`P: ${dimensions.depth} cm`);
    return parts.length > 0 ? parts.join(' × ') : null;
  };

  // Formater le prix
  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const dimensionsText = formatDimensions(product.dimensions_cm);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Informations produit
          <Badge variant="secondary" className="ml-2 text-xs font-normal">
            Lecture seule
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sous-catégorie */}
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <FolderTree className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Sous-catégorie
            </p>
            <p className="text-sm">
              {product.product_category_name ?? (
                <span className="text-muted-foreground italic">
                  Non définie
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Fournisseur */}
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Fournisseur
            </p>
            <p className="text-sm">
              {product.product_supplier_name ?? (
                <span className="text-muted-foreground italic">Non défini</span>
              )}
            </p>
          </div>
        </div>

        {/* Prix d'achat (confidentiel) */}
        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <Package className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Prix d&apos;achat HT (confidentiel)
            </p>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {formatPrice(product.cost_price)}
            </p>
          </div>
        </div>

        {/* Poids */}
        {product.weight_kg !== null && product.weight_kg !== undefined && (
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Scale className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Poids</p>
              <p className="text-sm">{product.weight_kg} kg</p>
            </div>
          </div>
        )}

        {/* Dimensions */}
        {dimensionsText && (
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Dimensions
              </p>
              <p className="text-sm">{dimensionsText}</p>
            </div>
          </div>
        )}

        {/* Pièces d'habitation */}
        {product.room_types && product.room_types.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Pièces d&apos;habitation
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {product.room_types.map((room, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {room}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Variantes produit */}
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <Layers className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Variantes du produit
            </p>
            {variantsLoading ? (
              <div className="space-y-2 mt-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : variants.length === 0 ? (
              <p className="text-sm text-muted-foreground italic mt-1">
                Aucune variante
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                {variants.map(variant => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between p-2 bg-background rounded border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {variant.name ?? variant.sku ?? 'Variante'}
                      </p>
                      {variant.variant_attributes && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(variant.variant_attributes).map(
                            ([key, value]) => (
                              <span
                                key={key}
                                className="text-xs text-muted-foreground"
                              >
                                {key}: {value}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-muted-foreground">
                        Stock: {variant.stock_real}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
