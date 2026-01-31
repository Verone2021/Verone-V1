'use client';

import { ProductThumbnail } from '@verone/products';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from '@verone/ui';
import { Layers, Package } from 'lucide-react';

import type { ProductVariant } from '../types';

interface ProductVariantsCardProps {
  variants: ProductVariant[];
  isLoading?: boolean;
}

/**
 * Composant affichant les variantes d'un produit en grille pleine largeur
 */
export function ProductVariantsCard({
  variants,
  isLoading = false,
}: ProductVariantsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Variantes du produit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Variantes du produit
            <Badge variant="secondary" className="ml-2">
              0
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Ce produit n&apos;a pas de variantes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Variantes du produit
          <Badge variant="secondary" className="ml-2">
            {variants.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {variants.map(variant => (
            <div
              key={variant.id}
              className="flex flex-col p-3 bg-muted/30 rounded-lg border hover:border-primary/50 transition-colors"
            >
              {/* Image variante */}
              <div className="mb-2 flex justify-center">
                <ProductThumbnail
                  src={variant.image_url}
                  alt={variant.name ?? variant.sku ?? 'Variante'}
                  size="lg"
                />
              </div>

              {/* Infos variante */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {variant.name ?? 'Variante'}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {variant.sku}
                </p>
              </div>

              {/* Attributs variante */}
              {variant.variant_attributes &&
                Object.keys(variant.variant_attributes).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(variant.variant_attributes).map(
                      ([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {value}
                        </Badge>
                      )
                    )}
                  </div>
                )}

              {/* Stock */}
              <div className="mt-2 pt-2 border-t">
                <Badge
                  variant={variant.stock_real > 0 ? 'default' : 'destructive'}
                  className="text-xs w-full justify-center"
                >
                  Stock: {variant.stock_real}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
